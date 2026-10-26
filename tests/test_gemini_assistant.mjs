import assert from 'node:assert/strict'
import fs from 'node:fs'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import {retrieve,SOURCES} from '../web/api/_knowledge.mjs'
import {findEvidence} from '../web/api/_retrieval.mjs'
import {SITE_SOURCES} from '../web/api/_site-index.mjs'
import handler from '../web/api/ask.js'

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const source=fs.readFileSync(path.join(repoRoot,'web/src/ProjectAssistant.tsx'),'utf8')
const api=fs.readFileSync(path.join(repoRoot,'web/api/ask.js'),'utf8')
const helper=fs.readdirSync(path.join(repoRoot,'web/api'))
assert.deepEqual(helper.sort(),['_knowledge.mjs','_retrieval.mjs','_site-index.mjs','ask.js'])
assert.ok(SITE_SOURCES.length>=150,'Website index must contain guide and published-data passages')
for(const q of ['tell me about yourself','tell me about the data used','what pages are on the website?','compare classification models','how do the plots work?'])assert.ok(findEvidence(q).length,'Expected site knowledge for: '+q)
assert.ok(findEvidence('tell me about the data used').some(x=>/olist|data|warehouse/i.test(x.title+' '+x.text)))
assert.ok(SITE_SOURCES.some(s=>s.url==='/web/public/data/manifest.json'),'Warehouse manifest should be included')
assert.ok(SITE_SOURCES.some(s=>s.url==='/web/public/data/mining_lab.json'),'Data mining experimental results should be included')
assert.ok(SOURCES.length>=15,'Expected current project topics')
assert.ok(retrieve('What is PromisePulse?').length,'Basic project question should be retrievable')
assert.ok(retrieve('How does k means clustering work?').some(s=>s.id==='cluster'||s.id==='playground'))
assert.ok(retrieve('What is model precision?').some(s=>s.id==='model'))
assert.ok(retrieve('precision').some(s=>s.id==='model'))
assert.ok(retrieve('threshold').some(s=>s.id==='model'))
assert.ok(retrieve('What can you do?').length)
assert.ok(retrieve('help me').length,'A user asking for help should get project guidance')
const nodeConfig=JSON.parse(fs.readFileSync(path.join(repoRoot,'web/tsconfig.node.json'),'utf8'))
assert.ok(nodeConfig.compilerOptions.outDir.includes('node_modules'), 'TypeScript config compilation must never shadow Vite config')
assert.ok(!fs.existsSync(path.join(repoRoot,'web/vite.config.js')), 'Stale Vite JavaScript config overrides TypeScript proxy')
assert.ok(!fs.existsSync(path.join(repoRoot,'web/vite.config.d.ts')), 'Generated Vite declarations must not be tracked')
assert.ok(fs.readFileSync(path.join(repoRoot,'web/scripts/dev.mjs'),'utf8').includes("'--config','vite.config.ts'"), 'Dev startup must explicitly load the proxying config')
assert.ok(JSON.parse(fs.readFileSync(path.join(repoRoot,'web/package.json'),'utf8')).scripts.build.includes('vite build --config vite.config.ts'), 'Build must use the same Vite config')
assert.equal(retrieve('What is the weather today?').length,0)
assert.ok(retrieve('How does Eclat work?').some(s=>s.id==='basket'||s.id==='playground'))
assert.equal(retrieve('What is the capital of France?').length,0,'Unrelated subject must be rejected before Gemini')
assert.equal(retrieve('Tell me a joke about penguins').length,0,'Unrelated jokes cannot reach Gemini')
assert.ok(!api.includes('VITE_GEMINI_API_KEY'))
assert.ok(!source.includes('GEMINI_API_KEY'))
assert.match(api,/process\.env\.GEMINI_API_KEY/)
assert.match(api,/x-goog-api-key/)
assert.match(api,/Cache-Control.*no-store/)
assert.match(source,/ProjectAssistant/)
assert.match(source,/q\.length<3/,'chat should validate short messages before API calls')
assert.match(source,/This is a missing local route, not a Gemini key error/,'404 should explain missing local API route')
assert.match(source,/source.*url|s\.url/i)

