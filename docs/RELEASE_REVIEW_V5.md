# PromisePulse 5.0 — Release Review and Empirical Quality Gate

**Status:** implementation complete on a **draft feature branch only**. `main` has not been modified. This review is grounded in `web/public/data/mining_lab.json`, `docs/screenshots/v5/CAPTURE_MANIFEST.json`, source code and GitHub Actions as inspected on October 25, 2026.

## Additive delivery contract

GitHub comparison with `main` reports **37 changed files** (new algorithm exporter, immutable historical data export, syllabus pages, documentation, screenshots and tests). Existing premium CSS, the state-level choropleth, the original Analytics Atlas 36 views, Research Workspaces 30 views, original Risk Center, OLAP, homepage, logo and theme implementations are **not replaced**. The only modified application/navigation files are `App.tsx`, `types.ts` and `main.tsx`, to register and render the six new modules.

New dock destinations: Warehouse & ETL, Data Lakes, EDA & Preprocessing, Classification Lab, Clustering Lab and Pattern Mining. Total destinations: 12 original + 6 new = **18**. Do not misrepresent the number of empirical visualizations: the retained Atlas + research workspace register **66** chart definitions, while the new syllabus labs add supplementary figures, diagrams, data tables and analytical selectors with different grains.

## The six syllabus modules, implemented and verifiable

| Module | Student syllabus hours | Evidence available in this branch | Limits |
| --- | ---: | --- | --- |
| Warehouse & ETL | 8 | Physical order/item stars and constellation, inventory, source quality plots and table exports | Snowflake alternative is illustrative, not deployed |
| Data Lakes | 3 | Raw input file manifest compared to curated Parquet, sizes/record counts and curation stages | Static raw/curated views, not a live cloud data-lake cluster |
| Exploration & preprocessing | 5 | Seven-variable summaries, histograms, quantiles/box plots, missingness, 7×7 Pearson heatmap, normalization and PCA-related context | Observational; box plot uses a labeled signed-log visual axis |
| Classification | 5 | Majority, Decision Tree, Gaussian NB and logistic classification evaluated on a shared chronological split; four regression baselines including simple/multiple linear regression | Weak minority-class detection and regression accuracy; see numbers below |
| Clustering | 4 | Deterministic K-Means, Ward agglomerative and bisecting partitioning, elbow/silhouette, PCA embedding, true Ward linkage dendrogram and exportable RFM profiles | Cluster sample is a subset and may underrepresent repeat customers |
| Frequent patterns | 5 | Actual category basket extraction, Apriori/FP-Growth/Eclat, closed-itemset postfilter, support/confidence/lift and rule graph | Only 649 eligible multi-category baskets; avoid generalized consumer-behavior claims |
| **Total** | **30** | Entire syllabus represented by empirical experiments and appropriately identified conceptual teaching diagrams | Independent scientific replication remains separate |

## Empirical figures that must not be obscured

### Classification: 22,189 labeled historical test observations

| Evaluated method | ROC AUC | PR AUC | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Majority classifier | 0.5000 | 0.04250 | 0.0000 | 0.0000 | 0.0000 |
| Decision Tree | 0.50865 | 0.04308 | 0.05461 | 0.04772 | 0.05093 |
| Gaussian Naive Bayes | 0.53271 | 0.04845 | 0.05740 | 0.17603 | 0.08657 |
| Logistic Regression | 0.48465 | 0.04350 | 0.04492 | 0.30117 | 0.07817 |

These are poor or near-chance discrimination results, not a validated breakthrough. The majority baseline is a non-predictive comparison. They should **never** be described as achieving high accuracy or outperforming prior work without appropriate evidence and tuned comparator models.

### Regression: observed delivery duration

| Model | MAE (days) | RMSE (days) | R² |
| --- | ---: | ---: | ---: |
| Median baseline | 5.127 | 6.652 | -0.0877 |
| Simple linear regression | 6.542 | 7.747 | -0.4754 |
| Multiple linear regression | 5.789 | 7.132 | -0.2505 |
| Decision tree regression | 4.854 | 6.353 | 0.0079 |

The negative R² values in three methods are important, not a formatting issue. This is delivered-order-only observational data, with known selection bias. It is not a production ETA service.

### Clustering

- Eligible customer population: **96,096**; deterministic modeling subset: **950 customers** (~0.99%).
- K-Means k chosen from recorded silhouette search: **k = 2**.
- Cluster sizes: **924 vs 26 customers**. The second small cluster is not proof of a stable rare consumer segment.
- Recorded silhouette: **0.6796** for K-Means and Ward agglomerative; **0.3640** for Bisecting K-Means.
- Ward dendrogram is a **52-record sample**, with **51 actual linkage segments**; it is not a tree over the full customer population.

### Pattern mining

- **649** eligible transaction baskets, drawn from **727** multi-category observed orders (as defined by the mining exporter).
- Apriori, FP-Growth and Eclat each discovered **75** frequent itemsets at recorded thresholds; **74** post-filtered closed itemsets and **47** available association-rule records.
- Algorithm run times in this export are tiny (`0.0033s`, `0.0041s`, `0.0018s`); hardware, interpreter scheduling and tiny inputs make these unsuitable for claims that any algorithm is categorically fastest.
- Support/confidence/lift describe associations in the **eligible filtered basket population**, not all 99,441 Olist orders. The result does not imply causality, product recommendation uplift or forecasting accuracy.

## Reproducibility and quality gates

```bash
# From repo root after installing environment dependencies:
cd web
npm ci
npm run build
node ../tests/test_sql_generation.cjs
node ../tests/test_theme.cjs
node ../tests/test_atlas.cjs
node ../tests/test_research_expansion.cjs
node ../tests/test_syllabus_modules.cjs
node ../tests/test_mining_export_integrity.cjs
```

The new `test_mining_export_integrity.cjs` verifies observed source row counts, missingness arithmetic, quantile ordering, 7×7 Pearson symmetry, model confusion-matrix totals and reported precision/recall, regression metric ranges, 950 modeled customer memberships, dendrogram linkage size, itemset support bounds and association-rule validity. It is part of **every push and PR** through `.github/workflows/web-checks.yml`.

The offline exporter remains the source of the empirical report:

```bash
python scripts/build_mining_lab.py
python scripts/verify_mining_lab.py
```

Consult `requirements-export.txt` and the script's CLI flags/inputs before regenerating the published JSON. The static JSON is checked into the branch to allow browser exploration without running Python.

`docs/screenshots/v5/` contains **16 genuine UI captures**, spanning all six modules and previous Overview in light/dark, plus two representative mobile views. The manifest documents the browser/run metadata. Screenshots verify presentation, not statistical significance or independent paper-level replication.

## Before student approval / merge

1. Open the **draft PR** and compare against `main`. Do not merge on our behalf.
2. Run the branch locally and select each of the 18 nav destinations; check long-page scrolling and mobile dock interactions.
3. Change chart selectors, cluster methods, confidence/support filters; export sample aggregate CSVs and verify source labels.
4. Show the professor the **actual** weak classification and regression results, limited cluster sample, and restricted basket denominator. Consider further experiments rather than presentation-level fixes.
5. For journal purposes, define a hypothesis, evaluate more suitable baselines, test temporal and geographic transfer, and include uncertainty and limitations.

**Academic integrity:** This is a rigorous syllabus-aligned interactive educational/research prototype, not evidence that a Scopus Q1 journal has accepted the work. Neither the 66 existing charts nor additional instructional diagrams should be equated with peer-reviewed findings.
