# PromisePulse

**Historical e-commerce intelligence · browser-side SQL · reproducible data mining · project-aware AI assistant**

[![Web validation](https://github.com/kasim672/PromisePulse/actions/workflows/web-checks.yml/badge.svg?branch=main)](https://github.com/kasim672/PromisePulse/actions/workflows/web-checks.yml)
[![MIT code license](https://img.shields.io/badge/code-MIT-blue)](LICENSE)
[![Olist historical data](https://img.shields.io/badge/dataset-Olist%202016--2018-4b779c)](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)

[Live website](https://promise-pulse-rose.vercel.app/) · [Architecture](docs/ARCHITECTURE_V5.md) · [User guide](docs/USER_GUIDE.md) · [Reproducibility](docs/RESEARCH_REPRODUCIBILITY.md) · [Deployment](docs/DEPLOYMENT.md) · [Screenshots](docs/SCREENSHOT_GALLERY_CURRENT.md) · [AI assistant](docs/GEMINI_RESEARCH_ASSISTANT.md)

![PromisePulse Welcome in dark mode, authentic Chromium capture](docs/screenshots/current/welcome-dark.png)

*Historical UI reference, captured from source commit [`a9620fa`](https://github.com/kasim672/PromisePulse/commit/a9620fa70d4bc1c8ea31931ab87a53c2c3801f62) on October 26, 2026. The [capture manifest](docs/screenshots/current/CAPTURE_MANIFEST.json) records its provenance. Screenshots may predate later AI assistant and chat theme improvements; see the [gallery](docs/SCREENSHOT_GALLERY_CURRENT.md). A GitHub merge is not evidence of a completed Vercel deployment.*

## Project overview

**PromisePulse 5.0** analyzes the [Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce), covering historical orders from **2016–2018**. It is an academic analytics application, **not** a live courier tracking service or a production risk-scoring platform.

There are three separate execution boundaries:

1. **Offline preparation:** Python and DuckDB transform eight original CSVs into audited dimension/fact Parquet files and `manifest.json`. Optional chronological machine-learning evaluation produces `risk_predictions.parquet`; another offline exporter produces the `mining_lab.json` teaching and research experiments.
2. **Browser analytics:** Vercel delivers a Vite/React application and versioned public files. DuckDB-Wasm executes authored read-only SQL inside each visitor's browser, powering charts, OLAP, state comparisons and CSV exports without a live SQL server.
3. **Optional Gemini conversation:** the floating **Ask PromisePulse AI** drawer calls `POST /api/ask` on a server-side Vercel Function. The function retrieves relevant checked-in website documentation and selected published aggregate results, then sends bounded context to Google Gemini **only if a private key is configured**. Otherwise, project reference passages can still appear, labeled as non-generative.

![Current application architecture including the optional Gemini service boundary](docs/architecture.svg)

Read [the architecture guide](docs/ARCHITECTURE_V5.md) for data flow, actual fact grains, runtime isolation, limits and entry points.

## Features and navigation

| Destination | What visitors can investigate |
| --- | --- |
| Welcome | Introduction, historical activity trend and navigation |
| Overview | Orders, payment totals, delivery outcomes and the Brazil state map |
| Intelligence | Marketplace and fulfillment comparisons |
| Analytics Atlas | 36 source-backed chart definitions spanning nine analytical lenses |
| Customer Cohorts | Six cohort/repeat-customer analyses |
| Delivery Lab | Six delivery-promise and lateness views |
| Research Studio | Twelve freight, basket and product analyses |
| AI Studio | Six held-out model diagnostic figures and a deterministic evidence view |
| OLAP Lab | Roll-up, drill-down, slice, dice and pivot with browser SQL |
| Risk Center | Retrospective risk predictions and limitations |
| Data Catalog | Lineage, table grain and warehouse metadata |
| Pipeline & Quality | Reconciliation, missingness and export integrity |
| Data Mining Lab | Direct entry to a hub containing six academic analysis sections |

The original research interface comprises **66 chart definitions** (36 Atlas + 30 research expansion). Data Mining Lab figures are additional and not included in that count. The six lab sections cover Warehouse & ETL, Data Lakes, EDA & Preprocessing, Classification, Clustering, and Frequent Patterns. Lab experiments are **precomputed on published historical data**, whereas the five interactive teaching visualizers (Decision Tree, K-Means, Apriori, FP-Growth and Eclat) step through **explicitly illustrative inputs**.

### Ask PromisePulse AI

The assistant is **part of `main`**, not a pending feature branch. It supports conversational questions about website navigation, dataset provenance, warehouse design, visualizations, algorithm results and project architecture; with Gemini enabled, it can also respond to ordinary general questions. Its index is built from checked-in documentation, the verified warehouse manifest and selected aggregate mining results. It **cannot see an individual user's live DuckDB session**, browse arbitrary sites or query every raw Parquet row.

With no valid Gemini credentials, the interface returns **labeled source/reference answers**, not simulated Gemini responses. Questions sent to Gemini leave the website for Google's API processing. Keep keys server-side, protect the public API from abuse and verify research claims against the cited source files. [Details and setup](docs/GEMINI_RESEARCH_ASSISTANT.md).

### Design and accessibility

The release retains the purple wordmark and uses **soft cyan `#7DD3FC`** for focused controls and selected states. It supports both light and dark modes, a responsive navigation dock, keyboard focus, readable cyan-on-navy contrast, and a polished AI drawer: opaque white/pale-blue chat surfaces in light mode with the existing dark palette preserved. Presentation changes do not modify the historical data or model metrics. [Theme specification](docs/THEME_SYSTEM.md).

## Published warehouse and research evidence

The [checked-in manifest](web/public/data/manifest.json), generated **October 13, 2026**, reports:

| Relation | Grain | Rows |
| --- | --- | ---: |
| `fact_orders` | One row per order | 99,441 |
| `fact_order_items` | One row per order item | 112,650 |
| `dim_customer` | Customer source record | 99,441 |
| `dim_product` | Product | 32,951 |
| `dim_seller` | Seller | 3,095 |
| `dim_date` | Calendar date | 774 |
| `risk_predictions` | Held-out test prediction | 19,294 |

**Grain matters:** payment totals belong to the order fact, while item prices and freight belong to the order-item fact. Summing order payments after a one-to-many item join would double-count revenue. The manifest reports separate payment/item reconciliation checks with zero-cent deltas.

For the historical delivery-risk evaluation at threshold **0.60**, held-out precision ≈ 0.049, recall ≈ 0.288 and ROC AUC ≈ 0.698. The very low precision means this model is **not demonstrated to be operationally reliable**. The syllabus classifiers use a separate experimental cohort and their metrics must not be mixed with the risk model. Clustering relies on a deterministic 950-customer RFM sample; frequent-pattern mining selects 649 eligible multi-category baskets. Read [reproducibility](docs/RESEARCH_REPRODUCIBILITY.md) and [Data Mining Lab](docs/SYLLABUS_V5.md) for inclusion criteria and methodological limits.

## Run locally

**Prerequisites:** Node.js 22 (used by GitHub CI) and npm; Python is only needed to rebuild exported data.

```bash
git clone https://github.com/kasim672/PromisePulse.git
cd PromisePulse
git switch main
cd web
npm ci
npm run dev
```

Visit **http://127.0.0.1:5173/**. The launcher starts both Vite and the local `/api/ask` server on **loopback port 8787**, then proxies requests through Vite; the key is never embedded in browser JavaScript. The dashboard works with the included exported data **without** a Gemini key, Kaggle account, Python process or database server.

To enable generative answers locally:

```bash
cd web
npm run setup:gemini
# Edit the untracked web/.env:
# GEMINI_API_KEY=<your private key>
# GEMINI_MODEL=<a model supported by your key>
npm run dev
```

Never commit `web/.env` or set `VITE_GEMINI_API_KEY`. The example currently uses `gemini-3.5-flash` but the exact supported model depends on your Google API account; choose one available for your key. In another terminal, run `npm run check:gemini` to verify the local API route **without spending Gemini credits**. This check does not verify Google authentication.

For a production build and static preview:

```bash
cd web
npm run build
npm run preview
```

Both the development launcher and build refresh the server-side website evidence index before running. The generated web bundle is `web/dist/`.

### Rebuild original research exports (optional)

Place the eight official Olist CSV files in `data/raw/` (they are not committed), then from the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-export.txt
python scripts/build_web_data.py --raw-dir data/raw --train
python scripts/verify_export.py
python scripts/build_mining_lab.py
python scripts/verify_mining_lab.py
```

The `--train` flag enables the retrospective chronological model evaluation and publishes `risk_predictions.parquet`. The standalone mining lab exporter reads the locally regenerated warehouse. See [the reproducibility guide](docs/RESEARCH_REPRODUCIBILITY.md).

## Vercel deployment

The intended production domain is [promise-pulse-rose.vercel.app](https://promise-pulse-rose.vercel.app/). Use the following project settings:

| Vercel setting | Value |
| --- | --- |
| Git repository / production branch | `kasim672/PromisePulse` / `main` |
| Framework | Vite |
| **Root directory** | **`web`** |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Server-only optional secrets | `GEMINI_API_KEY`, `GEMINI_MODEL` |

The website's historical dashboards are statically served. **Only** `web/api/ask.js` requires the Vercel serverless runtime when generative AI is enabled. The assistant will show clearly marked reference information without a key, where matching documentation exists.

GitHub commits and tests do **not** prove that the production deployment is current. Earlier builds were blocked by a Vercel build-rate limit; verify the actual **Ready** deployment and its commit SHA in the Vercel dashboard. The [deployment guide](docs/DEPLOYMENT.md) includes a production checklist, API-route tests and troubleshooting.

## Screenshots and verification

| Historical Overview capture: light | Historical Overview capture: dark |
| --- | --- |
| [![Overview in light mode](docs/screenshots/current/overview-light.png)](docs/screenshots/current/overview-light.png) | [![Overview in dark mode](docs/screenshots/current/overview-dark.png)](docs/screenshots/current/overview-dark.png) |

| Mining hub | Clustering |
| --- | --- |
| [![Data Mining Lab](docs/screenshots/current/mining-hub-light.png)](docs/screenshots/current/mining-hub-light.png) | [![Clustering and Ward dendrogram](docs/screenshots/current/clustering-light.png)](docs/screenshots/current/clustering-light.png) |

These are real Chromium captures of **an earlier `main` revision**, with source hashes recorded in [the manifests](docs/SCREENSHOT_GALLERY_CURRENT.md). A screenshot refresh workflow documents how to capture the latest UI and AI drawer; it never fabricates a Google response.

```bash
cd web
npm ci
npm run build
node ../tests/test_documentation.cjs
node ../tests/test_theme.cjs
node ../tests/test_soft_cyan_theme.cjs
node ../tests/test_gemini_assistant.mjs
node ../tests/test_mining_export_integrity.cjs
```

Additional analytics, algorithm, dataset and visual-regression checks are in [`tests/`](tests/) and [GitHub Actions](.github/workflows/web-checks.yml). Browser capture requires Playwright/Chromium and is not a permanent frontend dependency.

## Repository map

```text
PromisePulse/
├── README.md
├── docs/
│   ├── ARCHITECTURE_V5.md          # Architecture, data flow, data grains
│   ├── architecture.svg            # Overview of static analytics and Gemini API
│   ├── DEPLOYMENT.md               # Local and Vercel operations
│   ├── GEMINI_RESEARCH_ASSISTANT.md # Retrieval, privacy, Gemini setup
│   ├── SCREENSHOT_GALLERY_CURRENT.md
│   ├── THEME_SYSTEM.md
│   └── screenshots/current/       # Chromium captures and source manifests
├── scripts/                        # Python ETL, ML, integrity verification
├── tests/                          # Node and Python regression tests
├── web/
│   ├── api/                       # Server-side Gemini endpoint and knowledge index
│   ├── public/data/               # Published historical Parquet and JSON
│   ├── scripts/                    # Vite/backend launcher, index and capture
│   ├── src/                        # React analytics, mining and AI drawer
│   ├── package.json
│   └── vite.config.ts
└── requirements-export.txt
```

## Licensing and attribution

The source-code license is [MIT](LICENSE). The Olist historical dataset is independently distributed as [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); the code license does **not** override the dataset's attribution, noncommercial or share-alike conditions. Read [third-party notices](docs/THIRD_PARTY_NOTICES.md).

PromisePulse also builds on concepts from [Christopher Dougherty's `olist-sales-analytics-pipeline`](https://github.com/credough/olist-sales-analytics-pipeline). Its warehouse publication, Vite/React interface, DuckDB-Wasm exploration and data-mining demonstrations are documented here for reproducibility, not as claims of new independent scientific validation.
