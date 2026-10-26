/** Authentic AI drawer screenshots for the documentation.
 * Runs against the actual current React app + local HTTP handler, with no
 * mocked responses, secrets or external Gemini API usage required.
 * Usage: PP_BASE_URL=http://127.0.0.1:4173 node scripts/capture-assistant-docs.mjs
 */
import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
const origin=process.env.PP_BASE_URL||'http://127.0.0.1:4173/'
const out=path.resolve(process.cwd(),'../docs/screenshots/current')
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const images=[]
const errors=[]
async function capture(theme,width,height,mobile=false) {
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme,deviceScaleFactor:1,reducedMotion:'reduce'})
 await context.addInitScript(mode=>{try{localStorage.setItem('promisepulse-theme',mode)}catch{}},theme)
 const page=await context.newPage()
 page.on('pageerror',e=>errors.push(String(e)))
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:90000})
  await page.locator('.pp-welcome').waitFor({state:'visible',timeout:90000})
  const trigger=page.getByRole('button',{name:'Ask PromisePulse AI'})
  await trigger.click()
  const dialog=page.getByRole('dialog',{name:'PromisePulse Research Assistant'})
  await dialog.waitFor({state:'visible'})
  const actual=await page.evaluate(()=>document.documentElement.dataset.theme)
  if(actual!==theme)throw Error('Requested theme not applied: '+theme+' / '+actual)
  await page.evaluate(()=>document.fonts.ready)
  const file=(mobile?'mobile-':'')+'assistant-intro-'+theme+'.png'
  await dialog.screenshot({path:path.join(out,file),animations:'disabled'})
  images.push(file)
  if(!mobile){
   await dialog.getByRole('button',{name:'Tell me about the data used on this website'}).click()
   const msg=dialog.locator('.project-ai-message.assistant')
   await msg.first().waitFor({state:'visible',timeout:20000})
   await dialog.locator('.project-ai-thinking').waitFor({state:'hidden',timeout:20000})
   const answer=await msg.first().innerText()
   if(!/olist|dataset|historical|warehouse/i.test(answer))throw Error('No grounded project reference response: '+answer.slice(0,140))
   const responseFile='assistant-research-'+theme+'.png'
   await dialog.screenshot({path:path.join(out,responseFile),animations:'disabled'})
   images.push(responseFile)
  }
 }finally{await context.close()}
}
try{
 await capture('light',1440,900)
 await capture('dark',1440,900)
 await capture('light',390,844,true)
 if(errors.length)throw Error('Browser errors: '+errors.join(' | '))
 const record={
  release:'PromisePulse 5.0 — website-wide Gemini assistant and current light/dark palette',
  source_sha:process.env.GITHUB_SHA||'local',
  captured_at_utc:new Date().toISOString(),
  method:'Actual React UI in Playwright Chromium; local HTTP API with reference-only response; no mocked metrics or Gemini credentials',
  viewports:['1440x900 light','1440x900 dark','390x844 mobile light'],
  images
 }
 await writeFile(path.join(out,'ASSISTANT_CAPTURE_MANIFEST.json'),JSON.stringify(record,null,2)+'\n')
 console.log('PASS chatbot screenshots:',images.join(', '))
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}
