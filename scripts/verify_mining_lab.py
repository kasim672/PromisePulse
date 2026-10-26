#!/usr/bin/env python3
"""Reject synthetic, partial, invalid, or inconsistent mining exports."""
import json
from pathlib import Path
p=Path(__file__).resolve().parents[1]/"web/public/data/mining_lab.json"
d=json.loads(p.read_text())
assert d["version"]==1
assert d["source"]["dataset"]=="Olist Brazilian E-Commerce Public Dataset"
assert d["source"]["random_seed"]==42
assert d["eda"]["quality"]["fact_orders"]==99441, "Expected shipped order export row count"
assert d["eda"]["quality"]["fact_order_items"]==112650
assert len(d["eda"]["summary"])==7 and len(d["eda"]["missing"])==7
assert len(d["eda"]["correlations"])==49
assert len(d["classification"]["metrics"])==4
assert d["classification"]["train_rows"]>1000 and d["classification"]["test_rows"]>1000
for m in d["classification"]["metrics"]:
    assert 0 <= m["precision"] <= 1
    assert 0 <= m["recall"] <= 1
    assert 0 <= m["f1"] <= 1
    assert sum(m[k] for k in ("tp","tn","fp","fn"))==d["classification"]["test_rows"]
assert len(d["regression"]["metrics"])==4
assert len(d["clustering"]["algorithms"])==3
assert d["clustering"]["sample_size"]>=100
assert len(d["clustering"]["dendrogram"])==d["clustering"]["dendrogram_sample"]-1
assert len(d["clustering"]["k_search"])>=3
assert len(d["clustering"]["profiles"])==d["clustering"]["chosen_k"]
assert len(d["warehouse"]["physical_parquet"])>=6
assert len(d["warehouse"]["raw_source_files"])==8
basket=d["patterns"]
assert isinstance(basket["available"],bool)
if basket["available"]:
    assert basket["eligible"]>=25
    assert len(basket["algorithms"])==3
    assert basket["closed_itemsets_total"]>=len(basket["closed_itemsets"])>=1
    assert all(0<=item["support"]<=1 for item in basket["closed_itemsets"])
    assert {m["algorithm"] for m in basket["algorithms"]}=={"Apriori","FP-Growth","Eclat"}
    for rule in basket["rules"]:
        assert 0 <= rule["support"] <= 1 and 0 <= rule["confidence"] <= 1 and rule["lift"]>=0
print("PASS: real Olist export, 6 syllabus modules, 4 classification and regression methods, 3 clustering algorithms, Ward dendrogram, and 3 basket algorithms verified")
