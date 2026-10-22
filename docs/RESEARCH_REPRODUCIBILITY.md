# PromisePulse 3.0 — Architecture, Evaluation and Research Reproducibility

**Status:** documented implementation and descriptive analytics, **not** evidence of journal acceptance, statistical significance or validated production predictive performance.

## 1. Research framing

PromisePulse is an educational and reproducible example of combining a dimensional warehouse with browser-resident OLAP exploration and chronological delivery-risk classification using the [Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce). The period is historical, approximately 2016–2018. The included exported manifest was generated **2026-10-13** but its source data are not 2026 operations.

Its design demonstrates three distinct problems: (1) reconciling multi-table payment and merchandise facts without double-counting, (2) enabling filterable cross-dimensional exploratory analyses over historical order activity, and (3) evaluating late-delivery risk with observed labels while avoiding post-checkout features in a historical order-placement prediction setting.

A real Q1-journal submission would need a sharper scientific contribution and peer-reviewed comparison, rather than the graph quantity or interface quality alone. Quartiles depend on the index's category and calendar year; verify the intended venue independently at submission time.

## 2. Data lineage and trust boundary

```text
Public Olist CSVs (eight files; original dataset licensing applies)
            |
            v
DuckDB staging and explicit type conversion
            |
            +--> dimensional conformed tables
            |    ├─ dim_customer   (customer_id)
            |    ├─ dim_product    (product_id)
            |    ├─ dim_seller     (seller_id)
            |    └─ dim_date       (date_day)
            |
            +--> fact_orders       (ONE row per order_id)
            +--> fact_order_items  (ONE row per order_id + order_item_id)
            |
            +--> exporter quality assertions / row reconciliation
            |
            +--> chronological scikit-learn classifier (optional model export)
                        |
                        v
           seven verified Parquet views + manifest JSON
                        |
                        v
Browser downloads static artifacts via Vite HTTP
                        |
                        v
       DuckDB-Wasm loads read-only SQL views in-browser
                        |
           ┌────────────┼───────────────────┐
           v            v                   v
        Overview     Analytics Atlas      OLAP / risk / catalog
                        |
                 36 chart definitions
                        |
                 CSV aggregate export
```

The web application is **not** a continuously updating database nor a live GPS feed. Browser queries use `SELECT` / `WITH` statements against already-exported data. On every deployment, update Parquet plus manifest together; do not hard-code fresh metrics into React.

## 3. Warehouse fact grain and integrity

| Table | Primary grouping grain | Principal fields / use |
| --- | --- | --- |
| `fact_orders` | `order_id` | Customer, timestamps, status, aggregate payments, totals, reviews and lateness |
| `fact_order_items` | `order_id`, `order_item_id` | Seller, product, price and item freight |
| `dim_customer` | `customer_id` | Customer unique ID, state, city |
| `dim_seller` | `seller_id` | Seller state/city |
| `dim_product` | `product_id` | Translated category, product weight |
| `dim_date` | `date_day` | Calendar month, year and quarter |
| `risk_predictions` | Model test cohort, order-level | Predicted probability and observed actual_late |

The export's `fact_orders.payment_total` is the **sum of recorded order payments**, not the sum of item prices and not a net-profit metric. If a single order has multiple items, joining it to the item fact before calculating `SUM(payment_total)` will duplicate payments. Similarly, `fact_order_items.price` is merchandise value, not recorded payment value. PromisePulse intentionally produces category and seller analyses at item grain, while order and state paid-value analyses remain at order grain.

The exporter in `scripts/build_web_data.py` verifies uniqueness and penny-level reconciliation. The checked-in manifest reports:

| Integrity outcome | Published value |
| --- | ---: |
| Order fact rows | 99,441 |
| Item fact rows | 112,650 |
| Duplicate order keys | 0 |
| Duplicate item keys | 0 |
| Missing order customer references | 0 |
| Missing item product references | 0 |
| Missing item seller references | 0 |
| Payment reconciliation delta (centavos) | 0 |
| Item-sales reconciliation delta (centavos) | 0 |
| Orders without lateness labels | 2,971 |
| Labeled delivered outcomes | 96,470 |
| Orders without payment total | 1 |

These counts describe the **included export**, not a fresh independent recheck of Kaggle's current download.

### Lateness definition

For observed orders with `order_status='delivered'`, non-null actual receipt and estimated delivery timestamps, lateness is defined by **actual delivery calendar date later than estimated delivery calendar date**. Orders that are undelivered or lack those timestamps receive a null `is_late` label, never a fabricated false. Observed late share is divided by the number with known labels, not the entire order count. Delivery duration is an observed nonnegative timestamp difference.

## 4. Interactive analytics and 36-figure lineage

The main UI offers seven destinations: Overview, Intelligence, Analytics Atlas, OLAP Lab, Risk Center, Data Catalog and Pipeline & Quality. Both light and dark themes are available across views.

The new Analytics Atlas has nine lenses of four figures each, **36 defined views**. They are not 36 different datasets or models. Thirty-two charts are one-dimensional real SQL aggregations with alternate graph forms; four laboratory views are grouped matrices or held-out calibration. Inspect the [complete figure-to-SQL inventory](ANALYTICS_ATLAS_METHODOLOGY.md) for chart IDs, grain, definitions, missingness conditions, group limits, available exports and model-evaluation caveats.

