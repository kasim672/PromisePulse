import {Database,RefreshCw} from 'lucide-react'
import type {WarehouseProgress} from './db'
export function WarehouseLoading({progress}:{progress:WarehouseProgress}){
 const count=progress.total||0
 const known=progress.phase==='tables'&&count>0
 const labels={manifest:'Reading historical dataset manifest',engine:'Starting DuckDB-Wasm in your browser',tables:progress.table?'Preparing '+progress.table.replaceAll('_',' ')+' data':'Registering warehouse files',ready:'Warehouse ready'}
 return <section className="warehouse-progress" role="status" aria-live="polite" aria-label="Warehouse loading progress">
  <div className="warehouse-progress-head"><Database size={29} aria-hidden="true"/><div><h2>Preparing your historical warehouse</h2><p>{labels[progress.phase]}</p></div></div>
  {known?<><progress aria-label="Warehouse files registered" value={progress.completed} max={count}/><p className="warehouse-progress-meta">{progress.completed} of {count} Parquet files registered</p></>:
    <p className="warehouse-progress-meta">This stage is preparing the browser engine; its duration cannot be measured in advance.</p>}
  <p>SQL analysis runs locally once the source files are ready. No live transactions are being fetched.</p>
 </section>
}
export function ResourceLoading({label,detail}:{label:string;detail:string}){
 return <section className="mining-progress" role="status" aria-live="polite" aria-label={label}>
   <h2>{label}</h2><p>{detail}</p><progress aria-label="Loading historical experiment data"/><p>Reading published offline experimental results; no algorithms are retrained.</p>
 </section>
}
export function ResourceError({title,detail,onRetry}:{title:string;detail:string;onRetry:()=>void}){
 return <section className="loading-error" role="alert">
  <h2>{title}</h2>
  <p>The requested historical evidence is unavailable. Existing results have not been replaced with sample values.</p>
  <button type="button" className="loading-retry" onClick={onRetry}><RefreshCw size={16} aria-hidden="true"/> Retry loading data</button>
  <details><summary>Technical details</summary><code>{detail}</code><p>Check the browser network requests and the files in <code>web/public/data/</code>.</p></details>
 </section>
}
