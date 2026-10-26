# PromisePulse 5.0 — User Guide

This guide describes the working **historical Olist analytics application** from the PromisePulse GitHub source, not live production shipment tracking. For methodology and exact chart-level SQL lineage, see [Analytics Atlas Methodology](ANALYTICS_ATLAS_METHODOLOGY.md). For the architecture and research workflow, see [Research Reproducibility](RESEARCH_REPRODUCIBILITY.md).

## Look and feel of the current release

The merged PromisePulse 5.0 release uses **soft-cyan `#7DD3FC`** instead of the former lime/acid-green accent on selected navigation, the highlighted Overview KPI, Brazil map state selection, actionable buttons, charts, Data Mining Lab controls and favicon. The original purple logo lettering and dark graphite layout remain intact. Light mode uses a darker blue for text contrast; high-contrast navy text appears on cyan buttons. Theme selection remains persistent across visits.

See the [current screenshots](SCREENSHOT_GALLERY_CURRENT.md) and [complete design system](THEME_SYSTEM.md). If the live Vercel site still has the previous colors, compare the deployed Git SHA with `main` in the [deployment guide](DEPLOYMENT.md): Vercel was rate-limited after the theme merge.

## Starting the dashboard

```bash
git clone https://github.com/kasim672/PromisePulse.git
cd PromisePulse/web
npm ci
npm run dev
```

Open the local address printed by Vite. This repository includes the prepared Parquet files and `web/public/data/manifest.json`; the browser loads these files locally and initializes DuckDB-Wasm. A warehouse connection indicator shows when data is ready.

For a clean production build, run `npm run build`. No PostgreSQL/MySQL server, external API key, or live logistics connection is required to explore the already-exported historical facts.

### Main navigation

The navigation dock includes the **12 retained research/analytics workspaces** plus **one Data Mining Lab icon** in PromisePulse 5.0. The new first destination is **Welcome**, which opens by default and displays actual historical Olist month-trend data and navigation into the research workspaces. At tablet/mobile widths, the dock moves to the bottom and scrolls horizontally to keep targets readable. Buttons provide accessible labels and keyboard focus; navigate using the dock or the Search command palette.

| Destination | Purpose | Helpful inspection |
| --- | --- | --- |
| **Welcome** | Premium research landing, real monthly activity, quick entry into every lab | Explore the historic trend and select Launch Command Center or Research Studio |
| **Customer Cohorts** | Six first-observed customer cohort charts | Compare repeats, value, frequency and reviews, while accounting for uneven follow-up |
| **Delivery Lab** | Six promised-window and delivery-duration charts | Filter observed delivered orders and compare actual vs estimated lead times |
| **Research Studio** | Twelve basket and product-weight research plots | Switch Basket vs Weight & Freight to preserve correct order/item financial grains |
| **AI Studio** | Six held-out model evaluation charts and a deterministic evidence assistant | Compare predicted vs observed risk, inspect lift and change evidence questions; not an LLM |
| **Overview** | KPI summary, monthly payment patterns, state choropleth, high-level delivery and category indicators | Change the purchase year; select a Brazilian state on the historical map; compare order counts and late outcomes |
| **Intelligence** | Historical trends and descriptive comparisons | Look for differences by weekday, delivery periods, ratings and categories |
| **Analytics Atlas** | 36 focused charts across nine analysis lenses | Filter by purchase year and customer state; switch chart forms; inspect individual bins and export source aggregates |
| **OLAP Lab** | Genuine database roll-up, drill-down, slice, dice and pivot | Select a date range and states, then run an operation; results are shown without raw SQL preview |
| **Risk Center** | Chronologically evaluated historical delivery-risk model | Adjust the classification threshold; inspect precision/recall effects and the held-out confusion matrix |
| **Data Catalog** | Physical warehouse tables, their columns and source provenance | Preview actual selected table rows and consult source counts |
| **Pipeline & Quality** | ETL stages, data lineage and validation | Check deduplication, foreign-key coverage and reconciliation facts |

### Data Mining Lab — six additional analysis sections

Click the **graduation-cap Data Mining Lab icon** in the navigation dock. It opens the **Data Mining Lab overview immediately**, not a dropdown menu. Choose an analysis card or use the clickable internal tabs to switch between **Warehouse & ETL**, **Data Lakes**, **EDA & Preprocessing**, **Classification Lab**, **Clustering Lab** and **Pattern Mining**. Use **Overview** in that tab row to return to the analysis cards.

