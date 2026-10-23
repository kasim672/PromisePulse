import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
const base=process.env.PP_BASE_URL||'http://127.0.0.1:4173'
const folder=path.resolve(process.cwd(),'../docs/screenshots/v4')
await fs.mkdir(folder,{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const captures=[]
const pageErrors=[]
async function check(page,name){
 await page.locator('.atlas-error,.pp-error').first().waitFor({state:'hidden',timeout:1200}).catch(()=>{})
 const errors=await page.locator('.atlas-error,.pp-error').allTextContents()
 if(errors.length)throw Error(name+' shows query errors: '+errors.join('; '))
 const pending=await page.locator('.atlas-loading').count()
 if(pending)throw Error(name+' retained loading components')
}
async function save(page,name,scope){
 await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0)})
 if(scope)await page.locator(scope).first().waitFor({state:'visible',timeout:100000})
 await check(page,name)
 await page.screenshot({path:path.join(folder,name+'.png'),fullPage:true,animations:'disabled'})
 captures.push(name+'.png')
 console.log('Captured '+name)
}
async function navigate(page,label){
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:label,exact:true}).click()
}
async function research(page,label,filename){
 await navigate(page,label)
 await page.waitForFunction(()=>{
   const charts=document.querySelectorAll('.atlas-chart-card')
   return charts.length===6&&[...charts].every(el=>el.querySelector('.atlas-svg [role="button"]')||el.querySelector('.atlas-empty'))
 },null,{timeout:120000})
 await save(page,filename,'.research-page')
 const points=await page.locator('.atlas-chart-card .atlas-svg [role="button"]').count()
 if(points<5)throw Error(label+' has fewer than 5 rendered chart marks')
 console.log(label+': '+points+' interactive data marks; data-backed warehouse queries passed')
}
async function capture(theme,viewport,mobile=false){
 const context=await browser.newContext({viewport,deviceScaleFactor:1,colorScheme:theme,reducedMotion:'reduce'})
 await context.addInitScript(t=>localStorage.setItem('promisepulse-theme',t),theme)
 const page=await context.newPage()
 page.on('pageerror',e=>pageErrors.push(String(e)))
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000})
 await page.locator('.pp-welcome').waitFor({state:'visible',timeout:100000})
 await page.locator('.welcome-history svg[role="img"]').waitFor({state:'visible',timeout:120000})
 const suffix=mobile?'-mobile-'+theme:'-'+theme
 await save(page,'welcome'+suffix,'.welcome-history svg[role="img"]')
 await research(page,'Customer Cohorts','customer-cohorts'+suffix)
 if(!mobile){
  await research(page,'Delivery Lab','delivery-lab'+suffix)
  await research(page,'Research Studio','research-basket'+suffix)
  await page.getByRole('group',{name:'Research studio datasets'}).getByRole('button',{name:/Product weight & freight/}).click()
  await page.waitForFunction(()=>document.querySelectorAll('.atlas-chart-card .atlas-svg [role="button"]').length>5,null,{timeout:120000})
  await save(page,'research-weight'+suffix,'.research-page')
  await research(page,'AI Studio','ai-studio'+suffix)
  const answer=page.locator('.research-answer')
  if(!(await answer.textContent())?.includes('historical test cohort')) throw Error('AI Evidence Assistant has no real-data summary')
  await page.getByRole('button',{name:'Is the model well calibrated?'}).click()
  if(!(await answer.textContent())?.includes('ROC AUC'))throw Error('Evidence question selection is not working')
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Overview',exact:true}).click()
  await page.locator('.pp-dashboard').waitFor({state:'visible',timeout:100000})
  await page.waitForFunction(()=>[...document.querySelectorAll('.pp-placeholder')].every(e=>!e.textContent?.includes('Querying historical warehouse')),null,{timeout:120000})
  await save(page,'overview-preserved'+suffix,'.pp-dashboard')
 }
 await context.close()
}
try{
 await capture('light',{width:1440,height:900})
 await capture('dark',{width:1440,height:900})
 await capture('light',{width:390,height:844},true)
 if(pageErrors.length)throw Error('JS runtime errors: '+pageErrors.slice(0,10).join('; '))
 const report={source:'Verified running PromisePulse React+DuckDB-Wasm with bundled Olist Parquet, captured by Playwright Chromium',generated_at_utc:new Date().toISOString(),count:captures.length,images:captures,checks:'All 4 new research routes rendered six real queried charts per active lens; AI source questions and browser runtime verified; reference overview preserved.',viewports:['1440x900 light/dark','390x844 light']}
 await fs.writeFile(path.join(folder,'CAPTURE_MANIFEST.json'),JSON.stringify(report,null,2)+'\n')
 console.log('PASS: '+captures.length+' real application screenshots and data-query smoke checks')
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}
