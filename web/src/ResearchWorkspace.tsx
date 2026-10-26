import {useEffect,useMemo,useRef,useState} from 'react'
import {Activity,ArrowRight,BookOpen,BrainCircuit,Database,Download,Layers3,ShieldCheck,Sparkles} from 'lucide-react'
import type {Warehouse} from './db'
import {useSharedFilters} from './sharedFilters'
import type {RecordRow} from './types'
import type {AtlasState,AtlasYear} from './atlasQueries'
import {ATLAS_STATES} from './atlasQueries'
import {ChartCard} from './AnalyticsAtlas'
import {NEW_CHART_COUNT,RESEARCH_GROUPS,researchQuery} from './researchQueries'
import type {ResearchGroupId} from './researchQueries'
export type ResearchDestination='cohorts'|'promise'|'studio'|'model'

type QueryState={loading:boolean;rows:RecordRow[];error:string}
const waiting:QueryState={loading:true,rows:[],error:''}
function asNum(v:unknown){return v===null?null:Number.isFinite(Number(v))?Number(v):null}
function magnitude(v:unknown,digits=1){const n=asNum(v);return n==null?'Unavailable':new Intl.NumberFormat('en-US',{maximumFractionDigits:digits}).format(n)}
function percent(v:unknown){return asNum(v)==null?'Unavailable':magnitude(v)+'%'}
function download(rows:RecordRow[],name:string){
 if(!rows.length)return
 const columns=Object.keys(rows[0])
 const clean=(v:unknown)=>{
  const source=String(v??'')
  const safe=typeof v==='string'&&/^[\s]*[=+@-]/.test(source)?"'"+source:source
  return '"'+safe.replaceAll('"','""')+'"'
 }
 const csv=[columns.map(clean).join(','),...rows.map(r=>columns.map(k=>clean(r[k])).join(','))].join('\r\n')
 const uri=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}))
 const a=document.createElement('a');a.href=uri;a.download='promisepulse-'+name+'.csv';a.click()
 setTimeout(()=>URL.revokeObjectURL(uri),1000)
}
const DEFAULTS:Record<ResearchDestination,ResearchGroupId>={cohorts:'cohorts',promise:'promise',studio:'basket',model:'model'}

