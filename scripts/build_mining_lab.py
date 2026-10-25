#!/usr/bin/env python3
"""PromisePulse syllabus-aligned, reproducible offline data-mining export.

Consumes the *existing* historical, validated Olist Parquet warehouse. Produces
aggregate/evaluation JSON, never simulated charts or personal order records.
Computes reproducible descriptive statistics, leakage-aware chronological
classification/regression, customer clustering, and Apriori/FP-Growth/Eclat
market-basket comparisons. Only published evaluation metrics from held-out rows.
"""
from __future__ import annotations
import argparse
import json
import math
import os
import time
from pathlib import Path

import duckdb
import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage, dendrogram
from sklearn.cluster import KMeans, AgglomerativeClustering, BisectingKMeans
from sklearn.decomposition import PCA
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, confusion_matrix, davies_bouldin_score,
    f1_score, mean_absolute_error, mean_squared_error, precision_score,
    r2_score, recall_score, roc_auc_score, average_precision_score, silhouette_score,
)
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from mlxtend.frequent_patterns import apriori, fpgrowth, association_rules

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "web" / "public" / "data"
OUT = DATA / "mining_lab.json"
SEED = 42

def number(x, digits=5):
    if x is None or (isinstance(x, float) and not math.isfinite(x)) or pd.isna(x):
        return None
    if isinstance(x, (bool, np.bool_)): return bool(x)
    if isinstance(x, (int, np.integer)): return int(x)
    return round(float(x), digits)

def records(df, n=None):
    if n is not None: df = df.head(n)
    result=[]
    for row in df.to_dict("records"):
        result.append({str(k): (str(v) if isinstance(v, pd.Timestamp) else number(v) if isinstance(v, (int,float,np.integer,np.floating,np.bool_)) or pd.isna(v) else str(v)) for k,v in row.items()})
    return result

def percentile_bins(s, label, bins=14):
    v=pd.to_numeric(s,errors="coerce").dropna().astype(float)
    if len(v)==0:return []
    positive=v.clip(lower=0)
    maxval=float(positive.quantile(.99))
    if maxval<=0:maxval=float(positive.max()) or 1
    edges=np.linspace(0,maxval,bins+1)
    hist,_=np.histogram(positive.clip(upper=maxval),bins=edges)
    return [{"label":f"{edges[i]:,.0f}–{edges[i+1]:,.0f}","count":int(hist[i])} for i in range(bins)]

def export_eda(orders,items):
    cols=["payment_total","item_total","freight_total","item_count","review_score","delivery_days","lead_days"]
    summary=[];missing=[];hist={}
    for c in cols:
        val=pd.to_numeric(orders[c],errors="coerce")
        obs=val.dropna()
        summary.append({"field":c,"n":len(obs),"mean":number(obs.mean()),"std":number(obs.std()),
             "min":number(obs.min()),"q1":number(obs.quantile(.25)),"median":number(obs.median()),
             "q3":number(obs.quantile(.75)),"max":number(obs.max()),"p95":number(obs.quantile(.95))})
        missing.append({"field":c,"observed":int(val.notna().sum()),"missing":int(val.isna().sum()),"missing_pct":number(val.isna().mean()*100,2)})
        hist[c]=percentile_bins(obs,c)
    corr=orders[cols].corr(min_periods=500)
    matrix=[{"x":c,"y":r,"value":number(corr.loc[r,c])} for r in cols for c in cols]
    quality={
      "fact_orders":len(orders),"fact_order_items":len(items),
      "unknown_lateness":int(orders.is_late.isna().sum()),
      "valid_delivery_duration":int(orders.delivery_days.notna().sum()),
      "distinct_customer_states":int(orders.customer_state.nunique()),
    }
    dist=orders.groupby("customer_state",dropna=False).agg(orders=("order_id","size"),payments=("payment_total","sum")).reset_index().sort_values("orders",ascending=False)
    return {"summary":summary,"missing":missing,"histograms":hist,"correlations":matrix,"quality":quality,"states":records(dist.head(27))}

