import numpy as np
from sklearn.calibration import calibration_curve, CalibratedClassifierCV
from sklearn.metrics import brier_score_loss
import pandas as pd

def calibrate_model(clf, X_train, y_train, method='isotonic', cv=3):
    """
    Calibrates a classifier using Isotonic Regression or Platt Scaling via cross-validation.
    """
    calibrated_clf = CalibratedClassifierCV(estimator=clf, method=method, cv=cv)
    calibrated_clf.fit(X_train, y_train)
    return calibrated_clf

def evaluate_calibration(clf, X_test, y_test):
    """
    Evaluates the calibration of a classifier.
    Returns Brier score and calibration curve data.
    """
    probs = clf.predict_proba(X_test)[:, 1]
    brier = brier_score_loss(y_test, probs)
    prob_true, prob_pred = calibration_curve(y_test, probs, n_bins=10)
    return brier, prob_true, prob_pred

def expected_loss(probs, loan_amounts, lgd=0.5):
    """
    Calculates expected loss.
    EL = PD (Default Prob) * LGD * EAD (Exposure)
    Here, PD = 1 - probs (since probs is P(Good)).
    """
    pd_arr = 1.0 - probs
    return pd_arr * lgd * loan_amounts
