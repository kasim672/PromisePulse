# PromisePulse 5.0 — Full 30-hour Data Warehousing & Data Mining syllabus

**Release status:** feature branch only. This document maps the six university syllabus modules supplied by the student to genuine implementations, clearly separated from conceptual architecture illustrations. All original 12 workspaces, the initial 66 scientific chart definitions, the Brazil state-level geographic map, the AI evidence studio, both visual themes and OLAP tools are preserved. Six syllabus modules add six dock destinations (18 total). No removal or replacement was performed.

## Module-by-module syllabus coverage

| Module and original syllabus topics | Hours | Implementation in this branch | Honest limitations |
| --- | ---: | --- | --- |
| **1 — Introduction to Data Warehouse and ETL Process.** Warehouse/mart, dimensional modeling, star, snowflake, constellation, fact schema, OLAP operations, ETL stages, extraction/transformation/loading | **8** | Deployed order/item fact warehouse, conformed customer/product/seller/date dimensions, interactive star/fact-constellation selector, physical table inventory, record/byte graphs, data-quality counts, ETL stages; existing OLAP Lab already implements roll-up, drill-down, slice, dice and pivot | The snowflake schema is illustrated conceptually, not an additional deployed SQL schema; marts are described as subsets of analytical views, not independently operated data services |
| **2 — Introduction to Data Lakes.** Architecture, functionality, challenges, curation, data lake vs warehouse | **3** | Raw-file provenance from existing manifest, actual source file sizes and row counts, curated Parquet inventory and a curation/lakehouse stage explorer | Does **not** claim cloud object storage, streaming ingestion or a deployed standalone data-lake service. Input and output file sizes represent different grains and cannot be interpreted as a lossless file-level compression ratio |
| **3 — Data Exploration and Data Preprocessing.** KDD, statistical descriptions, box plots, bar/scatter graphs, data summary, cleaning, transformations, reduction | **5** | Real 7-variable numeric profiles (mean, standard deviation, min, quartiles, median, P95), histograms, 7×7 Pearson matrix with selected-cell interaction, missingness, box/whisker, train-fitted normalization/imputation and PCA cluster embedding | Histograms cap at empirical P99 for readability; correlation is not causal, and a clicked plot does not mutate the warehouse |
| **4 — Classification.** Decision Tree, Naive Bayes, Simple and Multiple Regression | **5** | Newly trained Decision Tree, Gaussian Naive Bayes, majority and logistic regression classifier benchmark on identical chronological holdout; confusion matrix selector, PR/ROC AUC, precision/recall/F1, calibration; Simple and Multiple Linear Regression versus median and tree-based regressors on observed duration | Evaluation uses known historical outcomes; delivered-only regression suffers selection bias; no current-market deployment or improvement is asserted. All methods are trained offline before publication; browser interactions select actual published results |
| **5 — Clustering.** K-Means, agglomerative and divisive hierarchical | **4** | K-Means with elbow/silhouette k-selection, actual Agglomerative Ward hierarchical clustering, divisive Bisecting K-Means, cluster-quality comparison, interactive PCA scatter, **real Ward dendrogram linkage**, profile/recency/frequency/monetary plots | Customer RFM fit uses a deterministic 950-customer sample for tractability, and the Ward dendrogram uses at most 52 records. Bisecting K-Means shows a divisive fitted partition, not a full divisive dendrogram |
| **6 — Mining Frequent Patterns.** Market Basket Analysis, frequent itemsets, closed/association rules, Apriori, pattern-growth, vertical itemset mining | **5** | Actual item-category baskets (one basket/order); Apriori, FP-Growth, Eclat vertical TID-set mining; empirical rule support/confidence/lift, interactive threshold filtering, rule network, itemset tables, algorithm duration/count figures | A **closed-itemset-specific mining algorithm is not separately implemented**; conventional frequent itemsets and observed association rules are. Rule denominators use eligible multi-category baskets among a bounded list of top categories; single-category order behavior does not generalize automatically |
| **Total** | **30** | All six modules implemented as additional navigable sections and real empirical experiments | Not every possible advanced extension is claimed to be deployed |

## Architecture and reproducibility

```text
              Included historical Olist source data (2016–2018)
                                |
              Existing validated DuckDB/Parquet warehouse
                  /            |                 \
            fact_orders  fact_order_items    conformed dimensions
                  \            |                 /
                   scripts/build_mining_lab.py
                     |    numpy, pandas, DuckDB
                     |    scikit-learn, SciPy, mlxtend
                     |
        +------------+--------------+----------------+
        |            |              |                |
   descriptive   chronological    customer      frequent itemset
    profiling     ML+regression   RFM clusters    mining (3 methods)
        |            |              |                |
        +------------+--------------+----------------+
                                |
              scripts/verify_mining_lab.py
                         checked JSON
                                |
                 web/public/data/mining_lab.json
                                |
      Browser React modules · SVG · CSV downloads · themed UI
```

