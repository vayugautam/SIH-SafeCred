"""
agents.py

Agentic AI components for SafeCred.
Simulates a Loan Officer Agent that reasons about the application and makes decisions.
"""

import json
from datetime import datetime
from typing import Dict, Any, List, Optional

class LoanOfficerAgent:
    """
    An AI Agent that acts as a Loan Officer.
    It reviews the ML scores, composite scores, and user data to generate
    a human-readable decision and reasoning.
    """
    
    def __init__(self, name: str = "SafeCred AI Officer"):
        self.name = name
        self.memory = []

    def think(self, thought: str):
        """Log a thought process."""
        self.memory.append({
            "timestamp": datetime.now().isoformat(),
            "type": "thought",
            "content": thought
        })

    def review_application(self, 
                          application_data: Dict[str, Any], 
                          ml_result: Dict[str, Any], 
                          composite_result: Dict[str, Any],
                          precomputed_status: Optional[str] = None) -> Dict[str, Any]:
        """
        Review the application and generate a decision report.
        """
        self.memory = [] # Clear memory for new review
        
        app_id = application_data.get("application_id", "Unknown")
        self.think(f"Starting review for application {app_id}")
        
        # 1. Analyze Risk Profile
        ml_prob = ml_result.get("ml_probability", 0)
        composite_score = composite_result.get("composite_score", 0)
        final_sci = ml_result.get("final_sci", 0)
        
        risk_level = "HIGH"
        if final_sci >= 80:
            risk_level = "LOW"
        elif final_sci >= 60:
            risk_level = "MEDIUM"
            
        self.think(f"Risk assessment: ML Prob={ml_prob}, Composite={composite_score}, Final SCI={final_sci} -> {risk_level} Risk")
        
        # 2. Analyze Financial Health
        income = application_data.get("declared_income", 0)
        loan_amount = application_data.get("loan_amount", 0)
        lti_ratio = loan_amount / max(1, income)
        
        financial_health = "GOOD"
        if lti_ratio > 0.6:
            financial_health = "STRETCHED"
            self.think(f"Financial warning: Loan-to-Income ratio is high ({lti_ratio:.2f})")
        
        # 3. Check for Red Flags
        red_flags = []
        if composite_result.get("fraud_risk_penalty", 0) > 0:
            red_flags.append("Potential fraud risk detected")
        if composite_result.get("no_history_manual_flag", False):
            red_flags.append("High income but no credit history")
            
        # 4. Formulate Decision
        decision = "MANUAL_REVIEW"
        reasoning = []
        
        if precomputed_status:
            # Use the precomputed status from the rigorous business rules
            if precomputed_status == "approved":
                decision = "APPROVED"
            elif precomputed_status == "rejected":
                decision = "REJECTED"
            else:
                decision = "MANUAL_REVIEW"
            self.think(f"Using precomputed status: {precomputed_status} -> {decision}")
        else:
            # Fallback to agent's own simple logic (if no precomputed status)
            if risk_level == "LOW" and not red_flags and financial_health == "GOOD":
                decision = "APPROVED"
            elif risk_level == "HIGH":
                decision = "REJECTED"
            else:
                decision = "MANUAL_REVIEW"

        # Generate reasoning based on the final decision
        if decision == "APPROVED":
            reasoning.append("Strong credit profile with low risk indicators.")
            reasoning.append("Consistent repayment history or reliable alternative data proxies.")
        elif decision == "REJECTED":
            reasoning.append("Credit score below acceptance threshold.")
            reasoning.append("Insufficient data to verify repayment capacity.")
        else:
            if red_flags:
                reasoning.append(f"Requires manual verification due to: {', '.join(red_flags)}.")
            elif financial_health == "STRETCHED":
                reasoning.append("Loan amount is high relative to declared income.")
            else:
                reasoning.append("Borderline credit score requires human oversight.")
                
        # 5. Generate Coaching & Lender Notes
        coaching_tips = self._generate_coaching_tips(application_data, composite_result, decision)
        lender_notes = self._generate_lender_notes(application_data, composite_result, decision, risk_level)

        # 6. Generate Message
        message = self._generate_message(decision, reasoning, application_data, coaching_tips)
        
        self.think(f"Final Decision: {decision}")
        
        return {
            "agent_name": self.name,
            "decision": decision,
            "reasoning": reasoning,
            "message": message,
            "coaching_tips": coaching_tips,
            "lender_notes": lender_notes,
            "thought_process": self.memory
        }

    def _generate_coaching_tips(self, app_data: Dict, composite_result: Dict, decision: str) -> List[str]:
        """Generate personalized financial advice for the applicant."""
        tips = []
        
        # Tip 1: Loan Amount
        income = app_data.get("declared_income", 0)
        loan_amount = app_data.get("loan_amount", 0)
        if income > 0 and (loan_amount / income) > 0.5:
            tips.append("Consider requesting a smaller loan amount (under 50% of your monthly income) to increase approval chances.")
            
        # Tip 2: Alternative Data
        consent_depth = composite_result.get("consent_depth", 0)
        if consent_depth < 0.5:
            tips.append("Linking more data sources like utility bills or recharge history can help us verify your reliability.")
            
        # Tip 3: Consistency
        if composite_result.get("components", {}).get("recharge_score", 0) < 0.5:
            tips.append("Regular mobile recharges help build a digital footprint that proves consistency.")
            
        if not tips:
            tips.append("Maintain your current good financial habits to build a strong credit history.")
            
        return tips

    def _generate_lender_notes(self, app_data: Dict, composite_result: Dict, decision: str, risk_level: str) -> List[str]:
        """Generate notes for the lender/investor to comfort them about the risk."""
        notes = []
        
        # Note 1: Alternative Data Validation
        if composite_result.get("user_segment") == "low_income_alternative_proxies" and decision == "APPROVED":
            notes.append("Applicant approved based on strong alternative data proxies (utility/recharge consistency) despite low income.")
            
        # Note 2: Fraud Check
        fraud_penalty = composite_result.get("fraud_risk_penalty", 0)
        if fraud_penalty == 0:
            notes.append("Passed all anti-fraud checks. No suspicious income-lifestyle mismatch detected.")
        else:
            notes.append(f"High fraud risk detected (Penalty: {fraud_penalty:.2f}). Proceed with caution.")
            
        # Note 3: Social Impact
        if app_data.get("is_socially_disadvantaged"):
            notes.append("This loan supports financial inclusion for a socially disadvantaged applicant.")
            
        return notes

    def _generate_message(self, decision: str, reasoning: List[str], app_data: Dict, tips: List[str]) -> str:
        """Generate a user-friendly message."""
        name = app_data.get("name", "Applicant").split()[0]
        
        if decision == "APPROVED":
            return f"Congratulations {name}! Your application has been approved based on your strong profile. {reasoning[0]}"
        elif decision == "REJECTED":
            tip_msg = f" Tip: {tips[0]}" if tips else ""
            return f"Dear {name}, we are unable to approve your loan at this time. {reasoning[0]}{tip_msg}"
        else:
            return f"Hello {name}, your application is under review. {reasoning[0]} Our team will contact you shortly."

class GenAIAgent(LoanOfficerAgent):
    """
    A more advanced agent that 'simulates' GenAI capabilities.
    In a real scenario, this would call an LLM.
    """
    def _generate_message(self, decision: str, reasoning: List[str], app_data: Dict, tips: List[str]) -> str:
        # Simulate a more empathetic, GenAI-style response
        base_msg = super()._generate_message(decision, reasoning, app_data, tips)
        return f"[AI Generated] {base_msg}"

