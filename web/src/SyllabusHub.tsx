import {useEffect,useState} from 'react'
import {ArrowRight,BookOpen,CheckCircle2,Database,Download,FlaskConical,GraduationCap,Layers3,ChartNoAxesCombined,BrainCircuit,GitFork,Network,ShieldCheck} from 'lucide-react'
import type {Tab} from './types'

type Summary={
 source?:{dataset?:string;year_range?:string;random_seed?:number}
 eda?:{quality?:{fact_orders?:number;fact_order_items?:number}}
 classification?:{test_rows?:number;metrics?:{name:string;roc_auc:number;precision:number}[]}
 clustering?:{sample_size?:number;dendrogram_sample?:number;algorithms?:unknown[]}
 patterns?:{eligible?:number;algorithms?:unknown[];rules?:unknown[]}
}
const modules=[
 {id:'Warehouse & ETL',number:1,hours:8,icon:Database,short:'Data Warehouse & ETL',topics:'Dimensional models · Star/Snowflake · Constellation · OLAP · ETL stages',outcome:'Explain the deployed star schema and compare conceptual schema alternatives',measure:'Physical order and item fact counts; payment reconciliation',phase:'Foundation'},
 {id:'Data Lakes',number:2,hours:3,icon:Layers3,short:'Data Lakes',topics:'Raw landing zones · Curation · Lake vs warehouse · File provenance',outcome:'Distinguish a curated Parquet analytical layer from a deployed object-store lake',measure:'Eight input source files; actual curated warehouse tables',phase:'Foundation'},
 {id:'EDA & Preprocessing',number:3,hours:5,icon:ChartNoAxesCombined,short:'EDA & Preprocessing',topics:'KDD · Attribute types · Five-number summary · Box plots · Cleaning · PCA',outcome:'Explore missingness and observed distributions before selecting a model',measure:'Seven numeric profiles, histograms and 7×7 correlation matrix',phase:'Statistics'},
 {id:'Classification Lab',number:4,hours:5,icon:BrainCircuit,short:'Classification & Regression',topics:'Decision Tree · Naive Bayes · Simple/Multiple Linear Regression',outcome:'Compare genuine chronological model metrics and disclose weak results',measure:'Four classifiers and four regressors trained on historical labels',phase:'Modelling'},
 {id:'Clustering Lab',number:5,hours:4,icon:GitFork,short:'Clustering & Dendrograms',topics:'K-Means · Ward agglomerative · Divisive bisecting · Silhouette',outcome:'Compare partitions and inspect a dendrogram computed from actual linkage',measure:'Deterministic customer subset and explicit dendrogram sample size',phase:'Modelling'},
 {id:'Pattern Mining',number:6,hours:5,icon:Network,short:'Frequent Pattern Mining',topics:'Apriori · FP-Growth · Eclat · Closed itemsets · Association rules',outcome:'Inspect real support, confidence and lift for eligible category baskets',measure:'Apriori, FP-Growth, Eclat parity and an observed basket denominator',phase:'Discovery'},
] as const satisfies readonly {id:Tab;number:number;hours:number;icon:typeof Database;short:string;topics:string;outcome:string;measure:string;phase:string}[]
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
   <div className="pp-page-top"><div><div className="pp-overline"><GraduationCap size={15}/> ACADEMIC RESEARCH / UNIVERSITY SYLLABUS</div>
    <h1>From raw data to <em>discoveries.</em></h1>
    <p>Six course modules, 30 contact hours, interactive historical Olist experiments. Every prior PromisePulse view remains available. Choose a module to inspect its actual computations and limits.</p></div><span className="pp-historical"><span/> VERIFIED HISTORICAL DATA</span></div>
   <div className="syllabus-hub-hero">
    <div className="syllabus-hub-intro"><span><BookOpen size={17}/> COMPLETE SYLLABUS COVERAGE</span><h2>6 modules. 30 hours. <em>One research environment.</em></h2>
     <p>Data warehouses and data lakes establish the source. Statistical profiling inspects it. Classification, clustering and frequent-itemset algorithms test what the data can support.</p>
     <button type="button" onClick={()=>onNavigate('Warehouse & ETL')}>Begin Module 01 <ArrowRight size={17}/></button></div>
    <div className="syllabus-hub-hours" aria-label="Syllabus contact hours by module">
     {modules.map(x=><button key={x.id} type="button" title={x.short+' — '+x.hours+' hours'} onClick={()=>onNavigate(x.id)}>
      <span>0{x.number}</span><span className="syllabus-hub-track"><i style={{width:100*x.hours/8+'%'}}/></span><strong>{x.hours}h</strong></button>)}
     <small>Each bar represents the module's official contact hours; it is not a course-completion percentage.</small>
    </div>
   </div>
   <div className="syllabus-hub-evidence">
    <div className="syllabus-hub-evidence-head"><ShieldCheck size={17}/><div><strong>Published experimental evidence</strong><span>Actual offline Olist/Parquet results, never example numbers</span></div></div>
    {loading?<p role="status">Loading validated experiment summary…</p>:error?<p role="alert">Evidence not available: {error}. The module pages will display their own source errors, not artificial results.</p>:
      <div className="syllabus-hub-stat-grid">{evidence.map(x=><div key={x.label}><span>{x.label}</span><strong>{format(x.value)}</strong></div>)}</div>}
   </div>
   <div className="syllabus-hub-heading"><div><span>COURSEWORK MATRIX · 30 CONTACT HOURS</span><h2>Choose an academic laboratory</h2><p>All six modules correspond directly to your syllabus. Original dashboards are preserved in the dock.</p></div><div className="syllabus-hub-filters" aria-label="Filter modules by phase">{(['All','Foundation','Statistics','Modelling','Discovery'] as const).map(value=><button key={value} type="button" aria-pressed={filter===value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{value}</button>)}</div></div>
   <div className="syllabus-hub-grid">{selected.map(x=>{const Icon=x.icon;return <article className="pp-block syllabus-hub-card" key={x.id}>
    <div className="syllabus-hub-card-top"><span className="syllabus-hub-module">MODULE 0{x.number}</span><span>{x.hours} HOURS</span></div><span className="syllabus-hub-icon"><Icon size={23}/></span><h3>{x.short}</h3><p>{x.topics}</p>
    <div className="syllabus-hub-learning"><strong><CheckCircle2 size={14}/> Learning outcome</strong><span>{x.outcome}</span></div>
    <div className="syllabus-hub-measure"><strong>Data-backed evidence</strong><span>{x.measure}</span></div>
    <button type="button" className="syllabus-hub-open" onClick={()=>onNavigate(x.id)}>Open interactive module <ArrowRight size={17}/></button>
   </article>})}</div>
   <section className="pp-block syllabus-hub-integrity"><div><FlaskConical size={22}/><h3>Review the method, not just the visuals.</h3><p>Classifier metrics and regression errors are historical test results, not performance promises. Clustering and frequent-pattern analyses use disclosed eligible samples. Data Lake/snowflake diagrams are conceptual where physical infrastructure is not implemented.</p></div><button type="button" onClick={()=>onNavigate('Pipeline & Quality')}>Inspect existing quality controls <ArrowRight size={17}/></button></section>
   <div className="atlas-methodology"><Database size={17}/><p><strong>Source and scope:</strong> Brazilian E-Commerce Public Dataset by Olist, 2016–2018. Six additional modules extend the original twelve navigation destinations. Source facts, payment/item grain, the original maps, graphs, and both themes remain unchanged. Scholarly claims require independent replication and uncertainty analysis.</p></div>
 </div>
}
