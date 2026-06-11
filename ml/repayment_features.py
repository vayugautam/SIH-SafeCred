import numpy as np
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime

class RepaymentFeatureExtractor:
    def __init__(self, reference_date: datetime = None):
        """
        Initializes the extractor. 
        :param reference_date: The date from which 'current' DPD is calculated for unpaid loans. Defaults to now.
        """
        self.reference_date = reference_date or datetime.utcnow()

    def _parse_date(self, date_val) -> datetime:
        if pd.isna(date_val) or not date_val:
            return None
        if isinstance(date_val, datetime):
            return date_val
        if isinstance(date_val, str):
            try:
                return pd.to_datetime(date_val).to_pydatetime()
            except Exception:
                return None
        return None

    def _calculate_dpd(self, rep: Dict[str, Any]) -> float:
        """
        Calculates Days Past Due (DPD) based on precedence rules:
        1. due_date + paid_date
        2. due_date only (against reference_date)
        3. dpd field present
        """
        due_date = self._parse_date(rep.get('due_date'))
        paid_date = self._parse_date(rep.get('paid_date'))
        
        if due_date and paid_date:
            return float(max(0, (paid_date - due_date).days))
        elif due_date and not paid_date:
            return float(max(0, (self.reference_date - due_date).days))
        elif 'dpd' in rep and rep['dpd'] is not None:
            return float(rep['dpd'])
        raise ValueError("Repayment record must contain due_date, or a legacy dpd field.")

    def compute_features(self, loans: List[Dict[str, Any]], repayments: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Computes 18+ mathematical features from raw loan and repayment histories.
        """
        # --- Default Edge Case Handlers ---
        if not loans and not repayments:
            return self._empty_feature_dict()

        # --- Pre-processing ---
        dpds = []
        delays = []
        paid_reps = 0
        prepayments = 0
        partial_payments = 0
        on_time_count = 0
        total_due_reps = len(repayments)
        
        # Streak tracking
        current_streak = 0
        max_streak = 0
        
        # Sort repayments by due_date to get valid streaks and trends
        try:
            sorted_reps = sorted(
                repayments, 
                key=lambda x: self._parse_date(x.get('due_date')) or datetime.min
            )
        except Exception:
            sorted_reps = repayments
            
        for rep in sorted_reps:
            dpd = self._calculate_dpd(rep)
            if not np.isnan(dpd):
                dpds.append(dpd)
                
            due_date = self._parse_date(rep.get('due_date'))
            paid_date = self._parse_date(rep.get('paid_date'))
            
            if paid_date:
                paid_reps += 1
                if due_date:
                    delay = (paid_date - due_date).days
                    delays.append(delay)
                    if delay < 0:
                        prepayments += 1
                    
                    if delay <= 0:
                        on_time_count += 1
                        current_streak += 1
                        max_streak = max(max_streak, current_streak)
                    else:
                        current_streak = 0

            amt_due = float(rep.get('amount_due', 0))
            amt_paid = float(rep.get('amount_paid', 0))
            if amt_due > 0 and 0 < amt_paid < amt_due:
                partial_payments += 1

        # --- Loan Level Aggregations ---
        disbursed_total = sum(float(l.get('disbursed_amount', 0)) for l in loans)
        approved_total = sum(float(l.get('approved_amount', 0)) for l in loans)
        
        fully_repaid = sum(1 for l in loans if l.get('status', '').upper() in ['CLOSED', 'REPAID'])
        unique_purposes = len(set(l.get('purpose') for l in loans if l.get('purpose')))
        unique_partners = len(set(l.get('channel_partner') for l in loans if l.get('channel_partner')))
        
        tenures = [float(l.get('tenure_months', 0)) for l in loans if l.get('tenure_months')]
        
        early_repayments = sum(
            1 for l in loans 
            if l.get('status', '').upper() in ['CLOSED', 'REPAID'] 
            and self._parse_date(l.get('closed_date')) 
            and self._parse_date(l.get('maturity_date'))
            and (self._parse_date(l.get('maturity_date')) - self._parse_date(l.get('closed_date'))).days > 90
        )

        # --- Feature Calculations ---
        features = {}

        # 1. emi_hit_rate
        features['emi_hit_rate'] = (on_time_count / total_due_reps * 100) if total_due_reps > 0 else 0.0

        # 2 & 3. DPD Aggregates
        overdue_dpds = [d for d in dpds if d > 0]
        features['avg_days_past_due'] = float(np.mean(overdue_dpds)) if overdue_dpds else 0.0
        features['max_days_past_due'] = float(np.max(dpds)) if dpds else 0.0
        
        # New additions requested
        features['current_days_past_due'] = float(dpds[-1]) if dpds else 0.0
        features['30_plus_dpd_count'] = sum(1 for d in dpds if d >= 30)
        features['60_plus_dpd_count'] = sum(1 for d in dpds if d >= 60)
        features['90_plus_dpd_count'] = sum(1 for d in dpds if d >= 90)

        # 4. prepayment_ratio
        features['prepayment_ratio'] = (prepayments / paid_reps) if paid_reps > 0 else 0.0

        # 5. loan_utilisation_rate
        features['loan_utilisation_rate'] = (disbursed_total / approved_total) if approved_total > 0 else 0.0

        # 6. repeat_borrower_flag
        features['repeat_borrower_flag'] = 1.0 if len(loans) >= 2 else 0.0

        # 7. tenure_completion_rate
        features['tenure_completion_rate'] = (fully_repaid / len(loans)) if len(loans) > 0 else 0.0

        # 8. delinquency_trend (slope of DPD over time, proxy via index for sequence)
        if len(dpds) > 1:
            try:
                x = np.arange(len(dpds))
                slope, _ = np.polyfit(x, dpds, 1)
                features['delinquency_trend'] = float(slope)
            except Exception:
                features['delinquency_trend'] = 0.0
        else:
            features['delinquency_trend'] = 0.0

        # 9. avg_loan_size_growth
        if len(loans) > 1:
            amts = [float(l.get('approved_amount', 0)) for l in loans]
            pct_changes = np.diff(amts) / (np.array(amts[:-1]) + 1e-9)
            features['avg_loan_size_growth'] = float(np.mean(pct_changes))
        else:
            features['avg_loan_size_growth'] = 0.0

        # 10. payment_consistency_score (1 - std(delays) / max_delay) normalized
        if len(delays) > 1:
            std_delay = np.std(delays)
            max_d = max(max(delays), 1)
            raw_score = max(0, 1 - (std_delay / max_d))
            features['payment_consistency_score'] = float(raw_score * 100)
        else:
            features['payment_consistency_score'] = 100.0 if paid_reps > 0 else 0.0

        # 11. consecutive_on_time_streak
        features['consecutive_on_time_streak'] = float(max_streak)

        # 12. worst_delinquency_bucket (0=never, 1=1-30, 2=31-60, 3=61-90, 4=90+)
        max_d = features['max_days_past_due']
        if max_d == 0: bucket = 0.0
        elif max_d <= 30: bucket = 1.0
        elif max_d <= 60: bucket = 2.0
        elif max_d <= 90: bucket = 3.0
        else: bucket = 4.0
        features['worst_delinquency_bucket'] = bucket

        # 13. partial_payment_rate
        features['partial_payment_rate'] = (partial_payments / total_due_reps) if total_due_reps > 0 else 0.0

        # 14. loan_purpose_diversity
        features['loan_purpose_diversity'] = float(unique_purposes)

        # 15. avg_loan_tenure_months
        features['avg_loan_tenure_months'] = float(np.mean(tenures)) if tenures else 0.0

        # 16. recovery_rate (proxy: paid_reps with dpd > 30 / total > 30)
        late_due = sum(1 for d in dpds if d > 30)
        late_paid = sum(1 for i, d in enumerate(dpds) if d > 30 and i < len(delays)) # Simplistic proxy
        features['recovery_rate'] = (late_paid / late_due) if late_due > 0 else 1.0

        # 17. early_repayment_flag
        features['early_repayment_flag'] = 1.0 if early_repayments > 0 else 0.0

        # 18. channel_partner_diversity
        features['channel_partner_diversity'] = float(unique_partners)

        # Extra ratios
        features['on_time_payment_ratio'] = features['emi_hit_rate'] / 100.0
        features['late_payment_ratio'] = 1.0 - features['on_time_payment_ratio']

        # Ensure no accidental NaNs escape into clean float fields unless intended
        for k, v in features.items():
            if np.isnan(v):
                features[k] = 0.0

        return features

    def _empty_feature_dict(self) -> Dict[str, float]:
        keys = [
            'emi_hit_rate', 'avg_days_past_due', 'max_days_past_due', 'current_days_past_due',
            '30_plus_dpd_count', '60_plus_dpd_count', '90_plus_dpd_count', 'prepayment_ratio',
            'loan_utilisation_rate', 'repeat_borrower_flag', 'tenure_completion_rate',
            'delinquency_trend', 'avg_loan_size_growth', 'payment_consistency_score',
            'consecutive_on_time_streak', 'worst_delinquency_bucket', 'partial_payment_rate',
            'loan_purpose_diversity', 'avg_loan_tenure_months', 'recovery_rate',
            'early_repayment_flag', 'channel_partner_diversity', 'on_time_payment_ratio',
            'late_payment_ratio'
        ]
        return {k: 0.0 for k in keys}
