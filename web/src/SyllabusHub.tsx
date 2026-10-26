import {useEffect,useState} from 'react'
import {ArrowRight,BookOpen,CheckCircle2,Database,FlaskConical,GraduationCap,Layers3,ChartNoAxesCombined,BrainCircuit,GitFork,Network,ShieldCheck} from 'lucide-react'
import type {Tab} from './types'

type Summary={
 source?:{dataset?:string;year_range?:string;random_seed?:number}
 eda?:{quality?:{fact_orders?:number;fact_order_items?:number}}
 classification?:{test_rows?:number;metrics?:{name:string;roc_auc:number;precision:number}[]}
 clustering?:{sample_size?:number;dendrogram_sample?:number;algorithms?:unknown[]}
 patterns?:{eligible?:number;algorithms?:unknown[];rules?:unknown[]}
}
const modules=[
 {id:'Warehouse & ETL',icon:Database,short:'Data Warehouse & ETL',topics:'Dimensional models · Star/Snowflake · Constellation · OLAP · ETL stages',outcome:'Explain the deployed star schema and compare conceptual schema alternatives',measure:'Physical order and item fact counts; payment reconciliation',phase:'Foundation'},
 {id:'Data Lakes',icon:Layers3,short:'Data Lakes',topics:'Raw landing zones · Curation · Lake vs warehouse · File provenance',outcome:'Distinguish a curated Parquet analytical layer from a deployed object-store lake',measure:'Eight input source files; actual curated warehouse tables',phase:'Foundation'},
 {id:'EDA & Preprocessing',icon:ChartNoAxesCombined,short:'EDA & Preprocessing',topics:'KDD · Attribute types · Five-number summary · Box plots · Cleaning · PCA',outcome:'Explore missingness and observed distributions before selecting a model',measure:'Seven numeric profiles, histograms and 7×7 correlation matrix',phase:'Statistics'},
 {id:'Classification Lab',icon:BrainCircuit,short:'Classification & Regression',topics:'Decision Tree · Naive Bayes · Simple/Multiple Linear Regression',outcome:'Compare genuine chronological model metrics and disclose weak results',measure:'Four classifiers and four regressors trained on historical labels',phase:'Modelling'},
 {id:'Clustering Lab',icon:GitFork,short:'Clustering & Dendrograms',topics:'K-Means · Ward agglomerative · Divisive bisecting · Silhouette',outcome:'Compare partitions and inspect a dendrogram computed from actual linkage',measure:'Deterministic customer subset and explicit dendrogram sample size',phase:'Modelling'},
 {id:'Pattern Mining',icon:Network,short:'Frequent Pattern Mining',topics:'Apriori · FP-Growth · Eclat · Closed itemsets · Association rules',outcome:'Inspect real support, confidence and lift for eligible category baskets',measure:'Apriori, FP-Growth, Eclat parity and an observed basket denominator',phase:'Discovery'},
] as const satisfies readonly {id:Tab;icon:typeof Database;short:string;topics:string;outcome:string;measure:string;phase:string}[]
export function SyllabusHub({onNavigate}:{onNavigate:(tab:Tab)=>void}){
 const [summary,setSummary]=useState<Summary|null>(null)
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [filter,setFilter]=useState<'All'|'Foundation'|'Statistics'|'Modelling'|'Discovery'>('All')
 useEffect(()=>{
  const ctrl=new AbortController()
  fetch('/data/mining_lab.json',{signal:ctrl.signal})
   .then(r=>{if(!r.ok)throw Error('Evidence export is unavailable (HTTP '+r.status+')');return r.json() as Promise<Summary>})
   .then(x=>{if(!ctrl.signal.aborted){setSummary(x);setLoading(false)}})
   .catch(e=>{if(!ctrl.signal.aborted){setError(String(e));setLoading(false)}})
  return()=>ctrl.abort()
 },[])
 const selected=modules.filter(x=>filter==='All'||x.phase===filter)
 const evidence=[
   {label:'Order facts',value:summary?.eda?.quality?.fact_orders},
   {label:'Item facts',value:summary?.eda?.quality?.fact_order_items},
   {label:'Hold-out orders',value:summary?.classification?.test_rows},
   {label:'Clustering sample',value:summary?.clustering?.sample_size},
   {label:'Dendrogram leaves',value:summary?.clustering?.dendrogram_sample},
   {label:'Eligible mining baskets',value:summary?.patterns?.eligible},
 ]
 const format=(n:number|undefined)=>n===undefined?'—':n.toLocaleString('en-US')
 return <div className="pp-home syllabus-page syllabus-hub">
   <div className="pp-page-top"><div>
    <h1>Explore the <em>data.</em></h1>
    <p>Inspect how historical Olist transactions are transformed, evaluated and analysed. Explore the methods, compare recorded results and download supporting data.</p></div></div>
   <div className="syllabus-hub-hero">
    <div className="syllabus-hub-intro"><h2>From transactions to <em>insights.</em></h2>
     <p>Start with warehouse structure and data quality, move into statistical exploration, then inspect predictive models, customer segments and purchase patterns.</p>
     <button type="button" onClick={()=>onNavigate('Warehouse & ETL')}>Explore the warehouse <ArrowRight size={17}/></button></div>
    <div className="syllabus-hub-guide" aria-label="Analysis workflow">
      <div><strong>Explore the workflow</strong><span>Follow historical transactions from ingestion to analysis.</span></div>
      {['Build the warehouse','Profile the data','Evaluate models and clusters','Discover product associations'].map(stage=><span key={stage} className="syllabus-hub-guide-step"><CheckCircle2 size={16} aria-hidden="true"/>{stage}</span>)}
    </div>
   </div>
   <div className="syllabus-hub-evidence">
    <div className="syllabus-hub-evidence-head"><ShieldCheck size={17}/><div><strong>Dataset snapshot</strong><span>Recorded results from historical Olist and Parquet exports</span></div></div>
    {loading?<p role="status">Loading analysis data…</p>:error?<p role="alert">Dataset information unavailable: {error}. Analysis pages display source errors rather than invented results.</p>:
      <div className="syllabus-hub-stat-grid">{evidence.map(x=><div key={x.label}><span>{x.label}</span><strong>{format(x.value)}</strong></div>)}</div>}
   </div>
   <div className="syllabus-hub-heading"><div><h2>Choose what to explore</h2><p>Open any area to investigate its charts, methods and recorded results.</p></div><div className="syllabus-hub-filters" aria-label="Filter analysis areas">{(['All','Foundation','Statistics','Modelling','Discovery'] as const).map(value=><button key={value} type="button" aria-pressed={filter===value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{value}</button>)}</div></div>
   <div className="syllabus-hub-grid">{selected.map(x=>{const Icon=x.icon;return <article className="pp-block syllabus-hub-card" key={x.id}>
    <span className="syllabus-hub-icon"><Icon size={23}/></span><h3>{x.short}</h3><p>{x.topics}</p>
    <div className="syllabus-hub-learning"><strong><CheckCircle2 size={14}/> Explore</strong><span>{x.outcome}</span></div>
    <div className="syllabus-hub-measure"><strong>Available data</strong><span>{x.measure}</span></div>
    <button type="button" className="syllabus-hub-open" onClick={()=>onNavigate(x.id)}>Open analysis <ArrowRight size={17}/></button>
   </article>})}</div>
   <section className="pp-block syllabus-hub-integrity"><div><FlaskConical size={22}/><h3>Understand the results and their limits.</h3><p>Model evaluations use historical observations, not live predictions. Clustering and frequent patterns use documented samples. Architecture diagrams are labelled where they describe concepts rather than deployed services.</p></div><button type="button" onClick={()=>onNavigate('Pipeline & Quality')}>Inspect data quality <ArrowRight size={17}/></button></section>
   <div className="atlas-methodology"><Database size={17}/><p><strong>Data source:</strong> Brazilian E-Commerce Public Dataset by Olist, 2016–2018. Source and warehouse counts, original dashboards, maps and colour themes are preserved. All reported model and mining results have documented limitations.</p></div>
 </div>
}