Every lab panel reads the published `mining_lab.json` export produced offline from the Olist warehouse. Charts and selectors do not fit a new machine-learning model in the browser. Teaching hours and module-number banners are documented separately in [the academic syllabus](SYLLABUS_V5.md) rather than placed as micro-headlines on the screen.

For current verified screenshots (including desktop, dark and mobile), see [the PromisePulse 5.0 gallery](SCREENSHOT_GALLERY_CURRENT.md). For the backend/public distinction see [Architecture](ARCHITECTURE_V5.md).

### Interactive algorithms: navigate and interpret

The Classification Lab includes a sample **Decision Tree path**; the Clustering Lab includes a computed **K-Means** plot; Pattern Mining offers **Apriori**, **FP-Growth**, and **Eclat** demonstrations. The teaching interface has **Next step**, **Previous**, **Restart** and numbered buttons. For pattern miners, choose the algorithm first. All example inputs are shown on screen.

Do not treat those steps as outputs from the fitted Olist methods. The genuine Olist metrics and analytical charts are below each visualizer. See [Algorithm Playground](ALGORITHM_PLAYGROUND.md) for exact worked data and equations.

**Loading:** A visible warehouse status displays manifest/engine stages and the number of registered Parquet tables. Chart queries show labeled progress without inventing an overall percentage. If the historical file cannot be read, click **Retry loading data**; expanded technical details can identify a missing URL. An error never triggers made-up analytics.


These are separate analysis views, **not separate data providers**. The application works from the same historical Olist source and verified Parquet export. The **66 registered research chart definitions** comprise the original 36 Atlas views plus 30 new empirical views; changing a chart form does not create a distinct research figure.

For the four originally added research destinations, see [PromisePulse 4.0 Research Expansion](RESEARCH_EXPANSION_V4.md) and [New screenshot gallery](SCREENSHOT_GALLERY_V4.md).

## Light mode, dark mode and search

Use the Sun/Moon button in the header. Theme preference is saved in localStorage and restored on return. If no saved preference exists, the app respects operating-system appearance when possible. Both styles apply to the dock, cards, charts, controls, tables, and geographic analysis. Keyboard focus styling and reduced-motion preferences are included.

Open **Search** in the header or press **Ctrl+K** on Linux/Windows, **Command+K** on macOS. Search existing workspaces by name/description, press a result to navigate, and Escape to close.

## Overview: geographic delivery intelligence

The Brazil choropleth shades **customer states** using aggregated, historical data. Hover or focus state polygons to inspect accessible state names; select a polygon to see its order count, paid value and known late-share. You can compare the selected state with the ranked list on the side. Color indicates summarized data, **not** a real-time truck route or customer location.

Lateness is defined only when `fact_orders.is_late` has an observed Boolean value, which the ETL derives for delivered orders with comparable actual/estimated delivery dates. Missing or incomplete outcomes are not treated as on-time deliveries.

## Analytics Atlas

Use the nine **in-page research lenses**, which sit beside or above the graphs depending on viewport width. Each lens contains four views:

1. Commercial pulse: orders, recorded payments, mean paid value and labeled late share by month.
2. Weekly behavior: counts, paid value, late share and mean delivery duration by purchase weekday.
3. Hourly demand: counts, payment total, mean payment and late share by purchase hour.
4. Regional comparisons: customer-state orders, payments, late share and duration.
5. Fulfillment anatomy: duration band counts, payments, late share and mean review.
6. Customer experience: review-score counts, payment totals, late share and delivery duration.
7. Product economics: item counts, item merchandise-price sums, mean item price and freight share by category.
8. Seller geography: distinct sellers, item counts, item merchandise sales and mean item freight by seller state.
9. Research laboratory: weekday×hour, state×month and review×punctuality matrices plus the held-out risk-calibration display.

For the 32 one-dimensional views, switch **Bars / Line / Area / Dots**, hover or keyboard-select data points, and expand **Inspect source aggregates**. Use the download icon to export exactly the aggregated rows returned by the query. This supports reproducibility and permits separate statistical analysis.

For laboratory matrices, choose a heatmap cell to inspect the historical order count. The calibration diagram compares observed late frequency with the model's average predicted probability by bin. It is restricted to **actually evaluated** test predictions.

### Interpreting uncertainty

