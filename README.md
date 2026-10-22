# PromisePulse — E-Commerce Intelligence & Delivery Risk Analytics

<div align="center">
  <img src="web/public/promisepulse-logo.webp" alt="PromisePulse Logo" width="380" />
  <p><strong>Enterprise-grade Data Warehousing, In-Browser OLAP Analytics & Historical Delivery Risk Mining</strong></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Dataset: Kaggle Olist](https://img.shields.io/badge/Dataset-Olist%20E--Commerce-orange.svg)](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)
  [![Engine: DuckDB / DuckDB--Wasm](https://img.shields.io/badge/Engine-DuckDB%20%7C%20DuckDB--Wasm-yellow.svg)](https://duckdb.org/)
  [![Frontend: React + Vite + TypeScript](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript-61dafb.svg)](https://react.dev/)
  [![ML: scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E.svg)](https://scikit-learn.org/)

  [Key Features](#key-features) • [System Architecture](#system-architecture) • [Dimensional Warehouse](#dimensional-warehouse) • [OLAP Operations](#olap-operations) • [Data Mining Methodology](#data-mining-methodology) • [Dashboard Gallery](#dashboard-gallery) • [Academic Relevance](#academic-relevance) • [Installation & Setup](#installation-and-setup)
</div>

---

### Executive Overview

**PromisePulse** bridges the divide between offline dimensional data warehousing and modern client-side analytical exploration. Built upon the comprehensive [Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) (100k orders spanning 2016–2018), PromisePulse models raw transactional logs into an audited **Star Schema**, applies leak-free **chronological classification** to evaluate order-placement delivery risk, and delivers interactive multi-dimensional **SQL OLAP operations directly inside the browser using DuckDB-Wasm and Parquet**.

Unlike traditional analytics dashboards that rely on heavy server fleets or compute pre-aggregated static numbers, PromisePulse executes real SQL queries—including `ROLLUP`, slicing, dicing, and pivoting—entirely in the user's browser without contacting a remote database server.

---

## Hero Dashboard

<div align="center">
  <img src="docs/screenshots/overview.png" alt="PromisePulse Overview Dashboard" width="100%" />
  <p><em>Figure 1: PromisePulse Executive Overview Dashboard rendering live KPIs, monthly payment revenue curves, category breakdowns, and geographic footprint from 99,441 verified order facts using browser-embedded DuckDB-Wasm.</em></p>
</div>

---

## Project Overview

Modern e-commerce enterprises face two foundational data challenges:
1. **Financial Discrepancies & Grain Confusion**: Orders frequently contain multiple items, each with varying prices, shipping fees, sellers, and product categories. Naively joining items and summing revenue produces severe multi-counting errors.
2. **Post-Purchase Delivery Friction**: Customer satisfaction deteriorates when delivery expectations are breached. Predicting late deliveries at purchase time enables proactive intervention, but models frequently suffer from catastrophic target leakage (e.g., using shipping timestamps or transit logs not yet available at checkout).

### Why the Olist E-Commerce Dataset?
The Brazilian E-Commerce Public Dataset provided by Olist contains 100,000 real anonymized orders from marketplaces across Brazil. Its multi-table relational structure (orders, order items, payments, reviews, customers, sellers, products, geolocation) mirrors real-world production complexities:
- Highly skewed geographical distribution across 27 federative units.
- Non-trivial fulfillment delays caused by continental logistics across Brazil.
- One-to-many relationships between orders, items, and payment installments.

### How PromisePulse Combines Warehousing and Mining
* **Data Warehousing Foundation**: Transforms 8 normalized transactional CSV files into an immutable Star Schema consisting of two distinct fact tables (`fact_orders` and `fact_order_items`) and four conformed dimension tables (`dim_customer`, `dim_product`, `dim_seller`, `dim_date`).
* **Predictive Data Mining**: Implements a chronologically bounded classification pipeline using `scikit-learn`. The model predicts delivery risk strictly using features known at checkout (purchase calendar attributes, destination state, item volume, basket value, freight ratio, and promised fulfillment window), tuned on a dedicated validation window and evaluated against out-of-sample test orders.
* **Serverless Analytical Interface**: Exports verified dimensional tables to Apache Parquet files, allowing a zero-backend React Single-Page Application (SPA) to instantiate an in-memory DuckDB-Wasm database engine directly within the client's browser thread.

---

## Key Features

* **Executive Performance Overview**: Real-time evaluation of aggregate order volume (99,441 facts), total payment revenue (R$ 16.01M), average basket size (R$ 160.99), and empirical late delivery rate (6.8%).
* **Interactive In-Browser OLAP Lab**: First-class support for multi-dimensional operations (`ROLLUP`, Drill-down, Slice, Dice, and Pivot) executing standard SQL in milliseconds via WebAssembly.
* **Predictive Delivery-Risk Investigation**: Interactive triage center featuring adjustable probability decision thresholds, dynamic client-side confusion matrix recalculation, and CSV investigation export.
* **Audited Data Catalog**: Comprehensive provenance documentation detailing source CSV bytes and record counts, table grain definitions, and interactive live SQL table previews.
* **Automated Data Quality & Reconciliation**: Strict zero-tolerance assertions guaranteeing primary key uniqueness, referential foreign-key completeness, and exact penny-level revenue reconciliation.
* **Responsive Modern Luxury Interface**: Clean design language built with CSS custom properties, accessible contrast ratios, full mobile drawer navigation, and zero third-party UI framework bloat.

---

## Dashboard Gallery

| View | Screenshot | Description |
| :--- | :--- | :--- |
| **Interactive OLAP Lab (`ROLLUP`)** | [![OLAP Roll-up](docs/screenshots/olap-rollup.png)](docs/screenshots/olap-rollup.png) | Multidimensional hierarchical aggregation computing customer state and monthly sub-totals via SQL `GROUP BY ROLLUP`. |
| **Historical Risk Investigation** | [![Risk Center](docs/screenshots/risk-center.png)](docs/screenshots/risk-center.png) | Historical model triage queue displaying validation-selected decision thresholds, precision/recall curves, and risk-ranked orders. |
| **Data Catalog & Grain Explorer** | [![Data Catalog](docs/screenshots/data-catalog.png)](docs/screenshots/data-catalog.png) | Provenance catalog showing raw file counts, license terms, dimensional schema definitions, and live SQL table inspection. |
| **Data Quality & Reconciliation** | [![Data Quality](docs/screenshots/data-quality.png)](docs/screenshots/data-quality.png) | Pipeline lineage diagram, warehouse record metrics, and mathematical balance checks validating zero grain inflation. |
| **Revenue & Sales Analytics** | [![Revenue Analytics](docs/screenshots/revenue-analytics.png)](docs/screenshots/revenue-analytics.png) | SVG area charts depicting seasonal payment velocity and category bar distributions across Olist product lines. |
| **Mobile Responsive Layout** | [![Mobile Layout](docs/screenshots/mobile-overview.png)](docs/screenshots/mobile-overview.png) | Fully responsive adaptive layout with collapsible navigation drawer for mobile and tablet inspection. |

---

## System Architecture

PromisePulse enforces a strict separation between **offline compute** (heavy data extraction, cleansing, dimensional modeling, and model training) and **client-side analytical presentation** (zero-latency SQL querying and visualization).

<div align="center">
  <img src="docs/screenshots/architecture.png" alt="PromisePulse Architecture Diagram" width="85%" />
  <p><em>Figure 2: End-to-end architecture diagram detailing the offline DuckDB + scikit-learn pipeline and the zero-server browser DuckDB-Wasm runtime.</em></p>
</div>

<details>
<summary><strong>View Mermaid Architecture Source</strong></summary>

```mermaid
flowchart TB
    subgraph Offline_Pipeline["Offline Data Engineering & Mining (Python & DuckDB)"]
        direction TB
        CSV["Original Kaggle Olist CSV Files<br/>(8 Relational Files · 99k Orders)"]
        ETL["Python DuckDB ETL<br/>scripts/build_web_data.py"]
        DW[("Local Dimensional Warehouse<br/>warehouse/promisepulse.duckdb")]
        ML["Chronological Mining Pipeline<br/>scripts/train_risk.py (scikit-learn)"]
        EXPORTS["Optimized Parquet Assets & Manifest<br/>web/public/data/*.parquet"]

        CSV --> ETL
        ETL --> DW
        DW --> ML
        DW --> EXPORTS
        ML --> EXPORTS
    end

    subgraph Browser_Runtime["Browser Client Runtime (React 18 + DuckDB-Wasm)"]
        direction TB
        FETCH["HTTP Range Fetch / In-Memory Buffer"]
        WASM[("DuckDB-Wasm Engine<br/>Client-Side WebAssembly SQL")]
        APP["React + TypeScript SPA<br/>App Shell & Visual Analytics"]
        UI_OVERVIEW["Overview & Revenue Trends"]
        UI_OLAP["OLAP Lab (ROLLUP / Slice / Dice)"]
        UI_RISK["Risk Center & Triage Queue"]
        UI_CATALOG["Catalog & Data Quality Checks"]

        EXPORTS -.->|Static Delivery| FETCH
        FETCH --> WASM
        WASM <--> APP
        APP --> UI_OVERVIEW
        APP --> UI_OLAP
        APP --> UI_RISK
        APP --> UI_CATALOG
    end
```
</details>

---

## Dimensional Warehouse

The analytical backbone of PromisePulse is a conformed **Star Schema** designed to eliminate fan-out errors and support rapid OLAP aggregations.

### Schema Entity-Relationship Diagram

<div align="center">
  <img src="docs/screenshots/warehouse-er-schema.png" alt="Warehouse Entity-Relationship Diagram" width="85%" />
  <p><em>Figure 3: Conformed Star Schema dimensional model with fact_orders, fact_order_items, and four dimension tables.</em></p>
</div>

<details>
<summary><strong>View Mermaid Schema ER Source</strong></summary>

```mermaid
erDiagram
    dim_customer ||--o{ fact_orders : places
    dim_date ||--o{ fact_orders : timestamps
    fact_orders ||--|{ fact_order_items : contains
    dim_product ||--o{ fact_order_items : classifies
    dim_seller ||--o{ fact_order_items : fulfills
    fact_orders ||--o| risk_predictions : evaluates

    fact_orders {
        VARCHAR order_id PK
        VARCHAR customer_id FK
        VARCHAR order_status
        TIMESTAMP purchase_ts
        DATE purchase_date FK
        TIMESTAMP estimated_delivery_ts
        TIMESTAMP delivered_ts
        DATE delivered_date
        INTEGER item_count
        DOUBLE item_total
        DOUBLE freight_total
        DOUBLE payment_total
        DOUBLE review_score
        BOOLEAN is_late
    }

    fact_order_items {
        VARCHAR order_id FK
        INTEGER order_item_id PK
        VARCHAR product_id FK
        VARCHAR seller_id FK
        DOUBLE price
        DOUBLE freight_value
    }

    dim_customer {
        VARCHAR customer_id PK
        VARCHAR customer_unique_id
        VARCHAR customer_city
        VARCHAR customer_state
    }

    dim_product {
        VARCHAR product_id PK
        VARCHAR category
        DOUBLE weight_g
    }

    dim_seller {
        VARCHAR seller_id PK
        VARCHAR seller_city
        VARCHAR seller_state
    }

    dim_date {
        DATE date_day PK
        INTEGER year
        INTEGER quarter
        INTEGER month
        VARCHAR year_month
    }

    risk_predictions {
        VARCHAR order_id PK
        TIMESTAMP purchase_ts
        VARCHAR customer_state
        DOUBLE order_value
        TIMESTAMP estimated_delivery_ts
        INTEGER actual_late
        DOUBLE risk_probability
        INTEGER predicted_risk
        VARCHAR risk_band
    }
```
</details>

### Table Grains and Architectural Rationale

| Table Name | Entity Role | Primary Grain | Total Rows | Description & Key Columns |
| :--- | :--- | :--- | :--- | :--- |
| `fact_orders` | Accumulating Fact | 1 row per `order_id` | **99,441** | Order-level monetary totals (`payment_total`), item aggregates, customer FK, purchase date FK, delivery timestamps, and boolean `is_late` label. |
| `fact_order_items` | Transactional Fact | 1 row per `(order_id, order_item_id)` | **112,650** | Item price and freight allocation, product FK (`product_id`), seller FK (`seller_id`). |
| `dim_customer` | Conformed Dimension | 1 row per `customer_id` | **99,441** | Maps order customer tokens to persistent individuals (`customer_unique_id`, 96,096 distinct individuals), customer cities, and customer states. |
| `dim_product` | Conformed Dimension | 1 row per `product_id` | **32,951** | Product physical characteristics and translated English categories (e.g., `bed_bath_table`, `health_beauty`). |
| `dim_seller` | Conformed Dimension | 1 row per `seller_id` | **3,095** | Seller marketplace accounts and originating geographic states. |
| `dim_date` | Conformed Dimension | 1 row per calendar day | **774** | Complete calendar spanning 2016-09-04 to 2018-10-17 with year, quarter, month, and `year_month` formatting. |
| `risk_predictions` | Analytical Fact | 1 row per out-of-sample order | **19,294** | Held-out test period predictions containing predicted risk probabilities, binary flags, and actual late delivery outcomes. |

#### Preventing Revenue Double-Counting
In e-commerce reporting, an order with 3 items totaling R$ 150 paid in 1 transaction will produce 3 rows in `order_items` and 1 row in `order_payments`. Joining raw items directly with payments creates cartesian fan-out, inflating total revenue threefold (to R$ 450). 

PromisePulse resolves this by:
1. Aggregating payments independently per `order_id` inside `fact_orders.payment_total`.
2. Aggregating item prices independently inside `fact_orders.item_total` and allocating line items to `fact_order_items.price`.
3. Validating that `payment_total_delta_cents = 0` and `item_sales_delta_cents = 0` during data reconciliation.

---

## OLAP Operations

The **OLAP Lab** allows users to explore the multidimensional cube through standardized analytical operations. Every query executes live against the browser's DuckDB-Wasm engine.

### 1. Roll-Up (Hierarchical Aggregation)
* **Objective**: Summarize metrics by climbing up the geographic and temporal hierarchies, producing state-level subtotals and grand totals using SQL-standard `GROUP BY ROLLUP`.
* **Executable SQL Query**:
```sql
SELECT 
    CASE WHEN GROUPING(c.customer_state) = 1 THEN 'ALL STATES' 
         ELSE COALESCE(c.customer_state, 'Unknown') END AS state,
    CASE WHEN GROUPING(d.year_month) = 1 THEN 'ALL MONTHS' 
         ELSE d.year_month END AS month,
    COUNT(*) AS orders,
    ROUND(SUM(o.payment_total), 2) AS payment_revenue
FROM fact_orders o
JOIN dim_customer c USING (customer_id)
JOIN dim_date d ON o.purchase_date = d.date_day
WHERE o.purchase_date BETWEEN DATE '2016-01-01' AND DATE '2018-12-31'
GROUP BY ROLLUP(c.customer_state, d.year_month)
ORDER BY state, month
LIMIT 100;
```
* **Analytical Insight**: Enables management to observe revenue contributions per state across time while simultaneously receiving aggregated totals for executive reporting without secondary query passes.

### 2. Drill-Down (Navigating to Greater Detail)
* **Objective**: Deconstruct high-level regional performance into lower-level temporal grains (e.g., examining monthly breakdowns specifically for São Paulo `SP`).
* **Executable SQL Query**:
```sql
SELECT 
    c.customer_state AS state,
    d.year_month AS month,
    COUNT(*) AS orders,
    ROUND(SUM(o.payment_total), 2) AS payment_revenue
FROM fact_orders o
JOIN dim_customer c USING (customer_id)
JOIN dim_date d ON o.purchase_date = d.date_day
WHERE o.purchase_date BETWEEN DATE '2016-01-01' AND DATE '2018-12-31'
  AND c.customer_state = 'SP'
GROUP BY 1, 2
ORDER BY 2;
```
* **Analytical Insight**: Reveals monthly growth trajectories within the platform's primary market (SP accounted for >40,000 orders), isolating demand spikes during promotional periods (e.g., Black Friday in November 2017).

### 3. Slice (Fixing One Dimension)
* **Objective**: Select a 2D rectangular sub-slice of the data cube by fixing the geographic dimension (`customer_state = 'SP'`) and examining fulfillment status distributions.
* **Executable SQL Query**:
```sql
SELECT 
    c.customer_state AS state,
    o.order_status AS status,
    COUNT(*) AS orders,
    ROUND(SUM(o.payment_total), 2) AS payment_revenue,
    ROUND(100.0 * COUNT(*) FILTER (WHERE o.is_late = true) / NULLIF(COUNT(o.is_late), 0), 2) AS late_pct
FROM fact_orders o
JOIN dim_customer c USING (customer_id)
WHERE o.purchase_date BETWEEN DATE '2016-01-01' AND DATE '2018-12-31'
  AND c.customer_state = 'SP'
GROUP BY 1, 2
ORDER BY orders DESC;
```
* **Analytical Insight**: Shows that while São Paulo achieves high delivery completion rates (40,501 delivered orders), its late delivery rate remains controlled at 4.49%, significantly lower than remote territories.

### 4. Dice (Sub-Cube Selection)
* **Objective**: Filter across multiple dimensions simultaneously (specifying states `SP` and `RJ` and restricting order statuses to `delivered`, `shipped`, `canceled`).
* **Executable SQL Query**:
```sql
SELECT 
    c.customer_state AS state,
    o.order_status AS status,
    COUNT(*) AS orders,
    ROUND(SUM(o.payment_total), 2) AS payment_revenue
FROM fact_orders o
JOIN dim_customer c USING (customer_id)
WHERE o.purchase_date BETWEEN DATE '2016-01-01' AND DATE '2018-12-31'
  AND c.customer_state IN ('SP', 'RJ')
  AND o.order_status IN ('delivered', 'shipped', 'canceled')
GROUP BY 1, 2
ORDER BY 1, 2;
```
* **Analytical Insight**: Enables direct comparative operational benchmarking between two high-density economic hubs, revealing cancellation and in-transit failure rates.

### 5. Pivot (Cross-Tabulation & Rotation)
* **Objective**: Rotate dimensions by projecting monthly order volumes for two competing states side-by-side using SQL `FILTER` clauses.
* **Executable SQL Query**:
```sql
SELECT 
    d.year_month AS month,
    COUNT(*) FILTER (WHERE c.customer_state = 'SP') AS SP_orders,
    COUNT(*) FILTER (WHERE c.customer_state = 'RJ') AS RJ_orders,
    COUNT(*) AS all_states_orders
FROM fact_orders o
JOIN dim_customer c USING (customer_id)
JOIN dim_date d ON o.purchase_date = d.date_day
WHERE o.purchase_date BETWEEN DATE '2016-01-01' AND DATE '2018-12-31'
GROUP BY 1
ORDER BY 1;
```
* **Analytical Insight**: Produces an immediate comparative growth matrix without requiring backend reshape or Python pivoting operations.

---

## Data Mining Methodology

PromisePulse frames delivery risk as a **binary classification problem at the time of order checkout**.

```
Problem: Predict whether an order will arrive after its promised estimated delivery date.
Target Label: actual_late ∈ {0, 1}
  - 1 (Late): delivered_customer_date::DATE > estimated_delivery_date::DATE
  - 0 (On-Time): delivered_customer_date::DATE <= estimated_delivery_date::DATE
  - Excluded: Orders canceled, unavailable, or missing final delivery timestamps (2,971 rows)
```

### 1. Leakage Safeguards & Feature Engineering
A frequent flaw in e-commerce machine learning is data leakage: utilizing features that could not have been known when the decision was made. PromisePulse strictly enforces a **checkout-time feature set**:

| Feature Name | Type | Processing | Rationale |
| :--- | :--- | :--- | :--- |
| `item_count` | Numeric | Median Imputation + Standard Scaling | Number of discrete physical items in the order. |
| `item_total` | Numeric | Median Imputation + Standard Scaling | Total merchandise price in BRL. |
| `freight_total` | Numeric | Median Imputation + Standard Scaling | Total shipping fee incurred. |
| `promised_days` | Numeric | Median Imputation + Standard Scaling | Days between purchase date and estimated delivery date. |
| `purchase_month` | Numeric | Median Imputation + Standard Scaling | Calendar month capturing macro seasonality (holidays, Q4). |
| `purchase_weekday` | Numeric | Median Imputation + Standard Scaling | Day of week capturing weekend logistics dispatch lag. |
| `customer_state` | Categorical | One-Hot Encoding (`handle_unknown='ignore'`) | Destination federative unit capturing geographical transit distance. |

> **Strict Non-Leakage Rule**: No delivery timestamps, carrier pickup timestamps, tracking progress events, or customer review scores are provided to the model.

### 2. Chronological Train / Validation / Test Splitting
Random $k$-fold cross-validation is inappropriate for temporal logistics data because future deliveries leak information back into historical training sets. PromisePulse uses strict **temporal splitting** with label maturity cutoffs:

* **Training Window** (First 65% of orders: 58,731 samples): Orders purchased and delivered prior to cutoff date 1.
* **Validation Window** (Next 15% of orders: 12,435 samples): Orders purchased and delivered between cutoff date 1 and cutoff date 2. Used exclusively for hyperparameter validation and optimal decision threshold selection.
* **Test Window** (Final 20% of orders: 19,294 samples): Held-out test set spanning **2018-05-26 to 2018-08-29**. Used strictly for final benchmark reporting.

### 3. Empirical Model Evaluation Results

Due to severe class imbalance (late deliveries represent only ~3.5% of out-of-sample orders in the test window), standard accuracy is a misleading metric (a trivial classifier predicting 0 achieves 96.5% accuracy but catches zero delays). The optimal operating threshold ($\tau = 0.60$) was chosen strictly on the validation set to maximize F1-score.

| Metric | Dummy Prior Baseline | PromisePulse Balanced Logistic Model | Relative Gain |
| :--- | :--- | :--- | :--- |
| **Precision** | 0.000 (0.0%) | **0.049** (4.9%) | $+4.9\text{ percentage points}$ |
| **Recall** | 0.000 (0.0%) | **0.288** (28.8%) | $+28.8\text{ percentage points}$ |
| **F1-Score** | 0.000 | **0.083** | $+0.083$ |
| **ROC-AUC** | 0.500 | **0.698** | $+0.198$ |
| **PR-AUC** (Avg Precision) | 0.035 | **0.068** | $+94.3\%\text{ increase}$ |

#### Held-Out Confusion Matrix (19,294 Test Orders at $\tau = 0.60$)
* **True Positives (TP)**: **194** correctly flagged late orders.
* **False Positives (FP)**: **3,779** flagged orders that arrived on time.
* **False Negatives (FN)**: **480** unflagged orders that arrived late.
* **True Negatives (TN)**: **14,841** correctly identified on-time deliveries.

#### Limitations of the Historical Classifier
* **Transit Blindness**: The model operates strictly at purchase time. Unforeseen weather disruptions, carrier strikes, or vehicle breakdowns occurring days later cannot be anticipated by checkout features alone.
* **False Positive Rate**: To capture ~29% of late deliveries, the model accepts a notable false positive rate. In operations, this queue is used for low-cost preventive measures (e.g., priority dispatching, routing to expedited carriers, or setting conservative delivery estimates).

---

## Dataset Source and Attribution

* **Official Dataset**: [Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)
* **Dataset Provider**: Olist
* **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/))
* **Temporal Period**: 2016 – 2018 (Historical dataset; not live orders)

### Processed File Inventory

| Source CSV File | Staging Table | Source Rows | Raw File Size |
| :--- | :--- | :--- | :--- |
| `olist_customers_dataset.csv` | `raw_customers` | 99,441 | 9.03 MB |
| `olist_orders_dataset.csv` | `raw_orders` | 99,441 | 17.65 MB |
| `olist_order_items_dataset.csv` | `raw_order_items` | 112,650 | 15.44 MB |
| `olist_order_payments_dataset.csv` | `raw_order_payments` | 103,886 | 5.78 MB |
| `olist_order_reviews_dataset.csv` | `raw_order_reviews` | 99,224 | 14.45 MB |
| `olist_products_dataset.csv` | `raw_products` | 32,951 | 2.38 MB |
| `olist_sellers_dataset.csv` | `raw_sellers` | 3,095 | 0.17 MB |
| `product_category_name_translation.csv` | `raw_product_category_translation` | 71 | 2.61 KB |

### Verified Post-ETL Dimension & Fact Counts
* **`fact_orders`**: 99,441 facts (96,470 orders with verified final delivery outcomes; 2,971 unlabeled).
* **`fact_order_items`**: 112,650 item-level facts.
* **`dim_customer`**: 99,441 customer records (mapping to 96,096 distinct individual customers).
* **`dim_product`**: 32,951 dimension records.
* **`dim_seller`**: 3,095 dimension records.
* **`dim_date`**: 774 calendar dates.
* **`risk_predictions`**: 19,294 evaluated test orders.

---

## Upstream Project Attribution

This project builds upon architectural concepts and data engineering patterns established in:
* **Upstream Repository**: [credough/olist-sales-analytics-pipeline](https://github.com/credough/olist-sales-analytics-pipeline)
* **Original Author**: Christopher Dougherty

### Enhancements and Novel Contributions in PromisePulse
1. **Serverless Browser Architecture**: Replaced the previous Streamlit and Dockerized PostgreSQL architecture with a modern React 18 + Vite SPA powered by embedded **DuckDB-Wasm**.
2. **In-Browser OLAP Engine**: Added dynamic client-side SQL execution supporting `ROLLUP`, Drill-down, Slicing, Dicing, and Pivoting without server dependencies.
3. **Rigorous Machine Learning Pipeline**: Implemented a leak-free chronological train/validation/test framework in `scripts/train_risk.py` with explicit label maturity cutoffs and validation-only threshold tuning.
4. **Interactive Risk Center**: Created an interactive risk investigation UI featuring real-time client-side confusion matrix recalculation and CSV triage export.
5. **Modern Luxury Design System**: Engineered a custom responsive interface matching high-end design principles without heavyweight external UI component libraries.

---

## Installation and Setup

### Prerequisites
* **Linux Environment** (Ubuntu 20.04+ or modern Linux distribution)
* **Python 3.10+** (Python 3.11 tested)
* **Node.js 18+** (Node.js 20+ recommended) and `npm`

---

### Step 1: Clone Repository and Set Up Python Environment

```bash
# Clone the repository
git clone https://github.com/kasim672/PromisePulse.git
cd PromisePulse

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install offline data processing and ML dependencies
pip install --upgrade pip
pip install -r requirements-export.txt
```

---

### Step 2: Download Dataset and Build Warehouse (Optional for Local Re-build)

The repository already includes pre-built, verified Parquet data assets in `web/public/data/`. If you wish to reproduce the ETL and machine learning training from scratch:

```bash
# Download the 8 CSV files from Kaggle and place in data/raw/
# https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
mkdir -p data/raw

# Run the dimensional ETL pipeline and scikit-learn model training
python scripts/build_web_data.py --raw-dir data/raw --train

# Run automated validation on the generated export assets
python scripts/verify_export.py
```

Expected verification output:
```text
PASS dim_customer: 99,441 records
PASS dim_product: 32,951 records
PASS dim_seller: 3,095 records
PASS dim_date: 774 records
PASS fact_orders: 99,441 records
PASS fact_order_items: 112,650 records
PASS risk_predictions: 19,294 records
PASS: fact grains and financial reconciliation
PASS: official dataset attribution: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
PASS: mining status: evaluated
```

---

### Step 3: Web Dashboard Setup & Development

```bash
# Navigate to the frontend directory
cd web

# Install frontend dependencies
npm install

# Run TypeScript compilation and build production bundle
npm run build

# Start local development server
npm run dev
```

Open your browser at `http://127.0.0.1:5173`. DuckDB-Wasm will initialize, load the Parquet tables into client memory, and display **LOCAL SQL READY** in the header.

---

### Step 4: Run Automated Tests

PromisePulse includes automated test suites covering Python data export reconciliation and SQL query template generation:

```bash
# Run Python exporter unit tests
.venv/bin/pytest tests/

# Run TypeScript/JavaScript SQL generation tests
NODE_PATH=web/node_modules node tests/test_sql_generation.cjs
```

---

## Academic Relevance

### Data Warehousing and Data Mining Concepts Demonstrated

This project serves as a comprehensive reference implementation for university coursework in **Data Warehousing & Data Mining (DWDM)**:

| DWDM Topic | Academic Concept | Concrete Implementation in PromisePulse |
| :--- | :--- | :--- |
| **ETL & Data Staging** | Multi-source schema integration & sanitization | `scripts/build_web_data.py` reads 8 raw CSVs into DuckDB staging tables with type validation and null-coalescing. |
| **Dimensional Modeling** | Kimball Star Schema & Grain Separation | Distinct accumulating fact (`fact_orders`) and transactional fact (`fact_order_items`) conformed across 4 dimensions. |
| **Measures & Additivity** | Additive vs Non-additive Facts | Unit price and freight are fully additive; review scores and delivery delays are non-additive; payment totals are additive only at order grain. |
| **OLAP Aggregations** | Multidimensional Cube Queries | In-browser implementation of `ROLLUP`, Drill-down, Slicing, Dicing, and Pivoting using DuckDB-Wasm. |
| **Data Quality Auditing** | Referential integrity & reconciliation | Automated SQL assertions checking zero duplicate keys, complete conformed joins, and penny-level payment reconciliation. |
| **Feature Engineering** | Leak-free checkout feature extraction | Calendar extraction (`month`, `dow`), distance proxies (`customer_state`), and fulfillment commitments (`promised_days`). |
| **Supervised Classification**| Skewed binary classification | Scikit-learn Pipeline with median imputation, one-hot encoding, and class-balanced logistic regression. |
| **Temporal Evaluation** | Leakage prevention in time-series data | Chronological train/validation/test split preventing backwards-in-time label contamination. |
| **Threshold Optimization**| Rare-event cost-sensitive triage | Validation-only threshold optimization tuning the decision boundary for maximum F1-score. |

---

## Project Structure

```text
promisepulse-react-mvp/
├── .gitignore                    # Comprehensive Git exclusion rules
├── LICENSE                       # MIT Open-Source License
├── README.md                     # Project documentation & reference manual
├── requirements-export.txt       # Python dependencies (DuckDB, Pandas, scikit-learn)
├── docs/
│   ├── ADD_TO_EXISTING_PROJECT.md # Migration instructions for legacy pipelines
│   └── screenshots/              # High-resolution genuine dashboard captures
│       ├── overview.png
│       ├── revenue-analytics.png
│       ├── olap-rollup.png
│       ├── olap-drilldown.png
│       ├── olap-slice.png
│       ├── olap-dice.png
│       ├── olap-pivot.png
│       ├── risk-center.png
│       ├── risk-predictions-queue.png
│       ├── model-evaluation.png
│       ├── data-catalog.png
│       ├── warehouse-tables.png
│       ├── data-quality.png
│       ├── data-reconciliation.png
│       └── mobile-overview.png
├── scripts/
│   ├── build_web_data.py         # Offline DuckDB ETL & Parquet exporter
│   ├── train_risk.py             # Chronological ML training & scoring pipeline
│   ├── verify_export.py          # Automated dataset integrity & metric assertions
│   └── capture_screenshots.py    # Playwright browser automation script
├── tests/
│   ├── test_exporter.py          # Pytest suite verifying manifest & table grains
│   └── test_sql_generation.cjs   # Unit tests validating SQL OLAP templates
├── warehouse/                    # Local DuckDB database directory (.duckdb)
└── web/                          # React + TypeScript SPA frontend
    ├── index.html                # HTML entry point with Plus Jakarta Sans fonts
    ├── package.json              # Node dependencies (@duckdb/duckdb-wasm, Lucide)
    ├── vite.config.ts            # Vite build configuration
    ├── public/
    │   ├── promisepulse-logo.png # High-resolution brand logo
    │   ├── favicon.png           # Browser tab icon
    │   └── data/                 # Exported Parquet tables & manifest.json
    │       ├── dim_customer.parquet
    │       ├── dim_date.parquet
    │       ├── dim_product.parquet
    │       ├── dim_seller.parquet
    │       ├── fact_order_items.parquet
    │       ├── fact_orders.parquet
    │       ├── risk_predictions.parquet
    │       └── manifest.json
    └── src/
        ├── App.tsx               # Main application component & tab routing
        ├── db.ts                 # DuckDB-Wasm connection & Parquet registration
        ├── queries.ts            # Dynamic SQL builders & parameterized templates
        ├── styles.css            # Responsive custom luxury styling
        └── types.ts              # TypeScript analytical schema interfaces
```

---

## Testing and Verification Status

The project was audited, built, and verified end-to-end in this environment:

| Verification Phase | Command / Tool | Status | Result / Notes |
| :--- | :--- | :--- | :--- |
| **Python Unit Tests** | `pytest tests/` | **PASSED** | 2/2 tests passed in 0.06s (`tests/test_exporter.py`). |
| **OLAP SQL Tests** | `node tests/test_sql_generation.cjs` | **PASSED** | All 5 OLAP SQL generator templates validated with injection guards. |
| **Data Integrity Verification** | `python scripts/verify_export.py` | **PASSED** | All 7 tables, grains, license attribution, and metric outputs validated. |
| **TypeScript Type Checks** | `tsc -b` | **PASSED** | Zero type errors across all TS/TSX modules. |
| **Production Web Build** | `vite build` | **PASSED** | Production bundle compiled in 2.83s with DuckDB-Wasm assets included. |
| **Browser Execution (Playwright)** | `scripts/capture_screenshots.py` | **PASSED** | Chromium headless session executed; 15 genuine high-res screenshots captured. |

---

## Limitations and Future Roadmap

* **Historical Snapshot Nature**: The Olist dataset terminates in late 2018. Models and trends reflect historical Brazilian retail patterns and are not connected to a live ERP or courier API.
* **Client-Side Memory Constraints**: While DuckDB-Wasm handles 100,000 order facts seamlessly (~15MB compressed Parquet), datasets exceeding several million rows would necessitate server-side database clustering or DuckDB server pushdown.
* **Model Algorithmic Complexity**: The current baseline utilizes class-weighted Logistic Regression to maintain transparency and instant scoring. Incorporating gradient-boosted trees (e.g., LightGBM or XGBoost) with SHAP value explainability represents a valuable future extension.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

The underlying **Brazilian E-Commerce Public Dataset** is provided by **Olist** and licensed under **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)**.
