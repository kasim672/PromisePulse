import assert from 'node:assert/strict'
import fs from 'node:fs'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import {execFileSync} from 'node:child_process'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const url=process.env.PP_BASE_URL||'http://127.0.0.1:4173/'
const api=new URL('api/ask',url)
const envSample=fs.readFileSync(path.join(root,'web/.env.example'),'utf8')
const viteConfig=fs.readFileSync(path.join(root,'web/vite.config.ts'),'utf8')
assert.ok(envSample.includes('GEMINI_API_KEY='))
assert.ok(!/GEMINI_API_KEY=AIza[0-9A-Za-z_-]+/.test(envSample),'example must not contain a real Gemini key')
assert.match(viteConfig,/loadEnv\(mode, process\.cwd\(\), 'GEMINI_'\)/)
assert.match(viteConfig,/server\.middlewares\.use\('\/api\/ask'/)
for(const local of ['web/.env','web/.env.local','web/.env.production.local']){
 const ignored=execFileSync('git',['check-ignore',local],{cwd:root,encoding:'utf8'}).trim()
 assert.equal(ignored,local,'secret env file should be ignored by Git')
}
const listed=execFileSync('git',['ls-files','web/.env'],{cwd:root,encoding:'utf8'}).trim()
assert.equal(listed,'','real env must not be tracked')
const doPost=async(body,headers={})=>fetch(api,{
 method:'POST',headers:{'Content-Type':'application/json',...headers},
 body:typeof body==='string'?body:JSON.stringify(body)
})
let response=await fetch(api,{method:'GET'})
assert.equal(response.status,405)
response=await doPost({question:'What is the capital of France?'})
assert.equal(response.status,200)
let result=await response.json()
assert.equal(result.grounded,false)
assert.equal(result.sources.length,0)
response=await doPost({question:'hi'})
assert.equal(response.status,400,'short input should reach local API and return validation, not a 404')
result=await response.json()
assert.match(result.error,/between 3 and 450 characters/)
response=await doPost({question:'Explain PromisePulse warehouse architecture'})
assert.equal(response.status,503,'missing local key should produce actionable setup message')
result=await response.json()
assert.match(result.error,/web\/\.env/)
assert.match(response.headers.get('cache-control')||'',/no-store/)
response=await doPost('{not valid json')
assert.equal(response.status,400)
response=await doPost({question:'What is PromisePulse?'},{Origin:'https://invalid.example'})
assert.equal(response.status,403)
response=await doPost({question:'hello'},{'Content-Type':'text/plain'})
assert.equal(response.status,415)
response=await doPost({question:'X'.repeat(460)})
assert.equal(response.status,400)
console.log('PASS local Gemini Vite API: /api/ask, project-only refusal, missing-key guidance, origin protection, JSON errors, ignored .env')
