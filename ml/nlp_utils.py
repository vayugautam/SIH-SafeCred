"""
nlp_utils.py

Simple NLP utilities for categorizing bank transactions and analyzing text data.
This serves as a lightweight NLP component without heavy dependencies.
"""

import re
from typing import List, Dict, Any

class TransactionCategorizer:
    """
    Rule-based NLP categorizer for bank transactions.
    """
    
    CATEGORIES = {
        "INCOME": [
            r"salary", r"credit", r"deposit", r"neft.*in", r"imps.*in", 
            r"upi.*in", r"dividend", r"interest", r"refund"
        ],
        "UTILITIES": [
            r"electricity", r"water", r"gas", r"bill", r"recharge", 
            r"mobile", r"dth", r"broadband", r"internet", r"bescom", r"bwssb"
        ],
        "FOOD": [
            r"swiggy", r"zomato", r"restaurant", r"cafe", r"coffee", 
            r"grocery", r"supermarket", r"mart", r"food", r"pizza", r"burger"
        ],
        "TRANSPORT": [
            r"uber", r"ola", r"rapido", r"fuel", r"petrol", r"diesel", 
            r"shell", r"hpcl", r"bpcl", r"metro", r"bus", r"train", r"irctc"
        ],
        "LOAN_REPAYMENT": [
            r"emi", r"loan", r"finance", r"bajaj", r"muthoot", r"manappuram", 
            r"repayment", r"ach.*debit"
        ],
        "ENTERTAINMENT": [
            r"netflix", r"prime", r"hotstar", r"movie", r"cinema", r"bookmyshow", 
            r"spotify", r"youtube", r"game"
        ]
    }

    @staticmethod
    def categorize(description: str) -> str:
        """
        Categorize a single transaction description.
        """
        desc_lower = description.lower()
        
        for category, patterns in TransactionCategorizer.CATEGORIES.items():
            for pattern in patterns:
                if re.search(pattern, desc_lower):
                    return category
        
        return "OTHER"

    @staticmethod
    def analyze_statements(statements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze a list of bank statement entries and return spending breakdown.
        """
        breakdown = {cat: 0.0 for cat in TransactionCategorizer.CATEGORIES.keys()}
        breakdown["OTHER"] = 0.0
        
        total_debits = 0.0
        
        for entry in statements:
            amount = float(entry.get("debit", 0) or 0)
            if amount > 0:
                category = TransactionCategorizer.categorize(entry.get("description", ""))
                breakdown[category] += amount
                total_debits += amount
        
        # Calculate percentages
        if total_debits > 0:
            percentages = {k: round(v / total_debits, 3) for k, v in breakdown.items()}
        else:
            percentages = {k: 0.0 for k in breakdown.keys()}
            
        return {
            "breakdown_amount": breakdown,
            "breakdown_percentage": percentages,
            "total_debits": total_debits
        }

class TextAnalyzer:
    """
    Basic text analysis for loan purpose or other text fields.
    """
    
    POSITIVE_KEYWORDS = ["education", "health", "medical", "business", "agriculture", "farming", "house", "home", "repair"]
    NEGATIVE_KEYWORDS = ["gamble", "betting", "crypto", "speculation", "vacation", "luxury"]

    @staticmethod
    def analyze_purpose(purpose: str) -> Dict[str, Any]:
        if not purpose:
            return {"sentiment": "neutral", "risk_flag": False}
            
        purpose_lower = purpose.lower()
        
        risk_flag = any(kw in purpose_lower for kw in TextAnalyzer.NEGATIVE_KEYWORDS)
        is_productive = any(kw in purpose_lower for kw in TextAnalyzer.POSITIVE_KEYWORDS)
        
        return {
            "sentiment": "positive" if is_productive else "negative" if risk_flag else "neutral",
            "risk_flag": risk_flag,
            "is_productive": is_productive
        }
