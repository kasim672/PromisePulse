# PromisePulse 5.0 — Architecture and data flow

This document describes the **current merged `main` source release**: PromisePulse 5.0's historical analytics, six mining lab sections, five teaching visualizers, soft-cyan **`#7DD3FC`** light/dark UI, and the optional website-wide Gemini research assistant. AI generation is an additional server-side function; it is not a replacement for the in-browser SQL architecture.

![PromisePulse 5.0 system architecture](architecture.svg)

The app has **three separate execution boundaries**: offline Python/DuckDB data preparation; a static React website running analytical SQL locally in DuckDB-Wasm; and an optional `/api/ask` serverless Gemini gateway for the research chat. The public dataset is historical and the gateway is neither a hosted analytical SQL engine nor a live logistics service.

## 1. End-to-end architecture

```mermaid
flowchart LR
    subgraph OFF["Offline build: Python, DuckDB, scikit-learn"]
        CSV["Eight Olist CSVs (2016–2018)"] --> ETL["ETL + data-quality checks"]
        ETL --> ML["Optional chronological model evaluation"]
        ETL --> MIN["Offline data-mining experiments"]
    end

    subgraph STATIC["Published, publicly downloadable assets"]
        PAR["Six Parquet warehouse tables"]
        RISK["risk_predictions.parquet"]
        JSON["manifest.json + mining_lab.json"]
        WEB["Compiled React/Vite site"]
    end

    subgraph CLIENT["Visitor browser: no server-side SQL"]
        UI["React dashboard + six mining labs"]
        DB["DuckDB-Wasm Web Worker"]
        CHARTS["Historical charts, OLAP, CSV"]
        UI --> DB --> CHARTS --> UI
        JSON --> UI
        PAR --> DB
        RISK --> DB
    end

    subgraph AI["Optional private Vercel Function"]
        API["POST /api/ask"]
        INDEX["Reviewed docs + aggregate evidence index"]
        LLM["Google Gemini"]
        API --> INDEX --> LLM
    end

    ETL --> PAR
    ETL --> JSON
    ML --> RISK
    MIN --> JSON
    WEB --> UI
    UI -. "questions (not SQL)" .-> API
    LLM -. "generated answer + source links" .-> UI
```

**Hosting:** Vercel serves static `web/dist` build outputs and published data over HTTPS and deploys `web/api/ask.js` as a separate function. The browser runs analytical SQL against its own DuckDB-Wasm views; Vercel never acts as a warehouse query service. The AI function reads the private Gemini key and its indexed documentary evidence and does not access individual Parquet rows. A GitHub merge is not proof that the corresponding Vercel deployment is Ready.

### Important execution boundaries

- Offline training/experiment outputs are generated ahead of time. Interactive chart controls query the static warehouse in the browser; they do not retrain models.
- The visible AI Evidence Assistant is a deterministic explanation of published evaluation data, not a generative chatbot.
- Some Data Lakes and dimensional alternatives in the teaching lab are **conceptual views**, not separate cloud infrastructure.
- The map visualizes historic order aggregates by Brazilian state. It does not show live vehicle coordinates or customer addresses.
- All shipped `web/public/data` assets are **publicly downloadable**. Do not place credentials or sensitive customer information there.

### Integrated Gemini research assistant: separate trust boundary

