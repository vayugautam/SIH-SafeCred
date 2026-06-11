-- PostgreSQL DDL for SafeCred Cloud-Native Platform

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;

-- Type Enums
DO $$ BEGIN
    CREATE TYPE consumption_type AS ENUM ('ELECTRICITY', 'MOBILE_RECHARGE', 'LPG', 'WATER', 'BROADBAND');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. beneficiaries
CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nbcfdc_id VARCHAR(100) UNIQUE NOT NULL,
    name TEXT,
    dob DATE,
    gender CHAR(1),
    caste_category VARCHAR(20),
    district_code CHAR(6),
    state_code CHAR(2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 2. loans
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
    channel_partner_id UUID,
    loan_amount_paise BIGINT,
    approved_amount_paise BIGINT,
    tenure_months INT,
    interest_rate_bps INT,
    purpose_code VARCHAR(10),
    disbursement_date DATE,
    status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. repayments
-- Note: To make this a TimescaleDB hypertable partitioned by created_at, 
-- created_at must be part of the primary key.
CREATE TABLE repayments (
    id UUID DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    due_date DATE,
    paid_date DATE,
    due_amount_paise BIGINT,
    paid_amount_paise BIGINT,
    days_past_due INT DEFAULT 0,
    payment_mode VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
);

-- Convert repayments to TimescaleDB Hypertable partitioned by time (created_at)
SELECT create_hypertable('repayments', 'created_at', if_not_exists => TRUE);

-- 4. consumption_records
CREATE TABLE consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
    record_type consumption_type,
    period_month DATE,
    amount_paise BIGINT,
    units DECIMAL(10,2),
    payment_status VARCHAR(20),
    source VARCHAR(50),
    ocr_confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. feature_vectors
CREATE TABLE feature_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID UNIQUE REFERENCES beneficiaries(id) ON DELETE CASCADE,
    features JSONB NOT NULL,
    completeness_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 6. beneficiary_scores
CREATE TABLE beneficiary_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
    composite_score INT,
    repayment_score FLOAT,
    income_score FLOAT,
    sei_score FLOAT,
    risk_band CHAR(1),
    confidence_level VARCHAR(10),
    eligible_for_digital_lending BOOL,
    shap_report JSONB,
    scored_at TIMESTAMPTZ DEFAULT NOW(),
    model_version VARCHAR(20),
    is_current BOOL DEFAULT TRUE
);

-- 7. loan_applications
CREATE TABLE loan_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
    score_snapshot_id UUID REFERENCES beneficiary_scores(id) ON DELETE SET NULL,
    amount_requested_paise BIGINT,
    amount_approved_paise BIGINT,
    status VARCHAR(30),
    officer_id UUID,
    kyc_status VARCHAR(20),
    bank_verified BOOL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ
);

-- 8. socioeconomic_indices
CREATE TABLE socioeconomic_indices (
    district_code CHAR(6) PRIMARY KEY,
    state_code CHAR(2),
    avg_income_lakh FLOAT,
    poverty_rate_pct FLOAT,
    digital_literacy_pct FLOAT,
    electricity_penetration_pct FLOAT,
    data_year INT,
    source VARCHAR(50),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. audit_trail (Immutable Log)
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    action VARCHAR(100),
    actor_id VARCHAR(100),
    actor_role VARCHAR(50),
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address INET,
    request_id UUID,
    hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immutability rules for audit_trail (prevents updates and deletes)
CREATE RULE no_update AS ON UPDATE TO audit_trail DO INSTEAD NOTHING;
CREATE RULE no_delete AS ON DELETE TO audit_trail DO INSTEAD NOTHING;

-- ==========================================
-- INDEX DEFINITIONS
-- ==========================================

-- BTREE on all Foreign Key columns (to prevent locking during deletes and speed up joins)
CREATE INDEX idx_loans_beneficiary_id ON loans(beneficiary_id);
CREATE INDEX idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX idx_consumption_beneficiary_id ON consumption_records(beneficiary_id);
CREATE INDEX idx_scores_beneficiary_id ON beneficiary_scores(beneficiary_id);
CREATE INDEX idx_applications_beneficiary_id ON loan_applications(beneficiary_id);
CREATE INDEX idx_applications_score_snapshot_id ON loan_applications(score_snapshot_id);

-- GIN Index on feature_vectors.features for rapid JSON key/value path queries
CREATE INDEX idx_feature_vectors_features_gin ON feature_vectors USING GIN (features);

-- Composite index to rapidly pull the chronological scoring history for a specific beneficiary
CREATE INDEX idx_scores_beneficiary_scored_at ON beneficiary_scores(beneficiary_id, scored_at DESC);

-- Partial index for O(1) instantaneous lookups of the currently active score per beneficiary
CREATE INDEX idx_scores_current ON beneficiary_scores(beneficiary_id) WHERE is_current = TRUE;
