from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import datetime
import base64
import json

from app.core.config import settings
from app.models.schemas import StandardResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class OTPRequest(BaseModel):
    username: str

class OTPVerifyRequest(BaseModel):
    username: str
    code: str

def generate_token(username: str, role: str) -> str:
    payload = {
        "sub": username,
        "realm_access": {"roles": [role]},
        "exp": (datetime.datetime.utcnow() + datetime.timedelta(hours=12)).isoformat()
    }
    # Mock JWT token (base64 encoded JSON)
    encoded_payload = base64.b64encode(json.dumps(payload).encode()).decode()
    return f"mock_header.{encoded_payload}.mock_signature"

@router.post("/login")
async def login(req: LoginRequest):
    # Mocking standard DB verify for demo
    if req.password != "admin123" and req.password != "password":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")
    
    role = "ADMIN"
    if "officer" in req.username.lower():
        role = "OFFICER"
        
    token = generate_token(req.username, role)
    
    return {
        "status": "success",
        "data": {
            "token": token,
            "user": {
                "id": f"USR-{req.username}",
                "username": req.username,
                "role": role
            }
        },
        "message": "Login successful"
    }

@router.post("/send-otp")
async def send_otp(req: OTPRequest):
    return {
        "status": "success",
        "data": {"sent": True},
        "message": f"OTP sent to {req.username}"
    }

@router.post("/verify-otp")
async def verify_otp(req: OTPVerifyRequest):
    if len(req.code) != 6:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP")
        
    token = generate_token(req.username, "BENEFICIARY")
    
    return {
        "status": "success",
        "data": {
            "token": token,
            "user": {
                "id": f"BEN-{req.username}",
                "username": req.username,
                "role": "BENEFICIARY"
            }
        },
        "message": "OTP Verified successfully"
    }
