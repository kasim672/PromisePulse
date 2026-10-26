/**
 * Documentation screenshots of the merged V5 soft-cyan React + DuckDB-Wasm application.
 * Reads bundled Olist Parquet and published mining_lab.json. No mocked metrics.
 * npm ci && npm install --no-save --package-lock=false playwright
 * npm run dev -- --host 127.0.0.1 --port 4173
 * PP_BASE_URL=http://127.0.0.1:4173 node scripts/capture-current-docs.mjs
 */
import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
const url=process.env.PP_BASE_URL||'http://127.0.0.1:4173'
const output=path.resolve(process.cwd(),'../docs/screenshots/current')
const records=[]
await fs.mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const errors=[]
async function save(page,name){
 await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo({top:0,behavior:'instant'})})
 const filename=name+'.png'
 await page.screenshot({path:path.join(output,filename),fullPage:true,animations:'disabled'})
 records.push(filename)
 console.log('Captured '+filename)
}
async function openLab(page,index){
 const nav=page.getByRole('navigation',{name:'Main navigation'})
 await nav.getByRole('button',{name:'Data Mining Lab',exact:true}).click()
 const cards=page.locator('.syllabus-hub-grid .syllabus-hub-card')
 await cards.first().waitFor({state:'visible',timeout:90000})
 if(await cards.count()!==6)throw Error('All six mining lab sections must be visible')
 if(index===null)return
 await cards.nth(index).getByRole('button',{name:'Open analysis',exact:true}).click()
 await page.locator('.syllabus-page').waitFor({state:'visible',timeout:90000})
 await page.locator('.syllabus-pending').waitFor({state:'hidden',timeout:90000})
 const visibleErrors=await page.locator('.syllabus-error').allInnerTexts()
 if(visibleErrors.length)throw Error(visibleErrors.join(' | '))
 await page.locator('.syllabus-page .syllabus-card').first().waitFor({state:'visible',timeout:90000})
}
async function scenario(theme,width,height,mobile=false){
 const ctx=await browser.newContext({viewport:{width,height},colorScheme:theme,deviceScaleFactor:1,reducedMotion:'reduce'})
 await ctx.addInitScript(value=>{try{localStorage.setItem('promisepulse-theme',value)}catch{}},theme)
 const page=await ctx.newPage()
 page.on('pageerror',e=>errors.push(String(e)))
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000})
  await page.locator('.pp-welcome').waitFor({state:'visible',timeout:90000})
  const cyan=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--pp-accent-cyan').trim().toLowerCase())
  if(cyan!=='#7dd3fc')throw Error('Current-release cyan theme missing: '+cyan)
  // Header connection badge was intentionally removed; wait for actual source-backed chart output.
  await page.locator('.welcome-history svg').waitFor({state:'visible',timeout:90000})
  const prefix=mobile?'mobile-':''
  await save(page,prefix+'welcome-'+theme)
  const nav=page.getByRole('navigation',{name:'Main navigation'})
  await nav.getByRole('button',{name:'Overview',exact:true}).click()
  await page.locator('.pp-dashboard').waitFor({state:'visible',timeout:90000})
  await page.locator('.pp-dashboard .query-loading').first().waitFor({state:'hidden',timeout:90000})
  await save(page,prefix+'overview-'+theme)
  if(mobile){
   await openLab(page,null)
   await save(page,'mobile-mining-hub-'+theme)
   return
  }
  if(theme==='light'){
   await nav.getByRole('button',{name:'Analytics Atlas',exact:true}).click()
   await page.locator('.atlas-page .atlas-chart-card').first().waitFor({state:'visible',timeout:90000})
   await page.locator('.atlas-page .atlas-plot-wrap').first().waitFor({state:'visible',timeout:90000})
   await save(page,'analytics-atlas-'+theme)
  }
  await openLab(page,null)
  await save(page,'mining-hub-'+theme)
  if(theme==='light'){
   await openLab(page,0)
   await save(page,'warehouse-etl-'+theme)
   await openLab(page,4)
   if(await page.locator('.syllabus-dendrogram polyline').count()<10)throw Error('Expected actual Ward linkage marks')
   await save(page,'clustering-'+theme)
   await openLab(page,5)
   await save(page,'pattern-mining-'+theme)
  }
 }finally{await ctx.close()}
}
try{
 await scenario('light',1440,900)
 await scenario('dark',1440,900)
 await scenario('light',390,844,true)
 if(errors.length)throw Error('Runtime JavaScript exceptions: '+errors.slice(0,4).join('; '))
 const manifest={
  release:'PromisePulse 5.0 with editorial typography, interactive mining algorithms and soft cyan #7DD3FC',
  captured_at_utc:new Date().toISOString(),
  git_sha:process.env.GITHUB_SHA||'local',
  source:'Actual checked-in Olist Parquet, manifest.json and mining_lab.json',
  method:'Playwright Chromium against running Vite app; no synthetic metrics',
  viewports:['1440x900 light','1440x900 dark','390x844 mobile light'],
  images:records
 }
 await fs.writeFile(path.join(output,'CAPTURE_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n')
 console.log('PASS: '+records.length+' screenshots of current production source')
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}
