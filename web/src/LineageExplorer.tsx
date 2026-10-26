import {useState} from 'react'
import {ArrowRight,Database} from 'lucide-react'
import type {Manifest} from './types'
export function LineageExplorer({manifest}:{manifest:Manifest}){
 const stages=manifest.lineage
 const [selected,setSelected]=useState(0)
 const stage=stages[selected]
 return <section className="pp-block lineage-explorer" aria-label="Interactive ETL lineage">
  <div className="pp-block-header"><div><h3>Explore data lineage</h3><p>These steps come from the published warehouse manifest, not an invented live pipeline.</p></div></div>
  <div className="lineage-explorer-track">{stages.map((name,i)=><div key={i} className="lineage-explorer-node"><button type="button" aria-current={i===selected?'step':undefined} onClick={()=>setSelected(i)}><Database size={17}/><span>{name}</span></button>{i<stages.length-1&&<ArrowRight size={18} aria-hidden="true"/>}</div>)}</div>
  <div className="lineage-explorer-detail" aria-live="polite"><strong>{stage}</strong><p>{selected===0?'Original Olist CSV source files; provenance and row counts are in the catalog.':selected===stages.length-1?'Read-only historical aggregates run in your browser; data is not refreshed from a live order system.':'Recorded lineage stage from the dataset manifest. Follow the previous and next stages to see the processing order.'}</p>
  <span>Stage {selected+1} of {stages.length}</span></div>
 </section>
}
