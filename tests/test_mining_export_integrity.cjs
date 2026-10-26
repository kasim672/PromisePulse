/**
 * Release gate for shipped, empirical syllabus experiments.
 * No Python/runtime download needed: validates the JSON published with the app.
 * Algorithms are independently executed in scripts/build_mining_lab.py.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../web/public/data/mining_lab.json'),'utf8'));
const close=(a,b,epsilon=0.02)=>Math.abs(a-b)<=epsilon;
const finite=x=>typeof x==='number'&&Number.isFinite(x);

assert.equal(data.version,1);
assert.match(data.source.dataset,/Olist/);
assert.equal(data.source.random_seed,42);
assert.equal(data.eda.quality.fact_orders,99441);
assert.equal(data.eda.quality.fact_order_items,112650);
assert.equal(data.warehouse.raw_source_files.length,8);
assert.ok(data.warehouse.physical_parquet.length>=7);
assert.equal(data.eda.summary.length,7);
assert.equal(data.eda.missing.length,7);
assert.equal(data.eda.correlations.length,49);
for(const f of data.eda.summary){
 assert.ok(data.eda.histograms[f.field]?.length>1,'Missing numeric histogram: '+f.field);
 assert.ok(f.n>0&&f.std>=0&&f.q1<=f.median&&f.median<=f.q3,'Invalid quantiles: '+f.field);
 assert.ok(f.min<=f.q1&&f.q3<=f.max,'Quantiles outside min/max: '+f.field);
 const miss=data.eda.missing.find(x=>x.field===f.field);
 assert.ok(miss&&miss.observed===f.n&&miss.observed+miss.missing===99441,'Missingness denominator mismatch: '+f.field);
}
const fields=new Set(data.eda.summary.map(x=>x.field));
for(const row of data.eda.correlations){
 assert.ok(fields.has(row.x)&&fields.has(row.y),'Unregistered correlation feature');
 assert.ok(row.value===null||(finite(row.value)&&Math.abs(row.value)<=1.00001));
 const symmetric=data.eda.correlations.find(x=>x.x===row.y&&x.y===row.x);
 assert.ok(symmetric,'Non-square correlation matrix');
 if(finite(row.value))assert.ok(close(symmetric.value,row.value,.0001));
}
assert.equal(data.classification.metrics.length,4);
assert.ok(data.classification.train_rows>10000&&data.classification.test_rows>10000);
for(const m of data.classification.metrics){
 const actual=m.tp+m.fn,nonlate=m.tn+m.fp;
 assert.equal(actual+nonlate,data.classification.test_rows,'Classification confusion matrix does not sum to test size');
 for(const key of ['precision','recall','f1','balanced_accuracy','roc_auc','pr_auc'])
   assert.ok(finite(m[key])&&m[key]>=0&&m[key]<=1,key+' out of bounds for '+m.name);
 if(m.tp+m.fp)assert.ok(close(m.precision,m.tp/(m.tp+m.fp),.00003),'Precision conflicts with counts');
 if(actual)assert.ok(close(m.recall,m.tp/actual,.00003),'Recall conflicts with counts');
}
assert.equal(data.regression.metrics.length,4);
for(const m of data.regression.metrics){
 assert.ok(m.features>=1&&finite(m.mae_days)&&m.mae_days>=0&&finite(m.rmse_days)&&m.rmse_days>=m.mae_days-.01);
 assert.ok(finite(m.r2));
}
const c=data.clustering;
assert.equal(c.algorithms.length,3);
assert.ok(c.sample_size>=100&&c.sample_size<=c.population_size,'Invalid cluster sampling population');
assert.ok(c.dendrogram_sample<=c.sample_size);
assert.equal(c.dendrogram.length,c.dendrogram_sample-1);
assert.equal(c.profiles.length,c.chosen_k);
assert.equal(c.profiles.reduce((n,x)=>n+x.customers,0),c.sample_size);
for(const segment of c.dendrogram){
 assert.equal(segment.icoord.length,4);
 assert.equal(segment.dcoord.length,4);
 assert.ok(segment.icoord.every(finite)&&segment.dcoord.every(finite));
}
const p=data.patterns;
assert.equal(p.available,true,'No mined itemsets were published');
assert.equal(p.algorithms.length,3);
assert.deepEqual(new Set(p.algorithms.map(x=>x.algorithm)),new Set(['Apriori','FP-Growth','Eclat']));
assert.ok(p.eligible>=25&&p.multiple_category_orders>=p.eligible);
assert.ok(p.frequent_itemsets.length>0&&p.rules.length>0&&p.closed_itemsets_total>=p.closed_itemsets.length);
for(const item of [...p.frequent_itemsets,...p.closed_itemsets]){
 assert.ok(item.size>=1&&item.support>0&&item.support<=1,'Invalid observed itemset');
}
for(const rule of p.rules){
 assert.ok(rule.support>0&&rule.support<=1&&rule.confidence>0&&rule.confidence<=1);
 assert.ok(finite(rule.lift)&&rule.lift>0);
}
console.log('PASS: 99,441 Olist orders, EDA distributions, confusion arithmetic, 4 regressors, 3 real cluster fits, dendrogram, 3 mined frequent-pattern methods, original lineage retained');
