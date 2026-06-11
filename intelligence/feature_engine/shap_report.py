import os
import json
import io
from datetime import datetime
from typing import Dict, Any, List

import numpy as np
import pandas as pd
import shap
from pymongo import MongoClient

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

READABLE_LABELS = {
    "emi_hit_rate": {"en": "Loan Repayment Rate", "hi": "ऋण चुकाने की दर"},
    "avg_days_past_due": {"en": "Average Days Late", "hi": "देरी के औसत दिन"},
    "max_days_past_due": {"en": "Maximum Days Late", "hi": "देरी के अधिकतम दिन"},
    "prepayment_ratio": {"en": "Early Repayment Frequency", "hi": "जल्दी चुकाने की आवृत्ति"},
    "loan_utilisation_rate": {"en": "Credit Utilisation", "hi": "ऋण उपयोग"},
    "repeat_borrower_flag": {"en": "Prior Borrowing History", "hi": "पूर्व उधार इतिहास"},
    "tenure_completion_rate": {"en": "Loan Completion Rate", "hi": "ऋण पूरा करने की दर"},
    "delinquency_trend": {"en": "Recent Delay Trend", "hi": "हालिया देरी का रुझान"},
    "avg_loan_size_growth": {"en": "Loan Amount Growth", "hi": "ऋण राशि में वृद्धि"},
    "payment_consistency_score": {"en": "Payment Consistency", "hi": "भुगतान में निरंतरता"},
    "consecutive_on_time_streak": {"en": "On-Time Streak", "hi": "समय पर भुगतान की श्रृंखला"},
    "worst_delinquency_bucket": {"en": "Worst Delay Severity", "hi": "देरी की अधिकतम गंभीरता"},
    "partial_payment_rate": {"en": "Partial Payment Frequency", "hi": "आंशिक भुगतान की आवृत्ति"},
    "loan_purpose_diversity": {"en": "Loan Purpose Variety", "hi": "ऋण उद्देश्यों की विविधता"},
    "avg_loan_tenure_months": {"en": "Average Loan Duration", "hi": "औसत ऋण अवधि"},
    "recovery_rate": {"en": "Recovery after Default", "hi": "चूक के बाद सुधार"},
    "early_repayment_flag": {"en": "Early Closure Record", "hi": "जल्दी बंद करने का रिकॉर्ड"},
    "channel_partner_diversity": {"en": "Lender Variety", "hi": "ऋणदाताओं की विविधता"},
    "avg_monthly_electricity_units": {"en": "Average Electricity Use", "hi": "औसत बिजली का उपयोग"},
    "electricity_payment_regularity": {"en": "Electricity Payment Consistency", "hi": "बिजली बिल भुगतान निरंतरता"},
    "electricity_spend_trend": {"en": "Electricity Spend Trend", "hi": "बिजली खर्च का रुझान"},
    "avg_monthly_recharge_amount": {"en": "Average Mobile Recharge", "hi": "औसत मोबाइल रिचार्ज"},
    "recharge_frequency_score": {"en": "Recharge Frequency", "hi": "रिचार्ज की आवृत्ति"},
    "high_value_recharge_flag": {"en": "High Value Recharges", "hi": "उच्च मूल्य का रिचार्ज"},
    "utility_diversity_score": {"en": "Utility Bill Variety", "hi": "उपयोगिता बिल की विविधता"},
    "water_bill_payment_flag": {"en": "Piped Water Bill Record", "hi": "पानी के बिल का रिकॉर्ड"},
    "lpg_refill_frequency": {"en": "LPG Refill Frequency", "hi": "एलपीजी सिलेंडर रिफिल आवृत्ति"},
    "estimated_consumption_percentile": {"en": "Relative Consumption Level", "hi": "सापेक्ष खपत स्तर"},
    "payment_mode_digital_flag": {"en": "Digital Payment Usage", "hi": "डिजिटल भुगतान का उपयोग"},
    "consumption_growth_rate": {"en": "Spending Growth Rate", "hi": "खर्च वृद्धि दर"}
}

def get_risk_band(score: int) -> str:
    if score >= 750: return "A - Low Risk - High Need"
    if score >= 600: return "B - Low Risk - Low Need"
    if score >= 450: return "C - Med Risk - High Need"
    if score >= 300: return "D - High Risk - High Need"
    return "E - High Risk - Low Need"

