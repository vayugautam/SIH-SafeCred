import pytest
import pytest_asyncio
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from testcontainers.postgres import PostgresContainer
from testcontainers.mongodb import MongoDbContainer
from testcontainers.redis import RedisContainer
from fastapi.testclient import TestClient
from httpx import AsyncClient
import alembic.config
import alembic.command

# We assume standard models are mapped in backend/app/models/db_models.py
# and the app is defined in backend/app/main.py

# =========================================================================
# 1. TESTCONTAINERS INFRASTRUCTURE
# =========================================================================

@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres

@pytest.fixture(scope="session")
def mongo_container():
    with MongoDbContainer("mongo:6.0") as mongo:
        yield mongo

@pytest.fixture(scope="session")
def redis_container():
    with RedisContainer("redis:7-alpine") as redis:
        yield redis

# =========================================================================
# 2. DATABASE MIGRATIONS (RUN ONCE PER SESSION)
# =========================================================================

@pytest.fixture(scope="session")
def apply_migrations(postgres_container):
    db_url = postgres_container.get_connection_url().replace("postgresql+psycopg2", "postgresql")
    
    # Run Alembic programmatically
    alembic_cfg = alembic.config.Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)
    alembic.command.upgrade(alembic_cfg, "head")
    
    return db_url

# =========================================================================
# 3. ASYNC ENGINE & TRUNCATE ISOLATION
# =========================================================================

@pytest_asyncio.fixture(scope="function")
async def db_session(apply_migrations) -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a completely isolated database session.
    It runs TRUNCATE CASCADE after every test to wipe state without nested transaction bugs.
    """
    async_db_url = apply_migrations.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(async_db_url, echo=False)
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session

    # TRUNCATE ALL TABLES AFTER TEST
    async with engine.begin() as conn:
        # Ignore audit_trail immutability rules during tests if needed, or dynamically find tables
        await conn.execute(
            """
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
            """
        )
    await engine.dispose()

# =========================================================================
# 4. HTTPX ASYNC CLIENT
# =========================================================================

@pytest_asyncio.fixture(scope="function")
async def async_client(db_session) -> AsyncGenerator[AsyncClient, None]:
    # Dynamic import to avoid loading main before env vars are patched
    from app.main import app 
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
