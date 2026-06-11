from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Any
from datetime import datetime

class SignalHistory(BaseModel):
    type: str
    value: float
    ts: datetime
    weight: float

class IncomePosterior(BaseModel):
    beneficiary_id: str
    posterior: List[float] = Field(..., min_length=5, max_length=5)
    predicted_band: int = Field(..., ge=1, le=5)
    confidence: float = Field(..., ge=0.0, le=1.0)
    signal_history: List[SignalHistory] = []
    prior_source: str
    model_version: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("posterior")
    @classmethod
    def validate_posterior(cls, values):
        if len(values) != 5:
            raise ValueError("Posterior must contain exactly 5 values")
        if any(v < 0 for v in values):
            raise ValueError("Posterior values must be non-negative")
        if abs(sum(values) - 1.0) > 1e-6:
            raise ValueError("Posterior must sum to 1.0")
        return values

class RawConsumptionDoc(BaseModel):
    beneficiary_id: str
    file_type: str
    file_hash: str
    document_type: str
    ocr_raw_text: str
    extracted_fields: Dict[str, Any] = {}
    ocr_confidence: float = Field(..., ge=0.0, le=1.0)
    needs_manual_review: bool = False
    parsing_version: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

class ShapFactor(BaseModel):
    feature: str
    contribution: float
    label: str
    value: Any

class ShapExplanation(BaseModel):
    beneficiary_id: str
    score_id: str
    shap_values: Dict[str, float]
    base_value: float
    top_factors: List[ShapFactor]
    income_band_reason: str
    data_completeness_pct: float
    model_version: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class ModelHealthLog(BaseModel):
    model_version: str
    check_date: datetime = Field(default_factory=datetime.utcnow)
    auc_score: float
    psi_scores: Dict[str, float]
    ks_statistic: float
    drift_detected: bool
    drift_features: List[str] = []
    action_taken: str
    checked_at: datetime = Field(default_factory=datetime.utcnow)
