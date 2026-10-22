import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, Download, Globe2, MapPinned, Package, Sparkles, TrendingUp } from 'lucide-react'
import type { Warehouse } from './db'
import type { RecordRow } from './types'
import { dashboardQueries, insightQueries } from './premiumQueries'
import type { YearSelection } from './premiumQueries'
import { BRAZIL_STATE_SHAPES } from './brazilMap'

type Switch = (page: 'Overview' | 'OLAP Lab' | 'Risk Center' | 'Data Catalog' | 'Pipeline & Quality' | 'Intelligence') => void
type Dataset = { rows: RecordRow[]; busy: boolean; error: string }
const empty: Dataset = { rows: [], busy: true, error: '' }
function useQuery(db: Warehouse, sql: string): Dataset {
  const [data, setData] = useState<Dataset>(empty)
  useEffect(() => {
    let active = true
    setData({rows:[],busy:true,error:''})
    db.query(sql).then(rows=>{if(active)setData({rows,busy:false,error:''})})
      .catch(err=>{if(active)setData({rows:[],busy:false,error:String(err)})})
    return ()=>{active=false}
  },[db,sql])
  return data
}
const num=(value:unknown,dec=0)=>Number.isFinite(Number(value))?new Intl.NumberFormat('en-US',{maximumFractionDigits:dec}).format(Number(value)):'—'
const brl=(v:unknown)=>Number.isFinite(Number(v))?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v)):'—'
const brlCompact=(v:unknown)=>{
  const n=Number(v)
  if(!Number.isFinite(n))return '—'
  if(n>=1_000_000_000)return `R$ ${(n/1_000_000_000).toFixed(1)}B`
  if(n>=1_000_000)return `R$ ${(n/1_000_000).toFixed(1)}M`
  if(n>=1_000)return `R$ ${(n/1_000).toFixed(1)}K`
  return brl(n)
}
const compact=(v:unknown)=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(Number(v)):'—'
function Export({rows,name}:{rows:RecordRow[],name:string}) {
  const save=()=>{
    if(!rows.length)return
    const keys=Object.keys(rows[0]);const csv=[keys,...rows.map(row=>keys.map(k=>row[k]))].map(line=>line.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n')
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}))
    const a=document.createElement('a');a.href=url;a.download=name+'.csv';a.click();URL.revokeObjectURL(url)
  }
  return <button className="pp-icon-button" aria-label={'Download '+name+' CSV'} title="Export actual query results" disabled={!rows.length} onClick={save}><Download size={16}/></button>
}
function Block({title,subtitle,aside,children,className=''}:{title:string,subtitle?:string,aside?:ReactNode,children:ReactNode,className?:string}) {
  return <section className={'pp-block '+className}><div className="pp-block-header"><div><h3>{title}</h3>{subtitle&&<p>{subtitle}</p>}</div>{aside}</div>{children}</section>
}
function Loading({data,children}:{data:Dataset,children:ReactNode}){
  if(data.busy)return <div className="pp-placeholder"><span className="spinner"/> Querying historical warehouse…</div>
  if(data.error)return <p className="pp-error" role="alert">Unable to query: {data.error}</p>
  if(!data.rows.length)return <div className="pp-placeholder">No records for this period.</div>
  return <>{children}</>
}
function Trend({rows,value='revenue',color='lime',height=168}:{rows:RecordRow[],value?:string,color?:'lime'|'violet',height?:number}){
  const points=rows.map(r=>Number(r[value])||0)
  const peak=Math.max(1,...points)
  const coords=points.map((p,i)=>({x:10+i/Math.max(1,points.length-1)*780,y:height-18-p/peak*(height-36)}))
  if(!coords.length)return null
  const d=coords.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ')
  const shade=color==='lime'?'#237a48':'#1d4f87'
  return <div className="pp-trend"><svg viewBox={'0 0 800 '+height} role="img" aria-label={value+' trend from '+rows.length+' historical periods'} preserveAspectRatio="none">
    <defs><linearGradient id={'pp-fill-'+color} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={shade} stopOpacity=".2"/><stop offset="1" stopColor={shade} stopOpacity="0"/></linearGradient></defs>
    {[.25,.5,.75].map(n=><line key={n} x1="0" x2="800" y1={n*height} y2={n*height} stroke="#c6ced0" strokeDasharray="4 9" opacity=".7"/>)}
    <path d={d+' L '+coords[coords.length-1].x+' '+(height-8)+' L 10 '+(height-8)+' Z'} fill={'url(#pp-fill-'+color+')'}/>
    <path d={d} fill="none" stroke={shade} strokeWidth="3.25" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"/>
    {coords.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="11" fill="transparent"><title>{String(rows[i].period)}: {num(rows[i][value])}</title></circle>)}
  </svg><div className="pp-chart-dates"><span>{String(rows[0].period)}</span><span>{String(rows[Math.floor(rows.length/2)].period)}</span><span>{String(rows[rows.length-1].period)}</span></div></div>
}
function Bars({rows,label,value,format='number',limit=7}:{rows:RecordRow[],label:string,value:string,format?:'number'|'money'|'percent',limit?:number}){
  const top=rows.slice(0,limit),max=Math.max(1,...top.map(r=>Number(r[value])||0))
  return <div className="pp-bars">{top.map((r,i)=> <div className="pp-bar" key={i}>
    <div className="pp-bar-top"><span title={String(r[label])}>{String(r[label]??'Unknown').replaceAll('_',' ')}</span><strong>{format==='money'?brl(r[value]):format==='percent'?num(r[value],1)+'%':num(r[value])}</strong></div>
    <div className="pp-bar-track"><div style={{width:Math.max(0,Number(r[value])||0)/max*100+'%'}}/></div>
  </div>)}</div>
}
const palette=['#237a48','#1d4f87','#bcd4f2','#e4e7e4']
function Donut({rows}:{rows:RecordRow[]}){
  const items=rows.filter(r=>Number(r.orders)>0), total=items.reduce((s,r)=>s+Number(r.orders),0)
  let offset=0
  const gradient=items.map((r,i)=>{const pct=Number(r.orders)/Math.max(1,total)*100;const out=palette[i%palette.length]+' '+offset+'% '+(offset+pct)+'%';offset+=pct;return out}).join(', ')
  return <div className="pp-donut-layout"><div className="pp-donut" role="img" aria-label={items.map(r=>r.outcome+': '+num(r.orders)).join('; ')} style={{background:'conic-gradient('+gradient+')'}}><div><strong>{compact(total)}</strong><span>orders</span></div></div>
    <div className="pp-legend">{items.map((r,i)=><div key={String(r.outcome)}><span className="pp-legend-dot" style={{background:palette[i%palette.length]}}/><span>{String(r.outcome)}</span><b>{num(100*Number(r.orders)/Math.max(1,total),1)}%</b></div>)}</div>
  </div>
}
function MonthlySpark({data}:{data:RecordRow[]}){
  return <div className="pp-month-bars" role="img" aria-label="Monthly order activity bar chart">{data.slice(-18).map((r,i)=>{
    const max=Math.max(1,...data.slice(-18).map(x=>Number(x.orders)||0))
    return <div key={i} className="pp-month-col" title={r.period+': '+num(r.orders)+' orders'}><span style={{height:Math.max(3,Number(r.orders)/max*100)+'%'}}/></div>
  })}</div>
}
const heatColor=(value:number,max:number)=>{
  const t=max>0?Math.pow(Math.max(0,value)/max,.34):0
  const start=[230,239,243],end=[36,95,150]
  const rgb=start.map((v,i)=>Math.round(v+(end[i]-v)*t))
  return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`
}
function Geo({rows}:{rows:RecordRow[]}){
  const sorted=useMemo(()=>[...rows].sort((a,b)=>Number(b.orders)-Number(a.orders)),[rows])
  const [selected,setSelected]=useState<string|null>(null)
  const byState=useMemo(()=>new Map(rows.map(r=>[String(r.state),r])),[rows])
  const max=Math.max(1,...rows.map(r=>Number(r.orders)||0))
  const total=rows.reduce((sum,r)=>sum+(Number(r.orders)||0),0)
  const current=byState.get(selected??'')??sorted[0]
  const selectedCode=String(current?.state??'')
  const selectedShape=BRAZIL_STATE_SHAPES.find(shape=>shape.code===selectedCode)
  const rank=Math.max(1,sorted.findIndex(r=>String(r.state)===selectedCode)+1)
  const share=total?100*(Number(current?.orders)||0)/total:0
  const top=sorted.slice(0,5)
  return <div className="pp-map-wrap">
    <div className="pp-map-head"><span><span className="pp-live-dot"/> 27 Brazilian states · historical</span><span>2016–2018 Olist records</span></div>
    <div className="pp-map-layout">
      <div className="pp-map-plot">
        <div className="pp-map-meta"><span>BRAZIL</span><small>ORDER VOLUME CHOROPLETH</small></div>
        <svg className="pp-brazil-svg" viewBox="0 0 450 460" role="img" aria-label="Historical Olist order volume by Brazilian state">
          <defs>
            <filter id="pp-state-selected-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#1d4f87" floodOpacity=".34"/>
            </filter>
          </defs>
          {BRAZIL_STATE_SHAPES.map(shape=>{
            const row=byState.get(shape.code)
            const orders=Number(row?.orders)||0
            const isSelected=shape.code===selectedCode
            return <g key={shape.code} className={`pp-state-shape ${isSelected?'selected':''}`} role="button" tabIndex={0}
              aria-label={`${shape.name}: ${num(orders)} historical orders`}
              onClick={()=>setSelected(shape.code)}
              onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(shape.code)}}}>
              <path d={shape.d} fill={isSelected?'#bcd4f2':heatColor(orders,max)} filter={isSelected?'url(#pp-state-selected-glow)':undefined}/>
              <text x={shape.labelX} y={shape.labelY} textAnchor="middle">{shape.code}</text>
              <title>{shape.name} · {num(orders)} orders · {brl(row?.revenue)}</title>
            </g>
          })}
        </svg>
        <div className="pp-map-scale" aria-hidden="true"><span>Lower volume</span><i/><span>Higher volume</span></div>
      </div>
      <aside className="pp-map-inspector" aria-live="polite">
        <div className="pp-map-inspector-overline">STATE DETAIL <span>#{String(rank).padStart(2,'0')}</span></div>
        <div className="pp-map-state-title"><strong>{selectedCode||'—'}</strong><span>{selectedShape?.name??'Historical market'}</span></div>
        <div className="pp-map-primary"><strong>{num(current?.orders)}</strong><span>historical orders</span></div>
        <div className="pp-map-metrics">
          <div><span>Recorded payments</span><strong>{brl(current?.revenue)}</strong></div>
          <div><span>Share of orders</span><strong>{num(share,1)}%</strong></div>
          <div><span>Late-delivery rate</span><strong>{num(current?.late_pct,1)}%</strong></div>
        </div>
        <div className="pp-map-ranking"><div className="pp-map-ranking-head"><span>TOP MARKETS</span><span>ORDERS</span></div>{top.map(r=><button key={String(r.state)} type="button" className={String(r.state)===selectedCode?'active':''} onClick={()=>setSelected(String(r.state))}><span>{String(r.state)}</span><i><b style={{width:`${100*(Number(r.orders)||0)/max}%`}}/></i><strong>{compact(r.orders)}</strong></button>)}</div>
        <p className="pp-map-note">State boundaries are used for historical aggregation only. No live routes, vehicles or GPS positions are shown.</p>
      </aside>
    </div>
  </div>
}
const yearOptions:YearSelection[]=['all','2018','2017','2016']
export function PremiumOverview({db,onNavigate}:{db:Warehouse,onNavigate:Switch}){
  const [year,setYear]=useState<YearSelection>('all')
  const [filter,setFilter]=useState('All')
  const queries=useMemo(()=>dashboardQueries(year),[year])
  const kpi=useQuery(db,queries.summary),trends=useQuery(db,queries.monthly),regions=useQuery(db,queries.states),
    delivery=useQuery(db,queries.delivery),recent=useQuery(db,queries.recent),categories=useQuery(db,queries.categories)
  const row=kpi.rows[0]??{},filtered=recent.rows.filter(r=>filter==='All'||String(r.status)===filter.toLowerCase())
  return <div className="pp-home">
    <div className="pp-page-top"><div><div className="pp-overline"><Sparkles size={13}/> INSIGHT COMMAND CENTER <span>/ 01</span></div><h1>Every order tells <em>a story.</em></h1><p>Explore Brazil's historical e-commerce economy through a verified analytical warehouse.</p></div>
      <div className="pp-top-actions"><label className="pp-year"><CalendarDays size={15}/><span>Period</span><select aria-label="Analysis year" value={year} onChange={e=>setYear(e.target.value as YearSelection)}>{yearOptions.map(v=><option key={v} value={v}>{v==='all'?'All years (2016–2018)':v}</option>)}</select></label><span className="pp-historical"><span/> HISTORICAL DATA</span></div></div>
    <div className="pp-dashboard">
      <div className="pp-left">
        <div className="pp-kpis">
          <div className="pp-kpi pp-kpi-light"><span>Total orders <Package size={15}/></span><strong>{kpi.busy?'···':compact(row.orders)}</strong><small>Verified order-level facts <ArrowUpRight size={13}/></small></div>
          <div className="pp-kpi"><span>On-time delivery <CheckCircle2 size={15}/></span><strong>{kpi.busy?'···':num(row.ontime_pct,1)+'%'}</strong><small>Among known outcomes</small></div>
          <div className="pp-kpi pp-kpi-revenue"><span>Payment revenue <TrendingUp size={15}/></span><strong title={brl(row.revenue)}>{kpi.busy?'···':brlCompact(row.revenue)}</strong><small title={brl(row.revenue)}>Full total · {kpi.busy?'···':brl(row.revenue)}</small></div>
          <div className="pp-kpi"><span>Avg. delivery <Globe2 size={15}/></span><strong>{kpi.busy?'···':num(row.delivery_days,1)+'d'}</strong><small>Delivered orders with dates</small></div>
        </div>
        <Block title="Delivery outcomes" subtitle="Status across all historical orders" aside={<span className="pp-more">01 / 03</span>}>
          <Loading data={delivery}><Donut rows={delivery.rows}/></Loading>
        </Block>
        <Block title="Revenue performance" subtitle="Recorded payment totals · BRL" className="pp-revenue-card" aside={<Export rows={trends.rows} name="revenue-by-month"/>}>
          <Loading data={trends}>
            <div className="pp-revenue-top"><strong>{brl(row.revenue)}</strong><span><ArrowUpRight size={13}/> Historical total</span></div>
            <Trend rows={trends.rows}/></Loading>
        </Block>
        <button className="pp-upgrade" onClick={()=>onNavigate('OLAP Lab')}><div className="pp-upgrade-top"><span className="pp-upgrade-icon">✳</span><span>EXPLORE <ChevronRight size={15}/></span></div><strong>Explore the warehouse.</strong><small>Filter, slice, dice & drill-down <ArrowUpRight size={15}/></small></button>
      </div>
      <div className="pp-right">
        <Block title="Geographic delivery intelligence" subtitle="Historical order volume by customer state · select a state to inspect" className="pp-map-card" aside={<MapPinned size={20}/>}>
          <Loading data={regions}><Geo rows={regions.rows}/></Loading>
        </Block>
        <Block title="Recent historical orders" subtitle="Latest purchases within the selected period" className="pp-orders-card" aside={<Export rows={filtered} name="historical-orders"/>}>
          <div className="pp-order-filters">{['All','Delivered','Shipped','Canceled'].map(v=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{v}</button>)}</div>
          <Loading data={recent}><div className="pp-table-scroll"><table className="pp-order-table"><thead><tr><th>Order ID</th><th>Customer state</th><th>Payment</th><th>Purchased</th><th>Outcome</th></tr></thead><tbody>{filtered.length?filtered.map((r,i)=><tr key={i}><td title={String(r.order_id)}>{'#'+String(r.order_id).slice(0,9)}</td><td>{String(r.state??'—')}</td><td>{brl(r.value)}</td><td>{String(r.purchased)}</td><td><span className={'pp-state '+(r.outcome==='On time'?'on':r.outcome==='Delayed'?'late':'unknown')}><i/>{String(r.outcome)}</span></td></tr>):<tr><td colSpan={5}>No orders match this status.</td></tr>}</tbody></table></div></Loading>
        </Block>
      </div>
    </div>
    <div className="pp-bottom-grid">
      <Block title="Where customers shop" subtitle="Highest-volume customer states" aside={<Export rows={regions.rows} name="state-order-volume"/>}><Loading data={regions}><Bars rows={regions.rows} label="state" value="orders" limit={8}/></Loading></Block>
      <Block title="Top product categories" subtitle="Item-grain merchandise sales, not payment revenue" aside={<Export rows={categories.rows} name="category-sales"/>}><Loading data={categories}><Bars rows={categories.rows} label="category" value="sales" format="money" limit={8}/></Loading></Block>
      <Block title="Order activity" subtitle="Monthly order count, historical" aside={<ArrowDownRight size={16}/>}><Loading data={trends}><MonthlySpark data={trends.rows}/><div className="pp-callout"><strong>{compact(row.orders)} orders</strong><span>Browse annual variation with the period selector above.</span></div></Loading></Block>
    </div>
    <div className="pp-provenance"><CheckCircle2 size={16}/><span>Source: <a target="_blank" rel="noreferrer" href={db.manifest.dataset.url}>Brazilian E-Commerce Public Dataset by Olist</a>. Analyses run locally on historical Parquet facts. Brazilian state boundaries show historical aggregates. No live vehicles, routes or GPS positions are displayed.</span></div>
  </div>
}
export function PremiumIntelligence({db}:{db:Warehouse}){
 const [year,setYear]=useState<YearSelection>('all')
 const q=useMemo(()=>insightQueries(year),[year])
 const monthly=useQuery(db,q.deliveryMonths),fulfillment=useQuery(db,q.fulfillment),weekday=useQuery(db,q.weekday),
  review=useQuery(db,q.review),basket=useQuery(db,q.basket),frequency=useQuery(db,q.customerFrequency),
  repeat=useQuery(db,q.repeat),sellers=useQuery(db,q.sellers),freight=useQuery(db,q.freight)
 const risk=useQuery(db,db.manifest.model.status==='evaluated'?q.riskCalibration:'SELECT NULL AS decile WHERE FALSE')
 const repeatRow=repeat.rows[0]??{}
 return <div className="pp-insights pp-home">
  <div className="pp-page-top"><div><div className="pp-overline"><Sparkles size={13}/> WAREHOUSE INTELLIGENCE <span>/ 02</span></div><h1>The patterns <em>behind the numbers.</em></h1><p>Distinct distribution and segment views, derived from actual Olist warehouse facts.</p></div>
  <label className="pp-year"><CalendarDays size={15}/> <select aria-label="Intelligence analysis year" value={year} onChange={e=>setYear(e.target.value as YearSelection)}>{yearOptions.map(v=><option key={v} value={v}>{v==='all'?'All years (2016–2018)':v}</option>)}</select></label></div>
  <div className="pp-insights-hero"><div><span>BEHAVIORAL INTELLIGENCE</span><h2>See the signal.<br/><em>Not just the totals.</em></h2><p>Ten independent SQL lenses into delivery operations, buyers, logistics costs and marketplace composition.</p></div><div><span>REPEAT PURCHASE RATE</span><strong>{repeat.busy?'···':num(repeatRow.repeat_pct,2)+'%'}</strong><small>{num(repeatRow.repeat_customers)} repeat buyers / {num(repeatRow.customers)} distinct buyers in selected period</small></div></div>
  <div className="pp-bottom-grid pp-insights-grid">
   <Block title="Delivery performance over time" subtitle="Known on-time and late outcomes · by purchase month" aside={<Export rows={monthly.rows} name="delivery-trend"/>}><Loading data={monthly}><Trend rows={monthly.rows.map(r=>({...r,period:r.period,revenue:Number(r.ontime)+Number(r.late)}))}/><div className="pp-inline-legend"><span className="pp-dot-lime"/> Known delivery outcomes <span className="pp-dot-violet"/> Late counts in CSV export</div></Loading></Block>
   <Block title="Delivery duration distribution" subtitle="Elapsed calendar days from order to delivery" aside={<Export rows={fulfillment.rows} name="delivery-duration"/>}><Loading data={fulfillment}><Bars rows={fulfillment.rows} label="band" value="orders"/></Loading></Block>
   <Block title="Review score distribution" subtitle="Average scored reviews per order" aside={<Export rows={review.rows} name="review-distribution"/>}><Loading data={review}><Bars rows={review.rows} label="score" value="orders"/></Loading></Block>
   <Block title="Order value segments" subtitle="Recorded payment value bands · BRL" aside={<Export rows={basket.rows} name="basket-segments"/>}><Loading data={basket}><Bars rows={basket.rows} label="band" value="orders"/></Loading></Block>
   <Block title="Customers by purchase frequency" subtitle="Distinct repeat customers within selected period" aside={<Export rows={frequency.rows} name="customer-frequency"/>}><Loading data={frequency}><Bars rows={frequency.rows} label="purchases" value="customers"/></Loading></Block>
   <Block title="Seller footprint" subtitle="Item sales by seller location, item grain" aside={<Export rows={sellers.rows} name="seller-footprint"/>}><Loading data={sellers}><Bars rows={sellers.rows} label="state" value="sales" format="money"/></Loading></Block>
   <Block title="Freight cost distribution" subtitle="Recorded shipping charge per order" aside={<Export rows={freight.rows} name="freight-distribution"/>}><Loading data={freight}><Bars rows={freight.rows} label="band" value="orders"/></Loading></Block>
   <Block title="Purchase weekday patterns" subtitle="ISO weekday: 0 Sunday, 6 Saturday" aside={<Export rows={weekday.rows} name="weekday-demand"/>}><Loading data={weekday}><Bars rows={weekday.rows.map(r=>({...r,day:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][Number(r.weekday)]??String(r.weekday)}))} label="day" value="orders"/></Loading></Block>
   <Block title="Historical risk calibration" subtitle="Out-of-sample evaluation · probability buckets" aside={<Export rows={risk.rows} name="risk-calibration"/>}>{db.manifest.model.status!=='evaluated'?<div className="pp-placeholder">Training output not available.</div>:<Loading data={risk}><Bars rows={risk.rows.map(r=>({...r,decile:'Risk '+(Number(r.decile)*10)+'–'+(Number(r.decile)*10+10)+'%'}))} label="decile" value="observed_late_pct" format="percent" limit={10}/></Loading>}</Block>
  </div>
  <div className="pp-provenance"><CheckCircle2 size={16}/> Each graphic is computed by browser DuckDB. Revenue, payments and item sales use their appropriate fact grain. Risk calibration comes from historical held-out predictions and should not be interpreted as deployment performance.</div>
 </div>
}