function EvidenceCopilot({rows,manifest}:{rows:RecordRow[];manifest:Warehouse['manifest']}){
 const [prompt,setPrompt]=useState<'signal'|'calibration'|'methodology'>('signal')
 const usable=rows.filter(x=>asNum(x.orders)!=null)
 const total=usable.reduce((n,r)=>n+(asNum(r.orders)??0),0)
 const events=usable.reduce((n,r)=>n+(asNum(r.late_events)??0),0)
 const top=usable.reduce<RecordRow|null>((chosen,r)=>!chosen||(asNum(r.observed_pct)??-1)>(asNum(chosen.observed_pct)??-1)?r:chosen,null)
 const delta=usable.length>=2 ? (asNum(usable[usable.length-1].observed_pct)??0)-(asNum(usable[0].observed_pct)??0):null
 const report=manifest.model.model_metrics
 const statements={
  signal:total>0&&top?
   `In the fixed historical test cohort, ${magnitude(events,0)} of ${magnitude(total,0)} labeled orders were late (${percent(100*events/total)}). The band with the highest observed late frequency is ${String(top.label)} (${percent(top.observed_pct)}, ${magnitude(top.orders,0)} orders). A risk gradient from lowest to highest populated absolute-probability band is ${delta==null?'not available':(delta>=0?'+':'')+magnitude(delta)+' percentage points'}. This is an observational calibration diagnostic, not an intervention recommendation.`:
   'No evaluated predictions are available for this filtered cohort.',
  calibration:total>0?
   `The risk score on the horizontal axis is a probability estimated by the existing historical classifier. Observed frequency is calculated from actual_late labels, not from predicted classifications. Compare the blue probability curve to the outcome curve in the chart cards. The original held-out ROC AUC is ${magnitude(report?.roc_auc,3)} and PR AUC is ${magnitude(report?.pr_auc,3)} for the overall published split. These scores do not update when you filter the test cohort by state.`:
   'Calibration requires labeled, evaluated historical predictions. None are available here.',
  methodology:'PromisePulse uses an existing chronologically evaluated scikit-learn classifier at order placement. This assistant summarizes deterministic DuckDB results, not a generative language model or an external AI API. Its answers are traceable to the current aggregated table and the published evaluation manifest. Never read the risk label as a live courier forecast, and do not infer causality or statistical significance from a correlation.'
 }
 return <section className="pp-block research-copilot" aria-label="AI evidence assistant">
  <div className="research-copilot-header"><span className="research-copilot-emblem"><Sparkles size={22}/></span><div><h3>AI Evidence Assistant</h3><p>Traceable answers computed from actual evaluated Olist test rows and model metadata.</p></div></div>
  <div className="research-chips" aria-label="Research questions">{([
   ['signal','Where is late risk concentrated?'],['calibration','Is the model well calibrated?'],['methodology','How is this AI implemented?']
  ] as const).map(([key,label])=><button type="button" key={key} className={prompt===key?'active':''} aria-pressed={prompt===key} onClick={()=>setPrompt(key)}>{label}</button>)}</div>
  <div className="research-answer" aria-live="polite"><BrainCircuit size={20}/><p>{statements[prompt]}</p></div>
  <p className="research-disclosure">Deterministic evidence summary · Not ChatGPT, generative AI, or an autonomous logistics agent. Source: evaluated risk_predictions and manifest.</p>
 </section>
}
const destinationMeta:Record<ResearchDestination,{title:string,accent:string,subtitle:string}>={
 cohorts:{title:'Understand customer',accent:'behavior.',subtitle:'Six views of repeat ordering, observed customer value, frequency and review outcomes. Cohorts use the first purchase within your selected filter window.'},
 promise:{title:'Measure the',accent:'promise.',subtitle:'Six additional plots on real delivery lead times, late outcomes, reported satisfaction and payments. No simulated shipping routes.'},
 studio:{title:'Discover hidden',accent:'structures.',subtitle:'Twelve new visual investigations into basket composition, merchandise weight and freight economics, without multiplying payments by items.'},
 model:{title:'See what AI',accent:'actually knows.',subtitle:'Six held-out model diagnostics and a grounded evidence assistant. Every number traces to evaluated model predictions.'}
}
export function ResearchWorkspace({db,destination}:{db:Warehouse;destination:ResearchDestination}){
 const [groupId,setGroupId]=useState<ResearchGroupId>(DEFAULTS[destination])
 const [shared,setShared]=useSharedFilters()
 const year=shared.year as AtlasYear
 const state=shared.state as AtlasState
 const setYear=(v:AtlasYear)=>setShared({year:v})
 const setState=(v:AtlasState)=>setShared({state:v})
 const [data,setData]=useState<QueryState>(waiting)
 const cache=useRef(new Map<string,RecordRow[]>())
 const meta=destinationMeta[destination]
 useEffect(()=>setGroupId(DEFAULTS[destination]),[destination])
 const group=useMemo(()=>RESEARCH_GROUPS.find(x=>x.id===groupId)!,[groupId])
 const isModel=groupId==='model'
 const evaluated=db.manifest.model.status==='evaluated'
 useEffect(()=>{
  let current=true
  if(isModel&&!evaluated){setData({loading:false,rows:[],error:'The model was not trained for this export; no held-out predictions are published.'});return}
  setData(waiting)
  const key=groupId+'|'+year+'|'+state
  const cached=cache.current.get(key)
  if(cached){setData({loading:false,rows:cached,error:''});return}
  try{
   const query=researchQuery(groupId,year,state)
   void db.query(query).then(rows=>{cache.current.set(key,rows);if(current)setData({loading:false,rows,error:''})})
    .catch(error=>{if(current)setData({loading:false,rows:[],error:String(error)})})
  }catch(error){setData({loading:false,rows:[],error:String(error)})}
  return()=>{current=false}
 },[db,groupId,year,state,isModel,evaluated])
 const totalMetrics=destination==='studio'?12:group.metrics.length
 return <div className="pp-home atlas-page research-page">
  <div className="pp-page-top"><div><h1>{meta.title} <em>{meta.accent}</em></h1><p>{meta.subtitle}</p></div></div>
  <div className="research-fact-strip"><div><strong>{totalMetrics}</strong><span>Interactive figures</span></div><div><strong>{group.grain}</strong><span>Source granularity</span></div><div><strong>{isModel?'2018 hold-out':'2016–2018'}</strong><span>Observation period</span></div><div><strong>CSV</strong><span>Download aggregates</span></div></div>
  {destination==='studio'&&<div className="research-switch" role="group" aria-label="Research studio datasets"><button aria-pressed={groupId==='basket'} className={groupId==='basket'?'active':''} onClick={()=>setGroupId('basket')}><Layers3 size={16}/> Basket structure · 6 charts</button><button aria-pressed={groupId==='weight'} className={groupId==='weight'?'active':''} onClick={()=>setGroupId('weight')}><Activity size={16}/> Product weight & freight · 6 charts</button></div>}
  <div className="pp-block atlas-topbar">
   {!isModel&&<div className="atlas-filter"><label htmlFor="research-year">Purchase period</label><select id="research-year" value={year} onChange={e=>setYear(e.target.value as AtlasYear)}>{(['all','2016','2017','2018'] as const).map(v=><option value={v} key={v}>{v==='all'?'All years':v}</option>)}</select></div>}
   <div className="atlas-filter"><label htmlFor="research-state">Customer state</label><select id="research-state" value={state} onChange={e=>setState(e.target.value as AtlasState)}>{ATLAS_STATES.map(v=><option value={v} key={v}>{v==='ALL'?'All Brazilian states':v}</option>)}</select></div>
   <div className="atlas-filter-note"><ShieldCheck size={17}/><span>{isModel?'Fixed held-out test cohort; no retraining or year slicing. Other model metrics below are overall test-set values.':'Queries use the selected historical year and customer state. Only aggregate rows can be downloaded.'}</span></div>
  </div>
  <div className="atlas-group-intro"><div><h2>{group.name}</h2><span>{group.subtitle}</span></div><div className="atlas-grain"><Database size={16}/>{group.grain}</div></div>
  <p className="research-method-note"><BookOpen size={16}/>{group.scope}</p>
  {isModel&&<EvidenceCopilot rows={data.rows} manifest={db.manifest}/>}
  <div className="atlas-count-line"><span>{group.metrics.length} additional live aggregate charts</span><span>{data.loading?'Querying historical warehouse…':data.error?'Data source unavailable':data.rows.length+' observed bins'}</span></div>
  <div className="atlas-panel-grid">{group.metrics.map(metric=><ChartCard key={metric.id} rows={data.rows} lens="commerce" metric={metric} loading={data.loading} error={data.error}/>)}</div>
  <div className="atlas-methodology"><Database size={16}/><p><strong>Evidence contract.</strong> This workspace uses the existing DuckDB-Wasm engine and Olist export. Source rows are aggregated in SQL; no live telemetry or fabricated training runs. Null values and missing outcomes are reported, not imputed. Charts show associations; claims of statistical significance, causality or journal-level novelty need separate independent tests. Explore {NEW_CHART_COUNT} new chart definitions alongside the original 36, without altering the previous dashboard.</p></div>
  <button className="research-bottom-link" type="button" onClick={()=>download(data.rows,groupId)} disabled={!data.rows.length}><Download size={16}/> Export this research lens · {data.rows.length} grouped records <ArrowRight size={16}/></button>
 </div>
}
