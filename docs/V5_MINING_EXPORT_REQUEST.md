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
