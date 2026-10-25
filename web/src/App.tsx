import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity, ArrowRight, BarChart3, BrainCircuit, Check,
  CircleHelp, Database, Download, ExternalLink, FileCheck2, FileSpreadsheet,
  Layers3, LayoutDashboard, Menu, Moon, RefreshCw, Search, ShieldCheck, Sun,
  Compass, UsersRound, Truck, FlaskConical, Sparkles,
  Table2, TrendingUp, X, GitFork, Network, ChartNoAxesCombined,
} from 'lucide-react'
import { loadWarehouse } from './db'
import type { Warehouse } from './db'
import type { RecordRow, Tab } from './types'
import { PremiumOverview, PremiumIntelligence } from './Premium'
import { AnalyticsAtlas } from './AnalyticsAtlas'
import { Welcome } from './Welcome'
import { ResearchWorkspace } from './ResearchWorkspace'
import { SyllabusLab } from './SyllabusLab'
import {ATLAS_CHART_COUNT} from './atlasQueries'
import {NEW_CHART_COUNT} from './researchQueries'
import { buildOlapQuery, CATEGORY_SQL, exploratoryRiskMetricsQuery, OVERVIEW_SQL, riskQuery, STATE_SQL, TRENDS_SQL, WAREHOUSE_TABLES } from './queries'
import type { OlapFilters, OlapOperation, WarehouseTable } from './queries'

const NAV: { label: Tab; icon: typeof LayoutDashboard; description: string }[] = [
  { label: 'Welcome', icon: Compass, description: 'Research landing and guided discovery' },
  { label: 'Overview', icon: LayoutDashboard, description: 'Executive overview' },
  { label: 'Intelligence', icon: BarChart3, description: 'Historical analytical intelligence' },
  { label: 'Analytics Atlas', icon: TrendingUp, description: `${ATLAS_CHART_COUNT} historical interactive analytical views` },
  { label: 'Customer Cohorts', icon: UsersRound, description: 'Six cohort and repeat-activity charts' },
  { label: 'Delivery Lab', icon: Truck, description: 'Six promised-window fulfillment charts' },
  { label: 'Research Studio', icon: FlaskConical, description: `Twelve basket/freight charts · ${NEW_CHART_COUNT} new research figures` },
  { label: 'AI Studio', icon: Sparkles, description: 'Transparent model analysis and six new evaluation charts' },
  { label: 'OLAP Lab', icon: Layers3, description: 'Run multidimensional SQL' },
  { label: 'Risk Center', icon: BrainCircuit, description: 'Historical mining results' },
  { label: 'Data Catalog', icon: Table2, description: 'Inspect the source & warehouse' },
  { label: 'Pipeline & Quality', icon: ShieldCheck, description: 'Inspect the lineage & tests' },
  { label: 'Warehouse & ETL', icon: Database, description: 'Syllabus 1: Dimensional schema, facts, ETL and quality' },
  { label: 'Data Lakes', icon: Layers3, description: 'Syllabus 2: Raw and curated source comparison' },
  { label: 'EDA & Preprocessing', icon: ChartNoAxesCombined, description: 'Syllabus 3: Descriptive statistics, distributions, correlation and cleaning' },
  { label: 'Classification Lab', icon: BrainCircuit, description: 'Syllabus 4: Decision Tree, Naive Bayes and regression experiments' },
  { label: 'Clustering Lab', icon: GitFork, description: 'Syllabus 5: K-Means, hierarchical clustering and dendrograms' },
  { label: 'Pattern Mining', icon: Network, description: 'Syllabus 6: Apriori, FP-Growth, Eclat and association rules' },
]

const nfmt = (value: unknown, digits = 0) => typeof value === 'number'
  ? new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value) : value == null ? '—' : String(value)
const money = (value: unknown) => `R$ ${nfmt(value, 2)}`
const pct = (value: unknown) => value == null ? '—' : `${nfmt(value, 1)}%`

