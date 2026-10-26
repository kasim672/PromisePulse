"""Scientific guardrail: no holdout information is used to fit model preprocessing."""
import numpy as np
import pandas as pd
from scripts.build_mining_lab import prepare_features

train = pd.DataFrame({
    "payment_total": [10.0, np.nan, 30.0],
    "item_count": [1, 2, 3],
    "customer_state": ["SP", "RJ", "SP"],
})
holdout = pd.DataFrame({
    "payment_total": [np.nan, 99999999.0],
    "item_count": [4, 5],
    "customer_state": ["MG", "RJ"],
})
fit, transform = prepare_features(train, holdout, ["payment_total","item_count","customer_state"])
assert list(fit.columns) == list(transform.columns), "holdout must share train-only vocabulary"
assert float(fit.iloc[1]["payment_total"]) == 20.0, "train median must be used"
assert float(transform.iloc[0]["payment_total"]) == 20.0, "test missing value must use train median"
assert float(transform.iloc[1]["payment_total"]) == 99999999.0, "holdout value is transformed, not clipped"
assert float(transform.iloc[0].filter(like="customer_state_").sum()) == 0.0, "unseen holdout state must not create a new fitted column"
assert "customer_state_MG" not in fit.columns, "test-only categorical level leaked into training vocabulary"
print("PASS: numeric imputations, category vocabulary and model matrix width fit on training rows only")
