import {useEffect,useMemo,useState} from 'react'
import type {ReactNode,CSSProperties} from 'react'
import {Download,ShieldCheck} from 'lucide-react'
import {ChartCard} from './AnalyticsAtlas'
import type {AtlasMetric} from './atlasQueries'
import type {RecordRow,Tab} from './types'
import {AlgorithmWalkthrough} from './AlgorithmWalkthrough'
export type SyllabusModule='Warehouse & ETL'|'Data Lakes'|'EDA & Preprocessing'|'Classification Lab'|'Clustering Lab'|'Pattern Mining'
type Row=Record<string,unknown>
type Evidence={
 version:number;source:{dataset:string;year_range:string;random_seed:number};
 warehouse:{raw_source_files:Row[];physical_parquet:Row[];architecture_notes:string;schema_models:Record<string,string>};
 eda:{summary:Row[];missing:Row[];histograms:Record<string,Row[]>;correlations:Row[];quality:Record<string,number>;states:Row[]};
 classification:{metrics:Row[];calibration:Row[];train_rows:number;test_rows:number;test_start:string;base_late_rate_pct:number;selection:string};
 regression:{metrics:Row[];notes:string};
 clustering:{sample_size:number;population_size:number;chosen_k:number;k_search:Row[];algorithms:Row[];profiles:Row[];points:Row[];dendrogram:Row[];dendrogram_sample:number;caveats:string};
 patterns:{available:boolean;reason?:string;eligible:number;multiple_category_orders:number;algorithms:Row[];rules:Row[];frequent_itemsets:Row[];closed_itemsets:Row[];closed_itemsets_total:number;caveats:string}
}
const sequence:SyllabusModule[]=['Warehouse & ETL','Data Lakes','EDA & Preprocessing','Classification Lab','Clustering Lab','Pattern Mining']
const n=(v:unknown,d=2)=>typeof v==='number'&&Number.isFinite(v)?new Intl.NumberFormat('en-US',{maximumFractionDigits:d}).format(v):'—'
const formatted=(name:string)=>name.replaceAll('_',' ')
function sourceCsv(rows:Row[],name:string){
 if(!rows.length)return
 const cols=Object.keys(rows[0])
 const safe=(v:unknown)=>{const s=String(v??'');const t=typeof v==='string'&&/^\s*[=+@-]/.test(s)?"'"+s:s;return '"'+t.replaceAll('"','""')+'"'}
 const csv=[cols.map(safe).join(','),...rows.map(row=>cols.map(k=>safe(row[k])).join(','))].join('\r\n')
 const u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}))
 const a=document.createElement('a');a.href=u;a.download='promisepulse-'+name+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)
}
function Panel({title,note,children}:{title:string;note:string;children:ReactNode}){
 return <section className="pp-block syllabus-card"><div className="pp-block-header"><h3>{title}</h3><p>{note}</p></div>{children}</section>
}
function Export({rows,name}:{rows:Row[];name:string}){return <button className="syllabus-download" type="button" disabled={!rows.length} onClick={()=>sourceCsv(rows,name)}><Download size={15}/> Export empirical CSV</button>}
function Table({rows,cols,limit=32}:{rows:Row[];cols:[string,string][];limit?:number}){
 return <div className="syllabus-scroll"><table><thead><tr>{cols.map(([key,label])=><th key={key}>{label}</th>)}</tr></thead><tbody>{rows.slice(0,limit).map((row,i)=><tr key={i}>{cols.map(([key])=><td key={key}>{typeof row[key]==='number'?n(row[key]):row[key]==null?'—':String(row[key])}</td>)}</tr>)}</tbody></table></div>
}
function Plot({title,rows,field,label,unit='number',note,shape='bars'}:{title:string;rows:Row[];field:string;label:string;unit?:AtlasMetric['unit'];note:string;shape?:AtlasMetric['shape']}){
 const out:RecordRow[]=rows.map((r,i)=>({label:String(r[label]??i),value:typeof r[field]==='number'?r[field] as number:null}))
 const metric:AtlasMetric={id:title.toLowerCase().replaceAll(' ','-'),title,field:'value',unit,shape,insight:note}
 return <ChartCard rows={out} metric={metric} lens="commerce" loading={false} error=""/>
}
function Warehouse({d}:{d:Evidence}){
 const [model,setModel]=useState<'star'|'snowflake'|'constellation'>('constellation')
 const quality=Object.entries(d.eda.quality).map(([label,value])=>({label,value}))
 return <>
  <div className="syllabus-two">
   <Panel title="Dimensional model laboratory" note="The deployed model has order and item facts sharing dimensions; alternatives are documented accurately.">
    <div className="syllabus-control">{(['star','snowflake','constellation'] as const).map(key=><button type="button" key={key} aria-pressed={model===key} className={model===key?'active':''} onClick={()=>setModel(key)}>{key}</button>)}</div>
    <div className="syllabus-schema"><div><span>DIM CUSTOMER</span><span>DIM DATE</span><span>DIM PRODUCT</span></div><div className="syllabus-fact"><span>FACT ORDERS</span>{model==='constellation'&&<span>FACT ORDER ITEMS</span>}</div><div><span>DIM SELLER</span><span>PRODUCT CATEGORY</span><span>CUSTOMER STATE</span></div></div>
    <p className="syllabus-note">{d.warehouse.schema_models[model]}</p>
   </Panel>
   <Panel title="Physical table registry" note="Actual included Parquet files, order/item grains, physical sizes and row counts.">
    <Table rows={d.warehouse.physical_parquet} cols={[[ 'table','Table'],['rows','Rows'],['parquet_bytes','Bytes'],['grain','Grain']]}/>
    <Export rows={d.warehouse.physical_parquet} name="warehouse-inventory"/>
   </Panel>
  </div>
  <div className="atlas-panel-grid">
    <Plot title="Rows by warehouse relation" rows={d.warehouse.physical_parquet} field="rows" label="table" note="Actual physical table records"/>
    <Plot title="Parquet bytes by relation" rows={d.warehouse.physical_parquet} field="parquet_bytes" label="table" note="Real exported file sizes"/>
    <Plot title="Order counts by customer state" rows={d.eda.states} field="orders" label="customer_state" note="Aggregate customer state, not live geolocation"/>
    <Plot title="Published quality and missingness counts" rows={quality} field="value" label="label" note="Different statistics have different denominators"/>
  </div>
  <Panel title="ETL lineage and OLAP design" note="Operational order of actual Olist warehouse preparation and browser serving."><div className="syllabus-steps">{['Raw historical CSV','DuckDB typing / staging','Conformed dimensions','Order/item facts','Quality validation','Read-only browser Parquet'].map((x,i)=><span key={x}>{i+1}. {x}</span>)}</div><p className="syllabus-note">The original OLAP Lab already supports roll-up, drill-down, slice, dice, and pivot. The conceptual snowflake is not an additional physically deployed data model.</p></Panel>
 </>
}
function DataLakes({d}:{d:Evidence}){
 const raw=d.warehouse.raw_source_files,par=d.warehouse.physical_parquet
 return <>
  <Panel title="Lake-to-warehouse data curation" note="Raw-zone files are inventoried from original source manifest; no cloud S3 or ingestion stream is claimed."><div className="syllabus-steps">{['Raw zone · Olist CSV','Type staging · DuckDB','Curated zone · Parquet','Warehouse facts & dimensions','Serving · DuckDB-Wasm'].map((s,i)=><span key={s}>{i+1}. {s}</span>)}</div><p className="syllabus-note">{d.warehouse.architecture_notes}</p></Panel>
  <div className="atlas-panel-grid">
    <Plot title="Source CSV sizes" rows={raw} field="bytes" label="file" note="Manifest source bytes; not equivalent rows/grain to curated tables"/>
    <Plot title="Curated Parquet sizes" rows={par} field="parquet_bytes" label="table" note="Actual shipped Parquet file bytes"/>
    <Plot title="Source CSV record counts" rows={raw} field="rows" label="file" note="Raw records before type conversion"/>
    <Plot title="Curated relation row counts" rows={par} field="rows" label="table" note="Business dimension and fact grain"/>
  </div>
  <Panel title="Raw-file provenance" note="Compare metadata, inspect ingestion counts, and export the original source inventory."><Table rows={raw} cols={[[ 'file','Original CSV file'],['rows','Rows'],['bytes','Recorded bytes']]}/><Export rows={raw} name="raw-zone"/></Panel>
 </>
}
function Exploration({d}:{d:Evidence}){
 const [col,setCol]=useState('payment_total'),[pair,setPair]=useState<Row|null>(null)
 const record=d.eda.summary.find(r=>r.field===col)
 const names=d.eda.summary.map(r=>String(r.field))
 return <>
  <div className="syllabus-two">
   <Panel title="Descriptive statistical profile" note="Select any actual order-grain numeric metric and inspect its five-number summary, standard deviation and P95.">
    <div className="syllabus-control"><label htmlFor="eda-field">Attribute</label><select id="eda-field" value={col} onChange={e=>setCol(e.target.value)}>{names.map(x=><option key={x}>{x}</option>)}</select></div>
    <div className="syllabus-stat-grid">{[['Observed','n'],['Mean','mean'],['Std. deviation','std'],['Minimum','min'],['First quartile','q1'],['Median','median'],['Third quartile','q3'],['95th percentile','p95'],['Maximum','max']].map(([label,key])=><div key={key}><span>{label}</span><strong>{n(record?.[key])}</strong></div>)}</div>
   </Panel>
   <Panel title="Interactive box-and-whisker summary" note="Box = Q1–Q3, median line, min/max whiskers from actual data; not an IQR outlier classification.">
    <svg viewBox="0 0 540 155" role="img" aria-label="Observed quartile box plot">{record&&(()=>{const low=Number(record.min)||0,high=Number(record.max)||1,scale=(v:unknown)=>Math.sign(Number(v))*Math.log1p(Math.abs(Number(v))),xx=(v:unknown)=>30+(scale(v)-scale(low))/(scale(high)-scale(low)||1)*470;return <><line x1={xx(record.min)} x2={xx(record.max)} y1="70" y2="70" stroke="var(--atlas-series)" strokeWidth="3"/><rect x={xx(record.q1)} y="40" width={Math.max(1,xx(record.q3)-xx(record.q1))} height="60" fill="var(--atlas-series)" fillOpacity=".23" stroke="var(--atlas-series)" strokeWidth="2"/><line x1={xx(record.median)} x2={xx(record.median)} y1="35" y2="107" stroke="var(--atlas-selected)" strokeWidth="3"/><text x="30" y="135" className="atlas-tick">{n(record.min)}</text><text x="500" y="135" textAnchor="end" className="atlas-tick">{n(record.max)}</text></>})()}</svg><p className="syllabus-note">Signed log1p spacing makes heavy-tailed values legible; quartiles, median and whiskers are still actual values in original units.</p>
   </Panel>
  </div>
  <div className="atlas-panel-grid">
    <Plot title={'Histogram · '+col} rows={d.eda.histograms[col]||[]} field="count" label="label" note="99th-percentile capped values with explicit equal-width bins"/>
    <Plot title="Null attribute percentage" rows={d.eda.missing} field="missing_pct" label="field" unit="percent" note="Real missingness; absence never silently treated as zero"/>
  </div>
  <Panel title="Pearson correlation matrix" note="Calculated from numeric order-grain features (minimum 500 valid pairs). Click cells to inspect.">
    <div className="syllabus-scroll"><table className="syllabus-heat"><thead><tr><th>Field</th>{names.map(c=><th key={c}>{formatted(c)}</th>)}</tr></thead><tbody>{names.map(y=><tr key={y}><th>{formatted(y)}</th>{names.map(x=>{const item=d.eda.correlations.find(v=>v.x===x&&v.y===y);return <td key={x}><button type="button" style={{'--heat-strength':(typeof item?.value==='number'?Math.round(Math.abs(item.value)*82):0)+'%'} as CSSProperties} className="syllabus-heat-cell" onClick={()=>setPair(item??null)} aria-label={x+' × '+y+' = '+n(item?.value,3)}>{n(item?.value,2)}</button></td>})}</tr>)}</tbody></table></div>
    <p className="syllabus-note">{pair?String(pair.x)+' versus '+String(pair.y)+' · r = '+n(pair.value,4):'Select a cell to see its observed correlation.'}</p>
  </Panel>
  <Panel title="Preprocessing and dimension reduction" note="Actual techniques used in offline, train/test-aware ML or clustering pipelines."><div className="syllabus-steps">{['Missing-value audit','Training-median numeric imputation','One-hot state features','StandardScaler fit on train','Log1p customer RFM','PCA 2D customer embedding'].map((t,i)=><span key={t}>{i+1}. {t}</span>)}</div><Table rows={d.eda.summary} cols={[[ 'field','Field'],['n','Observed'],['mean','Mean'],['std','Std.'],['median','Median'],['p95','P95']]}/></Panel>
 </>
}
function Classification({d}:{d:Evidence}){
 const all=d.classification.metrics
 const [model,setModel]=useState('Decision Tree'),[metric,setMetric]=useState('f1')
 const chosen=all.find(v=>v.name===model)
 const cal=d.classification.calibration.filter(v=>v.model===model)
 return <>
  <div className="syllabus-facts"><span>Train rows <strong>{n(d.classification.train_rows,0)}</strong></span><span>Holdout rows <strong>{n(d.classification.test_rows,0)}</strong></span><span>Test starts <strong>{d.classification.test_start}</strong></span><span>Late prevalence <strong>{n(d.classification.base_late_rate_pct)}%</strong></span></div>
  <div className="syllabus-two">
   <Panel title="Four-method classifier comparison" note="Majority baseline, Decision Tree, Gaussian Naive Bayes and Logistic Regression share chronological held-out labels."><div className="syllabus-control"><label>Evaluation metric</label><select value={metric} onChange={e=>setMetric(e.target.value)}>{['roc_auc','pr_auc','precision','recall','f1','balanced_accuracy'].map(v=><option key={v}>{v}</option>)}</select></div><Plot title={'Held-out '+formatted(metric)} rows={all} field={metric} label="name" note="Estimated on test observations only; no tuning on test outcomes"/></Panel>
   <Panel title="Confusion matrix" note="Actual classified holdout orders at fixed 0.5 threshold."><div className="syllabus-control"><label>Classifier</label><select value={model} onChange={e=>setModel(e.target.value)}>{all.map(v=><option key={String(v.name)}>{String(v.name)}</option>)}</select></div><div className="syllabus-confusion">{[['TN','tn'],['FP','fp'],['FN','fn'],['TP','tp']].map(([title,key])=><div key={key}><small>{title}</small><strong>{n(chosen?.[key],0)}</strong></div>)}</div><p className="syllabus-note">{d.classification.selection}</p></Panel>
  </div>
  <div className="atlas-panel-grid">
   <Plot title={'Observed frequency · '+model} rows={cal} field="observed_pct" label="bin" unit="percent" note="Actual late frequency in predicted risk bands" shape="dots"/>
   <Plot title={'Predicted probability · '+model} rows={cal} field="predicted_pct" label="bin" unit="percent" note="Mean held-out predicted risk by band" shape="line"/>
   <Plot title="Held-out classification precision" rows={all} field="precision" label="name" note="Positive class precision (imbalanced)"/>
   <Plot title="Held-out classification recall" rows={all} field="recall" label="name" note="True positive fraction among observed late deliveries"/>
  </div>
  <Panel title="Regression experiment · actual delivery days" note="Multiple and simple linear regression versus baseline and a tree regressor; eligible delivered orders only.">
    <Table rows={d.regression.metrics} cols={[[ 'name','Approach'],['features','Inputs'],['mae_days','MAE days'],['rmse_days','RMSE days'],['r2','R²']]}/>
    <p className="syllabus-note">{d.regression.notes}</p>
  </Panel>
  <div className="atlas-panel-grid"><Plot title="Regression mean absolute error" rows={d.regression.metrics} field="mae_days" label="name" unit="days" note="Lower MAE better"/><Plot title="Regression root mean squared error" rows={d.regression.metrics} field="rmse_days" label="name" unit="days" note="Nonnegative out-of-time RMSE; signed R² shown in the results table"/></div>
  <Export rows={all} name="chronological-classification"/>
 </>
}
function Cluster({d}:{d:Evidence}){
 const g=d.clustering
 const [algorithm,setAlgorithm]=useState('K-Means')
 const points=g.points.filter(v=>v.algorithm===algorithm)
 const xv=points.map(v=>Number(v.x)),yv=points.map(v=>Number(v.y))
 const xmin=Math.min(...xv),xmax=Math.max(...xv),ymin=Math.min(...yv),ymax=Math.max(...yv)
 const xx=(v:unknown)=>30+(Number(v)-xmin)/(xmax-xmin||1)*580
 const yy=(v:unknown)=>280-(Number(v)-ymin)/(ymax-ymin||1)*245
 const maxX=Math.max(10,...g.dendrogram.flatMap(v=>v.icoord as number[]))
 const maxY=Math.max(1,...g.dendrogram.flatMap(v=>v.dcoord as number[]))
 const [selected,setSelected]=useState<string>('')
 return <>
  <div className="syllabus-facts"><span>Population <strong>{n(g.population_size,0)}</strong></span><span>Fit sample <strong>{n(g.sample_size,0)}</strong></span><span>Selected k <strong>{g.chosen_k}</strong></span><span>Seed <strong>42</strong></span></div>
  <div className="syllabus-two">
   <Panel title="Actual PCA cluster assignments" note="K-Means, Ward agglomerative and divisive Bisecting K-Means on log1p-scaled customer RFM.">
    <div className="syllabus-control"><label>Algorithm</label><select value={algorithm} onChange={e=>setAlgorithm(e.target.value)}>{g.algorithms.map(a=><option key={String(a.name)}>{String(a.name)}</option>)}</select></div>
    <svg className="syllabus-scatter" viewBox="0 0 640 312" role="group" aria-label="Interactive sample customer PCA scatter">{points.map((p,i)=><circle key={i} role="button" tabIndex={0} cx={xx(p.x)} cy={yy(p.y)} r="3.5" fill={['var(--atlas-series)','var(--atlas-selected)','#d28f5e','#b4a3e1','#63b3a5','#a1c663'][Number(p.cluster)%6]} onMouseEnter={()=>setSelected('Cluster '+p.cluster)} onFocus={()=>setSelected('Cluster '+p.cluster)} onClick={()=>setSelected('Cluster '+p.cluster)}><title>{'Cluster '+p.cluster}</title></circle>)}<text x="28" y="306" className="atlas-tick">PCA component 1 →</text></svg>
    <p className="syllabus-note">{selected||'Hover or focus points to inspect membership'}</p>
   </Panel>
   <Panel title="Ward hierarchical dendrogram" note={'True linkage heights on '+g.dendrogram_sample+' deterministic sample records, not all customers.'}>
    <svg viewBox="0 0 640 312" className="syllabus-dendrogram" role="group" aria-label="Ward agglomerative dendrogram">{g.dendrogram.map((segment,i)=>{const xs=segment.icoord as number[],ys=segment.dcoord as number[];return <polyline key={i} tabIndex={0} role="button" aria-label={'Merge '+(i+1)} points={xs.map((x,k)=>(25+x/maxX*580)+','+(277-ys[k]/maxY*240)).join(' ')} fill="none" stroke="var(--atlas-series)" strokeWidth="2" onFocus={()=>setSelected('Ward merge '+(i+1)+' · height '+n(Math.max(...ys),3))} onMouseEnter={()=>setSelected('Ward merge '+(i+1)+' · height '+n(Math.max(...ys),3))}><title>{'Ward linkage height '+n(Math.max(...ys),3)}</title></polyline>})}<text x="25" y="306" className="atlas-tick">Sample leaf ordering →</text></svg><p className="syllabus-note">{selected||'Focus a dendrogram segment to inspect an actual merge.'}</p>
   </Panel>
  </div>
  <div className="atlas-panel-grid">
    <Plot title="K-Means inertia elbow" rows={g.k_search} field="inertia" label="k" shape="line" note="Within-cluster sum of squares versus candidate k"/>
    <Plot title="Silhouette by chosen k" rows={g.k_search} field="silhouette" label="k" shape="line" note="Silhouette estimated on sample"/>
    <Plot title="Silhouette by clustering method" rows={g.algorithms} field="silhouette" label="name" note="Compare three fitted partitions"/>
    <Plot title="Davies–Bouldin validation" rows={g.algorithms} field="davies_bouldin" label="name" note="Lower scores indicate more compact separated clusters"/>
    <Plot title="Population in each cluster" rows={g.profiles} field="customers" label="cluster" note="K-Means assignments on sampled customers"/>
    <Plot title="Cluster recency" rows={g.profiles} field="recency_days" label="cluster" unit="days" note="Days since final historical purchase"/>
    <Plot title="Cluster order frequency" rows={g.profiles} field="frequency" label="cluster" note="Mean observed orders per customer"/>
    <Plot title="Cluster monetary values" rows={g.profiles} field="monetary" label="cluster" unit="brl" note="Mean recorded customer payments"/>
  </div>
  <Panel title="Cluster profiles and algorithm validation" note={g.caveats}><Table rows={g.profiles} cols={[[ 'cluster','Cluster'],['customers','Customers'],['recency_days','Recency days'],['frequency','Orders'],['monetary','Recorded paid value']]}/><Export rows={g.profiles} name="customer-rfm-clusters"/></Panel>
 </>
}
function Rules({d}:{d:Evidence}){
 const p=d.patterns
 const [support,setSupport]=useState(.005),[confidence,setConfidence]=useState(.2),[focus,setFocus]=useState<Row|null>(null)
 const rules=useMemo(()=>p.rules?.filter(r=>Number(r.support)>=support&&Number(r.confidence)>=confidence)??[],[p.rules,support,confidence])
 const rulePercent=rules.map(r=>({...r,support_pct:Math.round(Number(r.support)*100000)/1000,confidence_pct:Math.round(Number(r.confidence)*10000)/100}))
 const timings=(p.algorithms||[]).map(r=>({...r,milliseconds:Math.round(Number(r.seconds)*10000)/10}))
 const itemsets=p.frequent_itemsets?.filter(r=>Number(r.support)>=support)??[]
 if(!p.available)return <Panel title="Baskets not sufficient" note="Rules are suppressed rather than fabricated."><p>{p.reason}</p></Panel>
 return <>
  <div className="syllabus-facts"><span>Eligible baskets <strong>{n(p.eligible,0)}</strong></span><span>Multiple-category orders <strong>{n(p.multiple_category_orders,0)}</strong></span><span>Rule count <strong>{rules.length}</strong></span></div>
  <Panel title="Apriori / FP-Growth / Eclat rule explorer" note="Vary confidence and support on actual exported rules; a control filters results rather than retraining silently.">
   <div className="syllabus-filters"><label>Support ≥ {n(support*100,1)}%<input type="range" min=".005" max=".03" step=".005" value={support} onChange={e=>setSupport(Number(e.target.value))}/></label><label>Confidence ≥ {n(confidence*100,0)}%<input type="range" min=".1" max=".8" step=".05" value={confidence} onChange={e=>setConfidence(Number(e.target.value))}/></label></div>
   <Table rows={rulePercent} cols={[[ 'lhs','Antecedent'],['rhs','Consequent'],['support_pct','Support (%)'],['confidence_pct','Confidence (%)'],['lift','Lift']]} limit={45}/><Export rows={rules} name="itemset-association-rules"/>
  </Panel>
  <div className="atlas-panel-grid">
   <Plot title="Mining runtime (milliseconds)" rows={timings} field="milliseconds" label="algorithm" note="Single-run elapsed milliseconds, not a controlled benchmark"/>
   <Plot title="Frequent sets by algorithm" rows={p.algorithms} field="itemsets" label="algorithm" note="Matched basket matrix, minimum support and maximum length"/>
   <Plot title="Top association lifts" rows={rules.slice(0,20).map((r,i)=>({...r,index:i+1}))} field="lift" label="index" note="Relative co-occurrence enrichment"/>
   <Plot title="Top association confidences (%)" rows={rulePercent.slice(0,20).map((r,i)=>({...r,index:i+1}))} field="confidence_pct" label="index" unit="percent" note="Conditional percentage among eligible baskets"/>
   <Plot title="Frequent itemset support (%)" rows={itemsets.slice(0,20).map(r=>({...r,support_pct:Math.round(Number(r.support)*100000)/1000}))} field="support_pct" label="itemset" unit="percent" note="Share of eligible multi-category baskets"/>
   <Plot title="Association support distribution (%)" rows={rulePercent.slice(0,20).map((r,i)=>({...r,index:i+1}))} field="support_pct" label="index" unit="percent" note="Observed basket co-occurrence percentage"/>
   <Plot title="Closed frequent-itemset support (%)" rows={(p.closed_itemsets||[]).slice(0,20).map(r=>({...r,support_pct:Math.round(Number(r.support)*100000)/1000}))} field="support_pct" label="itemset" unit="percent" note="A closed set has no proper frequent superset with identical observed support"/>
  </div>
  <Panel title="Closed frequent itemsets" note="Computed from all Apriori candidate results: no proper frequent superset has exactly the same observed support."><p className="syllabus-note">Total closed itemsets: {n(p.closed_itemsets_total,0)}. These are derived from the verified Apriori mining output, not a separately named mining algorithm.</p><Table rows={p.closed_itemsets||[]} cols={[[ 'itemset','Closed itemset'],['size','Set size'],['support','Observed support']]} limit={40}/><Export rows={p.closed_itemsets||[]} name="closed-frequent-itemsets"/></Panel>
  <Panel title="Interactive rule network" note="Select actual directed category associations; links show statistical co-occurrence, not recommendations or causal purchase behavior.">
   <div className="syllabus-rule-network">{rules.slice(0,20).map((r,i)=><button key={i} type="button" className={focus===r?'active':''} onClick={()=>setFocus(r)}><span>{String(r.lhs)}</span><span>→</span><span>{String(r.rhs)}</span><strong>{n(r.lift)}×</strong></button>)}</div>
   <p className="syllabus-note">{focus?'Support '+n(Number(focus.support)*100,3)+'% · Confidence '+n(Number(focus.confidence)*100,2)+'% · Lift '+n(focus.lift):'Select an edge to inspect confidence, support and lift.'}</p><p className="syllabus-note">{p.caveats}</p>
  </Panel>
 </>
}
export function SyllabusLab({module,onNavigate}:{module:SyllabusModule;onNavigate:(tab:Tab)=>void}){
 const [result,setResult]=useState<Evidence|null>(null),[pending,setPending]=useState(true),[error,setError]=useState('')
 useEffect(()=>{let live=true;void fetch(import.meta.env.BASE_URL+'data/mining_lab.json').then(res=>{if(!res.ok)throw Error('Mining export missing: install requirements-mining.txt and run python scripts/build_mining_lab.py.');return res.json() as Promise<Evidence>}).then(v=>{if(live){setResult(v);setPending(false)}}).catch(e=>{if(live){setPending(false);setError(String(e))}});return()=>{live=false}},[])
 return <div className="pp-home atlas-page syllabus-page">
  <div className="pp-page-top"><div><h1>{module.split(' ')[0]} <em>{module.split(' ').slice(1).join(' ')}</em></h1><p>Explore historical Olist data, inspect the underlying methods, and compare verified results.</p></div></div>
  <nav className="syllabus-tabs" aria-label="Data Mining Lab sections">
    <button type="button" onClick={()=>onNavigate('Syllabus Hub')}>Overview</button>
    {sequence.map(name=><button type="button" key={name} className={name===module?'active':''} aria-current={name===module?'page':undefined} onClick={()=>onNavigate(name)}>{name}</button>)}
  </nav>
  {pending?<section className="pp-block syllabus-pending"><span className="spinner"/> Loading real mining evidence…</section>:error?<section className="pp-block syllabus-error" role="alert"><h3>Experiment data unavailable</h3><p>{error}</p><p>No results are simulated. Generate the offline export and reload.</p></section>:result&&<>
    <div className="syllabus-facts"><span>Data <strong>Olist Brazilian E-Commerce</strong></span><span>Years <strong>{result.source.year_range}</strong></span><span>Seed <strong>{result.source.random_seed}</strong></span><span>Source <strong>Verified Parquet</strong></span></div>
    {module==='Warehouse & ETL'&&<Warehouse d={result}/>}
    {module==='Data Lakes'&&<DataLakes d={result}/>}
    {module==='EDA & Preprocessing'&&<Exploration d={result}/>}
    {module==='Classification Lab'&&<Classification d={result}/>}
    {module==='Clustering Lab'&&<Cluster d={result}/>}
    {module==='Pattern Mining'&&<Rules d={result}/>}
     {module==='Classification Lab'&&<AlgorithmWalkthrough topic="classification"/>}
     {module==='Clustering Lab'&&<AlgorithmWalkthrough topic="clustering"/>}
     {module==='Pattern Mining'&&<AlgorithmWalkthrough topic="patterns"/>}
     <div className="reproducibility-links"><h3>Reproduce the analysis</h3><p>Download the recorded results or inspect the offline exporter. Walkthroughs are educational; measured results come from published data.</p><a href={import.meta.env.BASE_URL+'data/mining_lab.json'} download="mining_lab.json">Download experiment results (JSON)</a><a href="https://github.com/kasim672/PromisePulse/blob/main/scripts/build_mining_lab.py" target="_blank" rel="noreferrer">View exporter source</a></div>
    <div className="atlas-methodology"><ShieldCheck size={18}/><p><strong>Interpretation notes.</strong> Offline analyses use real historical Olist source data and a deterministic script, not simulated charts. Clustering samples and rule denominators are disclosed. Relationships are exploratory, not causal; manuscript-level statistical testing and independent validation remain separate work.</p></div>
  </>}
 </div>
}
