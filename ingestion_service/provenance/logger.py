from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, DateTime
import datetime
import structlog

logger = structlog.get_logger()

# Async SQLite engine
engine = create_async_engine("sqlite+aiosqlite:///./ingestion_provenance.db", echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(AsyncAttrs, DeclarativeBase):
    pass

class ProvenanceLog(Base):
    __tablename__ = "provenance_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(100))
    record_hash: Mapped[str] = mapped_column(String(64), index=True)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("database_initialized", db="ingestion_provenance.db")

class ProvenanceLogger:
    @staticmethod
    async def log_record(source: str, record_hash: str, ts: datetime.datetime = None):
        if ts is None:
            ts = datetime.datetime.utcnow()
            
        async with AsyncSessionLocal() as session:
            new_log = ProvenanceLog(source=source, record_hash=record_hash, timestamp=ts)
            session.add(new_log)
            await session.commit()
            logger.debug("provenance_logged", source=source, hash=record_hash)
