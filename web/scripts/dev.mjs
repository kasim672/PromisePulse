/**
 * npm run dev: start the localhost Gemini API first, verify its health, then
 * start Vite in the foreground. One command, two managed local processes.
 */
import {spawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {dirname,resolve} from 'node:path'
import {setTimeout as delay} from 'node:timers/promises'

const web=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const port=Number(process.env.PP_LOCAL_GEMINI_PORT||8787)
let api=null
let vite=null
let shuttingDown=false
const stop=()=>{
 if(shuttingDown)return
 shuttingDown=true
 if(vite&&!vite.killed)vite.kill('SIGTERM')
 if(api&&!api.killed)api.kill('SIGTERM')
}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stop();process.exit(0)})
process.on('exit',stop)

try{
 api=spawn(process.execPath,['scripts/local-gemini-server.mjs'],{cwd:web,stdio:'inherit',env:process.env})
 api.on('error',error=>{console.error('Local Gemini API could not start:',error.message);stop();process.exitCode=1})
 let ready=false
 for(let i=0;i<35;i++){
  if(api.exitCode!==null)break
  try{
   const response=await fetch('http://127.0.0.1:'+port+'/__gemini_health',{signal:AbortSignal.timeout(1200)})
   const info=await response.json()
   if(response.ok&&info.service==='promisepulse-local-gemini'){ready=true;break}
  }catch{}
  await delay(150)
 }
 if(!ready)throw new Error('Local Gemini API failed to start; check whether port '+port+' is in use.')
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1',...process.argv.slice(2)],{cwd:web,stdio:'inherit',env:process.env})
 const result=await new Promise((resolve,reject)=>{
  vite.on('error',reject)
  vite.on('exit',(code,signal)=>resolve({code,signal}))
 })
 stop()
 if(result.code&&result.code!==0)process.exitCode=result.code
}catch(error){
 console.error('[PromisePulse] '+error.message)
 stop()
 process.exitCode=1
}
