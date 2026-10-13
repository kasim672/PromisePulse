"""Train/evaluate historical purchase-time risk without post-purchase leakage."""
from __future__ import annotations

import math
from typing import Any

import duckdb
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (average_precision_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# All features must be observable at the prediction cutoff (order placed).
NUM = ['item_count', 'item_total', 'freight_total', 'promised_days', 'purchase_month', 'purchase_weekday']
CAT = ['customer_state']
FEATURES = NUM + CAT


def evaluate(y: pd.Series, proba: np.ndarray, threshold: float) -> dict[str, float | None]:
    prediction = (proba >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, prediction, labels=[0, 1]).ravel().tolist()
    return {
        'precision': float(precision_score(y, prediction, zero_division=0)),
        'recall': float(recall_score(y, prediction, zero_division=0)),
        'f1': float(f1_score(y, prediction, zero_division=0)),
        'roc_auc': float(roc_auc_score(y, proba)) if len(np.unique(y)) == 2 else None,
        'pr_auc': float(average_precision_score(y, proba)) if len(np.unique(y)) == 2 else None,
        'true_positive': int(tp), 'false_positive': int(fp), 'true_negative': int(tn), 'false_negative': int(fn),
    }


def train_and_score(con: duckdb.DuckDBPyConnection) -> dict[str, Any]:
    df = con.execute("""
        SELECT o.order_id, o.purchase_ts, o.estimated_delivery_ts, o.delivered_ts,
               o.is_late::INTEGER AS actual_late, c.customer_state,
               COALESCE(o.item_count, 0)::DOUBLE AS item_count,
               o.item_total::DOUBLE AS item_total,
               o.freight_total::DOUBLE AS freight_total,
               DATE_DIFF('day', o.purchase_ts::DATE, o.estimated_delivery_ts::DATE)::DOUBLE AS promised_days,
               EXTRACT(month FROM o.purchase_ts)::DOUBLE AS purchase_month,
               EXTRACT(dow FROM o.purchase_ts)::DOUBLE AS purchase_weekday,
               o.payment_total::DOUBLE AS order_value
        FROM fact_orders o LEFT JOIN dim_customer c USING (customer_id)
        WHERE o.is_late IS NOT NULL AND o.purchase_ts IS NOT NULL
        ORDER BY o.purchase_ts, o.order_id
    """).df()
    if len(df) < 100 or df['actual_late'].nunique() < 2:
        return {'status': 'not_trained', 'reason': 'Insufficient labeled class-balanced historical deliveries.'}
    df['customer_state'] = df['customer_state'].fillna('Unknown')

    # Avoid using delivery labels that were not yet known when the subsequent
    # period began. Last-period test outcomes are used only for evaluation.
    first_cut = df.iloc[int(0.65 * len(df))]['purchase_ts']
    second_cut = df.iloc[int(0.80 * len(df))]['purchase_ts']
    train = df.loc[(df.purchase_ts < first_cut) & (df.delivered_ts < first_cut)].copy()
    validation = df.loc[(df.purchase_ts >= first_cut) & (df.purchase_ts < second_cut) & (df.delivered_ts < second_cut)].copy()
    test = df.loc[df.purchase_ts >= second_cut].copy()
    if any(len(x) < 50 or x.actual_late.nunique() < 2 for x in (train, validation, test)):
        return {'status': 'not_trained', 'reason': 'Chronological splits do not contain enough labeled outcomes per class.'}

    preprocessing = ColumnTransformer([
        ('numeric', Pipeline([('impute', SimpleImputer(strategy='median')), ('scale', StandardScaler())]), NUM),
        ('category', Pipeline([('impute', SimpleImputer(strategy='most_frequent')),
                               ('encode', OneHotEncoder(handle_unknown='ignore'))]), CAT),
    ])
    model = Pipeline([('preprocess', preprocessing),
                      ('classifier', LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42))])
    model.fit(train[FEATURES], train.actual_late.astype(int))
    validation_proba = model.predict_proba(validation[FEATURES])[:, 1]
    thresholds = np.arange(0.10, 0.91, 0.05)
    # Threshold chosen ONLY on validation set; no test-set tuning.
    threshold = float(max(thresholds, key=lambda t: f1_score(validation.actual_late, validation_proba >= t, zero_division=0)))
    test_proba = model.predict_proba(test[FEATURES])[:, 1]

    baseline = DummyClassifier(strategy='prior').fit(train[FEATURES], train.actual_late.astype(int))
    baseline_proba = baseline.predict_proba(test[FEATURES])[:, 1]
    base_metrics = evaluate(test.actual_late, baseline_proba, 0.5)
    model_metrics = evaluate(test.actual_late, test_proba, threshold)

    exported = test[['order_id', 'purchase_ts', 'customer_state', 'order_value', 'estimated_delivery_ts', 'actual_late', 'item_count', 'freight_total', 'promised_days']].copy()
    exported['risk_probability'] = test_proba
    exported['predicted_risk'] = (test_proba >= threshold).astype(int)
    exported['risk_band'] = pd.cut(test_proba, bins=[-0.001, 0.30, 0.65, 1.001], labels=['Low', 'Medium', 'High']).astype(str)
    con.register('risk_holdout', exported)
    con.execute('CREATE OR REPLACE TABLE risk_predictions AS SELECT * FROM risk_holdout')
    con.unregister('risk_holdout')

    return {
        'status': 'evaluated',
        'prediction_time': 'At order placement (historical simulated decision point)',
        'target': 'Delivered after estimated delivery calendar date; unknown outcomes excluded',
        'threshold': round(threshold, 3),
        'train_rows': int(len(train)),
        'validation_rows': int(len(validation)),
        'test_rows': int(len(test)),
        'test_start': str(test.purchase_ts.min()),
        'test_end': str(test.purchase_ts.max()),
        'model_metrics': model_metrics,
        'baseline_metrics': base_metrics,
    }