def prepare_features(df,features,include_state=True):
    base=df[features].copy()
    for col in base:
        if col=="customer_state": base[col]=base[col].fillna("Unknown").astype(str)
        else:base[col]=pd.to_numeric(base[col],errors="coerce").fillna(base[col].median() if base[col].notna().any() else 0)
    return pd.get_dummies(base,dummy_na=False,dtype=float)

def valid_split(df,test_ratio=.23):
    df=df.sort_values(["purchase_ts","order_id"]).reset_index(drop=True)
    cut=int(len(df)*(1-test_ratio))
    if cut<100 or len(df)-cut<100:raise ValueError("Insufficient historical chronological test rows")
    return df.iloc[:cut].copy(),df.iloc[cut:].copy()

def classification(orders):
    d=orders[orders.is_late.notna() & orders.purchase_ts.notna()].copy()
    d["label"]=d.is_late.astype(int)
    d["purchase_month"]=d.purchase_ts.dt.month
    d["purchase_weekday"]=d.purchase_ts.dt.dayofweek
    train,test=valid_split(d)
    feats=["payment_total","item_total","freight_total","item_count","purchase_month","purchase_weekday","customer_state"]
    x=prepare_features(d,feats);x_train=x.loc[train.index] if False else None
    # Reassemble with identical one-hot columns after sorting; avoid index leaks.
    ordered=d.sort_values(["purchase_ts","order_id"]).reset_index(drop=True)
    x=prepare_features(ordered,feats)
    split=len(train);xt=x.iloc[:split].to_numpy();xv=x.iloc[split:].to_numpy()
    y=ordered.label.to_numpy();yt=y[:split];yv=y[split:]
    scaler=StandardScaler();zt=scaler.fit_transform(xt);zv=scaler.transform(xv)
    models={
        "Majority baseline":DummyClassifier(strategy="prior"),
        "Decision Tree":DecisionTreeClassifier(max_depth=5,min_samples_leaf=130,random_state=SEED,class_weight="balanced"),
        "Gaussian Naive Bayes":GaussianNB(var_smoothing=1e-7),
        "Logistic Regression":LogisticRegression(max_iter=300,class_weight="balanced",random_state=SEED),
    }
    metrics=[];curves=[]
    for name,model in models.items():
        model.fit(zt,yt)
        prob=model.predict_proba(zv)[:,1]
        # Common threshold fixed for transparent comparison; not tuned on test.
        guess=(prob>=.5).astype(int)
        tn,fp,fn,tp=confusion_matrix(yv,guess,labels=[0,1]).ravel()
        metrics.append({"name":name,"roc_auc":number(roc_auc_score(yv,prob)) if len(set(yv))>1 else None,
            "pr_auc":number(average_precision_score(yv,prob)) if len(set(yv))>1 else None,
            "precision":number(precision_score(yv,guess,zero_division=0)),
            "recall":number(recall_score(yv,guess,zero_division=0)),
            "f1":number(f1_score(yv,guess,zero_division=0)),
            "balanced_accuracy":number(balanced_accuracy_score(yv,guess)),
            "tn":int(tn),"fp":int(fp),"fn":int(fn),"tp":int(tp)})
        for bin_ in range(10):
            subset=(prob>=bin_/10)&(prob<((bin_+1)/10 if bin_<9 else 1.00001))
            curves.append({"model":name,"bin":bin_,"predicted_pct":number(prob[subset].mean()*100,2) if subset.sum() else None,
                "observed_pct":number(yv[subset].mean()*100,2) if subset.sum() else None,"n":int(subset.sum())})
    return {"metrics":metrics,"calibration":curves,"train_rows":int(len(yt)),"test_rows":int(len(yv)),
       "train_end":str(ordered.purchase_ts.iloc[split-1].date()),"test_start":str(ordered.purchase_ts.iloc[split].date()),
       "base_late_rate_pct":number(100*yv.mean(),3),"features":feats,
       "selection":"Chronological 77/23 split; train-fitted transforms; fixed 0.5 decision threshold; no test-set tuning."}

