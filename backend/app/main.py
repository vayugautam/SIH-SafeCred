import traceback
import sys

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    from app.core.config import settings
    from app.middleware.request_id import RequestIDMiddleware
    from app.middleware.audit_logger import AuditLoggerMiddleware
    from app.middleware.rate_limiter import setup_rate_limiter

    from app.api.v1.routes import ingest, scoring, lending, dashboard, admin, audit, auth

    from fastapi import Request
    from fastapi.responses import JSONResponse

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="SafeCred Core ML and Lending API",
        docs_url="/docs",
        openapi_url="/openapi.json"
    )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        with open("crash.txt", "a") as f:
            f.write(f"Exception on {request.url}: {exc}\n")
            f.write(traceback.format_exc())
        return JSONResponse(status_code=500, content={"message": "Internal Server Error", "error": str(exc)})

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Middlewares (Order matters: Request ID must be first so Audit Logger can use it)
    app.add_middleware(AuditLoggerMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # Rate Limiter
    setup_rate_limiter(app)

    # Routers
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(ingest.router, prefix="/api/v1")
    app.include_router(scoring.router, prefix="/api/v1")
    app.include_router(lending.router, prefix="/api/v1")
    app.include_router(dashboard.router, prefix="/api/v1")
    app.include_router(admin.router, prefix="/api/v1")
    app.include_router(audit.router, prefix="/api/v1")

    @app.get("/health", tags=["Health"])
    async def health_probe():
        """Kubernetes liveness and readiness probe."""
        return {"status": "healthy", "version": settings.VERSION}

except Exception as e:
    with open("startup_error.log", "w") as f:
        f.write("Failed to start FastAPI:\n")
        f.write(traceback.format_exc())
    raise
