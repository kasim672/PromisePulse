"""Minimal contract tests. Requires duckdb, see requirements-export.txt."""
from pathlib import Path
import sys
import pytest

pytest.importorskip('duckdb')
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from build_web_data import find_sources, INPUTS


def test_missing_sources_fail_loudly(tmp_path):
    with pytest.raises(FileNotFoundError, match='Required Olist CSV files missing'):
        find_sources(tmp_path)


def test_translation_filename_matches_official_dataset(tmp_path):
    for source, candidates in INPUTS.items():
        # Official Kaggle listing has product_category_name_translation.csv.
        name = candidates[0]
        (tmp_path / name).write_text('sample\n', encoding='utf-8')
    resolved = find_sources(tmp_path)
    assert resolved['product_category_translation'].name == 'product_category_name_translation.csv'
    assert len(resolved) == 8