def regression(orders):
    d=orders.loc[orders.delivery_days.notna() & orders.purchase_ts.notna()].copy()
    d["month"]=d.purchase_ts.dt.month
    ordered=d.sort_values(["purchase_ts","order_id"]).reset_index(drop=True)
    split=int(len(ordered)*.77)
    y=ordered.delivery_days.to_numpy()
    results=[]
    models=[
      ("Constant median baseline",["item_count"],DummyRegressor(strategy="median")),
      ("Simple linear regression",["item_count"],LinearRegression()),
      ("Multiple linear regression",["item_count","item_total","freight_total","month","customer_state"],LinearRegression()),
      ("Decision tree regression",["item_count","item_total","freight_total","month","customer_state"],DecisionTreeRegressor(max_depth=6,min_samples_leaf=100,random_state=SEED)),
    ]
    for name,feats,model in models:
        x=prepare_features(ordered,feats).to_numpy()
        model.fit(x[:split],y[:split])
        pred=model.predict(x[split:])
        results.append({"name":name,"mae_days":number(mean_absolute_error(y[split:],pred),3),
            "rmse_days":number(np.sqrt(mean_squared_error(y[split:],pred)),3),
            "r2":number(r2_score(y[split:],pred),4),"features":len(feats)})
    return {"metrics":results,"train_rows":split,"test_rows":int(len(y)-split),
        "notes":"Delivered orders only, target purchase-to-receipt days. Features available near purchase, but delivered-only selection biases estimates. No future labels in features."}

