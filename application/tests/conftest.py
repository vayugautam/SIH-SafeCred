import pytest
import asyncio
from typing import Generator

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Example mock DB session for dependency injection overrides
@pytest.fixture
def mock_db_session():
    from unittest.mock import AsyncMock
    return AsyncMock()
