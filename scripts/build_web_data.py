"""Build the PromisePulse standalone DuckDB warehouse and browser Parquet export.

Run from the project root after downloading the original Olist dataset:
  python scripts/build_web_data.py --raw-dir data/raw --train

Never substitutes synthetic/placeholder data for missing CSVs.
"""
from __future__ import annotations

import argparse
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import duckdb

LOG = logging.getLogger("promisepulse")
ROOT = Path(__file__).resolve().parents[1]
INPUTS = {
    "customers": ("olist_customers_dataset.csv",),
    "sellers": ("olist_sellers_dataset.csv",),
    "products": ("olist_products_dataset.csv",),
    "orders": ("olist_orders_dataset.csv",),
    "order_items": ("olist_order_items_dataset.csv",),
    "order_payments": ("olist_order_payments_dataset.csv",),
    "order_reviews": ("olist_order_reviews_dataset.csv",),
    "product_category_translation": ("product_category_name_translation.csv", "olist_product_category_name_translation.csv"),
}
EXPORTS = ("dim_customer", "dim_product", "dim_seller", "dim_date", "fact_orders", "fact_order_items")


def find_sources(raw_dir: Path) -> dict[str, Path]:
    found = {}
    missing = []
    for name, filenames in INPUTS.items():
        path = next((raw_dir / fn for fn in filenames if (raw_dir / fn).is_file()), None)
        if path is None:
            missing.append(f"{name}: {' or '.join(filenames)}")
        else:
            found[name] = path
    if missing:
        raise FileNotFoundError("Required Olist CSV files missing from " + str(raw_dir) + ":\n  " + "\n  ".join(missing))
    return found


def create_warehouse(con: duckdb.DuckDBPyConnection, sources: dict[str, Path]) -> None:
    for name, path in sources.items():
        # all_varchar preserves source codes and avoids inference-dependent behavior.
        con.execute(f"CREATE OR REPLACE TABLE raw_{name} AS SELECT * FROM read_csv_auto(?, all_varchar=true, header=true, sample_size=-1)", [str(path)])

    con.execute("""
        CREATE OR REPLACE TABLE dim_customer AS
        SELECT customer_id, customer_unique_id, customer_city, customer_state
        FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY customer_unique_id) AS rn FROM raw_customers)
        WHERE rn = 1 AND customer_id IS NOT NULL
    """)
    con.execute("""
        CREATE OR REPLACE TABLE dim_seller AS
        SELECT seller_id, seller_city, seller_state
        FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY seller_id ORDER BY seller_id) AS rn FROM raw_sellers)
        WHERE rn = 1 AND seller_id IS NOT NULL
    """)
    con.execute("""
        CREATE OR REPLACE TABLE dim_product AS
        SELECT p.product_id,
          COALESCE(t.product_category_name_english, p.product_category_name, 'Unknown') AS category,
          TRY_CAST(p.product_weight_g AS DOUBLE) AS weight_g
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY product_id) AS rn
          FROM raw_products
        ) p
        LEFT JOIN (
          SELECT product_category_name, MAX(product_category_name_english) AS product_category_name_english
          FROM raw_product_category_translation GROUP BY product_category_name
        ) t ON p.product_category_name = t.product_category_name
        WHERE p.rn = 1 AND p.product_id IS NOT NULL
    """)
    con.execute("""
        CREATE OR REPLACE TABLE fact_order_items AS
        SELECT order_id, TRY_CAST(order_item_id AS INTEGER) AS order_item_id,
               product_id, seller_id,
               TRY_CAST(price AS DOUBLE) AS price,
               TRY_CAST(freight_value AS DOUBLE) AS freight_value
        FROM (
           SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id, order_item_id ORDER BY order_id) AS rn
           FROM raw_order_items
        ) x
        WHERE rn = 1 AND order_id IS NOT NULL AND TRY_CAST(order_item_id AS INTEGER) IS NOT NULL
    """)
    con.execute("""
        CREATE OR REPLACE TABLE fact_orders AS
        WITH items AS (
          SELECT order_id, COUNT(*) AS item_count,
                 SUM(price) AS item_total, SUM(freight_value) AS freight_total
          FROM fact_order_items GROUP BY order_id
        ), payments AS (
          SELECT order_id, SUM(TRY_CAST(payment_value AS DOUBLE)) AS payment_total
          FROM raw_order_payments GROUP BY order_id
        ), reviews AS (
          SELECT order_id, AVG(TRY_CAST(review_score AS DOUBLE)) AS review_score
          FROM raw_order_reviews GROUP BY order_id
        ), orders_unique AS (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY order_purchase_timestamp) AS rn
          FROM raw_orders
        )
        SELECT o.order_id, o.customer_id, o.order_status,
               TRY_CAST(o.order_purchase_timestamp AS TIMESTAMP) AS purchase_ts,
               TRY_CAST(o.order_purchase_timestamp AS TIMESTAMP)::DATE AS purchase_date,
               TRY_CAST(o.order_estimated_delivery_date AS TIMESTAMP) AS estimated_delivery_ts,
               TRY_CAST(o.order_delivered_customer_date AS TIMESTAMP) AS delivered_ts,
               TRY_CAST(o.order_delivered_customer_date AS TIMESTAMP)::DATE AS delivered_date,
               items.item_count,
               items.item_total, items.freight_total,
               payments.payment_total, reviews.review_score,
               CASE WHEN o.order_status = 'delivered'
                          AND TRY_CAST(o.order_delivered_customer_date AS TIMESTAMP) IS NOT NULL
                          AND TRY_CAST(o.order_estimated_delivery_date AS TIMESTAMP) IS NOT NULL
                    THEN TRY_CAST(o.order_delivered_customer_date AS TIMESTAMP)::DATE
                       > TRY_CAST(o.order_estimated_delivery_date AS TIMESTAMP)::DATE
                    ELSE NULL END AS is_late
        FROM orders_unique o
        LEFT JOIN items ON o.order_id = items.order_id
        LEFT JOIN payments ON o.order_id = payments.order_id
        LEFT JOIN reviews ON o.order_id = reviews.order_id
        WHERE o.rn = 1 AND o.order_id IS NOT NULL
    """)
    con.execute("""
        CREATE OR REPLACE TABLE dim_date AS
        SELECT day::DATE AS date_day,
               YEAR(day)::INTEGER AS year,
               QUARTER(day)::INTEGER AS quarter,
               MONTH(day)::INTEGER AS month,
               STRFTIME(day, '%Y-%m') AS year_month
        FROM generate_series(
           (SELECT MIN(purchase_date) FROM fact_orders WHERE purchase_date IS NOT NULL),
           (SELECT MAX(purchase_date) FROM fact_orders WHERE purchase_date IS NOT NULL),
           INTERVAL 1 DAY
        ) AS t(day)
    """)


