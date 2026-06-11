import logging
import json
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

# In production, this logger should be configured to push to MongoDB or PostgreSQL
audit_logger = logging.getLogger("audit_trail")
audit_logger.setLevel(logging.INFO)

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        method = request.method
        
        # We only auto-log mutating requests
        if method in ["POST", "PUT", "DELETE", "PATCH"]:
            # Capture user context if available (depends on JWT auth execution order)
            # Since middleware runs before routes, user is not attached yet to request.user standardly without custom auth backend.
            # We log IP, path, and request_id.
            client_ip = request.client.host if request.client else "unknown"
            path = request.url.path
            
            # Note: consuming request body in middleware can hang the stream for the route.
            # Safe basic logging:
            req_id = getattr(request.state, "request_id", "unknown")
            
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": req_id,
                "method": method,
                "path": path,
                "client_ip": client_ip,
                "event": "API_MUTATION_ATTEMPT"
            }
            audit_logger.info(json.dumps(log_entry))
            
            response = await call_next(request)
            
            # Post-response log
            log_entry["event"] = "API_MUTATION_COMPLETE"
            log_entry["status_code"] = response.status_code
            audit_logger.info(json.dumps(log_entry))
            
            return response
            
        return await call_next(request)
