import asyncio
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))

import application_api
from features_direct import extract_features_from_application_data
from models_enhanced import EnhancedLoanApplication
from scoring import compute_composite_score, map_sci_to_riskband


class _PassthroughScaler:
    def transform(self, frame):
        return frame


class _CompositeAwareClassifier:
    def __init__(self):
        self.seen_composite_score = None

    def predict_proba(self, frame):
        self.seen_composite_score = float(frame.iloc[0]["composite_score"])
        return [[0.2, 0.8]]


class CoreLogicTests(unittest.TestCase):
    def test_low_income_no_bank_uses_consumption_weight(self):
        features = extract_features_from_application_data({
            "declared_income": 8000,
            "loan_amount": 3000,
            "tenure_months": 12,
            "is_socially_disadvantaged": True,
            "consent_recharge": True,
            "recharge_history": {"frequency": 12, "avg_amount": 150},
            "consent_electricity": True,
            "electricity_bills": {"frequency": 6, "avg_payment": 500, "consistency": 0.8},
        })

        _, breakdown = compute_composite_score(features)

        self.assertFalse(breakdown["has_bank_data"])
        self.assertEqual(breakdown["user_segment"], "new_user_no_bank_data")
        self.assertEqual(breakdown["pillar_weights_used"]["consumption"], 0.5)

    def test_high_income_no_history_forces_manual_review_signal(self):
        features = extract_features_from_application_data({
            "declared_income": 25000,
            "loan_amount": 10000,
            "tenure_months": 12,
            "consent_bank": True,
            "bank_statement": {"monthly_credits": 25000, "avg_balance": 8000},
        })

        composite, breakdown = compute_composite_score(features)
        risk_band, _ = map_sci_to_riskband(composite)

        self.assertEqual(breakdown["user_segment"], "high_income_no_history_manual_review")
        self.assertTrue(breakdown["no_history_manual_flag"])
        self.assertIn(risk_band, {"High Risk", "Reject"})

    def test_high_income_good_history_can_be_low_risk(self):
        features = extract_features_from_application_data({
            "declared_income": 30000,
            "loan_amount": 10000,
            "tenure_months": 12,
            "consent_bank": True,
            "bank_statement": {"monthly_credits": 30000, "avg_balance": 10000},
            "repayment_history": {
                "previous_loans_count": 3,
                "on_time_ratio": 0.97,
                "avg_payment_delay_days": 1,
                "avg_repayment_ratio": 0.97,
            },
        })

        composite, breakdown = compute_composite_score(features)
        risk_band, _ = map_sci_to_riskband(composite)

        self.assertEqual(breakdown["user_segment"], "high_income_repayment_only")
        self.assertFalse(breakdown["no_history_manual_flag"])
        self.assertEqual(risk_band, "Low Risk")

    def test_reject_band_below_threshold(self):
        risk_band, need = map_sci_to_riskband(39.9, socio_flag=1)

        self.assertEqual(risk_band, "Reject")
        self.assertEqual(need, "High Need")

    def test_apply_direct_populates_composite_before_model_prediction(self):
        fake_classifier = _CompositeAwareClassifier()
        original_state = (
            application_api.clf,
            application_api.scaler,
            application_api.feature_order,
            application_api.load_ml_model,
            application_api.loan_officer,
        )

        class _LoanOfficer:
            def review_application(self, **kwargs):
                return {"message": "Reviewed"}

        try:
            application_api.clf = fake_classifier
            application_api.scaler = _PassthroughScaler()
            application_api.feature_order = [
                "declared_income",
                "loan_amount",
                "tenure",
                "composite_score",
            ]
            application_api.load_ml_model = lambda: True
            application_api.loan_officer = _LoanOfficer()

            response = asyncio.run(application_api.apply_direct(EnhancedLoanApplication(
                name="Test User",
                mobile="9999999999",
                age=30,
                declared_income=8000,
                loan_amount=3000,
                tenure_months=12,
                consent_recharge=True,
            )))

            self.assertGreater(fake_classifier.seen_composite_score, 0)
            self.assertEqual(
                fake_classifier.seen_composite_score,
                response["details"]["score_breakdown"]["composite_score"],
            )
        finally:
            (
                application_api.clf,
                application_api.scaler,
                application_api.feature_order,
                application_api.load_ml_model,
                application_api.loan_officer,
            ) = original_state

    def test_consent_without_data_does_not_increase_offer(self):
        fake_classifier = _CompositeAwareClassifier()
        original_state = (
            application_api.clf,
            application_api.scaler,
            application_api.feature_order,
            application_api.load_ml_model,
            application_api.loan_officer,
        )

        class _LoanOfficer:
            def review_application(self, **kwargs):
                return {"message": "Reviewed"}

        try:
            application_api.clf = fake_classifier
            application_api.scaler = _PassthroughScaler()
            application_api.feature_order = [
                "declared_income",
                "loan_amount",
                "tenure",
                "composite_score",
            ]
            application_api.load_ml_model = lambda: True
            application_api.loan_officer = _LoanOfficer()

            response = asyncio.run(application_api.apply_direct(EnhancedLoanApplication(
                name="Consent Only",
                mobile="9999999998",
                age=30,
                declared_income=8000,
                loan_amount=10000,
                tenure_months=12,
                consent_recharge=True,
                consent_electricity=True,
                consent_education=True,
                has_children=True,
            )))

            self.assertEqual(response["details"]["consent_bonus"], 0)
            self.assertEqual(response["details"]["proxy_quality_bonus"], 0)
            self.assertEqual(
                response["loan_offer"],
                min(10000, response["details"]["base_offer"]),
            )
        finally:
            (
                application_api.clf,
                application_api.scaler,
                application_api.feature_order,
                application_api.load_ml_model,
                application_api.loan_officer,
            ) = original_state


if __name__ == "__main__":
    unittest.main()