def quality_checks(con: duckdb.DuckDBPyConnection) -> dict[str, int | str]:
    checks = {
        "duplicate_order_keys": "SELECT COUNT(*) - COUNT(DISTINCT order_id) FROM fact_orders",
        "duplicate_item_keys": "SELECT COUNT(*) - COUNT(DISTINCT (order_id, order_item_id)) FROM fact_order_items",
        "missing_order_customer": "SELECT COUNT(*) FROM fact_orders f LEFT JOIN dim_customer c USING(customer_id) WHERE c.customer_id IS NULL",
        "missing_item_product": "SELECT COUNT(*) FROM fact_order_items f LEFT JOIN dim_product p USING(product_id) WHERE p.product_id IS NULL",
        "missing_item_seller": "SELECT COUNT(*) FROM fact_order_items f LEFT JOIN dim_seller s USING(seller_id) WHERE s.seller_id IS NULL",
        "unlabeled_orders": "SELECT COUNT(*) FROM fact_orders WHERE is_late IS NULL",
        "labeled_deliveries": "SELECT COUNT(*) FROM fact_orders WHERE is_late IS NOT NULL",
        "missing_payment_orders": "SELECT COUNT(*) FROM fact_orders WHERE payment_total IS NULL",
        "duplicate_source_review_ids": "SELECT COALESCE(SUM(n-1),0) FROM (SELECT COUNT(*) n FROM raw_order_reviews GROUP BY review_id HAVING COUNT(*) > 1)",
        "payment_total_delta_cents": "SELECT CAST(ROUND(100 * ABS(COALESCE((SELECT SUM(payment_total) FROM fact_orders),0) - COALESCE((SELECT SUM(TRY_CAST(payment_value AS DOUBLE)) FROM raw_order_payments WHERE order_id IN (SELECT order_id FROM fact_orders)),0))) AS INTEGER)",
        "item_sales_delta_cents": "SELECT CAST(ROUND(100 * ABS(COALESCE((SELECT SUM(item_total) FROM fact_orders),0) - COALESCE((SELECT SUM(price) FROM fact_order_items WHERE order_id IN (SELECT order_id FROM fact_orders)),0))) AS INTEGER)",
    }
    results = {name: int(con.execute(sql).fetchone()[0]) for name, sql in checks.items()}
    results['revenue_note'] = 'Order payment totals and item sales use separate grains and are not summed after joining raw items.'
    # Duplicated warehouse keys indicate an integrity bug, not a warning.
    if results['duplicate_order_keys'] or results['duplicate_item_keys'] or results['payment_total_delta_cents'] > 1 or results['item_sales_delta_cents'] > 1:
        raise ValueError('Warehouse grain or financial reconciliation verification failed')
    return results


