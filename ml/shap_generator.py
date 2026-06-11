import os
from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
import shap

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
except ImportError:
    pass # Managed in requirements

class SHAPReportGenerator:
    # Comprehensive mapping of raw feature names to (English, Hindi) labels
    FEATURE_LABELS = {
        'emi_hit_rate': ('Loan Repayment Rate', 'ऋण चुकौती दर'),
        'avg_days_past_due': ('Average Days Late', 'औसत दिन देरी'),
        'max_days_past_due': ('Worst Payment Delay', 'सबसे खराब भुगतान देरी'),
        'current_days_past_due': ('Current Days Late', 'वर्तमान दिन देरी'),
        'prepayment_ratio': ('Early Payment Ratio', 'जल्दी भुगतान अनुपात'),
        'loan_utilisation_rate': ('Loan Utilization', 'ऋण उपयोग'),
        'repeat_borrower_flag': ('Repeat Borrower', 'नियमित उधारकर्ता'),
        'tenure_completion_rate': ('Loans Completed', 'पूरा किया गया ऋण'),
        'delinquency_trend': ('Payment Delay Trend', 'भुगतान देरी की प्रवृत्ति'),
        'avg_loan_size_growth': ('Loan Size Growth', 'ऋण आकार में वृद्धि'),
        'payment_consistency_score': ('Payment Consistency', 'भुगतान निरंतरता'),
        'consecutive_on_time_streak': ('On-Time Streak', 'समय पर भुगतान की लकीर'),
        'worst_delinquency_bucket': ('Max Delinquency Bucket', 'अधिकतम देरी बाल्टी'),
        'partial_payment_rate': ('Partial Payment Rate', 'आंशिक भुगतान दर'),
        'loan_purpose_diversity': ('Loan Purposes', 'ऋण के उद्देश्य'),
        'avg_loan_tenure_months': ('Average Loan Term', 'औसत ऋण अवधि'),
        'recovery_rate': ('Recovery Rate', 'वसूली दर'),
        'early_repayment_flag': ('Early Repayment Flag', 'जल्दी चुकौती ध्वज'),
        'channel_partner_diversity': ('Partner Diversity', 'भागीदार विविधता'),
        'on_time_payment_ratio': ('On-Time Ratio', 'समय पर अनुपात'),
        'late_payment_ratio': ('Late Ratio', 'देरी अनुपात'),
        '30_plus_dpd_count': ('30+ Days Late Count', '30+ दिन देरी की संख्या'),
        '60_plus_dpd_count': ('60+ Days Late Count', '60+ दिन देरी की संख्या'),
        '90_plus_dpd_count': ('90+ Days Late Count', '90+ दिन देरी की संख्या'),
        
        # Income Proxies
        'avg_monthly_electricity_units': ('Avg Electricity Usage', 'औसत बिजली उपयोग'),
        'electricity_payment_regularity': ('Electricity Payment Regularity', 'बिजली बिल भुगतान नियमितता'),
        'electricity_spend_trend': ('Electricity Spend Trend', 'बिजली खर्च प्रवृत्ति'),
        'avg_monthly_recharge_amount': ('Avg Mobile Recharge', 'औसत मोबाइल रिचार्ज'),
        'recharge_frequency_score': ('Recharge Frequency', 'रिचार्ज आवृत्ति'),
        'high_value_recharge_flag': ('High Value Recharge', 'उच्च मूल्य रिचार्ज'),
        'utility_diversity_score': ('Utility Types Count', 'उपयोगिता प्रकारों की संख्या'),
        'water_bill_payment_flag': ('Water Bill Payment', 'पानी बिल भुगतान'),
        'lpg_refill_frequency': ('LPG Refill Frequency', 'एलपीजी रिफिल आवृत्ति'),
        'estimated_consumption_percentile': ('Consumption Percentile', 'खपत प्रतिशतक'),
        'payment_mode_digital_flag': ('Digital Payment User', 'डिजिटल भुगतान उपयोगकर्ता'),
        'consumption_growth_rate': ('Consumption Growth', 'खपत में वृद्धि')
    }

    def __init__(self, model, background_data: Optional[pd.DataFrame] = None, max_background_rows: int = 100):
        self.model = model
        self.background_rows = 0
        
        if background_data is not None and not background_data.empty:
            # Sample background data between 50 and 500 rows, default to max_background_rows
            n_samples = min(len(background_data), max(50, min(max_background_rows, 500)))
            self.background_data = background_data.sample(n=n_samples, random_state=42)
            self.background_rows = len(self.background_data)
            
            self.explainer = shap.TreeExplainer(
                self.model, 
                data=self.background_data, 
                feature_perturbation="interventional"
            )
            self.perturbation_type = "interventional"
        else:
            self.explainer = shap.TreeExplainer(
                self.model, 
                feature_perturbation="tree_path_dependent"
            )
            self.perturbation_type = "tree_path_dependent"
            
    def _get_readable_label(self, raw_feature: str) -> str:
        en, hi = self.FEATURE_LABELS.get(raw_feature, (raw_feature.replace('_', ' ').title(), raw_feature))
        return f"{en} / {hi}"

    def generate_explanation(
        self, 
        beneficiary_id: str, 
        feature_vector: pd.DataFrame, 
        composite_score: int, 
        risk_band: str,
        imputed_features: List[str] = None
    ) -> Dict[str, Any]:
        """Calculates SHAP values and structures the explanation dictionary."""
        shap_values = self.explainer.shap_values(feature_vector)
        
        # Depending on XGBoost/LightGBM binary objective, shap_values might be a list
        if isinstance(shap_values, list):
            shap_values = shap_values[1] # Take positive class
            
        shap_array = shap_values[0] # Single beneficiary
        
        # Zip features with their SHAP contributions
        feature_names = feature_vector.columns.tolist()
        contributions = list(zip(feature_names, shap_array))
        
        # Sort by impact
        sorted_factors = sorted(contributions, key=lambda x: x[1]) # Ascending: negative first
        
        top_negative = sorted_factors[:3] # Lowest (negative impact on score)
        top_positive = sorted_factors[-5:] # Highest (positive impact on score)
        top_positive.reverse() # Sort descending
        
        def format_factors(factors):
            res = []
            for feat, cont in factors:
                val = feature_vector[feat].iloc[0]
                res.append({
                    "feature": feat,
                    "contribution": float(cont),
                    "readable_label": self._get_readable_label(feat),
                    "feature_value": float(val) if isinstance(val, (int, float, np.integer, np.floating)) else str(val)
                })
            return res
            
        data_completeness_pct = 100.0
        if imputed_features and len(feature_names) > 0:
            data_completeness_pct = ((len(feature_names) - len(imputed_features)) / len(feature_names)) * 100.0

        explanation = {
            "beneficiary_id": beneficiary_id,
            "composite_score": composite_score,
            "risk_band": risk_band,
            "top_positive_factors": format_factors(top_positive),
            "top_negative_factors": format_factors(top_negative),
            "income_band_reason": "Derived from utility and telecom footprint proxies.",
            "data_completeness_pct": data_completeness_pct,
            "imputed_features": imputed_features or [],
            "model_version": "v1.3.0",
            "explainer_type": "tree",
            "feature_perturbation": self.perturbation_type,
            "background_rows": self.background_rows,
            "generated_at": datetime.utcnow().isoformat()
        }
        return explanation

    def save_to_mongodb(self, mongo_collection, explanation: Dict[str, Any]):
        """Synchronously saves the explanation to the MongoDB collection."""
        mongo_collection.insert_one(explanation)

    def generate_pdf(self, explanation: Dict[str, Any], output_path: str):
        """Generates a 1-page bilingual PDF using ReportLab."""
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        elements.append(Paragraph(f"Credit Explanation Report / क्रेडिट स्पष्टीकरण रिपोर्ट", styles['Title']))
        elements.append(Spacer(1, 12))
        
        # Beneficiary Header
        elements.append(Paragraph(f"<b>Beneficiary ID (लाभार्थी आईडी):</b> {explanation['beneficiary_id']}", styles['Normal']))
        elements.append(Paragraph(f"<b>Composite Score (समग्र स्कोर):</b> {explanation['composite_score']} / 1000", styles['Normal']))
        
        # Risk Band Coloring
        band_colors = {
            'A': colors.darkgreen,
            'B': colors.green,
            'C': colors.orange,
            'D': colors.red,
            'E': colors.darkred
        }
        bg_color = band_colors.get(explanation['risk_band'], colors.grey)
        
        band_data = [[Paragraph(f"<b>Risk Band (जोखिम बैंड): {explanation['risk_band']}</b>", styles['Normal'])]]
        band_table = Table(band_data, colWidths=[200])
        band_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(Spacer(1, 12))
        elements.append(band_table)
        elements.append(Spacer(1, 24))
        
        # Positive Factors
        elements.append(Paragraph("<b>Top Positive Factors (शीर्ष सकारात्मक कारक)</b>", styles['Heading2']))
        pos_data = [["Factor", "Value", "Impact"]]
        for f in explanation['top_positive_factors']:
            pos_data.append([f["readable_label"], str(round(f["feature_value"], 2)), f"+{round(f['contribution'], 3)}"])
            
        pos_table = Table(pos_data, colWidths=[250, 100, 100])
        pos_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (2, 1), (2, -1), colors.green),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(pos_table)
        elements.append(Spacer(1, 24))
        
        # Negative Factors
        elements.append(Paragraph("<b>Top Negative Factors (शीर्ष नकारात्मक कारक)</b>", styles['Heading2']))
        neg_data = [["Factor", "Value", "Impact"]]
        for f in explanation['top_negative_factors']:
            neg_data.append([f["readable_label"], str(round(f["feature_value"], 2)), str(round(f['contribution'], 3))])
            
        neg_table = Table(neg_data, colWidths=[250, 100, 100])
        neg_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (2, 1), (2, -1), colors.red),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(neg_table)
        
        # Footer Meta
        elements.append(Spacer(1, 40))
        elements.append(Paragraph(f"<font size=8>Generated: {explanation['generated_at']} | Model: {explanation['model_version']} | Data Completeness: {explanation['data_completeness_pct']}%</font>", styles['Normal']))
        
        doc.build(elements)