let nextIP=0
async function invoke({method='POST',body={question:'What is PromisePulse?'},headers={}}={}){
 const req={method,body,headers:{host:'localhost:3000',origin:'http://localhost:3000','content-type':'application/json','x-real-ip':'test-'+(++nextIP),...headers}}
 const out={status:0,headers:{},body:null}
 const response={
  setHeader(k,v){out.headers[k]=v;return this},
  status(value){out.status=value;return this},
  json(value){out.body=value;return this}
 }
 await handler(req,response)
 return out
}
const prior=process.env.GEMINI_API_KEY
const originalFetch=globalThis.fetch
try{
 delete process.env.GEMINI_API_KEY
 let result=await invoke()
 assert.equal(result.status,200)
 assert.equal(result.body.mode,'reference')
 assert.match(result.body.answer,/historical|Olist/i)
 assert.match(result.body.notice,/Configure GEMINI_API_KEY/)
 assert.ok(!JSON.stringify(result).includes('undefined'))
 result=await invoke({body:{question:'Tell me a joke about penguins'}})
 assert.equal(result.status,200)
 assert.equal(result.body.grounded,false)
 assert.match(result.body.answer,/PromisePulse AI/)
 result=await invoke({headers:{origin:'https://other.example'}})
 assert.equal(result.status,403)
 result=await invoke({body:{question:'X'.repeat(451)}})
 assert.equal(result.status,400)
 result=await invoke({method:'GET'})
 assert.equal(result.status,405)
 process.env.GEMINI_API_KEY='test-key-never-expose'
 const requests=[]
 globalThis.fetch=async(url,options)=>{
  requests.push({url,options})
  return {ok:true,status:200,async json(){return {candidates:[{content:{parts:[{text:'PromisePulse is a historical Olist data-warehouse dashboard; its DuckDB SQL runs in the browser.'}]}}]}}}
 }
 result=await invoke({body:{question:'What is PromisePulse and how does it work?'}})
 assert.equal(result.status,200)
 assert.equal(result.body.grounded,true)
 assert.match(result.body.answer,/historical Olist/)
 assert.ok(result.body.sources.length>0)
 for(const s of result.body.sources)assert.ok(s.url.startsWith('https://github.com/kasim672/PromisePulse/blob/main/'))
 assert.ok(!JSON.stringify(result.body).includes('test-key-never-expose'))
 assert.equal(requests.length,1)
 result=await invoke({body:{question:'Tell me more',history:['Explain the clustering algorithms']}})
 assert.equal(result.status,200)
 assert.equal(result.body.mode,'gemini')
 assert.ok(result.body.sources.some(s=>s.id==='cluster'||s.id==='playground'))
 assert.match(requests[1].options.body,/clustering algorithms/)
 result=await invoke({body:{question:'tell me about the data used'}})
 assert.equal(result.status,200)
 assert.equal(result.body.mode,'gemini')
 assert.ok(requests.at(-1).options.body.includes('Olist'))
 result=await invoke({body:{question:'tell me about yourself'}})
 assert.equal(result.status,200)
 assert.equal(result.body.mode,'gemini')
 result=await invoke({body:{question:'Tell me a joke about penguins'}})
 assert.equal(result.status,200)
 assert.equal(result.body.mode,'gemini','General conversation should reach configured Gemini, not hard refusal')
 assert.equal(result.body.grounded,false)
 assert.equal(result.body.sources.length,0)
 assert.match(requests[0].url,/generativelanguage\.googleapis\.com/)
 assert.equal(requests[0].options.headers['x-goog-api-key'],'test-key-never-expose')
 assert.ok(!requests[0].options.body.includes('test-key-never-expose'))
 globalThis.fetch=async()=>({ok:false,status:429})
 result=await invoke()
 assert.equal(result.status,200)
 assert.equal(result.body.mode,'reference')
 assert.match(result.body.notice,/usage limit/)
 console.log('PASS Gemini assistant: website-wide evidence, natural conversation, secure server key, source links and graceful reference fallback')
}finally{
 globalThis.fetch=originalFetch
 if(prior===undefined)delete process.env.GEMINI_API_KEY
 else process.env.GEMINI_API_KEY=prior
}
