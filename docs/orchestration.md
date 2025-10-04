# Orchestration Pseudocode

## High level
1. Applicant submits application (form + documents + bank statement).
2. Backend stores files, normalizes applicant data, triggers orchestrator.
3. Orchestrator:
   - Parses repayment history from bank statements (repayment_parser).
   - Runs income verification (compare declared income vs inferred income).
   - If income mismatch > 10%:
       - If income classified as 'fixed/stable' => flag manual_review_income_verification
       - Else => evaluate alternative proxies
   - Compute proxy_score from proxies (mobile_recharge, electricity, utility_bills)
   - Prepare feature vector: [repayment_score, verified_income_flag, proxy_score, repeat_borrower_flag, other_meta]
   - Call ML scoring service (FastAPI) with feature vector → returns probability/score and feature importances
   - Map model output to 0-100 composite score using scaling function
   - Apply repeat-borrower fast-track rule (if repeat_borrower & historical_repayment >= threshold -> boost)
   - Classify risk band (>=80 auto-approve, 60-79 manual review, <60 reject)
   - Persist decision + explanation to DB
   - Notify Officer Dashboard and Applicant (status)
   - If fraud heuristics triggered -> flag for Admin and increase fraud counter

## Components / Functions (pseudocode)

function receive_application(app_payload):
    save_to_db(app_payload)
    store_files(app_payload.files)
    enqueue_task("orchestrate", app_id=app_payload.id)

function orchestrate(app_id):
    app = db.get_application(app_id)
    parsed_repayment = repayment_parser.parse(app.bank_statements)
    inferred_income = income_inference.estimate(parsed_repayment, app.bank_statements)
    declared_income = app.declared_income
    income_diff_pct = abs(inferred_income - declared_income) / max(declared_income, 1)

    if income_diff_pct <= 0.10:
        income_verification_status = "verified"
        income_verified_flag = True
    else:
        income_verified_flag = False
        employment_type = employment_classifier.classify(app, parsed_repayment, metadata)
        if employment_type == "fixed":
            set_manual_review_reason(app_id, "IncomeMismatch_FixedIncome")
            income_verification_status = "manual_review"
            proceed_to_manual_review(app_id)
            return
        else:
            proxies = proxy_evaluator.evaluate(app, parsed_repayment, external_proxies)
            proxy_score = proxies.normalized_score  # 0-1

    repayment_score = repayment_scoring.compute(parsed_repayment)  # 0-1
    repeat_borrower_flag = repeat_borrower_detector.check(app.customer_id)

    features = {
        "repayment_score": repayment_score,
        "income_verified": 1 if income_verified_flag else 0,
        "proxy_score": proxy_score if not income_verified_flag else 1.0,
        "repeat_borrower": 1 if repeat_borrower_flag else 0,
        "declared_income": declared_income,
        "inferred_income": inferred_income,
        "...": "other features"
    }

    model_resp = ml_service.score(features)  # returns {prob, raw_score, feature_importances}
    raw_prob = model_resp.prob
    model_importances = model_resp.feature_importances

    # scale to 0-100
    composite_score = scale_to_100(raw_prob)

    # repeat-borrower fast-track rule
    if repeat_borrower_flag and repayment_score >= CONFIG.thresholds.repayment:
        composite_score = min(100, composite_score + CONFIG.thresholds.repeat_borrower_boost * 100)

    risk_band = map_score_to_risk_band(composite_score)  # >=80 auto, 60-79 manual, <60 reject

    save_decision(app_id, composite_score, risk_band, model_importances)

    notify_officer_dashboard(app_id)
    notify_applicant(app_id)

function map_score_to_risk_band(score):
    if score >= 80: return "AUTO_APPROVE"
    if score >= 60: return "MANUAL_REVIEW"
    return "REJECT"
