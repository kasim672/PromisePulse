import {useEffect,useState} from 'react'
import {Activity,ArrowDownRight,ArrowRight,BookOpen,BrainCircuit,CheckCircle2,ChevronRight,Database,FlaskConical,Globe2,Layers3,LockKeyhole,MoveUpRight,PlayCircle,ShieldCheck,Sparkles,TrendingUp} from 'lucide-react'
import type {Warehouse} from './db'
import type {RecordRow,Tab} from './types'
import {ATLAS_CHART_COUNT} from './atlasQueries'
import {NEW_CHART_COUNT} from './researchQueries'

type WelcomeProps={db:Warehouse|null;onNavigate:(tab:Tab)=>void;warehouseError?:string;pending?:boolean}
const num=(value:unknown)=>typeof value==='number'?new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(value):'—'
function MiniHistory({rows}:{rows:RecordRow[]}){
 const values=rows.map(x=>Number(x.orders)||0)
 const peak=Math.max(1,...values)
 const line=values.map((v,i)=>((i===0?'M':'L')+(24+i*448/Math.max(1,values.length-1)).toFixed(1)+' '+(183-v/peak*144).toFixed(1))).join(' ')
 const area=line+` L ${(24+(values.length-1)*448/Math.max(1,values.length-1)).toFixed(1)} 185 L 24 185 Z`
 return <div className="welcome-history">
   <div className="welcome-history-title"><span><Activity size={15}/> HISTORICAL PURCHASE ACTIVITY</span><strong>2016 — 2018</strong></div>
   {values.length?<svg viewBox="0 0 500 205" role="img" aria-label="Actual monthly historical Olist purchase counts">
     <defs><linearGradient id="welcome-history-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--welcome-blue)" stopOpacity=".30"/><stop offset="1" stopColor="var(--welcome-blue)" stopOpacity=".025"/></linearGradient></defs>
     {[0,1,2,3].map(i=><line key={i} x1="20" x2="480" y1={39+i*49} y2={39+i*49} stroke="var(--welcome-border)" strokeDasharray="3 8"/>)}
     <path d={area} fill="url(#welcome-history-fill)"/><path d={line} stroke="var(--welcome-blue)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
     {values.map((v,i)=><circle key={i} cx={24+i*448/Math.max(1,values.length-1)} cy={183-v/peak*144} r="4" fill="var(--welcome-blue)"><title>{String(rows[i].month)}: {v.toLocaleString()} orders</title></circle>)}
     <text x="24" y="202" className="atlas-tick">2016</text><text x="249" y="202" textAnchor="middle" className="atlas-tick">2017</text><text x="472" y="202" textAnchor="end" className="atlas-tick">2018</text>
   </svg>:<div className="welcome-chart-wait"><span className="spinner"/> {rows.length===0?'Waiting for verified Parquet trend data…':'No observations available'}</div>}
   <div className="welcome-history-foot"><span><i/> ACTUAL ORDER AGGREGATES</span><span>Source: Olist / DuckDB-Wasm</span></div>
 </div>
}
const features=[
 {name:'Geographic intelligence',sub:'Brazilian state-level delivery analytics',icon:Globe2,page:'Overview' as Tab},
 {name:'Research visualizations',sub:(ATLAS_CHART_COUNT+NEW_CHART_COUNT)+' interactive, SQL-backed chart definitions',icon:TrendingUp,page:'Analytics Atlas' as Tab},
 {name:'AI evidence studio',sub:'Transparent historical prediction diagnostics',icon:BrainCircuit,page:'AI Studio' as Tab},
 {name:'Cohort observatory',sub:'Repeat demand and customer economics',icon:Layers3,page:'Customer Cohorts' as Tab},
 {name:'Fulfillment science',sub:'Delivery and promise-window measurement',icon:Activity,page:'Delivery Lab' as Tab},
 {name:'Reproducible lineage',sub:'Two fact grains, verified export and model audit',icon:Database,page:'Pipeline & Quality' as Tab},
]
export function Welcome({db,onNavigate,warehouseError='',pending=false}:WelcomeProps){
 const [monthly,setMonthly]=useState<RecordRow[]>([])
 const [error,setError]=useState(false)
 useEffect(()=>{
  if(!db){setMonthly([]);return}
  let live=true
  void db.query("SELECT strftime(purchase_ts,'%Y-%m') AS month, COUNT(*) AS orders FROM fact_orders WHERE purchase_ts IS NOT NULL GROUP BY 1 ORDER BY 1").then(rows=>{if(live)setMonthly(rows)}).catch(()=>{if(live)setError(true)})
  return()=>{live=false}
 },[db])
 const manifest=db?.manifest
 return <div className="pp-welcome">
  <div className="welcome-marquee"><span className="welcome-live-dot"/><span>RESEARCH-GRADE EXPLORATORY INTELLIGENCE</span><span className="welcome-marquee-right">HISTORICAL BRAZIL · 2016–2018 <MoveUpRight size={13}/></span></div>
  <div className="welcome-hero">
   <div className="welcome-story">
     <div className="welcome-eyebrow"><Sparkles size={16}/> THE PROMISEPULSE RESEARCH EXPERIENCE <span>V 4.0</span></div>
     <h1>Every order holds a <em>story.</em><br/><span>Make the evidence impossible to ignore.</span></h1>
     <p>From fragmented marketplace transactions to rigorous visual discovery. Explore historical Brazilian commerce, measure fulfillment promises and interrogate an evaluated delivery-risk model—without confusing beautiful design with invented data.</p>
     <div className="welcome-cta"><button type="button" className="welcome-primary" onClick={()=>onNavigate('Overview')}>Launch the command center <ArrowRight size={19}/></button><button type="button" className="welcome-secondary" onClick={()=>onNavigate('Analytics Atlas')}><PlayCircle size={20}/> Explore {ATLAS_CHART_COUNT+NEW_CHART_COUNT} data-backed charts</button></div>
     <div className="welcome-trust"><span><CheckCircle2 size={15}/> Real historical Olist facts</span><span><LockKeyhole size={15}/> In-browser read-only SQL</span><span><BookOpen size={15}/> Traceable methodology</span></div>
   </div>
   <div className="welcome-visual">
     <div className="welcome-visual-top"><div><span className="welcome-visual-diamond"><Layers3 size={21}/></span><strong>INSIGHT ATLAS</strong></div><span className="welcome-verified"><i/> HISTORICAL DATA</span></div>
     <div className="welcome-number-grid"><div><span>ORDER FACTS</span><strong>{num(manifest?.warehouse.fact_orders)}</strong><small>Order-grain transactions</small></div><div><span>ANALYTICAL FIGURES</span><strong>{ATLAS_CHART_COUNT+NEW_CHART_COUNT}</strong><small>SQL-backed definitions</small></div><div><span>ITEM FACTS</span><strong>{num(manifest?.warehouse.fact_order_items)}</strong><small>Item-grain merchandise</small></div></div>
     <MiniHistory rows={monthly}/>
     {!pending && warehouseError && <div className="welcome-chart-error" role="alert">Warehouse data could not load. Open the command center to view the setup instructions: {warehouseError}</div>}
   <div className="welcome-visual-bottom"><span><ShieldCheck size={16}/> Sources before stories</span><button onClick={()=>onNavigate('Data Catalog')}>Explore lineage <ChevronRight size={17}/></button></div>
     {error&&<p className="welcome-chart-error">Monthly trend unavailable; the warehouse was not replaced with simulated values.</p>}
   </div>
  </div>
  <div className="welcome-proof"><div><strong>01.</strong><span>EXPLORE</span><p>Turn normalized orders into discoverable insights.</p></div><div><strong>02.</strong><span>COMPARE</span><p>Use cohorts, model diagnostics and geographic evidence.</p></div><div><strong>03.</strong><span>VERIFY</span><p>Trace figures to warehouse grains and documented exclusions.</p></div></div>
  <div className="welcome-section-header"><div><span>01 / CAPABILITIES</span><h2>A deeper view of <em>the market.</em></h2><p>Twelve focused workspaces, designed around evidence rather than filler. The existing premium interface remains exactly where you expect it.</p></div><button type="button" onClick={()=>onNavigate('Research Studio')}>Open research studio <ArrowRight size={17}/></button></div>
  <div className="welcome-feature-grid">{features.map(f=>{const Icon=f.icon;return <button type="button" key={f.name} className="welcome-feature" onClick={()=>onNavigate(f.page)}><span className="welcome-feature-icon"><Icon size={22}/></span><span className="welcome-feature-text"><strong>{f.name}</strong><small>{f.sub}</small></span><ArrowRight className="welcome-feature-arrow" size={19}/></button>})}</div>
  <section className="welcome-closer"><div><span><FlaskConical size={16}/> MADE FOR QUESTIONS WORTH TESTING</span><h2>Beautiful enough to explore.<br/><em>Careful enough to question.</em></h2><p>The interactive dashboard is a research instrument, not proof of journal acceptance or causality. Every chart has a real source, a labeled measurement, and limits worth understanding.</p><button type="button" onClick={()=>onNavigate('AI Studio')}>Inspect the AI evidence <ArrowDownRight size={19}/></button></div><div className="welcome-closer-art" aria-hidden="true"><div className="welcome-art-orbit a"/><div className="welcome-art-orbit b"/><div className="welcome-art-orbit c"/><span className="welcome-art-center"><BrainCircuit size={57}/></span></div></section>
  <div className="welcome-footnote"><span><Database size={16}/> Source: Brazilian E-Commerce Public Dataset by Olist. Observational, 2016–2018.</span><span>Built to be questioned, compared and reproduced.</span></div>
 </div>
}