The website-wide research assistant is **already part of `main`**, introduced through [PR #18](https://github.com/kasim672/PromisePulse/pull/18) and refined by [PR #19](https://github.com/kasim672/PromisePulse/pull/19). Unlike the deterministic **AI Studio** analytics panels, it can produce generative replies if the Google API is configured.

```mermaid
sequenceDiagram
    actor Visitor
    participant React as React chat drawer
    participant API as Vercel /api/ask (or local Node)
    participant Index as Server-side docs and aggregates
    participant Gemini as Google Gemini API

    Visitor->>React: Ask a question
    React->>API: POST question + bounded user-question history
    API->>API: Validate JSON, origin, length, rate limit
    API->>Index: Retrieve up to six relevant project passages
    alt Valid API key and Gemini available
        Index-->>API: Grounded excerpts + document links
        API->>Gemini: Question + selected excerpts (private key)
        Gemini-->>API: Generated response
        API-->>React: Answer + related source links
    else Key missing / Gemini unavailable
        Index-->>API: Reviewed snippets when relevant
        API-->>React: Labeled reference answer or setup error
    end
    React-->>Visitor: Display response and citations
```

The generator `web/scripts/build-assistant-index.mjs` reads checked-in docs, the historical warehouse `manifest.json` and **selected aggregate** `mining_lab.json` results. It runs automatically before local development and production builds. `web/api/_retrieval.mjs` searches the server-side index and forwards a bounded subset to Gemini; neither arbitrary visitor URLs nor every Parquet row are indexed. A model might answer general conversation without project citations; project-specific numerical claims should be checked against their links. This is not a live code repository browser or arbitrary SQL execution service.

**Local path:** `npm run dev` starts a loopback-only Node adapter (`127.0.0.1:8787`) and Vite (`127.0.0.1:5173`), with an explicit `vite.config.ts` proxy. **Production path:** Vercel routes `/api/ask` to the serverless handler and reads `GEMINI_API_KEY` from private project settings. Without a key, the analytics site still operates and the assistant shows labeled excerpts for documented questions. Questions and selected excerpts are sent to Google when generation succeeds, so apply privacy, spending and abuse controls. Read [AI configuration and limitations](GEMINI_RESEARCH_ASSISTANT.md).

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

### In-browser algorithm teaching and loading states

The new visualizer is **separate from the published Olist experiment export**. It computes deterministic examples in memory and does not change the dataset, retrain the original scikit-learn models, or insert new tables into DuckDB.

```mermaid
flowchart LR
  Click["Visitor selects a step"] --> Demo["AlgorithmPlayground.tsx"]
  Demo --> Math["algorithmSteps.ts: sample-only calculations"]
  Math --> Scene["SVG scene and accessible explanation"]
  Olist["mining_lab.json: published experiment metrics"] --> Existing["Existing empirical panels"]
  Scene -. "No data mutation" .-> Existing
```

The K-Means demonstrator recalculates squared Euclidean distances and arithmetic means of six visible points; Decision Tree follows two displayed example rules; Apriori, FP-Growth, and Eclat use the **same five illustrative baskets**, allowing support and TID intersections to be checked by hand. Their five-basket denominator must never be conflated with the real **649 eligible Olist baskets**.

The browser's `loadWarehouse` reports actual loading stages via `WarehouseProgress`: manifest fetch, DuckDB-Wasm initialization, then how many required Parquet tables have been registered. It deliberately does **not** display a fictional overall completion percentage; individual SQL and mining JSON requests have unknown durations. An abort signal prevents stale fetch results from updating a navigated-away view, and failures expose **Retry loading data**. Measured data is never replaced by illustrative examples.

```mermaid
stateDiagram-v2
  [*] --> Manifest
  Manifest --> WebAssembly: manifest parsed
  WebAssembly --> Parquet: DuckDB-Wasm initialized
  Parquet --> Parquet: registered N of total tables
  Parquet --> Ready: all views created
  Manifest --> Error: network or format failure
  WebAssembly --> Error: engine startup fails
  Parquet --> Error: file or SQL failure
  Error --> Manifest: user selects Retry
```

See [the full worked algorithm examples](ALGORITHM_PLAYGROUND.md) and [the current screenshot gallery](SCREENSHOT_GALLERY_CURRENT.md).

### Presentation-layer theme and file responsibilities

```mermaid
flowchart TD
   Entry["main.tsx"] --> Measured["measured-glass.css"]
   Measured --> Mode["theme.css — light/dark values"]
   Mode --> Editorial["editorial.css — typography"]
   Editorial --> Teaching["algorithm-playground.css — five method demos"]
   Teaching --> Cyan["soft-cyan.css — #7DD3FC final overrides"]
   Cyan --> Welcome["Welcome, cards and CTAs"]
   Cyan --> Atlas["Atlas chart interactions and Brazil selection"]
   Cyan --> Lab["Mining lab and algorithm controls"]
   Data["web/public/data/*.parquet, mining_lab.json"] --> Core["DuckDB-Wasm SQL and offline experiment displays"]
   Welcome --> Core
   Atlas --> Core
   Lab --> Core
```

The source of truth for the brand color is `--pp-accent-cyan: #7DD3FC`. The light-background text alternative is `#0369A1`, while dark navy `#082F49` provides readable text on bright cyan selections. The previous CSS names containing “lime” or “green” remain **compatibility aliases**, not evidence of green rendering. The original purple lettering is kept; the brand logo uses a targeted green-pixel recolor filter and the favicon uses `web/public/favicon-cyan.svg`.

The color system is documented in [THEME_SYSTEM.md](THEME_SYSTEM.md). Screenshots in [SCREENSHOT_GALLERY_CURRENT.md](SCREENSHOT_GALLERY_CURRENT.md) are captured from the actual source app, not from a simulated graphic or a promised Vercel deployment.

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
| `web/src/algorithmSteps.ts`, `web/src/AlgorithmPlayground.tsx` | Computed, labeled teaching-step visualizations (not empirical training traces) |
| `web/src/DataStates.tsx` | Real progress stages, accessible query loading and retryable errors |
| `web/public/data/` | Static historical analytical data; do not publish secrets |
| `web/src/ProjectAssistant.tsx`, `web/src/project-assistant.css` | Chat drawer, citations, light/dark presentation |
| `web/api/ask.js`, `web/api/_retrieval.mjs` | Server-side Gemini gateway, bounded source retrieval and fallback |
| `web/api/_site-index.mjs`, `web/scripts/build-assistant-index.mjs` | Generated source-evidence index and build-time refresh |
| `web/scripts/local-gemini-server.mjs`, `web/scripts/dev.mjs` | Loopback-only local API and Vite startup |
| `web/src/editorial.css` | Readable typography and de-emphasis of decorative microcopy |
| `web/src/theme.css`, `web/src/soft-cyan.css` | Light/dark theme, cyan tokens and contrast-safe overrides |
| `web/public/favicon-cyan.svg` | Soft-cyan product favicon, preserving fallback icon |
| `docs/screenshots/current/` | Current-release browser captures (see manifest) |

See [Deployment](DEPLOYMENT.md) for the actual public Vercel setup and build commands.
