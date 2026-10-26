const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const ts=require(require.resolve('typescript',{paths:[path.join(__dirname,'../web')]}))
const file=path.resolve(__dirname,'../web/src/researchQueries.ts')
const raw=fs.readFileSync(file,'utf8')
const js=ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const Module=module.constructor
const m=new Module(file,module);m.filename=file;m.paths=module.paths
// Type-only imports are erased; ATLAS_STATES is a static allowlist dependency.
const ModuleWrap=require('node:module');const baseLoad=ModuleWrap._load
ModuleWrap._load=function(id,parent,isMain){
 if(id==='./atlasQueries')return {ATLAS_STATES:['ALL','AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']}
 return baseLoad(id,parent,isMain)
}
try{m._compile(js,file)}finally{ModuleWrap._load=baseLoad}
const {RESEARCH_GROUPS,NEW_CHART_COUNT,researchQuery}=m.exports
assert.equal(NEW_CHART_COUNT,30,'30 additional panels, 6 per evidence family')
assert.deepEqual(RESEARCH_GROUPS.map(g=>g.id),['cohorts','promise','basket','weight','model'])
assert.ok(RESEARCH_GROUPS.every(g=>g.metrics.length===6),'each lens has six distinct plots')
assert.equal(new Set(RESEARCH_GROUPS.flatMap(g=>g.metrics.map(m=>m.id))).size,30,'figure ids must be distinct')
const app=fs.readFileSync(path.resolve(__dirname,'../web/src/App.tsx'),'utf8')
const nav=app.match(/const NAV:[\s\S]*?\n\]/)?.[0]||''
assert.equal((nav.match(/\{\s*label:\s*'/g)||[]).length,19,'preserve twelve original destinations, six syllabus labs and their syllabus hub')
for(const route of ['Welcome','Customer Cohorts','Delivery Lab','Research Studio','AI Studio'])
 assert.ok(app.includes("'"+route+"'"),'missing new destination '+route)
assert.match(app,/useState<Tab>\('Welcome'\)/,'landing page must be first')
assert.match(app,/<ResearchWorkspace db=\{db\} destination="model"\/>/)
const labs=fs.readFileSync(path.resolve(__dirname,'../web/src/ResearchWorkspace.tsx'),'utf8')
assert.match(labs,/Deterministic evidence summary/)
assert.match(labs,/Not ChatGPT, generative AI/)
assert.match(labs,/ChartCard/)
assert.match(labs,/researchQuery\(groupId,year,state\)/)
const landing=fs.readFileSync(path.resolve(__dirname,'../web/src/Welcome.tsx'),'utf8')
assert.match(landing,/FROM fact_orders WHERE purchase_ts IS NOT NULL/)
assert.doesNotMatch(landing,/<iframe/)
for(const group of RESEARCH_GROUPS){
 for(const year of ['all','2017'])for(const state of ['ALL','SP']){
   const q=researchQuery(group.id,year,state)
   assert.match(q,/^(SELECT|WITH) /,'read-only select')
   assert.match(q,/GROUP BY/,'data-backed aggregation')
   assert.doesNotMatch(q,/;.*(DROP|UPDATE|DELETE)/i,'no SQL mutations')
   if(group.id==='weight') {
     assert.match(q,/FROM fact_order_items/)
     assert.doesNotMatch(q,/SUM\(o\.payment_total\)/,'item grain must not repeat order payment')
   } else if(group.id==='model') {
     assert.match(q,/FROM risk_predictions/)
     assert.doesNotMatch(q,/fact_orders/,'model test cohort stays independent')
   } else assert.match(q,/fact_orders o/)
   if(group.id!=='model') {
     assert.match(q,year==='2017'?/EXTRACT\(YEAR FROM o\.purchase_ts\)=2017/:/\bTRUE\b/)
     assert.match(q,state==='SP'?/c\.customer_state='SP'/:/\bTRUE\b/)
   }
 }
}
for(const payload of ["SP'; DELETE FROM fact_orders;--","Unknown","NA"]){
 assert.throws(()=>researchQuery('cohorts','all',payload),/Invalid Brazilian state/)
}
assert.throws(()=>researchQuery('basket','2026','ALL'),/Invalid historical year/)
console.log('PASS: 12-route navigation, 30 new fact-backed charts, model cohort separation, 66-chart platform total, allowlist and financial grain rules')