Late-share plots show exploratory 95% Wilson interval whiskers where both a late count and labeled denominator exist. The intervals measure binomial sampling uncertainty **under simple independence assumptions**, not uncertainty arising from source selection, repeated customer observations, confounding, geospatial correlation, or multiple comparisons. They are **not** p-values or evidence of causation.

Do not interpret an empty group as zero. If a measure has no valid denominator, the query result is null and the chart omits the mark.

### Filters and their scopes

- **Purchase period**: all / 2016 / 2017 / 2018, derived from historical order purchase timestamps.
- **Customer state**: ALL or an explicit Brazilian state abbreviation. This filters applicable order and item aggregate views, and optionally the test cohort's state within the model diagnostic.
- **Calibration exception**: the held-out model cohort has its own chronological evaluation window; selecting a dashboard purchase year does **not** retrain or resplit the model.

Use the state filter to drill into a local cohort; be careful when comparing very small state/year combinations.

## OLAP Lab

The five operations are:

| Operation | What it demonstrates |
| --- | --- |
| Roll-up | Hierarchical subtotals combining state and calendar month |
| Drill-down | State selection expanded to month-level detail |
| Slice | One customer state with status/late metrics |
| Dice | Two selected states × selected fulfillment statuses |
| Pivot | Side-by-side counts for selected states by month |

The interface intentionally **shows query results, not raw SQL preview**. The reproducible query builders remain in `web/src/queries.ts`; the read-only DuckDB-Wasm engine executes them locally.

## Risk Center

The included model is a historical **demonstration of leakage-aware chronological classification**, not an accurate production predictor or a live scoring service. Adjusting the threshold recomputes confusion-matrix counts from held-out labels; a new threshold can change precision and recall even though the model itself has not changed.

The supplied manifest reports a 19,294-order held-out test split, F1≈0.0835, precision≈0.0488, recall≈0.2878 and ROC AUC≈0.698 at the recorded threshold 0.60. Those performance results require explicit disclosure because the positive class is uncommon and the selected threshold has many false positives. Do not describe the model as high-precision.

## Data Catalog and Pipeline & Quality

Look up the six exported dimensional/fact tables. Check their row counts and provenance, preview query rows, and inspect the quality summary. Important exported counts (source manifest, generated October 13, 2026):

| Relation | Records |
| --- | ---: |
| `fact_orders` | 99,441 |
| `fact_order_items` | 112,650 |
| `dim_customer` | 99,441 |
| `dim_product` | 32,951 |
| `dim_seller` | 3,095 |
| `dim_date` | 774 |
| `risk_predictions` | 19,294 |

The exporter reports **zero duplicated order keys**, **zero duplicated item keys**, and **zero-cent differences** for its payment and item-price reconciliations. It also reports 2,971 orders with unknown late labels and one order with no payment total. These checks are in the source manifest, not live database-service health checks.

## Responsible screenshots and figure citation

The [Screenshot Gallery](SCREENSHOT_GALLERY.md) links to authentic browser captures with a capture manifest. Use those images when describing the UI. The figure-to-SQL appendix and data manifest are the authoritative sources for quantitative methods. Never substitute a screenshot for a dataset-level validation or a statistical significance test.

## Troubleshooting

**White/blank content or loading errors:** confirm you ran Vite from the `web` directory and that `web/public/data/manifest.json` and the relevant Parquet files exist. Open browser DevTools to identify failed fetches.

**No predictions:** the `risk_predictions.parquet` file is only registered when the manifest reports an evaluated model. If regenerating the export without training, the Risk Center has no evaluated predictions to present.

**Old favicon/UI:** after switching Git branches, restart Vite and hard-refresh the browser; cached images can survive an update.

**Chart has no observations:** check the year, customer state, whether an outcome/review was actually recorded, and the chart's denominator.

**Narrow mobile screen:** plots scale and detailed tables scroll horizontally inside their containers. The bottom dock remains available; ensure it does not cover the last data row when testing on an actual device.

## Documentation index

- [README](../README.md): project narrative, architecture and setup.
- [Research Reproducibility](RESEARCH_REPRODUCIBILITY.md): methods, schema, quantitative caveats and evaluation.
- [Analytics Atlas Methodology](ANALYTICS_ATLAS_METHODOLOGY.md): 36-figure inventory and query lineage.
- [Screenshot Gallery](SCREENSHOT_GALLERY.md): light/dark/mobile and page gallery.
- [Measured Design Reference](../design.md): observed design tokens and source limitations.