**Repeat from the repository root:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-export.txt
python scripts/build_mining_lab.py
python scripts/verify_mining_lab.py
cd web
npm ci
npm run build
node ../tests/test_sql_generation.cjs
node ../tests/test_theme.cjs
node ../tests/test_atlas.cjs
node ../tests/test_research_expansion.cjs
node ../tests/test_syllabus_modules.cjs
npm run dev
```

No Olist raw CSV download is required to regenerate this *mining* experiment from the included Parquet warehouse, although the full original CSV-to-warehouse ETL still requires the original eight CSVs.

Offline export: `web/public/data/mining_lab.json`, generated on GitHub Actions from actual checked-in Parquet. It stores only descriptive groups, model-evaluation aggregates, sampled PCA coordinates with anonymous array indices and itemset/association statistics; it does **not** ship order IDs, personal identifiers or raw customer records.

## Actual observed outcomes from the first verified Olist export

These are empirical results, **not example placeholder numbers**:

- Order-level observations: **99,441**; order-item observations: **112,650**.
- Four chronological held-out classifier evaluations on **22,189** test observations (same test cohort): majority baseline, Decision Tree, Gaussian Naive Bayes and Logistic Regression. Observed positive-test count: **943**.
- Held-out Decision Tree precision **0.05461**, recall **0.04772**, ROC AUC **0.50865**.
- Held-out Gaussian Naive Bayes precision **0.05740**, recall **0.17603**, ROC AUC **0.53271**.
- Logistic Regression ROC AUC **0.48465**. **These results are weak and must not be described as accurate predictive performance.** They are nevertheless valid pedagogical comparisons.
- Duration regression: Simple Linear Regression MAE **6.542 days**, Multiple Linear Regression MAE **5.789 days**, median baseline MAE **5.127 days**, Decision Tree regressor MAE **4.854 days** in the stated delivered-order holdout. Negative R² values for linear models are retained and disclosed.
- Customer clustering: **950** deterministic RFM records, selected **k=2**; K-Means and Ward silhouette **0.6796**, divisive Bisecting K-Means silhouette **0.3640**. These are sample-conditional metrics, not evidence of population segmentation quality.
- Dendrogram is computed from a **52-record** Ward linkage sample, yielding 51 genuine merge segments.
- Frequent mining: **649** eligible multi-category baskets in the bounded item universe; **75** frequent itemsets for each of Apriori, FP-Growth and Eclat, **47** exported association rules meeting original mining criteria. This is a very small selected subset of all marketplace orders: be cautious about support denominators, prevalence and external validity.
- Single-run algorithm timings are captured for reproducibility but are **not a statistically controlled runtime benchmark**.

The experimental train/test split is **chronological 77/23**, not a random shuffle; the training timestamp and holdout start are in the JSON. Models share a common test set and fixed classification cutoff 0.5. Mean/scale transformations use train-fitted parameters when needed. The classification scope is orders with known late outcomes, and regression is delivered-only; missing statuses must not be silently imputed as on time.

### Mining terms and mathematics

- **Observed lateness:** `actual delivered date > estimated delivery date` for delivered orders with both timestamps.
- **K-Means inertia:** within-cluster squared Euclidean distances after scaling. **Silhouette:** mean `(b−a)/max(a,b)`, computed on a bounded sample; **Davies–Bouldin:** compares within-cluster scatter versus inter-centroid distance (lower is generally better).
- **Ward agglomeration:** bottom-up hierarchical merges minimizing increase in within-cluster variation. The dendrogram is a direct `scipy.cluster.hierarchy.linkage` output.
- **Bisecting K-Means:** top-down, repeated two-way K-Means splits into the chosen number of groups; *not* a binary split tree diagram on this page.
- **Support `P(A∪B)`:** fraction of eligible baskets containing the union of categories; **Confidence `P(B|A)`:** support(A∪B)/support(A); **Lift:** confidence(A→B)/support(B).
- **Apriori:** joins frequent smaller itemsets and prunes those with infrequent subsets; **FP-Growth:** pattern-growth frequent itemsets; **Eclat:** intersections of vertical transaction-ID sets. All three use the same boolean category-basket matrix and minimum support.

## UI and academic evaluation

- **18 floating navigation destinations**: 12 previous pages plus six new syllabus pages. Desktop dock scrolls vertically when needed; tablet/mobile dock scrolls horizontally.
- Existing glass cards, charts, Brazil map, page structure, website branding, favicon, light/dark colors and routes remain unchanged.
- Experiments use actual historical data; when the mining JSON cannot be loaded, the module explicitly says so rather than substituting invented numbers.
- Controls include schema-variant selector, variable profile selector, correlation cell inspection, classifier comparison metric and confusion matrix selector, cluster-algorithm switch, dendrogram focus, and rule support/confidence sliders.
- Tables and per-chart aggregate CSV downloads support demonstration; clicking an algorithm view does not secretly retrain a model.
- New [screenshots](SCREENSHOT_GALLERY_V5.md) cover all six modules and both themes with real source data.

## Publication and grading considerations

This project demonstrates coursework modules and provides a richer reproducible research toolkit, but it cannot claim successful journal submission, model superiority, a live cloud data lake, a fully deployed snowflake architecture, or statistical significance merely because its visualization count increased. A Q1-indexed manuscript still needs a precise novel research question, external validations, comparisons, uncertainty estimates, ethics, related work, and target-journal-specific review.

**Data source:** Brazilian E-Commerce Public Dataset by Olist, as described and licensed in the original `web/public/data/manifest.json`. Source commercial/noncommercial licensing conditions apply separately from the project's software license.
