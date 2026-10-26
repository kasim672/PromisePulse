/**
 * Quick local health check with no Gemini calls or API credits.
 * Run in a second terminal while npm run dev is running.
 */
const origin=process.env.PP_BASE_URL||'http://127.0.0.1:5173/'
const endpoint=new URL('api/ask',origin)
try{
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'hi'}),signal:AbortSignal.timeout(4000)})
 const data=await response.json().catch(()=>({}))
 if(response.status===400&&/between 3 and 450/.test(data.error||'')){
  console.log('PASS: '+endpoint.href+' reaches the real PromisePulse Gemini API.')
  console.log('The test used a deliberately short question; no request was sent to Google and no credits were consumed.')
  process.exit(0)
 }
 console.error('FAIL: unexpected HTTP '+response.status+' from '+endpoint.href)
 if(response.status===404)console.error('You are viewing a stale Vite server. Stop all old npm run dev processes and restart from ~/PromisePulse/web.')
 else console.error('Response code:',data.error||'Unexpected response shape')
 process.exitCode=1
}catch(error){
 console.error('FAIL: local Gemini route is unreachable at '+endpoint.href)
 console.error('Start the app with: cd ~/PromisePulse/web && npm run dev')
 console.error('If a port is already occupied, stop the earlier Vite process first.')
 process.exitCode=1
}
