# PromisePulse 5.0 — Run real offline data mining on historical Olist Parquet

This marker triggers the branch-only GitHub Actions workflow `v5-mining-export.yml`.

Requirements:
- Use six currently committed source warehouse tables and the real Olist historical records
- Publish descriptives, missingness, histograms, Pearson matrix and dataset integrity
- Chronological 77/23 split for Decision Tree, Gaussian Naive Bayes, Logistic Regression and majority baseline
- Simple/multiple Linear Regression and a tree baseline against observed delivery days
- K-Means, Ward agglomerative and divisive Bisecting K-Means, with actual PCA scatter and sampled Ward dendrogram linkage
- Apriori, FP-Growth and vertical-format Eclat for category baskets (exclude insufficient data; do not fake support)
- Validate output with `scripts/verify_mining_lab.py` before adding it to `web/public/data/mining_lab.json`

No main branch writes; metrics must be empirical and explicitly labeled with limitations.

Final academically complete rerun: include exact closed frequent itemsets by proper-superset/equal-support filtering of all Apriori results, validate exported counts, and retain original empirical model/clustering/basket results.

## 2026-10-26 full-syllabus review branch regeneration
Re-run every numeric experiment from the unchanged historical Olist Parquet inputs on this review branch after correcting train-only median imputation and category vocabulary fitting. Commit the regenerated `web/public/data/mining_lab.json` only if the Python verifier succeeds. Keep weak/negative model results as observed; update published metrics in documentation from the actual artifact, never estimates.

## Validate numerical training boundary
Execute `python tests/test_mining_training_boundary.py` under the scientific Python dependencies to confirm test-only categorical levels and extreme values cannot influence fitted train transforms. Then regenerate from the same checked-in historical Olist Parquet, verify the empirical JSON and commit it only if results change.


## Retest after fixing CI source import root
Scientific fixture now adds the repository root to the Python module search path before importing the actual training encoder, then checks train-only fitted medians and one-hot categories. Regenerate only after the fixture passes.
