"""
Enhanced Pydantic models for accepting detailed user data from frontend.

This allows users to input their:
- Recharge history
- Electricity bills
- Education fees
- Bank statement summary
- Repayment history

Instead of reading from offline CSV/JSON files.
"""

from pydantic import BaseModel, Field
from typing import Optional

class BankStatementData(BaseModel):
    """User's bank statement summary (last 3-6 months)"""
    monthly_credits: Optional[float] = Field(None, description="Average monthly credits/income")
    avg_balance: Optional[float] = Field(None, description="Average account balance")
    total_credits: Optional[float] = Field(None, description="Total credits in period")
    total_debits: Optional[float] = Field(None, description="Total debits in period")
    salary_count: Optional[int] = Field(0, description="Number of salary credits")
    bounce_count: Optional[int] = Field(0, description="Number of bounced transactions")


class RechargeHistory(BaseModel):
    """User's mobile recharge history (last 6-12 months)"""
    total_amount: Optional[float] = Field(0, description="Total recharge amount")
    frequency: Optional[int] = Field(0, description="Number of recharges")
    avg_amount: Optional[float] = Field(0, description="Average recharge amount")
    consistency: Optional[float] = Field(0.5, ge=0, le=1, description="Recharge consistency score")
    recharge_count: Optional[int] = Field(0, description="Total recharge count")


class ElectricityBills(BaseModel):
    """User's electricity bill payment history"""
    total_paid: Optional[float] = Field(0, description="Total electricity bill payments")
    frequency: Optional[int] = Field(0, description="Number of bill payments")
    avg_payment: Optional[float] = Field(0, description="Average bill amount")
    consistency: Optional[float] = Field(0.5, ge=0, le=1, description="Payment consistency")
    ontime_ratio: Optional[float] = Field(0.5, ge=0, le=1, description="On-time payment ratio")


class EducationFees(BaseModel):
    """User's education fee payment history (for children)"""
    total_paid: Optional[float] = Field(0, description="Total education fees paid")
    frequency: Optional[int] = Field(0, description="Number of fee payments")
    avg_fee: Optional[float] = Field(0, description="Average fee amount")
    consistency: Optional[float] = Field(0.5, ge=0, le=1, description="Payment consistency")
    ontime_ratio: Optional[float] = Field(0.5, ge=0, le=1, description="On-time payment ratio")


class RepaymentHistory(BaseModel):
    """User's previous loan repayment history"""
    ontime_count: Optional[int] = Field(0, description="Number of on-time repayments")
    late_count: Optional[int] = Field(0, description="Number of late repayments")
    missed_count: Optional[int] = Field(0, description="Number of missed repayments")
    avg_repayment_ratio: Optional[float] = Field(0.5, ge=0, le=1, description="Average repayment ratio")


class EnhancedLoanApplication(BaseModel):
    """
    Complete loan application with all user-provided data.
    
    This accepts data DIRECTLY from frontend form,
    not from offline CSV/JSON files.
    """
    
    # ==================== BASIC INFO ====================
    name: str = Field(..., description="Full name")
    mobile: str = Field(..., description="Mobile number")
    email: Optional[str] = Field(None, description="Email address")
    age: int = Field(..., ge=18, le=100, description="Age")
    has_children: bool = Field(False, description="Has children?")
    is_socially_disadvantaged: bool = Field(False, description="SC/ST/OBC?")
    dependents: int = Field(0, ge=0, description="Number of dependents")
    
    # ==================== LOAN DETAILS ====================
    declared_income: float = Field(..., ge=1000, description="Monthly income (₹)")
    loan_amount: float = Field(..., ge=1000, le=100000, description="Loan amount requested (₹)")
    tenure_months: int = Field(..., ge=1, le=36, description="Loan tenure (months)")
    purpose: Optional[str] = Field(None, description="Loan purpose")
    existing_loan_amt: float = Field(0, ge=0, description="Existing loan amount (₹)")
    
    # ==================== CONSENTS ====================
    consent_recharge: bool = Field(False, description="Consent to share recharge data")
    consent_electricity: bool = Field(False, description="Consent to share electricity data")
    consent_education: bool = Field(False, description="Consent to share education data")
    consent_bank: bool = Field(False, description="Consent to share bank statement")
    
    # ==================== OPTIONAL PROXY DATA ====================
    bank_statement: Optional[BankStatementData] = Field(None, description="Bank statement summary")
    recharge_history: Optional[RechargeHistory] = Field(None, description="Recharge history")
    electricity_bills: Optional[ElectricityBills] = Field(None, description="Electricity bills")
    education_fees: Optional[EducationFees] = Field(None, description="Education fees")
    repayment_history: Optional[RepaymentHistory] = Field(None, description="Repayment history")
    
    # ==================== METADATA ====================
    application_id: Optional[str] = Field(None, description="Application ID (auto-generated)")
