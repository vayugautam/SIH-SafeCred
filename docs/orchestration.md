# Orchestration Pseudocode — SafeCred (Phase 0)

**Purpose:** Orchestrator decides data flow: repeated-borrower -> repayment -> income -> proxy -> ML -> final.

## Config thresholds (see infra/config.json)
- REPAY_OK_THRESHOLD = 0.80
- PROXY_THRESHOLD = 0.60
- REPEAT_BORROWER_ONTIME = 0.90

## High-level steps
1. Load application by app_id.
2. Load user history.
3. If repeated_borrower(user) and user.avg_on_time_ratio >= REPEAT_BORROWER_ONTIME:
   - score = score_from_history(user)
   - save and return
4. If bank_statement exists:
   - rep = run_repayment_check(bank_statement)
   - if rep.on_time_ratio >= REPAY_OK_THRESHOLD:
       - features = build_features_from_repayment(rep, app)
       - call ML -> score
       - save and return
5. Run income_verification (OCR/bank inflow):
   - if verification_status is VERIFIED or PARTIAL and confident:
       - features = build_features_from_income(verified_income, app)
       - call ML -> score
       - save and return
6. Run proxy_eval (recharge, electricity, utilities):
   - if proxy_score >= PROXY_THRESHOLD:
       - features = build_features_from_proxy(proxy_score, app)
       - call ML -> score
       - save and return
7. Else:
   - mark app for MANUAL_REVIEW and return

## Logging & Explainability
- Save for every run: model_version, input_features, feature_values, model_output, explainability_json, route_used.