def clustering(orders):
    d=orders[orders.purchase_ts.notna() & orders.customer_unique_id.notna()].copy()
    anchor=d.purchase_ts.max()+pd.Timedelta(days=1)
    group=d.groupby("customer_unique_id").agg(last=("purchase_ts","max"),frequency=("order_id","size"),monetary=("payment_total","sum")).reset_index()
    group["recency"]=(anchor-group["last"]).dt.days.clip(lower=0)
    group["monetary"]=group.monetary.fillna(0).clip(lower=0)
    # Prefer a bounded but deterministic sample for O(n^2) hierarchical algorithms.
    sample=group.sample(n=min(950,len(group)),random_state=SEED).reset_index(drop=True)
    features=np.column_stack([np.log1p(sample.recency),np.log1p(sample.frequency),np.log1p(sample.monetary)])
    scaler=StandardScaler();x=scaler.fit_transform(features)
    candidates=[]
    for k in range(2,min(7,len(sample)//25)):
        labels=KMeans(n_clusters=k,n_init=10,random_state=SEED).fit_predict(x)
        candidates.append({"k":k,"inertia":number(KMeans(n_clusters=k,n_init=10,random_state=SEED).fit(x).inertia_,2),
            "silhouette":number(silhouette_score(x,labels,sample_size=min(420,len(x)),random_state=SEED),4)})
    chosen=max(candidates,key=lambda row:row["silhouette"])["k"]
    algorithms={
      "K-Means":KMeans(n_clusters=chosen,n_init=10,random_state=SEED),
      "Agglomerative":AgglomerativeClustering(n_clusters=chosen,linkage="ward"),
      "Bisecting K-Means":BisectingKMeans(n_clusters=chosen,random_state=SEED),
    }
    coords=PCA(n_components=2,random_state=SEED).fit_transform(x)
    experiments=[];points=[]
    for name,model in algorithms.items():
        labels=model.fit_predict(x)
        experiments.append({"name":name,"k":int(chosen),
             "silhouette":number(silhouette_score(x,labels,sample_size=min(420,len(x)),random_state=SEED),4),
             "davies_bouldin":number(davies_bouldin_score(x,labels),4)})
        for ix in range(len(labels)):
            if ix<500:points.append({"algorithm":name,"cluster":int(labels[ix]),"x":number(coords[ix,0],4),"y":number(coords[ix,1],4)})
    labels=algorithms["K-Means"].labels_
    profiles=[]
    for k in sorted(set(labels)):
        group_slice=sample.iloc[np.flatnonzero(labels==k)]
        profiles.append({"cluster":int(k),"customers":len(group_slice),"recency_days":number(group_slice.recency.mean(),2),
                         "frequency":number(group_slice.frequency.mean(),3),"monetary":number(group_slice.monetary.mean(),2)})
    subset=x[:min(52,len(x))]
    z=linkage(subset,method="ward",metric="euclidean")
    den=dendrogram(z,no_plot=True,labels=[f"C{i+1}" for i in range(len(subset))])
    dendro=[{"icoord":list(map(float,co)),"dcoord":list(map(float,do))} for co,do in zip(den["icoord"],den["dcoord"])]
    return {"sample_size":len(sample),"population_size":len(group),"features":["log1p recency","log1p frequency","log1p monetary"],
       "k_search":candidates,"chosen_k":int(chosen),"algorithms":experiments,
       "profiles":profiles,"points":points,"dendrogram":dendro,
       "dendrogram_labels":den["ivl"],"dendrogram_sample":len(subset),
       "caveats":"Clustering is exploratory and trained on a 950-person deterministic sample. Ward dendrogram uses at most 52 of that sample; bisecting k-means is a divisive partition, not a complete divisive dendrogram."}

def eclat(boolean_frame,min_support,max_len=3):
    n=len(boolean_frame);minimum=math.ceil(min_support*n)
    columns=list(boolean_frame.columns)
    initial=[(frozenset([c]),frozenset(np.flatnonzero(boolean_frame[c].to_numpy()))) for c in columns]
    initial=[(a,ids) for a,ids in initial if len(ids)>=minimum]
    found=[]
    def grow(prefix,positions,depth):
        for i,(name,tid) in enumerate(positions):
            combo=prefix|name
            found.append({"itemsets":combo,"support":len(tid)/n})
            if depth<max_len:
                next_gen=[(other,tid&other_tid) for other,other_tid in positions[i+1:] if len(tid&other_tid)>=minimum]
                if next_gen:grow(combo,next_gen,depth+1)
    grow(frozenset(),initial,1)
    return pd.DataFrame(found,columns=["itemsets","support"])

def mining_patterns(items):
    baskets=items.loc[items.category.notna(),["order_id","category"]].drop_duplicates()
    baskets=baskets[baskets.category!="Unknown"]
    order_group=baskets.groupby("order_id").category.agg(lambda a:tuple(sorted(set(a))))
    multiple=order_group[order_group.map(len)>=2]
    max_cats=36
    popular=baskets.category.value_counts().head(max_cats).index
    filtered=multiple.map(lambda cats:[c for c in cats if c in popular])
    filtered=filtered[filtered.map(len)>=2]
    if len(filtered)<25:
        return {"available":False,"reason":"Insufficient distinct multi-category baskets for trustworthy associations","eligible":int(len(filtered)), "rules":[]}
    if len(filtered)>12000:filtered=filtered.sample(12000,random_state=SEED)
    x=pd.DataFrame(False,index=np.arange(len(filtered)),columns=sorted(popular))
    for index,cats in enumerate(filtered):
        for category in cats:x.at[index,category]=True
    # Distinct itemsets and rules based on multi-category-eligible basket population.
    min_sup=0.005
    timings=[];frames={}
    for name,fn in [("Apriori",apriori),("FP-Growth",fpgrowth),("Eclat",eclat)]:
        tick=time.perf_counter()
        table=fn(x,min_support=min_sup,max_len=3,use_colnames=True) if name!="Eclat" else fn(x,min_sup)
        duration=time.perf_counter()-tick
        frames[name]=table
        timings.append({"algorithm":name,"seconds":number(duration,4),"itemsets":int(len(table))})
    apr=frames["Apriori"]
    rules=association_rules(apr,metric="confidence",min_threshold=.12) if not apr.empty else pd.DataFrame()
    evidence=[]
    if not rules.empty:
        for _,r in rules.sort_values(["lift","support"],ascending=False).head(130).iterrows():
            evidence.append({"lhs":" + ".join(sorted(r["antecedents"])),"rhs":" + ".join(sorted(r["consequents"])),
                             "support":number(r["support"],5),"confidence":number(r["confidence"],5),
                             "lift":number(r["lift"],4),"antecedent_support":number(r["antecedent support"],5),
                             "consequent_support":number(r["consequent support"],5)})
    pairs=[{"itemset":" + ".join(sorted(row.itemsets)),"size":len(row.itemsets),"support":number(row.support,5)}
          for row in apr.itertuples(index=False) if len(row.itemsets)>=2][:90]
    return {"available":True,"eligible":int(len(filtered)),"multiple_category_orders":len(multiple),
        "all_distinct_order_baskets":len(order_group),"min_support":min_sup,
        "min_confidence":.12,"max_itemset_size":3,"category_limit":max_cats,
        "algorithms":timings,"frequent_itemsets":pairs,"rules":evidence,
        "caveats":"Support denominators use eligible >=2-category baskets among top 36 translated categories. Many Olist orders have one category; do not generalize associations to all purchases. Algorithm timing measured during export hardware only; not a controlled benchmark."}

def lake_and_warehouse(con,source_manifest):
    tables=["fact_orders","fact_order_items","dim_customer","dim_product","dim_seller","dim_date","risk_predictions"]
    inventory=[]
    for table in tables:
        path=DATA/f"{table}.parquet"
        if not path.exists():continue
        inventory.append({"table":table,"rows":con.execute(f"SELECT COUNT(*) FROM '{path.as_posix()}'").fetchone()[0],
                          "parquet_bytes":path.stat().st_size,
                          "grain":"order" if table=="fact_orders" else "order_item" if table=="fact_order_items" else "dimension/test"})
    raw=[{"file":f["file"],"bytes":f["bytes"],"rows":f["rows"]} for f in source_manifest.get("source_files",[])]
    return {"physical_parquet":inventory,"raw_source_files":raw,
         "raw_total_bytes":sum(x["bytes"] for x in raw),"parquet_total_bytes":sum(x["parquet_bytes"] for x in inventory),
         "architecture_notes":"Source raw CSV = conceptual landing/data-lake zone; parquet warehouse = curated dimensional fact/dimension export. No live data-lake service, ingestion stream, S3 or object-store instance is deployed.",
         "schema_models":{"star":"Current conformed facts and dimensions","snowflake":"Conceptual normalized dimensions only, not an additional deployed model","constellation":"Actual shared customer/product/seller dimensions connected to order and item facts"}}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,default=OUT)
    args=parser.parse_args()
    con=duckdb.connect()
    for name in ["fact_orders","fact_order_items","dim_customer","dim_product","dim_seller","dim_date"]:
        file=DATA/f"{name}.parquet"
        if not file.exists():raise FileNotFoundError(f"Missing real warehouse data: {file}")
        con.execute(f"CREATE VIEW {name} AS SELECT * FROM read_parquet('{file.as_posix()}')")
    orders=con.execute("""
       SELECT o.*,c.customer_unique_id,c.customer_state,
              CASE WHEN o.delivered_ts>=o.purchase_ts
                   THEN date_diff('day',o.purchase_ts,o.delivered_ts) ELSE NULL END AS delivery_days,
              CASE WHEN o.estimated_delivery_ts>=o.purchase_ts
                   THEN date_diff('day',o.purchase_ts,o.estimated_delivery_ts) ELSE NULL END AS lead_days
       FROM fact_orders o LEFT JOIN dim_customer c USING(customer_id)
    """).df()
    items=con.execute("""SELECT i.order_id,i.price,i.freight_value,p.category
                        FROM fact_order_items i LEFT JOIN dim_product p USING(product_id)""").df()
    orders["purchase_ts"]=pd.to_datetime(orders.purchase_ts,errors="coerce")
    meta=json.loads((DATA/"manifest.json").read_text())
    result={
      "version":1,
      "source":{"dataset":"Olist Brazilian E-Commerce Public Dataset","year_range":"2016–2018",
        "manifest_generated_at":meta["generated_at"],"random_seed":SEED,
        "kind":"historical offline experiments, generated from repository Parquet only"},
      "warehouse":lake_and_warehouse(con,meta),
      "eda":export_eda(orders,items),
      "classification":classification(orders),
      "regression":regression(orders),
      "clustering":clustering(orders),
      "patterns":mining_patterns(items),
    }
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,separators=(",",":"),allow_nan=False))
    print(f"Saved {args.output} ({args.output.stat().st_size:,} bytes) from {len(orders):,} orders, {len(items):,} items")
    print(f"Cluster k={result['clustering']['chosen_k']} / basket rules={len(result['patterns'].get('rules',[]))}")
if __name__=="__main__":main()