class SHAPReportGenerator:
    def __init__(self, model, background_data: pd.DataFrame, mongo_uri: str = "mongodb://localhost:27017/", db_name: str = "safecred"):
        # We need a background dataset for 'interventional' perturbation
        self.explainer = shap.TreeExplainer(model, data=background_data, feature_perturbation='interventional')
        self.mongo_client = MongoClient(mongo_uri)
        self.db = self.mongo_client[db_name]
        self.collection = self.db["shap_explanations"]

    def generate_explanation_dict(
        self, 
        beneficiary_id: str, 
        feature_vector: pd.DataFrame, 
        score: int, 
        data_completeness_pct: float,
        imputed_features: List[str],
        model_version: str = "1.0.0"
    ) -> Dict[str, Any]:
        
        # 2. Compute shap_values for single beneficiary
        shap_values = self.explainer.shap_values(feature_vector)
        # Handle multiclass or binary shap output (assume binary/prob output here so shap_values is a flat array or 2D [1, num_features])
        if isinstance(shap_values, list):
            shap_values = shap_values[1] # Take positive class if list
        if shap_values.ndim == 2:
            shap_vals = shap_values[0]
        else:
            shap_vals = shap_values
            
        feature_names = feature_vector.columns.tolist()
        feature_vals = feature_vector.iloc[0].values

        # Combine into list of dicts
        contributions = []
        for i, f_name in enumerate(feature_names):
            val = float(feature_vals[i]) if pd.notnull(feature_vals[i]) else 0.0
            contrib = float(shap_vals[i])
            label_dict = READABLE_LABELS.get(f_name, {"en": f_name, "hi": f_name})
            contributions.append({
                "feature": f_name,
                "contribution": contrib,
                "readable_label": label_dict["en"],
                "readable_label_hi": label_dict["hi"],
                "feature_value": val
            })

        # Sort by absolute contribution to find top drivers
        # Positive factors (pushing score higher/better)
        positives = sorted([c for c in contributions if c["contribution"] > 0], key=lambda x: x["contribution"], reverse=True)
        # Negative factors (pushing score lower/worse)
        negatives = sorted([c for c in contributions if c["contribution"] < 0], key=lambda x: x["contribution"])

        explanation = {
            "beneficiary_id": beneficiary_id,
            "composite_score": score,
            "risk_band": get_risk_band(score),
            "top_positive_factors": positives[:5],
            "top_negative_factors": negatives[:3],
            "income_band_reason": "Derived from regular utility and telecom proxy consumption.",
            "data_completeness_pct": data_completeness_pct,
            "imputed_features": imputed_features,
            "model_version": model_version,
            "generated_at": datetime.utcnow()
        }
        
        return explanation

    def generate_pdf(self, explanation: Dict[str, Any]) -> bytes:
        """Exports a borrower-friendly bilingual 1-page PDF using ReportLab."""
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Draw Header
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, height - 50, "SafeCred Beneficiary Report / SafeCred लाभार्थी रिपोर्ट")
        
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 80, f"Beneficiary ID: {explanation['beneficiary_id']}")
        c.drawString(50, height - 100, f"Score: {explanation['composite_score']} / 1000")
        c.drawString(50, height - 120, f"Risk Band: {explanation['risk_band']}")
        c.drawString(50, height - 140, f"Data Completeness: {explanation['data_completeness_pct']}%")
        
        # Positive Factors
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, height - 180, "Top Factors Strengthening Your Profile:")
        c.setFont("Helvetica", 10)
        y = height - 200
        for p in explanation['top_positive_factors']:
            text = f"+ {p['readable_label']} ({p['readable_label_hi']}): {p['feature_value']:.2f}"
            c.drawString(60, y, text)
            y -= 20
            
        # Negative Factors
        c.setFont("Helvetica-Bold", 12)
        y -= 20
        c.drawString(50, y, "Areas for Improvement:")
        c.setFont("Helvetica", 10)
        y -= 20
        for n in explanation['top_negative_factors']:
            text = f"- {n['readable_label']} ({n['readable_label_hi']}): {n['feature_value']:.2f}"
            c.drawString(60, y, text)
            y -= 20
            
        # Footer
        c.setFont("Helvetica-Oblique", 8)
        c.drawString(50, 50, f"Model Version: {explanation['model_version']} | Generated: {explanation['generated_at'].strftime('%Y-%m-%d %H:%M:%S UTC')}")
        
        c.save()
        return buffer.getvalue()

    def save_to_mongodb(self, explanation: Dict[str, Any]):
        """Saves the explanation JSON to MongoDB shap_explanations collection."""
        # Convert generated_at to native python datetime if not already
        if isinstance(explanation.get("generated_at"), str):
            explanation["generated_at"] = datetime.fromisoformat(explanation["generated_at"])
        self.collection.insert_one(explanation)
