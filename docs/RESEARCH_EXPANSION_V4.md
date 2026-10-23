# PromisePulse 4.0 · Research expansion technical specification

## What changed and what did not

This is an additive release. The original light/dark **Cadra-inspired premium shell**, verified Brazil-state choropleth, 36-chart Analytics Atlas, OLAP Lab, historical Risk Center, Data Catalog and Pipeline & Quality remain functionally and visually intact. PromisePulse now begins at an original research landing page, and the premium icon dock has **12** destinations:

| Dock label | What opens | Chart count specific to route |
| --- | --- | ---: |
| Welcome | New research landing with real warehouse KPIs and historical monthly trend | 1 landing trend |
| Overview | Original executive dashboard, map and original visualizations | Existing unchanged |
| Intelligence | Existing historical comparative analysis | Existing unchanged |
| Analytics Atlas | Nine original lenses × four registered figures | 36 |
| Customer Cohorts | Unique-customer cohort behavior and economics | 6 new |
| Delivery Lab | Promised versus delivered historical lead-time distribution | 6 new |
| Research Studio | Two six-chart lenses, Basket Structure + Product Weight & Freight | 12 new |
| AI Studio | Six held-out prediction-bin figures and a transparent evidence assistant | 6 new |
| OLAP Lab | Original roll-up, drill-down, slice, dice and pivot | Existing unchanged |
| Risk Center | Original historical evaluation and threshold controls | Existing unchanged |
| Data Catalog | Original warehouse schema inspection | Existing unchanged |
| Pipeline & Quality | Original ETL lineage and integrity | Existing unchanged |

**New statistical chart definitions: 30. Original Atlas definitions: 36. Total documented Atlas + specialized research charts: 66.** This is a count of *distinct metric views*, not 66 different trained AI models or 66 newly collected datasets. They can be displayed in bar, area, line or dot forms without inflating the chart definition count.

## Design constraints

All new pages share the same design tokens and premium data-chart components from `web/src/AnalyticsAtlas.tsx`. The expanded left dock preserves black curved surfaces, tooltips, focus/active states, icon size, floating header, brand and theme toggle. To prevent off-screen clipping, the desktop dock scrolls vertically when viewport height is short. The bottom dock scrolls horizontally on tablet/mobile for 12 accessible targets rather than squashing unreadable icons. No existing UI styles were removed. The welcome page is an additive editorial landing page, with a real historical SQL trend instead of fabricated numerical marketing graphs. Every CTA navigates to a working page.

## 30 new chart definitions and SQL lineage

All SQL is authored and allowlisted in `web/src/researchQueries.ts`, and all new routes render via `web/src/ResearchWorkspace.tsx`. Every query runs against the **same existing DuckDB-Wasm static Parquet export** that powers previous pages. Results are lazy and cached by view/year/state; an aggregate CSV export is available for every chart.

### Customer Cohorts: six figures

Grain is *one `dim_customer.customer_unique_id`* after joining the order fact to customer dimension and filtering purchase years/state. Group each customer's records by their **first observed purchase month within the filtered subset**, then plot:

1. Number of unique customer IDs.
2. Percentage of customers with 2+ observed orders.
3. Mean number of orders per customer.
4. Mean total recorded order payments per customer.
5. Mean customer-specific paid value per order, equally weighted by customer.
6. Mean customer-level review score where observed.

**Caution:** This is descriptive repeat activity, *not churn or censored-corrected retention*. Later cohorts have less opportunity to repeat. Filtering year or customer state changes what qualifies as the first observed purchase.

### Delivery Lab: six figures

One **delivered order with valid purchase, estimated and receipt dates**, grouped by estimated purchase-to-promise window (0–7, 8–14, 15–21, 22–30, 31+ days):

1. Observed delivery count.
2. Observed late-delivery percentage with non-null outcome denominator.
3. Mean actual purchase-to-receipt duration.
4. Mean promised purchase-to-estimated duration.
5. Mean recorded review score.
6. Sum of recorded order-level payments.

Excluded timestamps and undelivered orders must not be counted as punctual. These are not live delivery routes, mileage or driver tracking.

### Research Studio · Basket Structure: six figures

One `fact_orders` row with `item_count >= 1`, grouped by 1 / 2 / 3 / 4 / 5+ items:

1. Order count.
2. Sum of recorded payments at **order grain**.
3. Mean recorded payment.
4. Mean item-freight total stored on the order fact.
5. Observed late percentage, known labeled outcomes only.
6. Mean recorded review score.

