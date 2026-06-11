from pydantic import BaseModel, Field
from typing import Any, Optional
from datetime import datetime

class StandardResponse(BaseModel):
    status: str = Field(..., description="SUCCESS or ERROR")
    data: Optional[Any] = Field(default=None, description="Response payload")
    message: str = Field(default="", description="Human readable message")
    request_id: str = Field(..., description="Correlated trace ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp of response")

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
