import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import structlog
from prometheus_client import Histogram, Counter, Gauge

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, DateTime, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.dialects.postgresql import insert as pg_insert
import uuid

logger = structlog.get_logger()

# --- Prometheus Metrics ---
FEATURE_WRITE_LATENCY = Histogram(
    'feature_write_latency_seconds', 
    'Time spent writing features to Postgres and Redis'
)
CACHE_HITS = Counter('feature_cache_hits_total', 'Number of feature reads served from Redis')
CACHE_MISSES = Counter('feature_cache_misses_total', 'Number of feature reads falling back to Postgres')
STALE_COUNT = Gauge('stale_feature_count', 'Number of beneficiaries with features older than threshold')

# --- SQLAlchemy Model ---
class Base(DeclarativeBase):
    pass

class FeatureVector(Base):
    __tablename__ = "feature_vectors"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    beneficiary_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    features: Mapped[dict] = mapped_column(JSONB)
    completeness_score: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# --- Core Feature Store ---
class FeatureStore:
    def __init__(self, redis_client, db_session_maker):
        """
        Dependency Injection Architecture
        :param redis_client: active aioredis client
        :param db_session_maker: async_sessionmaker for PostgreSQL
        """
        self.redis = redis_client
        self.db_session_maker = db_session_maker

    def _redis_key(self, bid: str) -> str:
        return f"features:{bid}"

    @FEATURE_WRITE_LATENCY.time()
    async def write_features(self, bid: str, features: dict, ttl_days: int = 30) -> bool:
        """Dual-write to Postgres (durable) and Redis (cache) concurrently."""
        logger.debug("writing_features", beneficiary_id=bid)
        
        async def write_pg():
            async with self.db_session_maker() as session:
                # PostgreSQL UPSERT
                stmt = pg_insert(FeatureVector).values(
                    beneficiary_id=bid,
                    features=features,
                    updated_at=datetime.utcnow()
                ).on_conflict_do_update(
                    index_elements=['beneficiary_id'],
                    set_={
                        'features': features,
                        'updated_at': datetime.utcnow()
                    }
                )
                await session.execute(stmt)
                await session.commit()

        async def write_redis():
            payload = json.dumps(features)
            await self.redis.set(self._redis_key(bid), payload, ex=ttl_days * 86400)

        try:
            # Execute both I/O bounds concurrently
            await asyncio.gather(write_pg(), write_redis())
            return True
        except Exception as e:
            logger.error("feature_write_failed", beneficiary_id=bid, error=str(e))
            return False

    async def read_features(self, bid: str) -> Optional[Dict]:
        """Cache-aside: Read from Redis, fallback to PG and re-warm."""
        # 1. Try Redis
        try:
            cached = await self.redis.get(self._redis_key(bid))
            if cached:
                CACHE_HITS.inc()
                return json.loads(cached)
        except Exception as e:
            logger.warning("redis_read_failed", error=str(e))
            
        CACHE_MISSES.inc()
        
        # 2. Try PostgreSQL
        try:
            async with self.db_session_maker() as session:
                result = await session.execute(
                    text("SELECT features FROM feature_vectors WHERE beneficiary_id = :bid"),
                    {"bid": bid}
                )
                row = result.fetchone()
                
                if row and row[0]:
                    features = row[0]
                    # 3. Re-warm Cache asynchronously (fire and forget)
                    asyncio.create_task(self.redis.set(self._redis_key(bid), json.dumps(features), ex=30 * 86400))
                    return features
        except Exception as e:
            logger.error("postgres_read_failed", beneficiary_id=bid, error=str(e))
            
        return None

    async def get_feature_age(self, bid: str) -> Optional[timedelta]:
        """Returns the age of the feature vector from Postgres."""
        async with self.db_session_maker() as session:
            result = await session.execute(
                text("SELECT updated_at FROM feature_vectors WHERE beneficiary_id = :bid"),
                {"bid": bid}
            )
            row = result.fetchone()
            if row:
                updated_at = row[0]
                return datetime.utcnow() - updated_at
        return None

    async def list_stale_beneficiaries(self, threshold_days: int = 30) -> List[str]:
        """Returns beneficiaries whose features haven't been updated in X days. Updates Prometheus Gauge."""
        threshold_date = datetime.utcnow() - timedelta(days=threshold_days)
        
        async with self.db_session_maker() as session:
            result = await session.execute(
                text("SELECT beneficiary_id FROM feature_vectors WHERE updated_at < :thresh"),
                {"thresh": threshold_date}
            )
            rows = result.fetchall()
            bids = [row[0] for row in rows]
            
            STALE_COUNT.set(len(bids))
            return bids

    async def bulk_write(self, records: List[Dict]) -> int:
        """
        High-throughput bulk upsert into PostgreSQL. 
        Expects records format: [{"beneficiary_id": "A", "features": {...}}, ...]
        """
        if not records:
            return 0
            
        async with self.db_session_maker() as session:
            stmt = pg_insert(FeatureVector).values(records)
            stmt = stmt.on_conflict_do_update(
                index_elements=['beneficiary_id'],
                set_={
                    'features': stmt.excluded.features,
                    'updated_at': datetime.utcnow()
                }
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.rowcount
