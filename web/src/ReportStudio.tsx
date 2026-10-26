import {useState} from 'react'
import {FileText,Printer,X} from 'lucide-react'
import type {Manifest} from './types'
type Part='warehouse'|'quality'|'model'|'method'
const labels:Record<Part,string>={warehouse:'Warehouse tables',quality:'Quality checks',model:'Delivery-risk evaluation',method:'Methods and limitations'}
const sections:Part[]=['warehouse','quality','model','method']
const fmt=(value:unknown)=>typeof value==='number'?value.toLocaleString('en-US',{maximumFractionDigits:3}):String(value??'—')
export function ReportStudio({manifest,onClose}:{manifest:Manifest;onClose:()=>void}){
 const [title,setTitle]=useState('PromisePulse — Historical Data Report')
 const [selected,setSelected]=useState<Part[]>(sections)
 const [printing,setPrinting]=useState(false)
 const toggle=(part:Part)=>setSelected(v=>v.includes(part)?v.filter(x=>x!==part):[...v,part])
 const print=()=>{setPrinting(true);requestAnimationFrame(()=>{window.print();setPrinting(false)})}
 return <div className="report-layer" role="presentation" onMouseDown={onClose}>
  <section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title" onMouseDown={e=>e.stopPropagation()}>
   <header className="report-controls"><div><h2 id="report-title"><FileText size={21}/> Create a report</h2><p>Choose evidence sections, then use your browser's “Save as PDF” print option.</p></div><button type="button" onClick={onClose} aria-label="Close report"><X size={19}/></button></header>
   <div className="report-options"><label>Report title<input value={title} maxLength={120} onChange={e=>setTitle(e.target.value)}/></label><fieldset><legend>Include</legend>{sections.map(part=><label key={part}><input type="checkbox" checked={selected.includes(part)} onChange={()=>toggle(part)}/>{labels[part]}</label>)}</fieldset><button type="button" onClick={print} disabled={!selected.length||!title.trim()||printing}><Printer size={17}/> Print / Save as PDF</button></div>
   <article className="report-print" aria-label="Report preview">
    <h1>{title.trim()||'Untitled report'}</h1><p><strong>Source:</strong> {manifest.dataset.name} ({manifest.dataset.period})</p><p>Provider: {manifest.dataset.provider}. Source: {manifest.dataset.url}</p>
    {selected.includes('warehouse')&&<section><h2>Warehouse tables</h2><table><thead><tr><th>Relation</th><th>Rows</th></tr></thead><tbody>{Object.entries(manifest.warehouse).map(([name,n])=><tr key={name}><td>{name}</td><td>{fmt(n)}</td></tr>)}</tbody></table></section>}
    {selected.includes('quality')&&<section><h2>Data quality</h2><table><thead><tr><th>Check</th><th>Result</th></tr></thead><tbody>{Object.entries(manifest.quality).map(([name,n])=><tr key={name}><td>{name.replaceAll('_',' ')}</td><td>{fmt(n)}</td></tr>)}</tbody></table></section>}
    {selected.includes('model')&&<section><h2>Model evaluation</h2><p>Evaluation status: {manifest.model.status}. Prediction time: {manifest.model.prediction_time||'Unavailable'}.</p><table><thead><tr><th>Metric</th><th>Held-out result</th></tr></thead><tbody>{Object.entries(manifest.model.model_metrics||{}).map(([name,n])=><tr key={name}><td>{name.replaceAll('_',' ')}</td><td>{fmt(n)}</td></tr>)}</tbody></table></section>}
    {selected.includes('method')&&<section><h2>Methods and limitations</h2><p>Historical observational Olist records, 2016–2018. Client-side OLAP queries run against exported Parquet datasets. Offline model evaluation is not live operational prediction. Association, segmentation and delivery analysis do not prove causation.</p><ol>{manifest.lineage.map((name,i)=><li key={i}>{name}</li>)}</ol></section>}
    <footer>PromisePulse · Generated from published source metadata · Verify values against the original data export before citing.</footer>
   </article>
  </section>
 </div>
}
