from pydantic import BaseModel, Field, EmailStr
from typing import Optional
import datetime

class UserBase(BaseModel):
    employee_id: Optional[str] = None
    mobile_number: Optional[str] = None
    aadhaar_last4: Optional[str] = None
    role: str = "BENEFICIARY" # "ADMIN", "UNDERWRITER", "BENEFICIARY"
    is_active: bool = True

class UserCreate(UserBase):
    password: Optional[str] = None

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: Optional[str] = None
    failed_attempts: int = 0
    locked_until: Optional[datetime.datetime] = None

    class Config:
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    
class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class OTPRequest(BaseModel):
    aadhaar_last4: str
    mobile_number: str

class OTPVerify(BaseModel):
    mobile_number: str
    otp: str
