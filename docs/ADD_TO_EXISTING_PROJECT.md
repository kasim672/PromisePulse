# Integrate into your existing PromisePulse repository

This archive is a **migration module**, not a complete copy of your current repository. Your original PostgreSQL project, model pipeline, Streamlit dashboard, tests and README are not included and must be preserved.

You can use the new React dashboard and embedded DuckDB exporter **without deleting** the working Streamlit/PostgreSQL implementation. The database-export script builds an independent, local DuckDB warehouse from the Olist CSVs and writes genuine Parquet tables to `web/public/data/`.

## Copy files into the original project

From a terminal in the existing `olist-sales-analytics-pipeline-main` repository:

```bash
# Replace this with the directory where you extracted this archive.
MIGRATION="$HOME/Downloads/promisepulse-react-mvp"

# Add only NEW files; do not overwrite existing code or tracked files by default.
cp -rn "$MIGRATION/web" .
mkdir -p scripts docs
cp -n "$MIGRATION/scripts/build_web_data.py" scripts/
cp -n "$MIGRATION/scripts/train_risk.py" scripts/
cp -n "$MIGRATION/scripts/verify_export.py" scripts/
cp -n "$MIGRATION/requirements-export.txt" .
cp -n "$MIGRATION/docs/gitignore-additions.txt" docs/
```

You may instead extract these paths manually inside the repository. **Do not overwrite `README.md`, `.gitignore`, `pipeline/`, `mining/`, or `dashboard/`**. Existing docs and source licenses should remain intact.

Append the lines in `docs/gitignore-additions.txt` to the original `.gitignore`.

## Produce the real warehouse and browser data

Make sure the official Olist CSVs already exist under `data/raw/` (your earlier Kaggle download and check-only output confirmed this).

```bash
.venv/bin/python -m pip install -r requirements-export.txt
.venv/bin/python scripts/build_web_data.py --raw-dir data/raw --train
.venv/bin/python scripts/verify_export.py
```

Expected outputs:

```text
warehouse/promisepulse.duckdb
web/public/data/manifest.json
web/public/data/fact_orders.parquet
web/public/data/fact_order_items.parquet
web/public/data/dim_customer.parquet
web/public/data/dim_product.parquet
web/public/data/dim_seller.parquet
web/public/data/dim_date.parquet
web/public/data/risk_predictions.parquet      # only if training/evaluation succeed
```

## Run React

```bash
cd web
npm install
npm run dev
```

Open the URL shown by Vite, usually `http://127.0.0.1:5173/`.

## Demonstrate to your professor

1. **Overview**: Show real e-commerce KPIs queried from fact tables.
2. **OLAP Lab**: Execute roll-up, drill-down, slice, dice and pivot. Show the exact SQL and rows returned.
3. **Risk Center**: Explain that scikit-learn was trained offline using historical features; demonstrate the interactive risk threshold and actual test-set outcomes.
4. **Data Catalog**: Show source CSV filenames and record counts, Kaggle link, license, and browse each warehouse table.
5. **Pipeline & Quality**: Show fact grains, row counts, integrity checks, and reproducible ETL commands.

## Academic integrity

- The imported Olist CSVs are official historical data, not live events.
- Customer IDs are anonymized in the source but records can still be sensitive. Consider publishing only restricted or minimized analytic subsets if hosting publicly.
- Data is subject to CC BY-NC-SA 4.0. Retain attribution and comply with license restrictions.
- The risk model is trained in Python, not in the browser. The browser performs real SQL-based analytical operations and risk-score filtering on precomputed holdout results.
- The model evaluation and screenshots must come from a genuine local run before submission.
- The React implementation is a new replacement UI, not proof that the original Postgres project was tested end to end.
