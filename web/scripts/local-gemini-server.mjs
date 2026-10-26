/**
 * Loopback-only Gemini development API.
 *
 * The old Vite Connect middleware could silently be bypassed by a stale
 * development server. Serve the real Vercel handler from a dedicated local
 * Node process, then proxy /api/ask from Vite on the *same origin*.
 *
 * This file is never bundled into the client or started on Vercel.
 */
import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {dirname,resolve} from 'node:path'
import handler from '../api/ask.js'

const web=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const host='127.0.0.1'
const port=Number(process.env.PP_LOCAL_GEMINI_PORT||8787)

async function loadLocalSecrets(){
 let raw
 try{raw=await readFile(resolve(web,'.env'),'utf8')}
 catch(error){if(error?.code==='ENOENT')return;throw error}
 for(const line of raw.split(/\r?\n/)){
  const m=line.match(/^\s*(GEMINI_API_KEY|GEMINI_MODEL)\s*=\s*(.*?)\s*$/)
  if(!m||process.env[m[1]])continue
  let value=m[2].trim()
  if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1)
  if(value)process.env[m[1]]=value
 }
}
const send=(res,status,obj)=>{
 if(res.writableEnded)return
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'})
 res.end(JSON.stringify(obj))
}
await loadLocalSecrets()
const server=createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://localhost')
 if(url.pathname==='/__gemini_health'){
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'})
  return send(res,200,{service:'promisepulse-local-gemini',configured:Boolean(process.env.GEMINI_API_KEY)})
 }
 if(url.pathname!=='/api/ask')return send(res,404,{error:'Unknown local API route.'})
 try{
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'Use POST to ask a question.'})}
  let bytes=0
  const parts=[]
  for await(const chunk of req){
   bytes+=chunk.length
   if(bytes>4096)return send(res,413,{error:'The request is too large.'})
   parts.push(chunk)
  }
  let body
  try{body=JSON.parse(Buffer.concat(parts).toString('utf8'))}
  catch{return send(res,400,{error:'Malformed JSON request.'})}
  const adapter={
   setHeader(name,value){res.setHeader(name,value);return this},
   status(value){res.statusCode=value;return this},
   json(value){if(!res.writableEnded){res.end(JSON.stringify(value))}return this}
  }
  await handler({method:req.method,headers:req.headers,body},adapter)
 }catch(error){
  // Intentionally avoid leaking upstream response text or API keys to clients.
  console.error('[PromisePulse API] Request failed:',error?.name||'ServerError')
  send(res,500,{error:'The local Gemini endpoint encountered an unexpected error.'})
 }
})
server.on('error',error=>{
 console.error('[PromisePulse API] Cannot bind loopback port '+port+': '+error.code)
 process.exitCode=1
})
server.listen(port,host,()=>{
 console.log('[PromisePulse API] Listening at http://'+host+':'+port+'/api/ask (loopback only)')
 console.log('[PromisePulse API] Gemini key '+(process.env.GEMINI_API_KEY?'found in server environment':'not configured; add it to web/.env'))
})
