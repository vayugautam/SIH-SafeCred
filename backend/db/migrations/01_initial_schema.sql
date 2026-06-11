-- ==========================================
-- SafeCred Master Data Definition Language
-- ==========================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 2. Custom Types
DO $$ BEGIN
    CREATE TYPE record_type_enum AS ENUM ('ELECTRICITY', 'MOBILE', 'WATER', 'GAS', 'INTERNET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tables (Dependency Order)

CREATE TABLE IF NOT EXISTS socioeconomic_indices (
    district_code CHAR(6) PRIMARY KEY,
    state_code CHAR(2) NOT NULL,
    avg_income_lakh FLOAT NOT NULL,
    poverty_rate_pct FLOAT NOT NULL,
    digital_literacy_pct FLOAT NOT NULL,
    electricity_penetration_pct FLOAT NOT NULL,
    data_year INT NOT NULL,
    source VARCHAR(50) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nbcfdc_id VARCHAR UNIQUE NOT NULL,
    name TEXT NOT NULL,
    dob DATE NOT NULL,
    gender CHAR(1) NOT NULL,
    caste_category VARCHAR(20) NOT NULL,
    district_code CHAR(6) NOT NULL REFERENCES socioeconomic_indices(district_code),
    state_code CHAR(2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
    channel_partner_id UUID NOT NULL,
    loan_amount_paise BIGINT NOT NULL,
    approved_amount_paise BIGINT NOT NULL,
    tenure_months INT NOT NULL,
    interest_rate_bps INT NOT NULL,
    purpose_code VARCHAR(10) NOT NULL,
    disbursement_date DATE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TIMESCALEDB HYPERTABLE: Requires created_at in Primary Key
CREATE TABLE IF NOT EXISTS repayments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id),
    due_date DATE NOT NULL,
    paid_date DATE,
    due_amount_paise BIGINT NOT NULL,
    paid_amount_paise BIGINT NOT NULL,
    days_past_due INT DEFAULT 0 NOT NULL,
    payment_mode VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
);

CREATE TABLE IF NOT EXISTS consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
    record_type record_type_enum NOT NULL,
    period_month DATE NOT NULL,
    amount_paise BIGINT NOT NULL,
    units DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    source VARCHAR(50) NOT NULL,
    ocr_confidence FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID UNIQUE NOT NULL REFERENCES beneficiaries(id),
    features JSONB NOT NULL,
    completeness_score FLOAT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS beneficiary_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
    composite_score INT NOT NULL,
    repayment_score FLOAT NOT NULL,
    income_score FLOAT NOT NULL,
    sei_score FLOAT NOT NULL,
    risk_band CHAR(1) NOT NULL,
    confidence_level VARCHAR(10) NOT NULL,
    eligible_for_digital_lending BOOL NOT NULL,
    shap_report JSONB NOT NULL,
    scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model_version VARCHAR(20) NOT NULL,
    is_current BOOL NOT NULL DEFAULT TRUE,
    UNIQUE (beneficiary_id, scored_at)
);

CREATE TABLE IF NOT EXISTS loan_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
    score_snapshot_id UUID NOT NULL REFERENCES beneficiary_scores(id),
    amount_requested_paise BIGINT NOT NULL,
    amount_approved_paise BIGINT,
    status VARCHAR(30) NOT NULL,
    officer_id UUID,
    kyc_status VARCHAR(20),
    bank_verified BOOL NOT NULL DEFAULT FALSE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address INET,
    request_id UUID,
    chain_index BIGINT NOT NULL,
    previous_hash TEXT NOT NULL,
    hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TimescaleDB Conversion
-- Turn the repayments table into a hypertable partitioned by created_at.
SELECT create_hypertable('repayments', 'created_at', if_not_exists => TRUE);

-- 5. Immutability Rules for Audit Trail
CREATE RULE no_update AS ON UPDATE TO audit_trail DO INSTEAD NOTHING;
CREATE RULE no_delete AS ON DELETE TO audit_trail DO INSTEAD NOTHING;

-- 6. Advanced Indexing

-- 6.1 Foreign Key Indexes (BTREE)
CREATE INDEX IF NOT EXISTS idx_beneficiaries_district ON beneficiaries(district_code);
CREATE INDEX IF NOT EXISTS idx_loans_beneficiary ON loans(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_repayments_loan ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_consumption_beneficiary ON consumption_records(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_scores_beneficiary ON beneficiary_scores(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_applications_beneficiary ON loan_applications(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_applications_score ON loan_applications(score_snapshot_id);

-- 6.2 Standalone Index for Repayments Canonical ID
CREATE INDEX IF NOT EXISTS idx_repayments_id ON repayments(id);

-- 6.3 Fast JSONB Index using jsonb_path_ops
CREATE INDEX IF NOT EXISTS idx_feature_vectors_json ON feature_vectors USING GIN (features jsonb_path_ops);

-- 6.4 Risk Scoring Timelines and Partial Indexes
CREATE INDEX IF NOT EXISTS idx_scores_current ON beneficiary_scores(beneficiary_id) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_scores_history ON beneficiary_scores(beneficiary_id, scored_at DESC);

-- 6.5 Audit Trail Crypto Lookups
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_chain ON audit_trail(entity_type, entity_id, chain_index);
