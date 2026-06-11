import numpy as np
from typing import List, Dict, Any
from datetime import datetime
import pandas as pd

class RepaymentFeatureExtractor:
    @staticmethod
    def extract_features(loans: List[Dict[str, Any]], repayments: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Extracts 18 repayment features from lists of loan and repayment dictionaries.
        Handle edge cases: zero loans, single payment, all nulls.
        """
        # Default empty features
        features = {
            "emi_hit_rate": 0.0,
            "avg_days_past_due": 0.0,
            "max_days_past_due": 0.0,
            "prepayment_ratio": 0.0,
            "loan_utilisation_rate": 0.0,
            "repeat_borrower_flag": 0.0,
            "tenure_completion_rate": 0.0,
            "delinquency_trend": 0.0,
            "avg_loan_size_growth": 0.0,
            "payment_consistency_score": 0.0,
            "consecutive_on_time_streak": 0.0,
            "worst_delinquency_bucket": 0.0,
            "partial_payment_rate": 0.0,
            "loan_purpose_diversity": 0.0,
            "avg_loan_tenure_months": 0.0,
            "recovery_rate": 0.0,
            "early_repayment_flag": 0.0,
            "channel_partner_diversity": 0.0,
        }

        if not loans and not repayments:
            return features

        # Process Loans
        num_loans = len(loans)
        if num_loans > 0:
            features["repeat_borrower_flag"] = 1.0 if num_loans >= 2 else 0.0
            features["loan_purpose_diversity"] = float(len(set(l.get("purpose") for l in loans if l.get("purpose"))))
            features["avg_loan_tenure_months"] = float(np.mean([l.get("tenure_months", 0) for l in loans]))
            features["channel_partner_diversity"] = float(len(set(l.get("channel_partner_id") for l in loans if l.get("channel_partner_id"))))
            
            fully_repaid = sum(1 for l in loans if l.get("status") == "closed")
            features["tenure_completion_rate"] = float(fully_repaid / num_loans)
            
            disbursed = sum(l.get("disbursed_amount", l.get("amount", 0)) for l in loans)
            approved = sum(l.get("approved_amount", l.get("amount", 0)) for l in loans)
            features["loan_utilisation_rate"] = float(disbursed / approved) if approved > 0 else 0.0

            # Early repayment flag
            early_closed = any(
                l.get("status") == "closed" and l.get("closed_early_months", 0) > 3 
                for l in loans
            )
            features["early_repayment_flag"] = 1.0 if early_closed else 0.0

            # Avg loan size growth
            if num_loans >= 2:
                # Sort loans by date
                sorted_loans = sorted(
                    [l for l in loans if l.get("applied_at")], 
                    key=lambda x: x.get("applied_at", datetime.min)
                )
                if len(sorted_loans) >= 2:
                    first_amount = sorted_loans[0].get("amount", 0)
                    last_amount = sorted_loans[-1].get("amount", 0)
                    if first_amount > 0:
                        features["avg_loan_size_growth"] = float((last_amount - first_amount) / first_amount)

        # Process Repayments
        num_repayments = len(repayments)
        if num_repayments > 0:
            emis_due = max(num_repayments, sum(r.get("emis_due_this_period", 1) for r in repayments)) # fallback
            on_time = sum(1 for r in repayments if r.get("dpd", 0) == 0 and r.get("is_late") is False)
            features["emi_hit_rate"] = float(on_time / emis_due * 100) if emis_due > 0 else 0.0

            dpds = [r.get("dpd", 0) for r in repayments]
            overdue_dpds = [d for d in dpds if d > 0]
            if overdue_dpds:
                features["avg_days_past_due"] = float(np.mean(overdue_dpds))
            features["max_days_past_due"] = float(max(dpds)) if dpds else 0.0

            prepayments = sum(1 for r in repayments if r.get("is_prepayment") is True)
            features["prepayment_ratio"] = float(prepayments / num_repayments)

            # Delinquency Trend (slope of DPD over last 6 months)
            # Sort by date
            valid_repayments = sorted(
                [r for r in repayments if r.get("paid_at")],
                key=lambda x: x.get("paid_at", datetime.min)
            )
            recent_reps = valid_repayments[-6:] if len(valid_repayments) >= 2 else []
            if len(recent_reps) >= 2:
                y = [r.get("dpd", 0) for r in recent_reps]
                x = list(range(len(y)))
                slope, _ = np.polyfit(x, y, 1)
                features["delinquency_trend"] = float(slope)

            # Payment consistency score
            delays = [r.get("delay_days", r.get("dpd", 0)) for r in repayments]
            if len(delays) > 1:
                std_delay = float(np.std(delays))
                # Normalize std_delay to 0-100 score where 0 std = 100 score
                # Assume max reasonable std is 90 days
                consistency = max(0.0, 100.0 - (std_delay / 90.0 * 100.0))
                features["payment_consistency_score"] = float(consistency)
            elif len(delays) == 1:
                features["payment_consistency_score"] = 100.0 if delays[0] == 0 else 50.0

            # Consecutive on time streak
            max_streak = 0
            current_streak = 0
            for d in delays:
                if d == 0:
                    current_streak += 1
                    max_streak = max(max_streak, current_streak)
                else:
                    current_streak = 0
            features["consecutive_on_time_streak"] = float(max_streak)

            # Worst delinquency bucket
            max_dpd = features["max_days_past_due"]
            if max_dpd == 0:
                features["worst_delinquency_bucket"] = 0.0
            elif 1 <= max_dpd <= 30:
                features["worst_delinquency_bucket"] = 1.0
            elif 31 <= max_dpd <= 60:
                features["worst_delinquency_bucket"] = 2.0
            elif 61 <= max_dpd <= 90:
                features["worst_delinquency_bucket"] = 3.0
            else:
                features["worst_delinquency_bucket"] = 4.0

            # Partial payment rate
            partials = sum(1 for r in repayments if r.get("is_partial") is True)
            features["partial_payment_rate"] = float(partials / num_repayments)

            # Recovery rate (payments made after delinquency episode)
            delinquency_episodes = 0
            recovered_episodes = 0
            in_episode = False
            for r in valid_repayments:
                dpd = r.get("dpd", 0)
                if dpd > 0 and not in_episode:
                    in_episode = True
                    delinquency_episodes += 1
                elif dpd == 0 and in_episode:
                    in_episode = False
                    recovered_episodes += 1
            if delinquency_episodes > 0:
                features["recovery_rate"] = float(recovered_episodes / delinquency_episodes)

        return features