function Panel({ title, sub, action, children, className = '' }: { title: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>
    <div className="panel-head"><div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>{action}</div>
    {children}
  </section>
}
function Loader({ title = 'Processing warehouse query…' }: { title?: string }) {
  return <div className="loading"><span className="spinner" /><span>{title}</span></div>
}
function Notice({ message, action }: { message: string; action?: ReactNode }) {
  return <div className="notice"><CircleHelp size={18} /><span>{message}</span>{action}</div>
}
function Empty({ title, description }: { title: string; description: string }) {
  return <div className="empty"><Database size={30} /><strong>{title}</strong><span>{description}</span></div>
}

function Table({ rows, max = 100 }: { rows: RecordRow[]; max?: number }) {
  if (rows.length === 0) return <Empty title="No matching rows" description="Try another filter or inspect the warehouse data." />
  const cols = Object.keys(rows[0]); const visible = rows.slice(0, max)
  return <div className="table-scroll"><table><thead><tr>{cols.map(c => <th key={c}>{c.replaceAll('_', ' ')}</th>)}</tr></thead>
    <tbody>{visible.map((r, i) => <tr key={i}>{cols.map(c => <td key={c} title={r[c] === null ? 'NULL' : String(r[c])}>{typeof r[c] === 'number' ? nfmt(r[c], 2) : String(r[c] ?? '—')}</td>)}</tr>)}</tbody></table>
    <div className="table-foot">Showing {visible.length.toLocaleString()} of {rows.length.toLocaleString()} returned rows</div></div>
}
export function BarChart({ data, x, y, currency = false }: { data: RecordRow[]; x: string; y: string; currency?: boolean }) {
  const items = data.slice(0, 12)
  const max = Math.max(1, ...items.map(row => Number(row[y]) || 0))
  if (!items.length) return <Empty title="No chart data" description="Generate warehouse exports to view trends." />
  return <div className="bar-chart">{items.map((row, idx) => {
    const value = Number(row[y]) || 0
    return <div className="bar-item" key={idx}>
      <div className="bar-label"><span title={String(row[x])}>{String(row[x] ?? 'Unknown')}</span><span>{currency ? money(value) : nfmt(value)}</span></div>
      <div className="bar-rail"><span style={{ width: `${Math.max(.2, value / max * 100)}%` }} /></div>
    </div>
  })}</div>
}
export function RevenueChart({ rows }: { rows: RecordRow[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const data = rows.filter(r => Number.isFinite(Number(r.payment_revenue)))
  if (!data.length) return <Empty title="No monthly revenue data" description="Run the real-data export to populate this chart." />
  const width = 840, height = 252, top = 24, bottom = 216, left = 15, right = 825
  const max = Math.max(1, ...data.map(r => Number(r.payment_revenue))) * 1.14
  const coords = data.map((r, i) => ({
    x: left + i / Math.max(1, data.length - 1) * (right - left),
    y: bottom - Number(r.payment_revenue) / max * (bottom - top),
  }))
  const line = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const area = `${line} L ${coords[coords.length - 1].x} ${bottom} L ${coords[0].x} ${bottom} Z`
  const index = selected ?? data.length - 1
  const point = coords[index]
  return <div className="revenue-chart">
    <div className="chart-highlight"><div><span className="chart-highlight-label">Selected month</span><strong>{money(data[index].payment_revenue)}</strong><span className="chart-period">{String(data[index].period)}</span></div><span className="chart-key"><i/> Payment revenue</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} className="revenue-svg" role="img" aria-label="Revenue by month; select a point to view its exact value">
      <defs><linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--pp-chart-blue)" stopOpacity=".19"/><stop offset="100%" stopColor="#2563EB" stopOpacity="0"/></linearGradient></defs>
      {[0,.25,.5,.75,1].map((v,i) => <line key={i} x1="15" x2="825" y1={top+(bottom-top)*v} y2={top+(bottom-top)*v} stroke="var(--pp-chart-grid)" strokeDasharray={i===4?'0':'5 7'}/>)}
      <path d={area} fill="url(#revenueArea)"/><path d={line} stroke="var(--pp-chart-blue)" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1={point.x} x2={point.x} y1={top} y2={bottom} stroke="var(--pp-chart-sky)" strokeDasharray="4 5" />
      {coords.map((c,i) => <circle key={i} cx={c.x} cy={c.y} r={i===index?6:9} fill={i===index?'var(--pp-chart-blue)':'transparent'} stroke={i===index?'white':'transparent'} strokeWidth="3" role="button" tabIndex={0} aria-label={`${String(data[i].period)} ${money(data[i].payment_revenue)}`} onFocus={()=>setSelected(i)} onMouseEnter={()=>setSelected(i)} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i)}}}/>) }
    </svg>
    <div className="chart-axis"><span>{String(data[0].period)}</span><span>{String(data[Math.floor((data.length-1)/2)].period)}</span><span>{String(data[data.length-1].period)}</span></div>
  </div>
}
function downloadCsv(rows: RecordRow[], filename: string) {
  if (!rows.length) return
  const cols = Object.keys(rows[0]); const quote = (s: unknown) => `"${String(s ?? '').replaceAll('"', '""')}"`
  const csv = [cols.map(quote).join(','), ...rows.map(r => cols.map(k => quote(r[k])).join(','))].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
function useSql(db: Warehouse | null, sql: string) {
  const [rows, setRows] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    if (!db) return
    setLoading(true); setError('')
    db.query(sql).then(result => { if (active) setRows(result) }).catch(e => { if (active) setError(String(e)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [db, sql])
  return { rows, loading, error }
}

export function Overview({ db, onNavigate }: { db: Warehouse; onNavigate: (tab: Tab) => void }) {
  const kpis = useSql(db, OVERVIEW_SQL)
  const trends = useSql(db, TRENDS_SQL)
  const categories = useSql(db, CATEGORY_SQL)
  const states = useSql(db, STATE_SQL)
  const row: RecordRow = kpis.rows[0] ?? {}
  return <div className="content-stack">
    <div className="section-eyebrow"><span className="eyebrow-rule"/> HISTORICAL BUSINESS INTELLIGENCE <span className="eyebrow-index">/ 01</span></div>
    <div className="intro hero-intro"><div><h2>Make sense of <span className="accent-text">every order.</span></h2><p>From raw transactions to meaningful decisions. Explore a real e-commerce warehouse, question the data with SQL, and investigate historical delivery risk.</p><div className="hero-actions"><button className="primary-btn hero-button" onClick={() => onNavigate('OLAP Lab')}>Explore the warehouse <ArrowRight size={17}/></button><button className="outline-btn" onClick={() => onNavigate('Data Catalog')}>View data sources <ExternalLink size={16}/></button></div></div><div className="hero-meta"><span className="meta-overline">THE DATASET</span><strong>2016<span>—</span>2018</strong><div className="hero-meta-row"><span className="hero-meta-dot"/> Brazilian E-Commerce · Olist</div><div className="hero-meta-caption">Real historical transactions, not a live service.</div></div></div>
    {kpis.error && <Notice message={kpis.error} />}
    <div className="kpi-grid">
      {[
        { title: 'Total orders', value: nfmt(row.total_orders), icon: FileCheck2, note: 'Distinct order-level facts' },
        { title: 'Payment revenue', value: money(row.payment_revenue), icon: TrendingUp, note: 'Payments aggregated per order' },
        { title: 'Avg order value', value: money(row.avg_order_value), icon: BarChart3, note: 'From recorded payment values' },
        { title: 'Late delivery rate', value: pct(row.late_rate_pct), icon: Activity, note: 'Only known delivery outcomes' },
      ].map(k => <div key={k.title} className="kpi-card"><div className="kpi-top"><span>{k.title}</span><k.icon size={18}/></div><div className="kpi-value">{kpis.loading ? '···' : k.value}</div><div className="kpi-note"><span className="green-dot" /> {k.note}</div></div>)}
    </div>
    <div className="two-col wide-left">
      <Panel title="Revenue trend" sub="Monthly payments, aggregated from order facts" action={<span className="micro-tag">SQL · GROUP BY</span>}>
        {trends.loading ? <Loader/> : <RevenueChart rows={trends.rows}/>}
      </Panel>
      <Panel title="Product categories" sub="Item sales, not double-counted payment revenue" action={<span className="micro-tag">ITEM GRAIN</span>}>
        {categories.loading ? <Loader/> : <BarChart data={categories.rows.slice(0, 7)} x="category" y="item_sales" currency />}
      </Panel>
    </div>
    <div className="two-col">
      <Panel title="Geographic footprint" sub="Order volume by customer state"><div className="geo-list">{states.loading ? <Loader/> : <BarChart data={states.rows.slice(0, 7)} x="state" y="orders" />}</div></Panel>
      <Panel title="How this works" sub="Academic data warehouse evidence">
        <div className="evidence-list"><div><Check size={16}/><span>CSV source records processed by DuckDB ETL</span></div><div><Check size={16}/><span>Separate fact_orders and fact_order_items tables</span></div><div><Check size={16}/><span>SQL aggregations executed in-browser with DuckDB-Wasm</span></div><div><Check size={16}/><span>Chronologically evaluated data mining (when trained)</span></div><div><Check size={16}/><span>Data source and quality counts available in the catalog</span></div></div>
        <div className="text-link" aria-label="Dataset source">Source: <a href={db.manifest.dataset.url} target="_blank" rel="noreferrer">Olist on Kaggle <ExternalLink size={12}/></a></div>
      </Panel>
    </div>
  </div>
}

const OLAP_OPERATIONS: OlapOperation[] = ['Roll-up', 'Drill-down', 'Slice', 'Dice', 'Pivot']
const OP_DESCRIPTION: Record<OlapOperation, string> = {
  'Roll-up': 'Summarize orders and revenue by state and month, including totals.',
  'Drill-down': 'Explore monthly order and revenue trends within a state.',
  'Slice': 'Compare order statuses within your selected state.',
  'Dice': 'Compare statuses across two selected states and a date range.',
  'Pivot': 'Compare the monthly order counts of two states side by side.',
}
function OlapLab({ db }: { db: Warehouse }) {
  const [op, setOp] = useState<OlapOperation>('Roll-up')
  const [filter, setFilter] = useState<OlapFilters>({ start: '2016-01-01', end: '2018-12-31', state: 'SP', secondState: 'RJ' })
  const [error, setError] = useState('')
  const [results, setResults] = useState<RecordRow[]>([])
  const [working, setWorking] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  // Keep SQL behind the interface: changing any filter refreshes only the results.
  const sql = useMemo(() => { try { return buildOlapQuery(op, filter) } catch (e) { return String(e) } }, [op, filter])
  useEffect(() => {
    let active = true
    setError('')
    setResults([])
    setHasLoaded(false)
    setWorking(true)
    if (!sql.startsWith('SELECT')) {
      setError(sql)
      setWorking(false)
      return () => { active = false }
    }
    void db.query(sql)
      .then(rows => { if (active) { setResults(rows); setHasLoaded(true) } })
      .catch(e => { if (active) setError(String(e)) })
      .finally(() => { if (active) setWorking(false) })
    return () => { active = false }
  }, [db, sql])
  return <div className="content-stack">
    <div className="section-eyebrow"><Layers3 size={14}/> INTERACTIVE DATA EXPLORER</div>
    <div className="intro"><div><h2>Explore data. <span className="accent-text">Find the patterns.</span></h2><p>Choose an analysis and adjust the filters. Results update automatically from historical warehouse records, without needing to write queries.</p></div><div className="year-pill"><Database size={15}/> Olist · 2016–2018</div></div>
    <div className="olap-ops" role="group" aria-label="Analysis operation">{OLAP_OPERATIONS.map(item => <button key={item} type="button" aria-pressed={op === item} className={`op-tab ${op === item ? 'selected' : ''}`} onClick={() => setOp(item)}>{item}</button>)}</div>
    <Panel title="Filters" sub={OP_DESCRIPTION[op]} action={<span className="micro-tag">AUTO REFRESH</span>}>
      <div className="filter-grid">
        <label>From<input type="date" value={filter.start} onChange={e => setFilter(s => ({ ...s, start: e.target.value }))}/></label>
        <label>To<input type="date" value={filter.end} onChange={e => setFilter(s => ({ ...s, end: e.target.value }))}/></label>
        <label>State<select value={filter.state} onChange={e => setFilter(s => ({ ...s, state: e.target.value }))}>{['SP','RJ','MG','RS','PR','BA','SC','DF','GO','PE'].map(s => <option key={s}>{s}</option>)}</select></label>
        <label>Compare with<select value={filter.secondState} onChange={e => setFilter(s => ({ ...s, secondState: e.target.value }))}>{['RJ','SP','MG','RS','PR','BA','SC','DF','GO','PE'].map(s => <option key={s}>{s}</option>)}</select></label>
      </div>
      {error && <Notice message={error}/>}
    </Panel>
    <Panel title="Results" sub={hasLoaded ? `${results.length} rows · Historical Olist warehouse` : 'Updates automatically when you change filters'} action={<button className="ghost-btn" disabled={working || !results.length} onClick={() => downloadCsv(results, `promisepulse-${op.toLowerCase()}.csv`)}><Download size={15}/> Export CSV</button>}>
      {working ? <Loader title="Updating results…"/> : !error ? <Table rows={results} /> : <Empty title="No results to display" description="Correct the filters to see your data."/>}
    </Panel>
  </div>
}

function RiskCenter({ db }: { db: Warehouse }) {
  const trained = db.manifest.model.status === 'evaluated'
  const [threshold, setThreshold] = useState(db.manifest.model.threshold ?? 0.5)
  const sql = useMemo(() => riskQuery(threshold), [threshold])
  const { rows, loading, error } = useSql(trained ? db : null, sql)
  const exploratory = useSql(trained ? db : null, useMemo(() => exploratoryRiskMetricsQuery(threshold), [threshold]))
  const confusion: RecordRow = exploratory.rows[0] ?? {}
  const metrics = db.manifest.model.model_metrics
  const baseline = db.manifest.model.baseline_metrics
  return <div className="content-stack">
    <div className="section-eyebrow"><BrainCircuit size={14}/> PREDICTIVE DATA MINING</div>
    <div className="intro"><div><h2>Understand the <span className="accent-text">risk.</span></h2><p>Historical out-of-sample predictions, with validation-selected threshold and true outcomes.</p></div><span className="year-pill">{trained ? 'EVALUATED · HISTORICAL' : 'NOT YET TRAINED'}</span></div>
    {!trained ? <Panel title="Real model output not available"><Empty title="The model has not been trained" description={db.manifest.model.reason ?? 'Run the export with --train using the official Olist CSV files. The dashboard never fabricates risk scores.'}/><pre className="terminal-code">python scripts/build_web_data.py --raw-dir data/raw --train</pre></Panel> : <>
      <div className="kpi-grid three">
        <div className="kpi-card"><div className="kpi-top">Model F1 <BrainCircuit size={17}/></div><div className="kpi-value">{nfmt(metrics?.f1, 3)}</div><div className="kpi-note">Held-out test period</div></div>
        <div className="kpi-card"><div className="kpi-top">Recall <Activity size={17}/></div><div className="kpi-value">{pct(Number(metrics?.recall ?? 0) * 100)}</div><div className="kpi-note">Fraction of late orders caught</div></div>
        <div className="kpi-card"><div className="kpi-top">PR-AUC <TrendingUp size={17}/></div><div className="kpi-value">{nfmt(metrics?.pr_auc, 3)}</div><div className="kpi-note">Rare-event performance</div></div>
      </div>
      <div className="two-col">
        <Panel title="Operating threshold" sub="Adjust the investigated risk queue; model evaluation above remains at the validation-selected threshold">
          <div className="threshold"><strong>{Math.round(threshold * 100)}%</strong><input aria-label="Risk score threshold" type="range" min="0" max="100" step="1" value={Math.round(threshold * 100)} onChange={e => setThreshold(Number(e.target.value) / 100)}/><div className="muted">Only historical test-set orders with predicted late-delivery probability at or above this value.</div>
          <div className="metric-grid exploratory-grid"><div>True positives<strong>{nfmt(confusion.true_positives)}</strong></div><div>False positives<strong>{nfmt(confusion.false_positives)}</strong></div><div>False negatives<strong>{nfmt(confusion.false_negatives)}</strong></div><div>True negatives<strong>{nfmt(confusion.true_negatives)}</strong></div></div>
          <p className="fineprint">This confusion matrix is recalculated by SQL in your browser. It is exploratory; the official test metrics use the threshold chosen on validation only.</p>
          </div>
        </Panel>
        <Panel title="Model evaluation" sub="Held-out test period vs dummy baseline"><div className="metric-grid"><div>Test orders<strong>{nfmt(db.manifest.model.test_rows)}</strong></div><div>Precision<strong>{nfmt(metrics?.precision,3)}</strong></div><div>Baseline F1<strong>{nfmt(baseline?.f1,3)}</strong></div><div>Chosen threshold<strong>{pct(Number(db.manifest.model.threshold) * 100)}</strong></div></div><p className="fineprint">Input features: purchase date, destination state, item count/value, freight, and promised delivery window. No actual delivery dates or review scores are used as inputs.</p></Panel>
      </div>
      <Panel title="Risk-ranked order investigation" sub="Recorded outcomes come from later historical delivery events, never from a live logistics service" action={<button className="ghost-btn" disabled={!rows.length} onClick={() => downloadCsv(rows,'promisepulse-historical-risk.csv')}><Download size={15}/> CSV</button>}>
        {error && <Notice message={error}/>} {loading ? <Loader/> : <Table rows={rows} max={250}/>}
      </Panel>
      <Notice message="Interpret predicted probabilities as model estimates on historical data, not guaranteed real-world probabilities or causal explanations." />
    </>}
  </div>
}

function DataCatalog({ db }: { db: Warehouse }) {
  const [table, setTable] = useState<WarehouseTable>('fact_orders')
  const preview = useSql(db, `SELECT * FROM ${table} LIMIT 25`)
  return <div className="content-stack">
    <div className="section-eyebrow"><FileSpreadsheet size={14}/> PROVENANCE & SCHEMA</div>
    <div className="intro"><div><h2>Know your <span className="accent-text">data.</span></h2><p>See exactly where the data came from, how many records were processed, and which warehouse tables power the dashboard.</p></div></div>
    <Panel title="Official dataset" sub="Direct attribution for your academic submission">
      <div className="source-hero"><div className="source-logo">O</div><div><strong>{db.manifest.dataset.name}</strong><span>{db.manifest.dataset.provider} · {db.manifest.dataset.period} · {db.manifest.dataset.license}</span></div><a href={db.manifest.dataset.url} target="_blank" rel="noreferrer" className="ghost-btn">View source <ExternalLink size={15}/></a></div>
      <div className="fineprint">Data is anonymized, historical, and used for academic analysis. Keep original attribution and comply with its noncommercial/share-alike license.</div>
    </Panel>
    <Panel title="Source CSV files" sub="Actual input files counted by the Python warehouse builder">
      <div className="file-grid">{db.manifest.source_files.map(f => <div className="file-card" key={f.table}><FileSpreadsheet size={19}/><div><strong>{f.table}</strong><span>{f.file}</span></div><div className="file-count">{nfmt(f.rows)} <small>rows</small></div></div>)}</div>
    </Panel>
    <Panel title="Interactive warehouse browser" sub="SQL query against real Parquet tables in your browser" action={<span className="micro-tag">NO DATABASE SERVER</span>}>
      <div className="table-selector"><label>Choose table<select value={table} onChange={e => setTable(e.target.value as WarehouseTable)}>{WAREHOUSE_TABLES.map(t => <option key={t}>{t}</option>)}</select></label><span>{nfmt(db.manifest.warehouse[table])} total rows</span></div>
      <pre className="sql-code compact"><code>SELECT * FROM {table} LIMIT 25</code></pre>
      {preview.loading ? <Loader/> : <Table rows={preview.rows} max={25} />}
    </Panel>
  </div>
}

function PipelineQuality({ db }: { db: Warehouse }) {
  const quality = db.manifest.quality
  const integrity = ['duplicate_order_keys', 'duplicate_item_keys']
  const allGood = integrity.every(key => Number(quality[key]) === 0)
  return <div className="content-stack">
    <div className="section-eyebrow"><ShieldCheck size={14}/> DATA ENGINEERING EVIDENCE</div>
    <div className="intro"><div><h2>Built on <span className="accent-text">evidence.</span></h2><p>Inspectable ETL lineage, verified table grains, and the quality checks produced during data preparation.</p></div><div className={`status-pill ${allGood ? 'positive' : 'negative'}`}>{allGood ? <Check size={14}/> : <X size={14}/>} {allGood ? 'Fact keys verified' : 'Review integrity checks'}</div></div>
    <Panel title="Data lineage" sub="Offline build produces static exports; browser SQL runs live during presentation">
      <div className="lineage">{db.manifest.lineage.map((stage,i) => <div className="lineage-node" key={stage}><span>{String(i+1).padStart(2, '0')}</span><strong>{stage}</strong>{i < db.manifest.lineage.length-1 && <ArrowRight size={15}/>}</div>)}</div>
    </Panel>
    <div className="two-col">
      <Panel title="Warehouse row counts" sub="Actual record counts after the ETL"><div className="stat-list">{Object.entries(db.manifest.warehouse).map(([key,val]) => <div key={key}><span><Database size={14}/>{key}</span><strong>{nfmt(val)}</strong></div>)}</div></Panel>
      <Panel title="Quality assertions" sub="Generated by reproducible SQL checks"><div className="stat-list">{Object.entries(quality).filter(([, v]) => typeof v === 'number').map(([key,val]) => <div key={key}><span><FileCheck2 size={14}/>{key.replaceAll('_', ' ')}</span><strong>{nfmt(val)}</strong></div>)}</div></Panel>
    </div>
    <Panel title="Reproduce the pipeline" sub="Execute ETL and chronological mining offline on real local source CSV files">
      <pre className="terminal-code">{`# 1. Build a dimensional warehouse from the official Kaggle CSVs\npython scripts/build_web_data.py --raw-dir data/raw --train\n\n# 2. Start the browser-based SQL dashboard\ncd web && npm install && npm run dev`}</pre>
      <p className="fineprint">Generated at {new Date(db.manifest.generated_at).toLocaleString()}. ETL, warehouse construction, and model training happen during the offline build, while OLAP query operations run in-browser on every interaction.</p>
    </Panel>
  </div>
}

type Theme = 'light' | 'dark'
const THEME_KEY = 'promisepulse-theme'

function initialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Private browsing can block storage; theme still works in memory. */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [active, setActive] = useState<Tab>('Welcome')
  const [db, setDb] = useState<Warehouse | null>(null)
  const [loadError, setLoadError] = useState('')
  const [pending, setPending] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [navQuery, setNavQuery] = useState('')
  const [reloading, setReloading] = useState(false)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d1018' : '#efefec')
    try { window.localStorage.setItem(THEME_KEY, theme) } catch { /* Non-persistent fallback. */ }
  }, [theme])
  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key === THEME_KEY && (event.newValue === 'dark' || event.newValue === 'light')) {
        setTheme(event.newValue)
      }
    }
    window.addEventListener('storage', syncTheme)
    return () => window.removeEventListener('storage', syncTheme)
  }, [])
  useEffect(() => {
    let alive = true; let current: Warehouse | null = null
    loadWarehouse().then(warehouse => { current = warehouse; if (alive) setDb(warehouse); else void warehouse.close() }).catch(e => { if (alive) setLoadError(String(e)) }).finally(() => { if (alive) setPending(false) })
    return () => { alive = false; if (current) void current.close() }
  }, [reloading])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(current => !current)
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  const matchingNav = NAV.filter(item => (item.label + ' ' + item.description).toLowerCase().includes(navQuery.trim().toLowerCase()))
  const changePage = (tab: Tab) => {
    setActive(tab)
    setMobileNav(false)
    setSearchOpen(false)
    setNavQuery('')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({top:0,behavior:reduced?'auto':'smooth'})
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header">
      <div className="header-inner">
        <button className="brand" aria-label="PromisePulse landing page" onClick={() => changePage('Welcome')}><img className="brand-logo-image" src="/promisepulse-logo.webp" alt="PromisePulse" /></button>
        
        <div className="header-actions"><button type="button" className="theme-toggle" onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}><span className="theme-toggle-icon">{theme === 'dark' ? <Sun size={17} aria-hidden="true"/> : <Moon size={17} aria-hidden="true"/>}</span><span className="theme-toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span></button><button type="button" className="header-search" onClick={() => setSearchOpen(true)} aria-label="Search pages, Ctrl or Command plus K"><Search size={16} aria-hidden="true"/><span>Search</span><kbd>⌘K</kbd></button><span className="header-version"><span className={`header-online ${db ? '' : 'offline'}`}/>{db ? 'WAREHOUSE CONNECTED' : pending ? 'INITIALIZING' : 'DATA NOT LOADED'}</span><button className="header-cta" onClick={()=>changePage('OLAP Lab')}>Explore data <ArrowRight size={15}/></button><button className="menu-toggle" aria-label={mobileNav?'Close navigation':'Open navigation'} aria-expanded={mobileNav} onClick={()=>setMobileNav(s=>!s)}>{mobileNav?<X size={21}/>:<Menu size={21}/>}</button></div>
      </div>
      <nav className={`main-nav ${mobileNav?'show':''}`} aria-label="Main navigation">{NAV.map(item => { const Icon = item.icon; return <button type="button" key={item.label} aria-label={item.label} data-label={item.label} aria-current={active===item.label?'page':undefined} className={`header-nav-item ${active===item.label?'active':''}`} title={item.description} onClick={()=>changePage(item.label)}><Icon size={19} aria-hidden="true"/><span className="nav-label">{item.label}</span></button> })}</nav>
    </header>
    {searchOpen && <div className="command-overlay" onMouseDown={() => setSearchOpen(false)}>
      <div className="command-dialog" role="dialog" aria-modal="true" aria-label="Find a PromisePulse section" onMouseDown={event => event.stopPropagation()}>
        <div className="command-search"><Search size={20} aria-hidden="true"/><input autoFocus value={navQuery} onChange={event => setNavQuery(event.target.value)} placeholder="Search pages, insights, warehouse tools..." aria-label="Search sections"/><kbd>ESC</kbd></div>
        <div className="command-section-label">JUMP TO A WORKSPACE</div>
        <div className="command-results">{matchingNav.length ? matchingNav.map(item => { const Icon = item.icon; return <button type="button" key={item.label} className="command-result" onClick={() => changePage(item.label)}><span className="command-result-icon"><Icon size={18} aria-hidden="true"/></span><span><strong>{item.label}</strong><small>{item.description}</small></span><ArrowRight size={16} aria-hidden="true"/></button> }) : <p className="command-no-results">No matching sections. Try “risk”, “OLAP”, or “catalog”.</p>}</div>
        <p className="command-hint">Search navigates between existing analytical pages. All warehouse results remain historical and data-backed.</p>
      </div>
    </div>}
    <main className="main-content" id="main-content">
      {active === 'Welcome' && <Welcome db={db} onNavigate={changePage} warehouseError={loadError} pending={pending}/>}
      {active !== 'Welcome' && pending && <Loader title="Initializing local DuckDB warehouse…"/>}
      {active !== 'Welcome' && !pending && loadError && <div className="setup-screen"><div className="setup-icon"><Database size={34}/></div><h2>Connect your <span className="accent-text">warehouse.</span></h2><p>This dashboard only displays real Olist analytics. Generate the Parquet export locally and reload; no demo numbers have been invented.</p><pre>{`python scripts/build_web_data.py --raw-dir data/raw --train\ncd web && npm run dev`}</pre><Notice message={loadError}/><button className="primary-btn" onClick={() => { setPending(true); setLoadError(''); setReloading(s => !s) }}><RefreshCw size={15}/> Retry loading</button></div>}
      {db && active !== 'Welcome' && <>
        {active === 'Overview' && <PremiumOverview db={db} onNavigate={changePage}/>}
        {active === 'Intelligence' && <PremiumIntelligence db={db}/>}
        {active === 'Analytics Atlas' && <AnalyticsAtlas db={db}/>}
        {active === 'Customer Cohorts' && <ResearchWorkspace db={db} destination="cohorts"/>}
        {active === 'Delivery Lab' && <ResearchWorkspace db={db} destination="promise"/>}
        {active === 'Research Studio' && <ResearchWorkspace db={db} destination="studio"/>}
        {active === 'AI Studio' && <ResearchWorkspace db={db} destination="model"/>}
        {active === 'OLAP Lab' && <OlapLab db={db}/>}
        {active === 'Risk Center' && <RiskCenter db={db}/>}
        {active === 'Data Catalog' && <DataCatalog db={db}/>}
        {active === 'Pipeline & Quality' && <PipelineQuality db={db}/>}
        {active === 'Warehouse & ETL' && <SyllabusLab module="Warehouse & ETL"/>}
        {active === 'Data Lakes' && <SyllabusLab module="Data Lakes"/>}
        {active === 'EDA & Preprocessing' && <SyllabusLab module="EDA & Preprocessing"/>}
        {active === 'Classification Lab' && <SyllabusLab module="Classification Lab"/>}
        {active === 'Clustering Lab' && <SyllabusLab module="Clustering Lab"/>}
        {active === 'Pattern Mining' && <SyllabusLab module="Pattern Mining"/>}
      </>}
    </main>
    <footer className="site-footer"><div className="footer-inner"><button className="footer-brand" aria-label="Back to PromisePulse landing page" onClick={()=>changePage('Welcome')}><img className="footer-logo-image" src="/promisepulse-logo.webp" alt="PromisePulse" /></button><span>Historical commerce intelligence · Brazil 2016–2018.</span><div className="footer-links"><button onClick={()=>changePage('Data Catalog')}>Data provenance</button><button onClick={()=>changePage('Pipeline & Quality')}>Methodology</button><span>© 2026 PromisePulse</span></div></div></footer>
  </div>
}
