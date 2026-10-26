import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
const url=process.env.PP_BASE_URL||'http://127.0.0.1:4173/'
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const dir=path.resolve(process.cwd(),'.screenshots-gemini')
await fs.mkdir(dir,{recursive:true})
async function visit(width,height,theme){
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'})
 await context.addInitScript(value=>{localStorage.setItem('promisepulse-theme',value)},theme)
 const page=await context.newPage()
 // Do NOT mock this request: it must reach the actual Vite -> Node API route.
 const health=await context.request.post(new URL('api/ask',url).href,{
   data:{question:'hi'},headers:{'Content-Type':'application/json'}
 })
 if(health.status()!==400)throw Error('Real local /api/ask route failed: expected HTTP 400 for invalid question, got '+health.status())
 const errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 let calls=0
 await page.route('**/api/ask',async route=>{
  calls++
  const data=route.request().postDataJSON()
  if(!data||typeof data.question!=='string')throw Error('Missing question')
  const joke=data.question.toLowerCase().includes('penguin')
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(joke?
   {grounded:false,answer:'I can only answer questions about PromisePulse and its documented historical research.',sources:[]}
   :{grounded:true,answer:'PromisePulse uses historical Olist warehouse data and DuckDB-Wasm in the browser.',sources:[{id:'architecture',title:'System architecture',url:'https://github.com/kasim672/PromisePulse/blob/main/docs/ARCHITECTURE_V5.md'}]})})
 })
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:80000})
  await page.locator('.pp-welcome').waitFor({state:'visible',timeout:80000})
  const trigger=page.getByRole('button',{name:'Ask PromisePulse AI'})
  await trigger.waitFor({state:'visible'})
  await trigger.click()
  const dialog=page.getByRole('dialog',{name:'PromisePulse Research Assistant'})
  await dialog.waitFor({state:'visible'})
  await dialog.getByRole('button',{name:'What is PromisePulse and how does it work?'}).click()
  await dialog.getByText('PromisePulse uses historical Olist warehouse data and DuckDB-Wasm in the browser.').waitFor({state:'visible'})
  const source=dialog.getByRole('link',{name:/System architecture/})
  if((await source.getAttribute('href'))!=='https://github.com/kasim672/PromisePulse/blob/main/docs/ARCHITECTURE_V5.md')throw Error('Missing trusted project reference')
  const entry=dialog.getByRole('textbox',{name:'Ask a question about PromisePulse'})
  await entry.fill('Tell me a joke about penguins')
  await entry.press('Enter')
  await dialog.getByText('I can only answer questions about PromisePulse and its documented historical research.').waitFor({state:'visible'})
  if(calls!==2)throw Error('Expected two mock requests, got '+calls)
  const screenshot=path.join(dir,'project-assistant-'+width+'-'+theme+'.png')
  await page.screenshot({path:screenshot,animations:'disabled',fullPage:true})
  await page.keyboard.press('Escape')
  await dialog.waitFor({state:'hidden'})
  await navSearch(page)
  if(errors.length)throw Error('JavaScript errors: '+errors.join(' | '))
  console.log('PASS Gemini drawer, citations, out-of-scope UI, Escape and navigation, '+width+' '+theme)
 }finally{await context.close()}
}
async function navSearch(page){
 const search=page.locator('.header-search')
 await search.click()
 await page.getByRole('dialog',{name:'Find a PromisePulse section'}).waitFor({state:'visible',timeout:12000})
 await page.keyboard.press('Escape')
}
try{
 for(const [w,h,t] of [[1440,900,'dark'],[1440,900,'light'],[390,844,'dark']])await visit(w,h,t)
}catch(error){console.error(error);process.exitCode=1}finally{await browser.close()}
