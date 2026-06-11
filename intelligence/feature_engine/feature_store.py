import json
import uuid
import datetime
from typing import Dict, List, Optional
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, String, Float, DateTime, select
from sqlalchemy.dialects.postgresql import UUID, JSONB
from prometheus_client import Histogram, Counter, Gauge

# Prometheus Metrics
FEATURE_WRITE_LATENCY = Histogram(
    'feature_write_latency_seconds', 
    'Time spent writing features to Postgres and Redis'
)
CACHE_HITS = Counter('feature_cache_hits_total', 'Number of Redis cache hits')
CACHE_MISSES = Counter('feature_cache_misses_total', 'Number of Redis cache misses')
STALE_COUNT = Gauge('stale_count_gauge', 'Number of stale feature vectors')

Base = declarative_base()

class FeatureVector(Base):
    __tablename__ = "feature_vectors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    beneficiary_id = Column(String, unique=True, index=True, nullable=False)
    features = Column(JSONB, nullable=False)
    completeness_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class FeatureStore:
    def __init__(self, redis_url: str = "redis://localhost:6379", pg_url: str = "sqlite+aiosqlite:///./test.db"):
        self.redis = Redis.from_url(redis_url, decode_responses=True)
        self.engine = create_async_engine(pg_url, echo=False)
        self.SessionLocal = sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)

    async def init_db(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    @FEATURE_WRITE_LATENCY.time()
    async def write_features(self, bid: str, features: dict, ttl_days: int = 30) -> bool:
        """Writes features to PostgreSQL and caches in Redis."""
        now = datetime.datetime.utcnow()
        # Calculate naive completeness score (non-null / total keys)
        completeness_score = sum(1 for v in features.values() if v is not None) / len(features) if features else 0.0

        async with self.SessionLocal() as session:
            async with session.begin():
                stmt = select(FeatureVector).where(FeatureVector.beneficiary_id == bid)
                result = await session.execute(stmt)
                record = result.scalars().first()

                if record:
                    record.features = features
                    record.completeness_score = completeness_score
                    record.updated_at = now
                else:
                    record = FeatureVector(
                        beneficiary_id=bid,
                        features=features,
                        completeness_score=completeness_score,
                        created_at=now,
                        updated_at=now
                    )
                    session.add(record)
                
        # Write to Redis
        redis_key = f"features:{bid}"
        ttl_seconds = ttl_days * 86400
        await self.redis.setex(redis_key, ttl_seconds, json.dumps(features))
        return True

    async def read_features(self, bid: str) -> Optional[dict]:
        """Reads features from Redis. On miss, falls back to Postgres and re-warms cache."""
        redis_key = f"features:{bid}"
        cached_data = await self.redis.get(redis_key)
        
        if cached_data:
            CACHE_HITS.inc()
            return json.loads(cached_data)
            
        CACHE_MISSES.inc()
        # Fallback to DB
        async with self.SessionLocal() as session:
            stmt = select(FeatureVector).where(FeatureVector.beneficiary_id == bid)
            result = await session.execute(stmt)
            record = result.scalars().first()
            
            if record:
                # Re-warm Redis
                await self.redis.setex(redis_key, 30 * 86400, json.dumps(record.features))
                return record.features
        
        return None

    async def get_feature_age(self, bid: str) -> Optional[datetime.timedelta]:
        """Returns the age (timedelta) of the features for a beneficiary."""
        async with self.SessionLocal() as session:
            stmt = select(FeatureVector.updated_at).where(FeatureVector.beneficiary_id == bid)
            result = await session.execute(stmt)
            updated_at = result.scalar_one_or_none()
            
            if updated_at:
                return datetime.datetime.utcnow() - updated_at
        return None

    async def list_stale_beneficiaries(self, threshold_days: int = 30) -> List[str]:
        """Returns a list of beneficiary IDs whose features are older than threshold_days."""
        threshold_date = datetime.datetime.utcnow() - datetime.timedelta(days=threshold_days)
        stale_bids = []
        
        async with self.SessionLocal() as session:
            stmt = select(FeatureVector.beneficiary_id).where(FeatureVector.updated_at < threshold_date)
            result = await session.execute(stmt)
            stale_bids = [row for row in result.scalars()]
            
        STALE_COUNT.set(len(stale_bids))
        return stale_bids

    async def bulk_write(self, records: List[dict]) -> int:
        """
        Writes a list of feature dictionaries to the database.
        Expected record format: {"bid": "...", "features": {...}}
        Returns the number of records successfully processed.
        """
        success_count = 0
        now = datetime.datetime.utcnow()
        
        async with self.SessionLocal() as session:
            async with session.begin():
                for rec in records:
                    bid = rec.get("bid")
                    features = rec.get("features", {})
                    if not bid:
                        continue
                        
                    completeness = sum(1 for v in features.values() if v is not None) / len(features) if features else 0.0
                    
                    stmt = select(FeatureVector).where(FeatureVector.beneficiary_id == bid)
                    result = await session.execute(stmt)
                    record = result.scalars().first()
                    
                    if record:
                        record.features = features
                        record.completeness_score = completeness
                        record.updated_at = now
                    else:
                        record = FeatureVector(
                            beneficiary_id=bid,
                            features=features,
                            completeness_score=completeness,
                            created_at=now,
                            updated_at=now
                        )
                        session.add(record)
                    success_count += 1
                    
                    # Re-warm Redis
                    redis_key = f"features:{bid}"
                    await self.redis.setex(redis_key, 30 * 86400, json.dumps(features))
                    
        return success_count
