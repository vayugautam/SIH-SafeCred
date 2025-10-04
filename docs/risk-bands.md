# Risk Bands

- **Auto-approve**: Score >= 80  
  - Action: System can auto-approve loan.
- **Manual review**: Score in [60, 79]  
  - Action: Officer reviews application; officer sees explanation and documents.
- **Reject**: Score < 60  
  - Action: System suggests rejection; officer may override under documented reason.

# Repeat borrower fast-track rule
If `repeat_borrower` == True AND `repayment_score` >= 0.8 (CONFIG.thresholds.repayment) and historical_repayment_quality >= CONFIG.thresholds.repeat_borrower:
- Apply small boost (config.repeat_borrower_boost) and re-evaluate risk band.
