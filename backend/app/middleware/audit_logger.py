import json
import logging
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("audit_logger")
logger.setLevel(logging.INFO)

class AuditLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # We only audit state-changing requests
        if request.method not in ["POST", "PUT", "DELETE", "PATCH"]:
            return await call_next(request)
            
        # Capture basic metadata
        request_id = getattr(request.state, "request_id", "unknown")
        user_id = "unknown"
        
        # We try to extract user ID from standard Authorization headers if decoded previously,
        # but in Starlette middleware it's often better to do it via a background task 
        # inside the endpoint if we want the actual decoded JWT subject. 
        # For this high-level middleware, we log the route and method.
        
        start_time = datetime.utcnow()
        
        response = await call_next(request)
        
        end_time = datetime.utcnow()
        duration_ms = (end_time - start_time).total_seconds() * 1000
        
        audit_entry = {
            "timestamp": start_time.isoformat(),
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "request_id": request_id,
            "duration_ms": duration_ms
        }
        
        logger.info(f"AUDIT: {json.dumps(audit_entry)}")
        
        return response
