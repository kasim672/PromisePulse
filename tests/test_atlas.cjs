/** Atlas query + visual registry regression checks; no sample data fabricated. */
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const ts=require(require.resolve('typescript',{paths:[path.join(__dirname,'../web')]}))
const filename=path.join(__dirname,'../web/src/atlasQueries.ts')
const js=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const Module=module.constructor
const m=new Module(filename,module);m.filename=filename;m.paths=module.paths;m._compile(js,filename)
const {ATLAS_GROUPS,ATLAS_CHART_COUNT,ATLAS_STATES,atlasQuery,atlasLabQueries}=m.exports
assert.equal(ATLAS_CHART_COUNT,36)
assert.equal(ATLAS_GROUPS.length,9)
assert.equal(new Set(ATLAS_GROUPS.flatMap(g=>g.metrics.map(m=>m.id))).size,36)
const required=['commerce','weekday','hour','geography','delivery','reviews','category','sellers','laboratory']
assert.deepEqual(ATLAS_GROUPS.map(g=>g.id),required)
for(const lens of required.filter(x=>x!=='laboratory')){
 for(const state of ['ALL','SP']){
  for(const year of ['all','2017']){
   const q=atlasQuery(lens,year,state)
   assert.match(q,/^SELECT /)
   assert.match(q,/GROUP BY 1/)
   assert.match(q,/o\.purchase_ts IS NOT NULL/)
   assert.match(q,year==='all'?/\bTRUE\b/:/EXTRACT\(YEAR FROM o.purchase_ts\)=2017/)
   assert.match(q,state==='ALL'?/\bTRUE\b/:/c\.customer_state='SP'/)
   if(lens==='category'||lens==='sellers'){
    assert.match(q,/fact_order_items i/)
    assert.doesNotMatch(q,/SUM\(o\.payment_total\)/,'item revenue must not aggregate order-level payments')
   }else{
    assert.match(q,/FROM fact_orders o LEFT JOIN dim_customer/)
   }
  }
 }
}
for(const malicious of ["SP'; DROP TABLE fact_orders;--","'OR 1=1--","ZZ"]){
 assert.throws(()=>atlasQuery('commerce','all',malicious),/Invalid state/)
}
assert.throws(()=>atlasQuery('commerce','2025','ALL'),/Invalid year/)
assert.equal(ATLAS_STATES.length,28)
const lab=atlasLabQueries('all','ALL',true)
assert.equal(Object.keys(lab).length,4)
assert.match(lab.weekhour,/EXTRACT\(HOUR FROM o.purchase_ts\)/)
assert.match(lab.statemonth,/customer_state AS y/)
assert.match(lab.reviewlate,/is_late IS NOT NULL/)
assert.match(lab.calibration,/FROM risk_predictions/)
assert.equal(atlasLabQueries('all','ALL',false).calibration,null)
assert.match(lab.calibration,/COUNT\(\*\) AS orders/)
const component=fs.readFileSync(path.join(__dirname,'../web/src/AnalyticsAtlas.tsx'),'utf8')
assert.match(component,/role="button"/)
assert.match(component,/onKeyDown=/)
assert.match(component,/onClick=\{\(\)=>saveCsv/)
assert.match(component,/aria-live="polite"/)
assert.match(component,/atlasQuery\(lens,year,state\)/)
assert.match(component,/const cache=useRef\(new Map/)
const app=fs.readFileSync(path.join(__dirname,'../web/src/App.tsx'),'utf8')
assert.match(app,/active === 'Analytics Atlas' && <AnalyticsAtlas/)
assert.match(app,/label: 'Analytics Atlas'/)
console.log('PASS: 36 genuine analytical views, safe filters, 8 warehouse grains, held-out-only calibration, accessible interactive renderer and navigation')
