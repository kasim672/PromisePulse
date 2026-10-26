# PromisePulse 5.0 — Student Review and Evidence Checklist

> **Draft branch only.** This feature branch diverges from the unchanged PromisePulse 4.0 `main` at `bf267c1e3d8505d66a2ba320af7d6c7ebbcad4db`. Do not merge until explicitly approved.

## Navigation

The existing **12 workspace** buttons remain. The graduation-cap **Data Mining Lab** icon opens its overview directly, without a popup. Six analysis pages are reached through overview cards and a clickable internal tab bar (including an Overview button). Command search still indexes every analysis page.

## Syllabus verification

| Course module | Hours | Implemented evidence | What remains conceptual / bounded |
|---|---:|---|---|
| Warehouse and ETL | 8 | Physical order and item facts, shared dimensions, source/curated inventories, row/byte visualizations, original OLAP operations | Snowflake variant is conceptual, no cloud warehouse deployment |
| Data Lakes | 3 | CSV and Parquet provenance, bytes and row counts, warehouse-vs-lake curation explanation | No separate running data lake |
| EDA and Preprocessing | 5 | 7 numeric descriptive profiles, histogram selector, missingness, box/whisker, 7×7 Pearson grid, train-only transforms, PCA context | No arbitrary full-warehouse preprocessing mutation from UI |
| Classification and Regression | 5 | Four actual chronological classifiers and four duration regressors, metrics, confusion matrices and calibration bins | Offline evaluation, poor performance; not live inference |
| Clustering | 4 | K-Means, Ward agglomerative, bisecting k-means, actual PCA assignments, elbow/silhouette, 52-leaf linkage plot | 950 sampled customers, hierarchical views not full population |
| Frequent Patterns | 5 | Apriori, FP-Growth, Eclat, closed frequent itemsets, support/confidence/lift, runtime summaries, rule inspection | 649 qualifying baskets; threshold UI filters precomputed rule results, not model retraining |

## Count visualizations conservatively

The `web/src/SyllabusLab.tsx` component contains **32 occurrences of the reusable data-backed `Plot` card** (some are controlled by field, selected model or confidence/support). Additionally, it contains custom visual representations: an EDA box-and-whisker SVG, a 7×7 Pearson heatmap, PCA cluster scatter, Ward dendrogram, classifier confusion matrix, and an association-rule network. These produce **up to 38 distinct analysis/visualization presentations**, depending on whether one treats the rule network and confusion matrix as charts. A conceptual dimensional schema explorer is intentionally counted separately. This is **not** a claim of 40 independent empirical graph definitions: parameterized versions and educational diagrams must be disclosed, and the originally requested 35–40 entirely additional validated charts is a *target* rather than a certified count.

The original Analytics Atlas and Research Workspaces retain **66 existing chart definitions**. Do not claim 106 unique measured charts until a separate systematic inventory confirms the definition count and independent analytical value.

## Local review

```bash
git fetch origin --prune
git switch feat/promisepulse-5-syllabus-research-lab
cd web
npm ci
npm run build
npm run dev
```

Click the Data Mining Lab icon to open the overview, select an analysis card, then navigate directly through all six clickable analysis tabs and back via Overview. Verify the existing Welcome, Overview, Intelligence, Atlas, customer cohorts, delivery, research, AI, OLAP, Risk Center, catalog and pipeline pages. Exercise light and dark themes, keyboard navigation, mobile menu, state map, module selectors, rule filters, and CSV export.

## Scientific reproduction

```bash
pip install -r requirements-export.txt
python scripts/build_mining_lab.py
python scripts/verify_mining_lab.py
python tests/test_mining_training_boundary.py
cd web
npm ci && npm run build
node ../tests/test_syllabus_modules.cjs
node ../tests/test_mining_export_integrity.cjs
```

Python scientific exports use real checked-in historical Olist Parquet; outputs do not imply real-time order data. Validate any changed artifacts independently. Review weak classification, negative regression R², underrepresented clusters and limited transaction-basket availability before presenting in a research paper.

## Release gate

- [ ] User has inspected all original pages and geography visualization
- [ ] User has inspected the hub entry and all six clickable analysis tabs on desktop/mobile
- [ ] GitHub Actions checks complete successfully
- [ ] Empirical export reproduced and checked
- [ ] User has accepted the measured scientific limitations
- [ ] Any requested fixes made on this **feature** branch only
- [ ] **Explicit user approval to merge into main** received

Closing or deleting this branch before approval would discard the unmerged V5 release. Keep the draft PR open for the student's review.