**Financial safeguard:** `payment_total` never joins the order-item table before summation, so multi-item baskets cannot artificially inflate revenue.

### Research Studio · Weight & Freight: six figures

One `fact_order_items` row joined to product and order/customer dimensions, grouped by valid product metadata weight (under 250g / 250–499g / 500–999g / 1–1.99kg / 2–4.99kg / 5kg+):

1. Item count.
2. Distinct orders represented by each band; an order can appear in multiple bands.
3. Summed **item merchandise price**, not order payments.
4. Mean item price.
5. Mean **listed** item freight.
6. Freight as a share of `price + freight`.

**Caution:** product metadata weight is not actual parcel weight, and listed freight is not realized shipping expense. Missing and negative weights are excluded.

### AI Studio: six figures

One row per `risk_predictions` observation from the **published chronological held-out test cohort**, grouped into *absolute* 0–10, 10–20, …, 90–100% estimated-risk bands:

1. Historical held-out order count.
2. Observed late cases.
3. Observed late frequency (percentage).
4. Mean model-estimated risk probability (percentage).
5. Observed late-frequency lift relative to filtered test-cohort prevalence.
6. Fraction of all observed late cases falling in each band (not cumulative recall).

The model remains the **previously evaluated scikit-learn classifier**. No external AI service, LLM invocation, new training or live customer predictions are introduced. The optional customer-state filter restricts the fixed test cohort; **purchase-year filters do not apply** to the model. All probability comparisons and metrics are observational. For state-filtered cohorts, original ROC-AUC and PR-AUC shown from the manifest still refer to the published *overall* test sample.

## Transparent AI Evidence Assistant

AI Studio adds a selectable **deterministic evidence interpreter**, deliberately not marketed as a chatbot or generative model. Three meaningful question presets are implemented:

- **Where is late risk concentrated?** Uses actual test-row totals, late counts, high observed-risk band, and first-to-last observed-risk difference (in percentage points).
- **Is the model calibrated?** Defines predicted vs observed curves, and discloses the recorded overall ROC AUC and PR AUC from the export manifest. Users inspect six populated chart panels directly.
- **How is this AI implemented?** Discloses the scikit-learn model lineage, cutoff information and distinction between observational association and causal evidence.

An answer cannot be generated from synthetic fallback numbers; if no evaluated model is present, the page communicates that fact. This is *explainable presentation of model evidence*, not SHAP, causal feature attribution or an AI-agent deployment.

## Comparison to SmartCart AI reference

The provided reference repository `dhruvvijan7-ops/Smartcart_AI-New` has roughly thirteen application destinations, grouped categories, a public landing page, and an AI console (see its implementation report and AppShell). PromisePulse adopts the *information architecture idea* of multiple focused destinations and a separate public landing page but **does not copy reference UI assets or claim unsupported functionalities**. Specifically, inventory edit workflows, supplier CRUD, real-time alerts, chatbot API calls and simulated analytics are not part of the current historical Olist dataset or PromisePulse warehouse. The benchmark project's report documents degraded/inconsistent API endpoints and fallback chatbot answers; PromisePulse does not reproduce those mechanisms.

## Software, tests and reproduction

```bash
cd web
npm ci
npm run build
node ../tests/test_sql_generation.cjs
node ../tests/test_atlas.cjs
node ../tests/test_theme.cjs
node ../tests/test_research_expansion.cjs
npm run dev
```

The 4th check enforces exactly 12 dock destinations, 30 new figure identities, safe order/item separation and allowlisted filters, and checks AI honesty text. The additional Playwright smoke in `web/scripts/capture-v4.mjs` navigates the actual running application, executes warehouse-backed charts, tests AI question selection, verifies the original Overview is preserved, and captures light/dark/mobile screenshots. GitHub Actions runs this script via `.github/workflows/v4-browser-capture.yml`; screenshots carry a manifest with provenance.

## Limits for scholarly submission

A larger visualization collection supports exploratory analysis but is **not a novelty claim** or a substitute for a scientific methodology. Scopus journal quartiles depend on year and subject area. Before submission to a top-quartile journal, independently validate all data exclusions, run geographical and chronological generalization checks, compare properly tuned baselines, compute uncertainty intervals appropriate to customer clustering, control for multiple testing, cite related work, and state the model's recorded minority-class precision (≈ 0.049 at the included threshold). Figures alone do not prove significance, causality, model reliability or acceptance.