def publish(con: duckdb.DuckDBPyConnection, out_dir: Path, sources: dict[str, Path], model: dict) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    counts: dict[str, int] = {}
    for name in EXPORTS:
        counts[name] = con.execute(f'SELECT COUNT(*) FROM {name}').fetchone()[0]
        dest = out_dir / f'{name}.parquet'
        target = str(dest.resolve()).replace("'", "''")
        con.execute(f"COPY (SELECT * FROM {name}) TO '{target}' (FORMAT PARQUET, COMPRESSION ZSTD)")
        LOG.info('Exported %-19s %7d rows %8.1f MB', name, counts[name], dest.stat().st_size / 1_000_000)

    risk_path = out_dir / 'risk_predictions.parquet'
    if model.get('status') == 'evaluated':
        target = str(risk_path.resolve()).replace("'", "''")
        con.execute(f"COPY (SELECT * FROM risk_predictions) TO '{target}' (FORMAT PARQUET, COMPRESSION ZSTD)")
        counts['risk_predictions'] = con.execute('SELECT COUNT(*) FROM risk_predictions').fetchone()[0]
    elif risk_path.exists():
        risk_path.unlink()  # prevent stale predictions being mistaken for this dataset

    raw = [{
        'file': path.name,
        'table': name,
        'rows': int(con.execute(f'SELECT COUNT(*) FROM raw_{name}').fetchone()[0]),
        'bytes': path.stat().st_size,
    } for name, path in sources.items()]

    manifest = {
        'title': 'PromisePulse — E-Commerce Intelligence',
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'dataset': {
            'name': 'Brazilian E-Commerce Public Dataset by Olist',
            'provider': 'Olist (Kaggle)',
            'url': 'https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce',
            'license': 'CC BY-NC-SA 4.0',
            'period': '2016–2018 (historical; not live orders)',
        },
        'source_files': raw,
        'warehouse': counts,
        'quality': quality_checks(con),
        'model': model,
        'lineage': ['Kaggle Olist CSVs', 'DuckDB raw staging', 'Dimensional warehouse', 'SQL OLAP operations', 'Chronological sklearn classification', 'Parquet export', 'React + DuckDB-Wasm'],
    }
    temp = out_dir / 'manifest.json.tmp'
    temp.write_text(json.dumps(manifest, indent=2, default=str), encoding='utf-8')
    temp.replace(out_dir / 'manifest.json')  # publish manifest last
    LOG.info('Published manifest and %d data tables', len(counts))
    return out_dir / 'manifest.json'


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--raw-dir', type=Path, default=ROOT / 'data' / 'raw')
    parser.add_argument('--out', type=Path, default=ROOT / 'web' / 'public' / 'data')
    parser.add_argument('--database', type=Path, default=ROOT / 'warehouse' / 'promisepulse.duckdb')
    parser.add_argument('--train', action='store_true', help='Fit/evaluate genuine chronological ML model and export test-period predictions')
    args = parser.parse_args(argv)
    sources = find_sources(args.raw_dir.resolve())
    args.database.parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(args.database.resolve()))
    try:
        con.execute('BEGIN TRANSACTION')
        create_warehouse(con, sources)
        quality_checks(con)
        con.execute('COMMIT')
        if args.train:
            from train_risk import train_and_score
            model = train_and_score(con)
        else:
            model = {'status': 'not_trained', 'reason': 'Run build_web_data.py with --train to fit and evaluate on real Olist records.'}
        path = publish(con, args.out, sources, model)
        print(f'OK: {path}')
    except Exception:
        try:
            con.execute('ROLLBACK')
        except Exception:
            pass
        raise
    finally:
        con.close()
    return 0


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
    raise SystemExit(main())
