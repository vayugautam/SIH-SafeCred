import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sentry_sdk
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.audit_logger import AuditMiddleware
from app.middleware.rate_limiter import limiter

# Setup Sentry
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        environment=settings.ENVIRONMENT
    )

# Prometheus Metrics Setup
REQUEST_COUNT = Counter("request_count", "Total HTTP requests", ["method", "endpoint", "http_status"])
REQUEST_LATENCY = Histogram("request_latency_seconds", "HTTP request latency", ["endpoint"])
SCORE_REQUESTS_TOTAL = Counter("score_requests_total", "Total scoring requests processed")
ACTIVE_APPLICATIONS = Gauge("active_applications", "Number of currently active loan applications")

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        description="Core API for SafeCred Digital Lending Engine. Includes scoring, ingestion, and orchestration.",
    )

    # Setup slowapi rate limiter
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Add Middlewares
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # Configure properly in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    from app.middleware.security_headers import SecurityHeadersMiddleware
    from app.middleware.pii_mask_middleware import PIIMaskingMiddleware
    
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(PIIMaskingMiddleware)
    app.add_middleware(AuditMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # Middleware for Prometheus metrics
    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        REQUEST_LATENCY.labels(endpoint=request.url.path).observe(process_time)
        REQUEST_COUNT.labels(
            method=request.method, 
            endpoint=request.url.path, 
            http_status=response.status_code
        ).inc()
        
        return response

    @app.get("/metrics")
    async def metrics():
        return JSONResponse(
            content=generate_latest().decode("utf-8"),
            media_type=CONTENT_TYPE_LATEST
        )

    @app.get("/health")
    async def health_check():
        return {
            "status": "OK",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT
        }

    # Register Routers
    from app.api.v1.routes import auth, dashboard, lending
    app.include_router(auth.router, prefix=settings.API_V1_STR + "/auth", tags=["auth"])
    app.include_router(dashboard.router, prefix=settings.API_V1_STR + "/dashboard", tags=["dashboard"])
    app.include_router(lending.router, prefix=settings.API_V1_STR + "/lending", tags=["lending"])
    # app.include_router(admin.router, prefix=settings.API_V1_STR + "/admin", tags=["admin"])
    # app.include_router(audit.router, prefix=settings.API_V1_STR + "/audit", tags=["audit"])

    return app

app = create_app()
