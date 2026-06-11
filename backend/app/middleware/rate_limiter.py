from fastapi import FastAPI
from functools import wraps

class DummyLimiter:
    def limit(self, limit_string):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                return await func(*args, **kwargs)
            return wrapper
        return decorator

limiter = DummyLimiter()

def setup_rate_limiter(app: FastAPI):
    # Mock rate limiter, slowapi removed to avoid dependency issue
    pass
