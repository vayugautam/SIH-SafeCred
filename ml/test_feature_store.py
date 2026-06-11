import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from ml.feature_store import FeatureStore, CACHE_HITS, CACHE_MISSES

@pytest.fixture
def mock_redis():
    return AsyncMock()

@pytest.fixture
def mock_session_maker():
    # Create a mock session maker that returns an AsyncMock session
    session_mock = AsyncMock()
    
    # We need to mock the async context manager (__aenter__ and __aexit__)
    session_mock.__aenter__.return_value = session_mock
    
    session_maker_mock = MagicMock(return_value=session_mock)
    return session_maker_mock

@pytest.fixture
def store(mock_redis, mock_session_maker):
    return FeatureStore(redis_client=mock_redis, db_session_maker=mock_session_maker)

@pytest.mark.asyncio
async def test_write_features(store, mock_redis, mock_session_maker):
    mock_session = mock_session_maker.return_value.__aenter__.return_value
    
    result = await store.write_features("USER1", {"feat": 1}, ttl_days=10)
    
    assert result is True
    # Verify Redis write
    mock_redis.set.assert_called_once_with("features:USER1", '{"feat": 1}', ex=864000)
    # Verify Postgres write
    mock_session.execute.assert_called_once()
    mock_session.commit.assert_called_once()

@pytest.mark.asyncio
async def test_read_features_cache_hit(store, mock_redis, mock_session_maker):
    # Simulate Redis Hit
    mock_redis.get.return_value = '{"feat": 1}'
    
    initial_hits = CACHE_HITS._value.get()
    
    features = await store.read_features("USER1")
    
    assert features == {"feat": 1}
    mock_redis.get.assert_called_once_with("features:USER1")
    # Verify Postgres wasn't called
    mock_session = mock_session_maker.return_value.__aenter__.return_value
    mock_session.execute.assert_not_called()
    
    # Verify prometheus metric incremented
    assert CACHE_HITS._value.get() == initial_hits + 1

@pytest.mark.asyncio
async def test_read_features_cache_miss_pg_hit(store, mock_redis, mock_session_maker):
    # Simulate Redis Miss
    mock_redis.get.return_value = None
    
    # Simulate Postgres Hit
    mock_session = mock_session_maker.return_value.__aenter__.return_value
    mock_result = MagicMock()
    mock_result.fetchone.return_value = ({"feat": 2},)
    mock_session.execute.return_value = mock_result
    
    initial_misses = CACHE_MISSES._value.get()
    
    features = await store.read_features("USER1")
    
    assert features == {"feat": 2}
    mock_redis.get.assert_called_once_with("features:USER1")
    mock_session.execute.assert_called_once()
    
    # Wait briefly for the fire-and-forget Redis re-warm task to execute
    await asyncio.sleep(0.01)
    
    # Verify Redis re-warm happened
    mock_redis.set.assert_called_once_with("features:USER1", '{"feat": 2}', ex=2592000)
    
    # Verify metric
    assert CACHE_MISSES._value.get() == initial_misses + 1

@pytest.mark.asyncio
async def test_read_features_total_miss(store, mock_redis, mock_session_maker):
    mock_redis.get.return_value = None
    
    mock_session = mock_session_maker.return_value.__aenter__.return_value
    mock_result = MagicMock()
    mock_result.fetchone.return_value = None
    mock_session.execute.return_value = mock_result
    
    features = await store.read_features("USER1")
    
    assert features is None

@pytest.mark.asyncio
async def test_bulk_write(store, mock_session_maker):
    mock_session = mock_session_maker.return_value.__aenter__.return_value
    mock_result = MagicMock()
    mock_result.rowcount = 2
    mock_session.execute.return_value = mock_result
    
    records = [
        {"beneficiary_id": "USER1", "features": {"a": 1}},
        {"beneficiary_id": "USER2", "features": {"b": 2}}
    ]
    
    count = await store.bulk_write(records)
    
    assert count == 2
    mock_session.execute.assert_called_once()
    mock_session.commit.assert_called_once()
