import json
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from starlette.responses import Response
from app.core.pii_masker import mask_payload

class PIIMaskingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # We only intercept JSON payloads to apply masking
        if response.headers.get("content-type") == "application/json":
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            
            try:
                data = json.loads(body)
                masked_data = mask_payload(data)
                masked_body = json.dumps(masked_data).encode("utf-8")
                
                # Update Content-Length
                headers = dict(response.headers)
                headers["content-length"] = str(len(masked_body))
                
                return Response(
                    content=masked_body, 
                    status_code=response.status_code, 
                    headers=headers, 
                    media_type="application/json"
                )
            except Exception:
                # Fallback to original body if parsing fails
                return Response(
                    content=body, 
                    status_code=response.status_code, 
                    headers=dict(response.headers), 
                    media_type="application/json"
                )
                
        return response