Selection, SVG interactions, line/bar/area/dot modes, filter changes, cross-tab cell inspection and aggregate CSV downloads are implemented by `web/src/AnalyticsAtlas.tsx`; the SQL builders are in `web/src/atlasQueries.ts`.

### Uncertainty and inference warnings

Observed late-share plots use **95% Wilson score intervals** calculated from the SQL-reported count of eligible labeled deliveries and the number labeled late. These are exploratory intervals relying on a simple binomial assumption. They are not cluster-corrected intervals, causal estimates, multiple-test adjusted results, or proofs of significant between-state differences.

No effect size or statistical significance should be claimed from a visual pattern alone. Review missingness, size of filtered cohorts, duration definition, data provenance and any prospective model leakage before writing a research conclusion.

## 5. Chronological classification

A training/export process can produce `risk_predictions.parquet` for a historical order-placement setting. The model uses purchase-time information rather than outcomes revealed only after shipping.

The **checked-in** `web/public/data/manifest.json` reports:

| Evaluation quantity | Value |
| --- | ---: |
| Training rows | 58,731 |
| Validation rows | 12,435 |
| Test rows | 19,294 |
| Test window | 2018-05-26 to 2018-08-29 |
| Recorded classification threshold | 0.60 |
| Precision at that threshold | 0.04883 |
| Recall at that threshold | 0.28783 |
| F1 score | 0.08349 |
| ROC AUC | 0.69800 |
| PR AUC | 0.06777 |
| True positives | 194 |
| False positives | 3,779 |
| True negatives | 14,841 |
| False negatives | 480 |

The manifest reports a simple baseline with zero positive predictions at its recorded decision threshold; this is not enough, alone, to establish superiority over appropriate tuned baselines. The Risk Center recomputes threshold-specific count diagnostics, while the Atlas's calibration scatter summarizes observed versus mean predicted risk by test decile. Neither visualization retrains the model.

For a publishable comparative study, evaluate robust baselines, probability calibration, class prevalence, confidence intervals, chronologically separated splits and distribution shift. Do not present the current threshold as high precision.

## 6. Setup, repeatability and development commands

### Inspect the existing version with shipped data

```bash
git clone https://github.com/kasim672/PromisePulse.git
cd PromisePulse
cd web
npm ci
npm run build
npm run dev
```

The browser downloads the already-published, checked-in Parquet export. For full raw-to-warehouse reproduction, obtain the separately licensed eight Olist CSV inputs from Kaggle, place them as documented in `README.md` and run:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/build_web_data.py --raw-dir data/raw --train
python scripts/verify_export.py
```

The exact Python scripts, requirements and available flags are the authority; consult their `--help` and the root README before changing a regeneration run. Regenerated ML metrics can differ if source data or environment changes.

### Continuous integration

The GitHub Actions workflow `.github/workflows/web-checks.yml` checks `npm ci`, the TypeScript/Vite production build, SQL query generation, theme contract, and the Atlas chart registry/query constraints. It is a **build and static contract check**, not a browser accessibility certification nor a complete end-to-end source-data SQL test.

```bash
cd web
npm run build
node ../tests/test_sql_generation.cjs
node ../tests/test_theme.cjs
node ../tests/test_atlas.cjs
```

To reproduce the reference screenshots using the **running application**, `web/scripts/capture-doc-screens.mjs` uses Chromium/Playwright. The screenshots' `docs/screenshots/v3/CAPTURE_MANIFEST.json` records capture time and viewport. This does not modify metrics or generate sample data.

## 7. Ethics, licenses, and source attribution

Olist dataset attribution and its CC BY-NC-SA 4.0 terms are stated in `web/public/data/manifest.json`. Dataset license and distribution conditions may limit commercial uses independently of the repository's source-code license. Review both before distributing the Parquet exports with a product or manuscript supplement.

PromisePulse's measured design reference cites Cadra as an inspiration for UI characteristics; no proprietary Cadra source, brand marks or data should be represented as PromisePulse's own research.

Aggregated state-based information is not precise private customer tracking. No personally identifiable individual-level data should be exposed in a screenshot or public demo.

## 8. Limitations and journal submission checklist

- **Dataset time span and representativeness:** 2016–2018 Brazilian platform orders may not generalize to current markets or carriers.
- **Observational bias:** missing review/receipt outcomes and repeated customers can distort cohort comparisons.
- **Granularity:** customer and seller states, not shipping-route GPS, delivery truck telemetry or true network transit times.
- **Financial semantics:** recorded payments and item-price gross merchandise value are different constructs.
- **Inference:** graph count is an interface feature, not a statistically validated scientific contribution.
- **Model generalization:** historical one-platform hold-out results and weak minority-class precision need further robust validation.
- **Screen captures:** browser screenshots document UI appearance and disclosures, not independent proof of quantitative correctness.
- **External verification still needed:** choose a target journal by *current Scopus ranking year and subject category*, conduct a literature review, formulate testable research hypotheses, report transparent sample exclusions, replicate results, compare methods and run statistical analyses.
- **Academic integrity:** never invent empirical outcomes, citations, prizes, peer-review status or a promised quartile outcome.

## Further reading in this repository

[User Guide](USER_GUIDE.md) · [Analytics Atlas Methodology](ANALYTICS_ATLAS_METHODOLOGY.md) · [Screenshot Gallery](SCREENSHOT_GALLERY.md) · [Primary README](../README.md) · [Design Reference](../design.md) · [Third-party Notices](THIRD_PARTY_NOTICES.md)
