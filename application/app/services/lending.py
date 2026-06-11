from app.db.mongodb import mongo_db
import time

class DigitalLendingEngine:
    """
    STEP 8 | Band A + eligible flag -> Digital Lending Engine triggers KYC -> bank verify -> auto-approve -> IMPS disbursal.
    """
    
    @staticmethod
    def process_loan_decision(beneficiary_id: str, score_data: dict, requested_amount: float) -> dict:
        print(f"[LENDING ENGINE] Evaluating automated decision for {beneficiary_id}...")
        
        band = score_data.get("band")
        score = score_data.get("composite_score")
        
        # Step 8 Logic: Auto-Approve Band A if amount is within threshold
        if band == "A" and requested_amount <= 50000:
            decision = "AUTO_APPROVED"
            message = "Triggering IMPS Disbursal API..."
            
            # Simulate KYC & Disbursal Latency
            time.sleep(1)
            print(f"[LENDING ENGINE] IMPS Disbursal Triggered for {beneficiary_id}! Amount: {requested_amount}")
        elif band in ["B", "C"]:
            decision = "MANUAL_REVIEW"
            message = "Routed to human underwriter queue."
        else:
            decision = "AUTO_REJECTED"
            message = "Credit score is below acceptable risk threshold."
            
        audit_record = {
            "beneficiary_id": beneficiary_id,
            "requested_amount": requested_amount,
            "decision": decision,
            "message": message,
            "score_snapshot": score,
            "band_snapshot": band,
            "timestamp": time.time()
        }
        
        mongo_db.lending_decisions.insert_one(audit_record)
        return audit_record

lending_engine = DigitalLendingEngine()
