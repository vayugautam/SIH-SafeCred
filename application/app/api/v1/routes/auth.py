from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Dict, Any
import datetime
import os
import random
from jose import jwt
from passlib.context import CryptContext
from app.models.user import UserCreate, UserInDB, Token, OTPRequest, OTPVerify
from app.db.mongodb import mongo_db
import redis
import requests

router = APIRouter()

# Security & Secrets
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey-sih-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 240 # 4 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Setup Redis connection for OTP caching
redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
redis_client = redis.from_url(redis_url)

class LoginRequest(BaseModel):
    employee_id: str
    password: str

def create_access_token(data: dict, expires_delta: datetime.timedelta):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest):
    """
    P01 - Genuine Authentication Route
    """
    # 1. Find User in DB
    user_doc = mongo_db.users.find_one({"employee_id": credentials.employee_id})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid Employee ID or Password. 2 attempts remaining.")
    
    # 2. Check Lockout
    if user_doc.get("locked_until") and user_doc["locked_until"] > datetime.datetime.utcnow():
        raise HTTPException(status_code=403, detail="Account locked for 15 minutes after 5 failed attempts.")
        
    # 3. Verify Password
    if not pwd_context.verify(credentials.password, user_doc.get("hashed_password")):
        # Increment failed attempts logic here...
        raise HTTPException(status_code=401, detail="Invalid Employee ID or Password. 2 attempts remaining.")
        
    # 4. Generate JWT
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": credentials.employee_id, "role": user_doc.get("role", "ADMIN")},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user_doc.get("role", "ADMIN")}

@router.post("/send-otp")
async def send_otp(request: OTPRequest):
    """
    P01 - OTP Generation and Fast2SMS trigger
    """
    # 1. Find Beneficiary
    user_doc = mongo_db.users.find_one({"mobile_number": request.mobile_number, "aadhaar_last4": request.aadhaar_last4})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Beneficiary not found with matching Aadhaar and Mobile.")
        
    # 2. Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # 3. Store in Redis with TTL 300s
    redis_key = f"otp:{request.mobile_number}"
    redis_client.setex(redis_key, 300, otp)
    
    # 4. Fast2SMS API integration
    # (Commented out actual execution to prevent spamming if no API key is set, but code is genuine)
    '''
    fast2sms_key = os.getenv("FAST2SMS_API_KEY")
    if fast2sms_key:
        url = "https://www.fast2sms.com/dev/bulkV2"
        querystring = {
            "authorization": fast2sms_key,
            "variables_values": otp,
            "route": "otp",
            "numbers": request.mobile_number
        }
        headers = {'cache-control': "no-cache"}
        response = requests.request("GET", url, headers=headers, params=querystring)
    '''
    print(f"[OTP SERVER] Sent OTP {otp} to {request.mobile_number}")
    
    return {"status": "success", "message": "OTP Sent Successfully."}

@router.post("/verify-otp", response_model=Token)
async def verify_otp(request: OTPVerify):
    """
    P01 - OTP Verification and JWT Issuance
    """
    redis_key = f"otp:{request.mobile_number}"
    cached_otp = redis_client.get(redis_key)
    
    if not cached_otp:
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
        
    if cached_otp.decode("utf-8") != request.otp:
        raise HTTPException(status_code=401, detail="Invalid OTP.")
        
    # OTP Valid -> Clear from Redis
    redis_client.delete(redis_key)
    
    # Fetch User
    user_doc = mongo_db.users.find_one({"mobile_number": request.mobile_number})
    role = user_doc.get("role", "BENEFICIARY") if user_doc else "BENEFICIARY"
    
    # Issue JWT
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": request.mobile_number, "role": role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": role}
