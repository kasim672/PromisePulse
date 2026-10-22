import {useEffect,useId,useMemo,useRef,useState} from 'react'
import type {CSSProperties} from 'react'
import {Activity,BarChart3,CalendarDays,CheckCircle2,ChevronRight,Database,Download,Filter,MapPinned,Microscope,TrendingUp} from 'lucide-react'
import type {Warehouse} from './db'
import type {RecordRow} from './types'
import {ATLAS_CHART_COUNT,ATLAS_GROUPS,ATLAS_STATES,atlasLabQueries,atlasQuery} from './atlasQueries'
import type {AtlasGroup,AtlasLens,AtlasMetric,AtlasState,AtlasYear} from './atlasQueries'

type QueryData={rows:RecordRow[];loading:boolean;error:string}
const empty:QueryData={rows:[],loading:true,error:''}
function numeral(value:unknown,unit:AtlasMetric['unit']='number'){
  if(value==null||value==='')return 'No data'
  const n=Number(value)
  if(!Number.isFinite(n))return 'No data'
  if(unit==='brl')return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2}).format(n)
  if(unit==='percent')return new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n)+'%'
  if(unit==='days')return new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n)+' days'
  return new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n)
}
function saveCsv(rows:RecordRow[],filename:string){
  if(!rows.length)return
  const keys=Object.keys(rows[0])
  const quote=(value:unknown)=>{
    const raw=String(value??'')
    // Escape spreadsheet-formula injection in exported descriptive labels.
    const safe=/^[\s]*[=+@-]/.test(raw)&&typeof value==='string'?"'"+raw:raw
    return '"'+safe.replaceAll('"','""')+'"'
  }
  const csv=[keys.map(quote).join(','),...rows.map(row=>keys.map(key=>quote(row[key])).join(','))].join('\r\n')
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a');a.href=url;a.download=filename+'.csv';a.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1500)
}
const dayLabels=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function labelFor(lens:AtlasLens,v:unknown){
  const s=String(v??'Unknown')
  return lens==='weekday'||lens==='laboratory'?dayLabels[Number(s)]??s:s
}
function MetricPlot({rows,metric,lens}:{rows:RecordRow[];metric:AtlasMetric;lens:AtlasLens}){
  const uid=useId().replace(/:/g,'')
  const [selected,setSelected]=useState<number|null>(null)
  const [chartMode,setChartMode]=useState<AtlasMetric['shape']>(metric.shape)
  useEffect(()=>{setSelected(null);setChartMode(metric.shape)},[metric.id,metric.shape])
  const n=rows.length
  const values=rows.map(r=>r[metric.field]==null?null:Number(r[metric.field])).map(v=>v!=null&&Number.isFinite(v)?v:null)
  const points=values.map((v,i)=>({valid:v!=null,value:v??0,label:labelFor(lens,rows[i].label),x:37+(i+.5)*(640-64)/Math.max(1,n),y:196-(v??0)/Math.max(1,...values.filter((p):p is number=>p!=null))*161}))
  const top=Math.max(1,...values.filter((p):p is number=>p!=null))
  const ix=Math.min(n-1,Math.max(0,selected??(n-1)))
  const chosen=n?rows[ix]:null
  const valid=points.filter(p=>p.valid)
  const path=points.map((p,i)=>(p.valid?(i===0||!points[i-1].valid?'M':'L')+p.x.toFixed(1)+' '+p.y.toFixed(1):'')).join(' ')
  const baseY=196
  const area=valid.length?path+' L '+valid[valid.length-1].x+' '+baseY+' L '+valid[0].x+' '+baseY+' Z':''
  const isBars=chartMode==='bars'
  return <div className="atlas-plot-wrap">
    <div className="atlas-chart-tools">
      <div className="atlas-chart-selector" aria-label={'Chart style for '+metric.title}>
        {(['bars','line','dots'] as const).map(mode=><button key={mode} type="button" className={chartMode===mode?'active':''}
          aria-pressed={chartMode===mode} title={'Display as '+mode} onClick={()=>setChartMode(mode)}>{mode==='bars'?'Bars':mode==='line'?'Line':'Dots'}</button>)}
      </div>
      <button className="atlas-export" type="button" onClick={()=>saveCsv(rows,'promisepulse-'+metric.id)} disabled={!n} title="Download computed aggregate CSV" aria-label={'Export '+metric.title+' CSV'}><Download size={15}/></button>
    </div>
    {n===0?<p className="atlas-empty">No observations for these filters. Try another period or state.</p>:<>
      <svg className="atlas-svg" viewBox="0 0 640 238" role="group" aria-label={'Interactive '+metric.title+'. Use Tab and Enter to inspect each aggregate.'}>
        <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--atlas-series)" stopOpacity=".23"/><stop offset="1" stopColor="var(--atlas-series)" stopOpacity=".015"/></linearGradient></defs>
        {[0,.5,1].map((t,i)=><g key={i}><line x1="32" x2="614" y1={35+t*161} y2={35+t*161} stroke="var(--atlas-grid)" strokeDasharray="3 7"/><text x="26" y={39+t*161} textAnchor="end" className="atlas-tick">{numeral(top*(1-t),metric.unit).slice(0,11)}</text></g>)}
        {chartMode==='area'&&area&&<path d={area} fill={'url(#'+uid+')'}/>}
        {(chartMode==='line'||chartMode==='area')&&<path d={path} stroke="var(--atlas-series)" strokeWidth="2.8" fill="none" strokeLinejoin="round" strokeLinecap="round"/>}
        {points.map((p,i)=>p.valid?
          isBars?<rect key={i} role="button" tabIndex={0} aria-label={p.label+': '+numeral(values[i],metric.unit)} x={p.x-((640-64)/Math.max(1,n))*.33} y={p.y} width={Math.max(2,((640-64)/Math.max(1,n))*.66)} height={Math.max(1,baseY-p.y)}
            fill={selected===i?'var(--atlas-selected)':'var(--atlas-series)'} rx="3" onFocus={()=>setSelected(i)} onMouseEnter={()=>setSelected(i)} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i)}}}><title>{p.label} · {numeral(values[i],metric.unit)}</title></rect>
          :<circle key={i} role="button" tabIndex={0} aria-label={p.label+': '+numeral(values[i],metric.unit)} cx={p.x} cy={p.y} r={selected===i?7:4.7} fill={selected===i?'var(--atlas-selected)':'var(--atlas-series)'} stroke="var(--atlas-surface)" strokeWidth="2"
            onFocus={()=>setSelected(i)} onMouseEnter={()=>setSelected(i)} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i)}}}><title>{p.label} · {numeral(values[i],metric.unit)}</title></circle>
        :null)}
        {n>0&&[0,Math.floor((n-1)/2),n-1].filter((v,i,a)=>a.indexOf(v)===i).map((i,j)=><text key={i} x={points[i].x} y="225" textAnchor={j===0?'start':j===2?'end':'middle'} className="atlas-tick">{points[i].label.length>13?points[i].label.slice(0,12)+'…':points[i].label}</text>)}
      </svg>
      <div className="atlas-selection" aria-live="polite"><span>{chosen?labelFor(lens,chosen.label):'Choose an observation'}</span><strong>{chosen?numeral(chosen[metric.field],metric.unit):'—'}</strong><span>{values.filter(v=>v!=null).length}/{n} bins measured</span></div>
      <details className="atlas-data-detail"><summary>Inspect {n} source aggregates</summary><div className="atlas-raw-table"><table><thead><tr>{Object.keys(rows[0]).map(x=><th key={x}>{x.replaceAll('_',' ')}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{Object.values(r).map((x,j)=><td key={j}>{x??'—'}</td>)}</tr>)}</tbody></table></div></details>
    </>}
  </div>
}
function ChartCard({rows,metric,lens,loading,error}:{rows:RecordRow[];metric:AtlasMetric;lens:AtlasLens;loading:boolean;error:string}){
  return <section className="pp-block atlas-chart-card" aria-label={metric.title}>
    <div className="atlas-chart-heading"><div><span className="atlas-mini-label">VISUAL ANALYSIS · {metric.id.toUpperCase().replaceAll('-',' ')}</span><h3>{metric.title}</h3><p>{metric.insight}</p></div><span className="atlas-chart-kind">{metric.unit==='brl'?'BRL':metric.unit==='percent'?'%':metric.unit==='days'?'DAYS':'COUNT'}</span></div>
    {loading?<div className="atlas-loading"><span className="spinner"/> Querying actual Parquet aggregates…</div>:error?<p className="atlas-error" role="alert">{error}</p>:<MetricPlot rows={rows} metric={metric} lens={lens}/>}
  </section>
}
type MatrixRow=RecordRow
function Matrix({rows,title,subtitle,kind}:{rows:MatrixRow[];title:string;subtitle:string;kind:'weekhour'|'statemonth'|'reviewlate'}){
  const [selection,setSelection]=useState<MatrixRow|null>(null)
  useEffect(()=>setSelection(null),[rows])
  const xs=useMemo(()=>Array.from(new Set(rows.map(r=>String(r.x)))).sort(),[rows])
  const ys=useMemo(()=>Array.from(new Set(rows.map(r=>String(r.y)))).sort(),[rows])
  const byCell=useMemo(()=>new Map(rows.map(r=>[String(r.y)+'|'+String(r.x),r])),[rows])
  const max=Math.max(1,...rows.map(r=>Number(r.orders)||0))
  return <section className="pp-block atlas-matrix-card">
    <div className="atlas-chart-heading"><div><span className="atlas-mini-label">CROSS-DIMENSIONAL ANALYSIS</span><h3>{title}</h3><p>{subtitle}</p></div><button className="atlas-export" title="Export matrix" aria-label={'Export '+title} onClick={()=>saveCsv(rows,'promisepulse-'+kind)} disabled={!rows.length}><Download size={16}/></button></div>
    {!rows.length?<p className="atlas-empty">No qualifying historical records for the selected filters.</p>:<>
      <div className="atlas-heatmap-scroll"><table className="atlas-matrix-table"><thead><tr><th scope="col">{kind==='statemonth'?'State':kind==='reviewlate'?'Review':'Day'}</th>{xs.map(x=><th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{ys.map(y=><tr key={y}><th scope="row">{kind==='weekhour'?labelFor('weekday',y):y}</th>{xs.map(x=>{
        const r=byCell.get(y+'|'+x),value=Number(r?.orders)||0,intensity=Math.round(12+83*Math.sqrt(value/max));
        return <td key={x}><button className="atlas-heat-cell" type="button" style={{'--atlas-intensity':intensity+'%'} as CSSProperties}
          aria-label={y+' by '+x+': '+value.toLocaleString()+' orders'} onClick={()=>setSelection(r??{y,x,orders:0})} title={y+' · '+x+': '+value.toLocaleString()+' orders'}>{value>0?value.toLocaleString():'·'}</button></td>
      })}</tr>)}</tbody></table></div>
      <div className="atlas-selection" aria-live="polite"><span>{selection?String(selection.y)+' × '+String(selection.x):'Select a matrix cell'}</span><strong>{selection?numeral(selection.orders):'—'} orders</strong><span>Historical order counts</span></div>
    </>}
  </section>
}
function Calibration({rows}:{rows:RecordRow[]}){
  const [selected,setSelected]=useState<number|null>(null)
  const data=rows.filter(r=>r.observed_pct!=null&&r.predicted_pct!=null)
  const index=selected??(data.length?data.length-1:0)
  return <section className="pp-block atlas-chart-card">
    <div className="atlas-chart-heading"><div><span className="atlas-mini-label">HELD-OUT CLASSIFICATION DIAGNOSTIC</span><h3>Prediction calibration by decile</h3><p>Mean estimated probability versus observed late frequency on the historical held-out set. The diagonal indicates perfect calibration, not measured performance.</p></div><button className="atlas-export" onClick={()=>saveCsv(rows,'promisepulse-risk-calibration')} disabled={!rows.length} title="Export decile table" aria-label="Export calibration table"><Download size={16}/></button></div>
    {!data.length?<p className="atlas-empty">No evaluated held-out predictions available.</p>:<>
      <svg viewBox="0 0 420 290" className="atlas-calibration" role="group" aria-label="Interactive observed versus predicted late delivery probability in held-out risk deciles">
        <line x1="44" y1="242" x2="370" y2="242" stroke="var(--atlas-grid)"/><line x1="44" y1="242" x2="44" y2="20" stroke="var(--atlas-grid)"/>
        <path d="M44 242 L266 20" fill="none" stroke="var(--atlas-grid)" strokeWidth="2" strokeDasharray="5 6"/>
        {data.map((r,i)=>{
          const x=44+Math.min(100,Math.max(0,Number(r.predicted_pct)))*2.22
          const y=242-Math.min(100,Math.max(0,Number(r.observed_pct)))*2.22
          return <circle key={i} role="button" tabIndex={0} aria-label={'Bin '+r.decile+' predicted '+r.predicted_pct+' percent, observed '+r.observed_pct+' percent, '+r.orders+' orders'} cx={x} cy={y} r={selected===i?9:7}
            fill={selected===i?'var(--atlas-selected)':'var(--atlas-series)'} stroke="var(--atlas-surface)" strokeWidth="2" onClick={()=>setSelected(i)} onFocus={()=>setSelected(i)} onMouseEnter={()=>setSelected(i)}
            onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i)}}}><title>{'Bin '+r.decile+' · '+r.orders+' orders · predicted '+r.predicted_pct+'% · observed '+r.observed_pct+'%'}</title></circle>
        })}
        <text x="208" y="275" className="atlas-tick" textAnchor="middle">Predicted risk (%)</text><text transform="translate(13 134) rotate(-90)" className="atlas-tick" textAnchor="middle">Observed late (%)</text>
        <text x="44" y="257" className="atlas-tick">0</text><text x="266" y="257" className="atlas-tick">100</text>
      </svg>
      <div className="atlas-selection" aria-live="polite"><span>{'Decile '+String(data[index].decile)}</span><strong>{numeral(data[index].observed_pct,'percent')} observed</strong><span>{numeral(data[index].predicted_pct,'percent')} predicted · {numeral(data[index].orders)} orders</span></div>
    </>}
    <p className="atlas-caveat">Risk chart is based on the model test cohort, not the selected order year. Small deciles and class imbalance require caution; no calibration improvement or causal claim is implied.</p>
  </section>
}
const GROUP_ICONS=[TrendingUp,CalendarDays,Activity,MapPinned,CheckCircle2,BarChart3,Database,Filter,Microscope]
export function AnalyticsAtlas({db}:{db:Warehouse}){
  const [lens,setLens]=useState<AtlasLens>('commerce')
  const [year,setYear]=useState<AtlasYear>('all')
  const [state,setState]=useState<AtlasState>('ALL')
  const [result,setResult]=useState<QueryData>(empty)
  const [matrix,setMatrix]=useState<Record<string,QueryData>>({})
  const cache=useRef(new Map<string,RecordRow[]>())
  const evaluated=db.manifest.model.status==='evaluated'
  const group=ATLAS_GROUPS.find(g=>g.id===lens) as AtlasGroup
  useEffect(()=>{
    let active=true
    setResult({rows:[],loading:true,error:''});setMatrix({})
    if(lens==='laboratory'){
      const queries=atlasLabQueries(year,state,evaluated)
      void (async()=>{
        for(const [key,sql] of Object.entries(queries)){
          if(!sql){if(active)setMatrix(prev=>({...prev,[key]:{rows:[],loading:false,error:'No held-out model is published for this dataset.'}}));continue}
          try{
            const id=lens+year+state+key
            const rows=cache.current.get(id)??await db.query(sql)
            cache.current.set(id,rows)
            if(active)setMatrix(prev=>({...prev,[key]:{rows,loading:false,error:''}}))
          }catch(e){if(active)setMatrix(prev=>({...prev,[key]:{rows:[],loading:false,error:String(e)}}))}
        }
      })()
    }else{
      try{
        const id=lens+year+state
        const cached=cache.current.get(id)
        if(cached){setResult({rows:cached,loading:false,error:''})}
        else void db.query(atlasQuery(lens,year,state,evaluated)).then(rows=>{
          cache.current.set(id,rows);if(active)setResult({rows,loading:false,error:''})
        }).catch(e=>{if(active)setResult({rows:[],loading:false,error:String(e)})})
      }catch(e){setResult({rows:[],loading:false,error:String(e)})}
    }
    return ()=>{active=false}
  },[db,lens,year,state,evaluated])
  const labKeys=['weekhour','statemonth','reviewlate','calibration'] as const
  const labInfo=[
    ['Purchase heatmap · weekday × hour','Orders by weekday and local timestamp hour.','weekhour'],
    ['State-by-month seasonality','Customer-state order counts over months, filtered by period.','statemonth'],
    ['Review × delivery outcome matrix','Only orders with recorded reviews and known late/on-time label.','reviewlate']
  ] as const
  return <div className="pp-home atlas-page">
    <div className="pp-page-top"><div><div className="pp-overline"><Microscope size={14}/> RESEARCH-GRADE EXPLORATORY WORKSPACE <span>/ ANALYTICS ATLAS</span></div>
      <h1>Explore every <em>dimension.</em></h1>
      <p>{ATLAS_CHART_COUNT} chart definitions across nine focused lenses. Real historical Olist aggregations, not simulated live shipping. The existing dashboard remains unchanged.</p></div>
      <span className="pp-historical"><span/> DESCRIPTIVE · 2016–2018</span>
    </div>
    <div className="pp-block atlas-topbar">
      <div className="atlas-filter"><label htmlFor="atlas-year">Purchase period</label><select id="atlas-year" value={year} onChange={e=>setYear(e.target.value as AtlasYear)}>{(['all','2016','2017','2018'] as const).map(v=><option key={v} value={v}>{v==='all'?'All years':v}</option>)}</select></div>
      <div className="atlas-filter"><label htmlFor="atlas-state">Customer state</label><select id="atlas-state" value={state} onChange={e=>setState(e.target.value as AtlasState)}>{ATLAS_STATES.map(x=><option key={x} value={x}>{x==='ALL'?'All Brazilian states':x}</option>)}</select></div>
      <div className="atlas-filter-note"><Filter size={18}/><span>Global filters apply to historical order and item lenses. Calibration is a fixed, held-out test cohort, optionally filtered by customer state.</span></div>
    </div>
    <div className="atlas-layout">
      <nav className="atlas-lenses" aria-label="Analytics lenses">{ATLAS_GROUPS.map((g,i)=>{const Icon=GROUP_ICONS[i];return <button type="button" key={g.id} className={'atlas-lens '+(g.id===lens?'active':'')} aria-current={g.id===lens?'page':undefined} onClick={()=>setLens(g.id)}><Icon size={17}/><span>{g.title}</span><strong>{g.metrics.length.toString().padStart(2,'0')}</strong></button>})}</nav>
      <div className="atlas-content">
        <div className="atlas-group-intro"><div><p>SELECTED ANALYSIS LENS</p><h2>{group.title}</h2><span>{group.subtitle}</span></div><div className="atlas-grain"><Database size={16}/>{group.grain}</div></div>
        {lens==='laboratory'?<div className="atlas-panel-grid atlas-lab-grid">
          {labInfo.map(([title,subtitle,key])=>{
            const dat=matrix[key]
            return !dat||dat.loading?<div className="pp-block atlas-loading" key={key}><span className="spinner"/> Computing {title}…</div>:
              dat.error?<div className="pp-block atlas-error" key={key} role="alert">{title}: {dat.error}</div>:
              <Matrix key={key} rows={dat.rows} title={title} subtitle={subtitle} kind={key}/>
          })}
          {!evaluated?<div className="pp-block atlas-empty">Risk calibration is unavailable because the published model has not been evaluated. No synthetic predictions are shown.</div>:
            !matrix.calibration?<div className="pp-block atlas-loading"><span className="spinner"/> Reading held-out calibration…</div>:
            matrix.calibration.error?<div className="pp-block atlas-error" role="alert">{matrix.calibration.error}</div>:
            <Calibration rows={matrix.calibration.rows}/>}
        </div>:<>
          <div className="atlas-count-line"><span>{group.metrics.length} interactive analyses</span><span>{result.loading?'Loading from Parquet…':result.error?'Query unavailable':result.rows.length+' aggregate bins'}</span></div>
          <div className="atlas-panel-grid">{group.metrics.map(metric=><ChartCard key={metric.id} rows={result.rows} metric={metric} lens={lens} loading={result.loading} error={result.error}/>)}</div>
        </>}
        <div className="atlas-methodology"><Database size={16}/><p><strong>Source and limits.</strong> Olist Brazilian historical e-commerce data (2016–2018), queried in-browser from DuckDB-Wasm Parquet. Metrics follow order-level or item-level grains as labeled. Descriptive associations are not causal findings; incomplete timestamps, reviews, rare states and the held-out prediction split introduce uncertainty. Download the underlying aggregates for verification.</p></div>
      </div>
    </div>
  </div>
}
