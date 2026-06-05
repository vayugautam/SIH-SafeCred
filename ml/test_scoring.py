"""
Unit tests for ml/scoring.py and ml/features_direct.py

Covers user segmentation, pillar weights, risk-band mapping,
consent aliasing, bank-data detection, and composite score flow.
"""

import unittest

from scoring import (
    compute_composite_score,
    combine_ml_and_composite,
    map_sci_to_riskband,
    compute_subscores,
)
from features_direct import extract_features_from_application_data


class TestLowIncomeNoBankUsesConsumptionWeight(unittest.TestCase):
    """1. Low-income user with NO real bank data → heavy consumption weight."""

    def setUp(self):
        self.features = {
            "declared_income": 5000,
            "_has_real_bank_data": False,
            "previous_loans_count": 0,
        }

    def test_user_segment(self):
        result = compute_subscores(self.features)
        self.assertEqual(result["user_segment"], "new_user_no_bank_data")

    def test_consumption_weight_at_least_040(self):
        result = compute_subscores(self.features)
        self.assertGreaterEqual(
            result["pillar_weights_used"]["consumption"],
            0.40,
            "Consumption pillar should carry heavy weight for no-bank-data users",
        )

    def test_does_not_crash_on_missing_data(self):
        # Should succeed even though many expected keys are absent
        result = compute_subscores(self.features)
        self.assertIn("financial", result)
        self.assertIn("repayment", result)
        self.assertIn("consumption", result)
        self.assertIn("history", result)


class TestHighIncomeNoHistoryManualReview(unittest.TestCase):
    """2. High-income user with bank data but no loan history → manual review."""

    def setUp(self):
        self.features = {
            "declared_income": 30000,
            "_has_real_bank_data": True,
            "previous_loans_count": 0,
            "bank_monthly_credits": 30000,
            "bank_avg_balance": 15000,
            "loan_amount": 20000,
        }

    def test_user_segment(self):
        result = compute_subscores(self.features)
        self.assertEqual(result["user_segment"], "high_income_no_history_manual_review")

    def test_no_history_manual_flag(self):
        result = compute_subscores(self.features)
        self.assertTrue(result["no_history_manual_flag"])

    def test_alternative_proxies_blocked(self):
        result = compute_subscores(self.features)
        self.assertTrue(result["alternative_proxies_blocked"])

    def test_fraud_risk_penalty_positive(self):
        result = compute_subscores(self.features)
        self.assertGreater(result["fraud_risk_penalty"], 0)


class TestHighIncomeGoodHistoryLowRisk(unittest.TestCase):
    """3. High-income user with proven repayment track record."""

    def setUp(self):
        self.features = {
            "declared_income": 25000,
            "_has_real_bank_data": True,
            "previous_loans_count": 5,
            "on_time_ratio": 0.95,
            "avg_prev_repayment_ratio": 0.95,
            "bank_monthly_credits": 25000,
            "bank_avg_balance": 12000,
            "loan_amount": 15000,
        }

    def test_composite_score_reasonable(self):
        score, breakdown = compute_composite_score(self.features)
        self.assertGreaterEqual(score, 50, "Proven borrower should score >= 50")

    def test_user_segment(self):
        _score, breakdown = compute_composite_score(self.features)
        self.assertEqual(breakdown["user_segment"], "high_income_repayment_only")


class TestCompositeScorePopulatedBeforeML(unittest.TestCase):
    """4. Feature extraction sets composite_score=0; compute_composite_score fills it."""

    def setUp(self):
        self.app_data = {
            "declared_income": 20000,
            "loan_amount": 10000,
            "tenure_months": 12,
            "has_children": False,
            "is_socially_disadvantaged": False,
            "consent_recharge": False,
            "consent_electricity": False,
            "consent_education": False,
            "consent_bank": True,
            "bank_statement": {"monthly_credits": 20000, "avg_balance": 10000},
        }

    def test_placeholder_is_zero(self):
        features = extract_features_from_application_data(self.app_data)
        self.assertEqual(features["composite_score"], 0)

    def test_computed_score_positive(self):
        features = extract_features_from_application_data(self.app_data)
        score, _ = compute_composite_score(features)
        self.assertGreater(score, 0, "Composite score should be positive after computation")


class TestConsentWithoutDataNoBonus(unittest.TestCase):
    """5. consent_recharge=True but no recharge_history → no fake proxy records."""

    def test_recharge_count_zero(self):
        app_data = {
            "declared_income": 15000,
            "loan_amount": 5000,
            "consent_recharge": True,
            # NOTE: no recharge_history key at all
        }
        features = extract_features_from_application_data(app_data)
        self.assertEqual(
            features["recharge_recharge_count"],
            0,
            "Consent alone (without actual data) must not create fake proxy records",
        )


class TestRejectBandBelowThreshold(unittest.TestCase):
    """6. map_sci_to_riskband returns correct bands at boundary values."""

    def test_reject(self):
        band, need = map_sci_to_riskband(35)
        self.assertEqual(band, "Reject")
        self.assertEqual(need, "Low Need")

    def test_high_risk(self):
        band, need = map_sci_to_riskband(45)
        self.assertEqual(band, "High Risk")
        self.assertEqual(need, "Low Need")

    def test_medium_risk(self):
        band, need = map_sci_to_riskband(55)
        self.assertEqual(band, "Medium Risk")
        self.assertEqual(need, "Low Need")

    def test_low_risk(self):
        band, need = map_sci_to_riskband(75)
        self.assertEqual(band, "Low Risk")
        self.assertEqual(need, "Low Need")


class TestConsentBankAliases(unittest.TestCase):
    """7. Either consent_bank or consent_bank_statement should set features['consent_bank']=1."""

    def test_consent_bank_flag(self):
        app_data = {
            "declared_income": 15000,
            "loan_amount": 5000,
            "consent_bank": True,
        }
        features = extract_features_from_application_data(app_data)
        self.assertEqual(features["consent_bank"], 1)

    def test_consent_bank_statement_alias(self):
        app_data = {
            "declared_income": 15000,
            "loan_amount": 5000,
            "consent_bank_statement": True,
        }
        features = extract_features_from_application_data(app_data)
        self.assertEqual(features["consent_bank"], 1)


class TestHasRealBankDataFlag(unittest.TestCase):
    """8. _has_real_bank_data is True only when actual bank statement data is provided."""

    def test_with_bank_data(self):
        app_data = {
            "declared_income": 15000,
            "loan_amount": 5000,
            "consent_bank": True,
            "bank_statement": {"monthly_credits": 20000, "avg_balance": 10000},
        }
        features = extract_features_from_application_data(app_data)
        self.assertTrue(features["_has_real_bank_data"])

    def test_without_bank_data(self):
        app_data = {
            "declared_income": 15000,
            "loan_amount": 5000,
            # No consent_bank and no bank_statement
        }
        features = extract_features_from_application_data(app_data)
        self.assertFalse(features["_has_real_bank_data"])


if __name__ == "__main__":
    unittest.main()
