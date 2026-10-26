# PromisePulse 5.0 — Architecture and data flow

This document describes the **current `main` release**, including the editorial typography cleanup. It does not describe the abandoned V6 proposal.

![PromisePulse 5.0 system architecture](architecture.svg)

The app has two separate execution environments: an **offline Python/DuckDB exporter** (used to generate the public analytical files) and a **static React web application** (used to explore those files in each visitor's browser). It is **not** a hosted live database, real-time logistics tracking system, or cloud ML service.

## 1. End-to-end architecture

```mermaid
flowchart LR
    subgraph OFF["Offline build — Python / DuckDB / scikit-learn"]
        CSV["Olist CSV sources (8 files)"]
        ETL["build_web_data.py — ETL and dimensional modeling"]
        ML["Optional --train — chronological delivery-risk evaluation"]
        MINE["build_mining_lab.py — offline mining experiments"]
        CSV --> ETL
        ETL --> ML
        ETL --> MINE
    end

    subgraph PUB["Versioned static assets — web/public/data"]
        PAR["6 Parquet tables"]
        RISK["risk_predictions.parquet — if evaluated"]
        META["manifest.json"]
        LAB["mining_lab.json"]
    end

    subgraph WEB["Visitor browser — static Vite/React build"]
        UI["React workspaces + Data Mining Lab"]
        LOADER["db.ts — fetch, register Parquet and create read-only views"]
        WASM["DuckDB-Wasm running in browser Web Worker"]
        VIEW["Historical SQL aggregates, charts, tables, CSV exports"]
        UI --> LOADER --> WASM --> VIEW --> UI
        LAB --> UI
    end

    ETL --> PAR
    ETL --> META
    ML --> RISK
    MINE --> LAB
    PAR --> LOADER
    RISK --> LOADER
    META --> LOADER
```

**Hosting:** Vercel serves the compiled `web/dist/` files and static datasets over HTTPS. After these files are downloaded, DuckDB SQL runs **client-side**; Vercel does not execute Python ETL jobs or handle analytics queries.

### Important execution boundaries

- Offline training/experiment outputs are generated ahead of time. Interactive chart controls query the static warehouse in the browser; they do not retrain models.
- The visible AI Evidence Assistant is a deterministic explanation of published evaluation data, not a generative chatbot.
- Some Data Lakes and dimensional alternatives in the teaching lab are **conceptual views**, not separate cloud infrastructure.
- The map visualizes historic order aggregates by Brazilian state. It does not show live vehicle coordinates or customer addresses.
- All shipped `web/public/data` assets are **publicly downloadable**. Do not place credentials or sensitive customer information there.

## 2. Offline export and verification

```mermaid
flowchart TD
    A["Eight Olist CSV source files"] --> B["DuckDB raw staging"]
    B --> C["Dimension tables: customer, product, seller, date"]
    B --> D["Order fact: fact_orders"]
    B --> E["Item fact: fact_order_items"]
    C --> F["CSV-to-Parquet export"]
    D --> F
    E --> F
    B --> G["Reconciliation and missingness checks"]
    G --> H["manifest.json + verify_export.py"]
    D --> I["Chronological model train / validation / test (optional)"]
    I --> J["risk_predictions.parquet + held-out metrics"]
    F --> K["build_mining_lab.py"]
    K --> L["Clustering, classification comparisons and frequent patterns"]
    L --> M["mining_lab.json + verify_mining_lab.py"]
```

`scripts/build_web_data.py` writes six Parquet warehouse tables and `manifest.json`; passing `--train` additionally evaluates and exports the model's held-out predictions. The independent `scripts/build_mining_lab.py` reads the local exported Parquet and produces the source-backed mining lab JSON. `scripts/verify_export.py` and `scripts/verify_mining_lab.py` check the generated artifacts. The raw Olist CSVs are **not** part of the published website.

The manifest in this revision reports an export timestamp of **2026-10-13T02:24:01Z**; it is **not** a real-time update timestamp.

## 3. Dimensional warehouse: two distinct fact grains

```mermaid
erDiagram
    DIM_CUSTOMER ||--o{ FACT_ORDERS : identifies
    DIM_DATE ||--o{ FACT_ORDERS : purchased_on
    DIM_PRODUCT ||--o{ FACT_ORDER_ITEMS : contains
    DIM_SELLER ||--o{ FACT_ORDER_ITEMS : sold_by
    FACT_ORDERS ||--|{ FACT_ORDER_ITEMS : has_items

    DIM_CUSTOMER {
        string customer_id PK
        string customer_state
    }
    DIM_DATE {
        date date_key PK
    }
    DIM_PRODUCT {
        string product_id PK
        string product_category
    }
    DIM_SELLER {
        string seller_id PK
        string seller_state
    }
    FACT_ORDERS {
        string order_id PK
        string customer_id FK
        decimal payment_value
        datetime purchase_ts
    }
    FACT_ORDER_ITEMS {
        string order_id FK
        int order_item_id
        string product_id FK
        string seller_id FK
        decimal item_price
        decimal freight_value
    }
```

The ER diagram is *conceptual*: it illustrates the two-grain relationship, not an exact copy of every exported column or every physical foreign-key constraint. Inspect the actual Parquet files or Data Catalog for exact schemas.

| Published table | Grain | Rows reported by manifest |
| --- | --- | ---: |
| `dim_customer` | Customer source record | 99,441 |
| `dim_product` | Product | 32,951 |
| `dim_seller` | Seller | 3,095 |
| `dim_date` | Calendar date | 774 |
| `fact_orders` | Order | 99,441 |
| `fact_order_items` | Order item | 112,650 |
| `risk_predictions` | Evaluated held-out prediction | 19,294 |

**Do not sum order-level payments after joining to multiple item rows.** The order fact and item fact must be aggregated at the proper grain first. The manifest records **zero payment/item reconciliation delta cents** for this export and **2,971 unlabeled orders**. An order's delivery-risk label is not known for every record.

## 4. Browser runtime and navigation

```mermaid
sequenceDiagram
    participant V as Visitor
    participant C as Vercel static CDN
    participant R as React application
    participant W as DuckDB-Wasm / Worker

    V->>C: GET compiled index.html / CSS / JavaScript
    C-->>V: Static application shell
    R->>C: GET manifest.json and Parquet files
    C-->>R: Versioned historical exports
    R->>W: Initialize engine, register files, create SQL views
    V->>R: Select workspace, period, state or chart
    R->>W: Read-only SELECT / WITH query
    W-->>R: Aggregated rows
    R-->>V: Interactive chart, table or CSV export
    V->>R: Open Data Mining Lab
    R->>C: GET mining_lab.json
    C-->>R: Previously computed experimental results
    R-->>V: Six method sections and recorded plots
```

There are **12 original workspaces**, plus one **Data Mining Lab overview** and **six lab analysis pages**. The navigation dock has *one* graduation-cap button for the lab, **not six extra dock icons or a flyout menu**. Clicking it opens the lab overview; the six pages are accessed through overview cards and clickable in-page tabs.

The 66 registered Atlas/research chart definitions are **36 Analytics Atlas + 30 Research** charts. The Data Mining Lab adds supplementary experimental plots; do not treat those as part of the original 66 count.

## 5. Historical model and mining-sample limits

The published manifest's delivery-risk model was evaluated on **19,294** time-held-out prediction rows. Its positive-class precision at the published 0.60 threshold is about **0.049**, with recall about **0.288**. These are weak results; no production predictive capability is claimed. The separate syllabus classification module uses an independently exported experimental test cohort and should not be conflated with these 19,294 rows.

The syllabus mining export uses **950** sampled customer RFM vectors and at most **52** Ward-dendrogram records; its frequent-pattern dataset contains **649** eligible multi-category baskets. Support denominators apply to that selected basket population, not the full order table. See [SYLLABUS_V5.md](SYLLABUS_V5.md) and [RESEARCH_REPRODUCIBILITY.md](RESEARCH_REPRODUCIBILITY.md).

## 6. Code ownership and entry points

| File / folder | Role |
| --- | --- |
| `scripts/build_web_data.py` | Offline ETL, warehouse export and optional model evaluation |
| `scripts/train_risk.py` | Risk modeling/evaluation implementation |
| `scripts/build_mining_lab.py` | Offline six-area mining experiment export |
| `scripts/verify_export.py`, `scripts/verify_mining_lab.py` | Reproducibility/integrity checks |
| `web/src/db.ts` | Browser DuckDB-Wasm initialization and read-only query wrapper |
| `web/src/App.tsx` | Application shell, routing state and native analysis workspaces |
| `web/src/AnalyticsAtlas.tsx`, `web/src/ResearchWorkspace.tsx` | Charting and research analyses |
| `web/src/SyllabusHub.tsx`, `web/src/SyllabusLab.tsx` | Mining overview and six lab screens |
| `web/public/data/` | Static historical analytical data; do not publish secrets |
| `web/src/editorial.css` | Current heading hierarchy and de-emphasis of decorative microcopy |
| `docs/screenshots/current/` | Current-release browser captures (see manifest) |

See [Deployment](DEPLOYMENT.md) for the actual public Vercel setup and build commands.
