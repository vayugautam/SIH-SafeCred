import uuid
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

# Context variable to hold the request ID for downstream services/logs
request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="")

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract from header or generate new
        req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Set context var
        token = request_id_ctx_var.set(req_id)
        
        # Inject into request state for easy access in routes
        request.state.request_id = req_id
        
        response = await call_next(request)
        
        # Propagate back in response headers
        response.headers["X-Request-ID"] = req_id
        
        request_id_ctx_var.reset(token)
        return response
