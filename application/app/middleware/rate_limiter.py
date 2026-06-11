from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import redis.asyncio as redis
from app.core.config import settings

# Initialize Redis client for rate limiting
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

# Define slowapi limiter using remote address
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL
)

# You can import `limiter` in your routes and use @limiter.limit("100/minute")
