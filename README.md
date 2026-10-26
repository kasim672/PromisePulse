# PromisePulse

**Historical e-commerce intelligence, dimensional warehousing and reproducible data-mining experiments.**

[![Web build and checks](https://github.com/kasim672/PromisePulse/actions/workflows/web-checks.yml/badge.svg?branch=main)](https://github.com/kasim672/PromisePulse/actions/workflows/web-checks.yml)
[![MIT source license](https://img.shields.io/badge/code-MIT-blue)](LICENSE)
[![Olist historical dataset](https://img.shields.io/badge/dataset-Olist%202016--2018-4b779c)](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)

**[Live dashboard](https://promise-pulse-rose.vercel.app/)** · **[Architecture](docs/ARCHITECTURE_V5.md)** · **[Deployment guide](docs/DEPLOYMENT.md)** · **[Screenshot gallery](docs/SCREENSHOT_GALLERY_CURRENT.md)** · **[Research methods](docs/RESEARCH_REPRODUCIBILITY.md)**

![PromisePulse current release homepage](docs/screenshots/current/welcome-light.png)

*Current PromisePulse 5.0 interface, captured from the real application after the editorial typography update. For image provenance and other views, see the [capture manifest](docs/screenshots/current/CAPTURE_MANIFEST.json).*

## Overview

PromisePulse explores the **Brazilian E-Commerce Public Dataset by Olist**, a historical record of marketplace activity from **2016–2018**. An offline Python/DuckDB pipeline converts eight raw source CSVs into an audited dimensional warehouse. The website then downloads **Parquet files** and uses **DuckDB-Wasm in the visitor's browser** to execute real read-only SQL for interactive dashboards, OLAP, charting and CSV exports.

A separate offline experiment exporter provides six Data Mining Lab sections: warehouse/ETL, data lakes, exploratory preprocessing, classification and regression, clustering, and frequent-pattern mining. The experiments use published historical results, not simulated order activity or models retrained on each visit.

**This is a research and education dashboard, not a live fulfillment tracker or deployed risk-scoring service.** It requires no hosted SQL server, account system, Streamlit application or Python process to serve the public site.

## Explore the current release

| Workspace | What it does |
| --- | --- |
| **Welcome** | Historical source-backed entry page and monthly order trend |
| **Overview** | Orders, payments, delivery outcomes, customer-state map and trends |
| **Intelligence** | Additional SQL-based marketplace and fulfillment comparisons |
| **Analytics Atlas** | 36 interactive chart definitions across nine analysis lenses |
| **Customer Cohorts** | Six cohort and repeat-customer analytics |
| **Delivery Lab** | Six descriptive promise-window and delivery analyses |
| **Research Studio** | Twelve basket, product-weight and freight analyses |
| **AI Studio** | Six held-out model diagnostics and a deterministic evidence assistant |
| **OLAP Lab** | Drill-down, roll-up, slice, dice and pivot operations |
| **Risk Center** | Exploration of evaluated historical late-delivery predictions |
| **Data Catalog** | Published source metadata, table grains and warehouse schemas |
| **Pipeline & Quality** | Transformation provenance and reconciliation checks |
| **Data Mining Lab** | An overview plus six detailed academic analysis sections |

There are **12 original navigation destinations** plus **one Data Mining Lab icon**. That icon opens the lab overview directly; the six analysis sections are selected from its cards or internal tabs. There is **no dropdown or separate icon for each lab section**.

The **66 original research chart definitions** come from 36 Atlas charts and 30 research expansion charts. Mining-lab diagrams, figures and tables are supplementary, not additions to that 66-definition count.

### Six Data Mining Lab sections

| Section | Recorded implementation |
| --- | --- |
| Warehouse & ETL | Dimensional models, order/item fact grain separation, ETL stages and quality |
| Data Lakes | File-level staging and curated data comparison (conceptual lake architecture, **no cloud object store**) |
| EDA & Preprocessing | Distributions, missingness, quartiles, descriptive statistics and correlations |
| Classification Lab | Offline Decision Tree, Gaussian Naive Bayes, logistic/majority baselines and regression comparisons |
| Clustering Lab | K-Means, Ward hierarchical clustering, Bisecting K-Means, PCA projections and real dendrogram links |
| Pattern Mining | Apriori, FP-Growth, Eclat, closed sets, support, confidence, lift and association rules |

The original university **30-hour syllabus breakdown** remains in the [syllabus methodology document](docs/SYLLABUS_V5.md); it is not shown as unnecessary micro-headlines on the website.

### Actual screenshots

| Overview (light) | Overview (dark) |
| --- | --- |
| [![Overview light](docs/screenshots/current/overview-light.png)](docs/screenshots/current/overview-light.png) | [![Overview dark](docs/screenshots/current/overview-dark.png)](docs/screenshots/current/overview-dark.png) |

| Mining lab overview | Clustering |
| --- | --- |
| [![Data Mining Lab](docs/screenshots/current/mining-hub-light.png)](docs/screenshots/current/mining-hub-light.png) | [![Clustering and Ward dendrogram](docs/screenshots/current/clustering-light.png)](docs/screenshots/current/clustering-light.png) |

**[See the complete current-release desktop, dark-mode and mobile gallery](docs/SCREENSHOT_GALLERY_CURRENT.md).** Previous [V3](docs/SCREENSHOT_GALLERY.md), [V4](docs/SCREENSHOT_GALLERY_V4.md) and [early V5](docs/SCREENSHOT_GALLERY_V5.md) captures remain archived; some older screenshots predate the typography cleanup.

## System architecture

![Offline ETL to static exports and in-browser DuckDB](docs/architecture.svg)

The system has **two distinct phases**:

1. **Offline data preparation:** Olist CSV files → Python/DuckDB staging and dimensional modeling → reconciliation checks → Parquet export and manifest. Optional chronological model evaluation produces held-out predictions; the mining exporter produces `mining_lab.json`.
2. **Public interactive application:** Vercel serves React/Vite build assets plus the versioned Parquet and JSON files. React instantiates DuckDB-Wasm in a browser worker, registers Parquet views and runs historical SQL against them. Lab charts display previously computed experiment results.

Read the **[full system architecture, end-to-end flow, ER/grain diagram and browser sequence diagram](docs/ARCHITECTURE_V5.md)**.

### Warehouse at a glance

| Published relation | Grain | Current manifest rows |
| --- | --- | ---: |
| `fact_orders` | Order | 99,441 |
| `fact_order_items` | Order item | 112,650 |
| `dim_customer` | Customer source record | 99,441 |
| `dim_product` | Product | 32,951 |
| `dim_seller` | Seller | 3,095 |
| `dim_date` | Calendar date | 774 |
| `risk_predictions` | Time-held-out prediction | 19,294 |

These figures are read from the checked-in [`manifest.json`](web/public/data/manifest.json); its recorded export date is **October 13, 2026**, not the time of your current visit.

**Avoid double-counting payments.** `fact_orders` contains order-grain payment totals; `fact_order_items` contains product/item prices and freight. Summing payment totals after joining one order to many items inflates revenue. The exporter provides separate, reconciled aggregations at the proper grains.

### Historical classification and mining limitations

The published held-out risk model has **precision ≈ 0.049**, **recall ≈ 0.288**, and **ROC AUC ≈ 0.698** at its recorded threshold of 0.60. These are limited minority-class results, not evidence of reliable operational alerts. A separate course classifier experiment has a different evaluation cohort and should not be merged numerically with the 19,294-row original model test.

The mining export uses a **950-customer** clustering sample and a **52-record** Ward dendrogram. Frequent pattern analysis uses **649 eligible multi-category baskets** under documented selection criteria, not every marketplace order. Correlation, cluster membership and itemset association do not establish causation.

See [research reproducibility](docs/RESEARCH_REPRODUCIBILITY.md), [syllabus experiments](docs/SYLLABUS_V5.md), and [original figure-to-SQL methodology](docs/ANALYTICS_ATLAS_METHODOLOGY.md).

## Run locally

A Node.js environment compatible with the project lockfile (CI uses **Node 22**) and npm are sufficient to run the already-published historical dashboard.

```bash
git clone https://github.com/kasim672/PromisePulse.git
cd PromisePulse
git switch main
cd web
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. No Python environment, Kaggle download or credentials are required to **view** the bundled exported analytics.

To build and preview the static production output:

```bash
cd web
npm run build
npm run preview
```

The Vite build runs TypeScript checks and places the deployable site in `web/dist/`.

### Optional: regenerate warehouse and mining results

Install Python, create a virtual environment and prepare the eight raw Olist CSV files in `data/raw/` from the [Kaggle source](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce). From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-export.txt

python scripts/build_web_data.py --raw-dir data/raw --train
python scripts/verify_export.py
python scripts/build_mining_lab.py
python scripts/verify_mining_lab.py
```

`--train` evaluates the offline delivery-risk model chronologically and publishes test-period predictions. This is **optional** for running the site with its existing data; it is required if you want to reproduce the included evaluated model exports from raw input.

**Dataset licensing:** The application code is MIT, but the Olist dataset is **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)**. The latter has attribution, noncommercial and share-alike conditions; MIT does not override them.

## Deploy on Vercel

The live site is **[promise-pulse-rose.vercel.app](https://promise-pulse-rose.vercel.app/)**. For a new Vercel import of this repository:

| Setting | Value |
| --- | --- |
| Repository | `kasim672/PromisePulse` |
| Production branch | `main` |
| Framework | Vite |
| **Root directory** | **`web`** |
| Install | `npm ci` |
| Build | `npm run build` |
| Output directory | `dist` |
| Required production secrets | None for the bundled static historical data |

Vercel deploys compiled HTML, JS, CSS, WebAssembly and `web/public/data` files. No live DuckDB server or Python deployment is involved. **[Read the complete setup, production QA, data-regeneration and troubleshooting guide](docs/DEPLOYMENT.md).**

## Validate the release

```bash
cd web
npm ci
npm run build

node ../tests/test_sql_generation.cjs
node ../tests/test_theme.cjs
node ../tests/test_atlas.cjs
node ../tests/test_research_expansion.cjs
node ../tests/test_syllabus_modules.cjs
node ../tests/test_mining_export_integrity.cjs
node ../tests/test_editorial_hierarchy.cjs
```

GitHub Actions runs these checks in [`.github/workflows/web-checks.yml`](.github/workflows/web-checks.yml). Browser navigation tests and capture scripts are in `web/scripts/` and install Playwright separately. The [capture gallery](docs/SCREENSHOT_GALLERY_CURRENT.md) documents the screenshot source, viewport and commit instead of relying on mockups.

## Project layout

```text
PromisePulse/
├── .github/workflows/         # Web build, data verification and browser QA
├── docs/
│   ├── ARCHITECTURE_V5.md     # Editable flow, ER and sequence diagrams
│   ├── architecture.svg       # Standalone overview diagram
│   ├── DEPLOYMENT.md          # Vercel and local deployment instructions
│   ├── SCREENSHOT_GALLERY_CURRENT.md
│   ├── SYLLABUS_V5.md         # Method mapping and empirical caveats
│   ├── RESEARCH_REPRODUCIBILITY.md
│   └── screenshots/
│       ├── current/           # Current browser screenshots and provenance
│       └── v3/, v4/, v5/     # Archived verified release captures
├── scripts/
│   ├── build_web_data.py      # Raw sources → warehouse → Parquet/manifest
│   ├── train_risk.py          # Chronological evaluation
│   ├── build_mining_lab.py    # Offline experimental methods
│   ├── verify_export.py
│   └── verify_mining_lab.py
├── tests/                     # Data, query, UX and export regression checks
├── web/
│   ├── public/data/           # Shipped Parquet and JSON; public on Vercel
│   ├── scripts/               # Actual Chromium browser/capture checks
│   ├── src/
│   │   ├── App.tsx            # Shell, navigation and original workspaces
│   │   ├── db.ts              # DuckDB-Wasm and SELECT-only query API
│   │   ├── Premium.tsx        # Overview / Intelligence / historical state map
│   │   ├── AnalyticsAtlas.tsx # Chart rendering and data exploration
│   │   ├── ResearchWorkspace.tsx
│   │   ├── SyllabusHub.tsx    # Single-click Data Mining Lab overview
│   │   ├── SyllabusLab.tsx    # Six analysis areas and clickable tabs
│   │   └── editorial.css      # Current readable typography refinements
│   ├── package.json
│   └── vite.config.ts
├── requirements-export.txt
└── LICENSE
```

## Credit and license

PromisePulse builds on concepts from [Christopher Dougherty's `olist-sales-analytics-pipeline`](https://github.com/credough/olist-sales-analytics-pipeline), with a separate React + DuckDB-Wasm frontend, read-only OLAP exploration, chronological risk evaluation, quality reporting and the current research/mining lab additions.

- **Source code:** [MIT License](LICENSE).
- **Historical dataset:** Olist's [Brazilian E-Commerce Public Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce), **CC BY-NC-SA 4.0**.
- **Additional dependencies and licenses:** [Third-party notices](docs/THIRD_PARTY_NOTICES.md).

No live-delivery, real-time inference, scientific novelty, independent peer review or guaranteed prediction accuracy is asserted by these screenshots or this documentation.
