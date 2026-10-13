"""Verify browser Parquet exports against manifest after generating real data."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import duckdb

REQUIRED = ['dim_customer', 'dim_product', 'dim_seller', 'dim_date', 'fact_orders', 'fact_order_items']


def verify(folder: Path) -> None:
    manifest = json.loads((folder / 'manifest.json').read_text())
    con = duckdb.connect(':memory:')
    try:
        for table in REQUIRED + (['risk_predictions'] if manifest['model']['status'] == 'evaluated' else []):
            path = folder / f'{table}.parquet'
            assert path.exists(), f'Missing {path}'
            count = con.execute('SELECT COUNT(*) FROM read_parquet(?)', [str(path)]).fetchone()[0]
            assert count == manifest['warehouse'][table], f'Count mismatch: {table}'
            print(f'PASS {table}: {count:,} records')
        assert manifest['quality']['duplicate_order_keys'] == 0
        assert manifest['quality']['duplicate_item_keys'] == 0
        assert manifest['quality']['payment_total_delta_cents'] <= 1
        assert manifest['quality']['item_sales_delta_cents'] <= 1
        print('PASS: fact grains and financial reconciliation')
        print('PASS: official dataset attribution:', manifest['dataset']['url'])
        print('PASS: mining status:', manifest['model']['status'])
    finally:
        con.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder', nargs='?', type=Path, default=Path(__file__).resolve().parents[1] / 'web/public/data')
    args = parser.parse_args()
    verify(args.folder)
