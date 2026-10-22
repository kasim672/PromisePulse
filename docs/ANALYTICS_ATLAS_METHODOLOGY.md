# Analytics Atlas: reproducibility and figure inventory

## Scope

PromisePulse 3.0's new **Analytics Atlas** is an *additive* exploratory workbench linked from the existing seven-item dock. It leaves the previously shipped Overview, Intelligence, OLAP Lab, Risk Center, Data Catalog, Pipeline & Quality, light/dark palettes, and Brazilian state choropleth untouched. The Atlas contains **36 figure definitions**, grouped into nine lenses of four charts. Each lens is loaded lazily when selected and supports a safe historical year/customer-state filter. The 32 one-dimensional figures support changing graph form (bars, line, dots), keyboard focus on individual aggregate marks, inspection of the actual grouped rows, and CSV export. The four laboratory figures present multi-dimensional aggregate cross-tabs and held-out calibration.

These are **exploratory observational graphics** over the publicly distributed historical Brazilian E-Commerce Public Dataset by Olist, approximately 2016–2018. They are not live monitoring, real delivery GPS tracking, a causal inference experiment, a published result, or an independent validation of model predictive performance.

## Figure registry

| Lens | Figure IDs | Relation / grouping | Valid measures and caveats |
| --- | --- | --- | --- |
| Commercial pulse | monthly-orders, monthly-payments, monthly-ticket, monthly-delay | `fact_orders`, purchase month | All orders for counts; recorded payment totals for payment measures; only known punctuality for late share |
| Weekly behavior | weekday-volume, weekday-payment, weekday-late, weekday-speed | `fact_orders`, purchase weekday | Nonnegative recorded purchase-to-delivery duration only for mean duration |
| Hourly demand | hour-volume, hour-payment, hour-ticket, hour-late | `fact_orders`, purchase hour | Olist recorded timestamps; do not infer local consumer behavior beyond dataset's timestamp convention |
| Regional comparison | state-volume, state-payment, state-late, state-speed | `fact_orders` + `dim_customer`, customer state | No live position; low-N states have unreliable observed rates; inspect labeled denominator |
| Fulfillment anatomy | duration-volume, duration-payment, duration-late, duration-rating | `fact_orders`, purchase-to-delivered time bins | Only delivered rows with nonnegative observed durations; rating only where recorded |
| Customer experience | review-volume, review-payment, review-late, review-speed | `fact_orders`, rounded mean recorded review score | Missing reviews excluded, multiple reviews were averaged in the ETL; no causal impact claim |
| Product economics | cat-items, cat-sales, cat-price, cat-freight | `fact_order_items` + `dim_product`, translated product category | Item count and merchandise-price sum, never multiplied order-level payments; top 16 categories |
| Seller geography | seller-coverage, seller-items, seller-sales, seller-freight | `fact_order_items` + `dim_seller`, seller state | Distinct sellers, item counts, item-price sum, listed freight per order-item; no invented facilities |
| Research laboratory | lab-weekhour, lab-state-month, lab-review-late, lab-risk | Cross-tab from `fact_orders`; `risk_predictions` test cohort for calibration | 2D weekday×hour / state×month / review×outcome; risk deciles only when evaluated and published |

All 36 IDs and their per-figure source field, semantic unit, default chart form, and explanatory note are registered in `web/src/atlasQueries.ts`. SQL-building functions live in that file, run as read-only `SELECT` aggregations through `web/src/db.ts`, and use fixed allowlisted Brazilian state and 2016–2018 year controls.

### Denominators, missing values and financial grain

- `orders`: count of rows in the **order-grain** `fact_orders` relation. It includes orders with non-delivered statuses unless a graph explicitly narrows to delivered orders.
- `payment_revenue`: sum of `fact_orders.payment_total` at order grain; **never** sum after joining order items.
- `late_pct`: `100 × (# is_late = true)/(# is_late IS NOT NULL)`, with a null result where none are labeled. The source ETL only creates lateness labels for delivered orders with observed estimated and delivered timestamps.
- `delivery_days`: mean nonnegative `date_diff('day',purchase_ts,delivered_ts)` where both timestamps are observed; not a median, SLA duration, or routing prediction.
- `review_score`: source reviews are averaged per order in the ETL. The grouped scores are rounded to integers, with missing scores excluded; do not conflate this with individual review-row distributions.
- `item_sales`: `SUM(fact_order_items.price)`, **not** payment revenue; order-item and payment grains must not be combined without explicit reconciliation.
- `freight_pct`: fraction of observed listed item freight out of merchandise price + listed freight, **not** profit margin, shipping cost, or carrier cost.
- The hold-out model calibration view measures observed frequency versus mean predicted late probability within each *risk-probability* decile. Its test period is determined by the training export, not by the main dashboard year filter. Its customer-state filter narrows that fixed test cohort.

Null aggregates remain null in the underlying CSV. The SVG layer explicitly skips missing metric values rather than silently inventing zeros. A visually empty chart indicates a genuine absence of eligible observations.

### Query execution and reproducibility

Queries are lazy: the selected lens loads only its own aggregate query. Atlas reuses the existing DuckDB-Wasm/Parquet browser engine rather than precomputing fabricated numbers, and caches successful grouped results for unchanged filter selections. The laboratory computes four small grouped relations when opened, sequentially to avoid querying the same shared connection concurrently. The export button downloads a CSV of the **actual returned grouped rows** for the displayed figure.

From a clean clone:

```bash
cd web
npm ci
npm run build
node ../tests/test_sql_generation.cjs
node ../tests/test_theme.cjs
node ../tests/test_atlas.cjs
npm run dev
```

Open **Analytics Atlas** from the single added navigation destination. Change purchase year and customer state; try the nine lenses, inspect individual marks with keyboard or mouse, open the aggregated table, and export CSV. The existing map continues to represent historical state boundaries only.

## Reporting and publication constraints

The dashboard is evidence discovery and communication, not a manuscript by itself. A paper aimed at a top-quartile indexed journal still needs an independently defined research question, a documented reproducibility protocol, scholarly comparison to related work, clear train/validation/test chronology for any predictive model, study limitations, and appropriately verified statistical tests. Do not infer significance, prediction quality, model improvement, or causality from an attractive chart.

Recommended *future* methodology, **not implemented or claimed as results**:

1. Register explicit hypotheses (e.g., delivery punctuality versus review score conditional on location/season) and prespecify adjustment variables.
2. Report missing-outcome selection, group denominators, confounding and uncertainty (e.g., Wilson intervals or bootstrap bands for grouped proportions) before testing contrasts.
3. Add chronological and geographic out-of-time/out-of-region validation; compare a simple baseline with the model's current held-out benchmark.
4. Verify calibration, recall/precision tradeoffs and prevalence shifts; show uncertainty and account for small high-risk cohorts.
5. Provide reproducible raw-to-Parquet scripts, license information, hash-verified exports and a supplementary figure-to-query appendix.
6. Choose a verified journal whose current-year **Scopus** source-category quartile fits the actual methodological contribution; "Q1" is subject/year specific, not a paper-quality guarantee.

## Limitations and browser checks

The new component needs independent browser visual QA in both themes at 1440px, 1099px, 760px, 480px and 320px, plus screen-reader testing of SVG marks, heatmap buttons, keyboard navigation and CSV exports. The CI currently checks TypeScript/Vite compilation, pre-existing SQL regressions, theme wiring and the Atlas figure/query contract; those checks **cannot substitute for statistical or end-user usability validation**. Avoid claiming journal acceptance, novelty, causal evidence or model accuracy from the chart count alone.
