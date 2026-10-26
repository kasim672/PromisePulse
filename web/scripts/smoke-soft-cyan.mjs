import {chromium} from 'playwright'
import path from 'node:path'
import fs from 'node:fs/promises'

const base=process.env.PP_BASE_URL||'http://127.0.0.1:4173/'
const out=path.resolve(process.cwd(),'../docs/theme-previews/soft-cyan')
const browser=await chromium.launch({headless:true,channel:process.env.PP_BROWSER_CHANNEL==='chrome'?'chrome':undefined,args:['--no-sandbox','--disable-dev-shm-usage']})
const cyan='rgb(125, 211, 252)'
const files=[]
async function background(page,selector){
 return await page.locator(selector).first().evaluate(el=>getComputedStyle(el).backgroundColor)
}
async function save(page,name){
 const p=path.join(out,name+'.png')
 await page.screenshot({path:p,animations:'disabled',fullPage:true})
 files.push(name+'.png')
}
async function run(theme,width,height){
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce',deviceScaleFactor:1})
 await context.addInitScript(value=>{localStorage.setItem('promisepulse-theme',value)},theme)
 const page=await context.newPage()
 const errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000})
  await page.locator('.pp-welcome').waitFor({state:'visible',timeout:90000})
  const accent=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--pp-accent-cyan').trim().toLowerCase())
  if(accent!=='#7dd3fc')throw Error('Theme token not exact cyan: '+accent)
  const logoFilter=await page.locator('.brand-logo-image').evaluate(el=>getComputedStyle(el).filter)
  if(!logoFilter.includes('pp-brand-cyan'))throw Error('Brand image was not selectively recolored: '+logoFilter)
  if(theme==='dark'){
   if(await background(page,'.welcome-primary')!==cyan)throw Error('Welcome primary not cyan')
   if(await background(page,'.header-cta')!==cyan)throw Error('Header CTA not cyan')
  }
  await save(page,'welcome-'+theme+'-'+width)
  const nav=page.getByRole('navigation',{name:'Main navigation'})
  await nav.getByRole('button',{name:'Overview',exact:true}).click()
  await page.locator('.pp-dashboard').waitFor({state:'visible',timeout:90000})
  if(await background(page,'.header-nav-item.active')!==cyan)throw Error('Navigation selection not cyan')
  if(theme==='dark'){
    await page.locator('.pp-kpi-light').waitFor({state:'visible',timeout:90000})
    const gradient=await page.locator('.pp-kpi-light').evaluate(el=>getComputedStyle(el).backgroundImage)
    if(!gradient.includes('186, 230, 253')||!gradient.includes('56, 189, 248'))throw Error('Highlighted KPI gradient was not cyan: '+gradient)
  }
  await page.locator('.pp-state-shape.selected path').first().waitFor({state:'attached',timeout:90000})
  const stateFill=await page.locator('.pp-state-shape.selected path').first().evaluate(el=>getComputedStyle(el).fill)
  if(stateFill!==cyan)throw Error('Selected Brazil map state not cyan: '+stateFill)
  await save(page,'overview-'+theme+'-'+width)
  await nav.getByRole('button',{name:'Analytics Atlas',exact:true}).click()
  await page.locator('.atlas-page').waitFor({state:'visible',timeout:90000})
  const lens=await page.locator('.atlas-page').evaluate(el=>getComputedStyle(el).getPropertyValue('--atlas-selected').trim().toLowerCase())
  if(theme==='dark'&&lens!=='#7dd3fc')throw Error('Atlas highlight not cyan')
  await nav.getByRole('button',{name:'Data Mining Lab',exact:true}).click()
  await page.locator('.syllabus-hub-grid').waitFor({state:'visible',timeout:90000})
  const selected=await page.locator('.syllabus-hub').evaluate(el=>getComputedStyle(el).getPropertyValue('--atlas-selected').trim().toLowerCase())
  if(theme==='dark'&&selected!=='#7dd3fc')throw Error('Mining hub accent not cyan: '+selected)
  if(theme==='dark'&&await background(page,'.syllabus-hub-intro button')!==cyan)throw Error('Mining hub primary action not cyan')
  await save(page,'mining-hub-'+theme+'-'+width)
  if(errors.length)throw Error('Browser errors: '+errors.slice(0,4).join('; '))
  console.log('PASS cyan '+theme+' '+width+'x'+height+'; logo, navigation, buttons, KPI, Brazil map, Atlas and Mining hub')
 }finally{await context.close()}
}
try{
 await fs.mkdir(out,{recursive:true})
 for(const v of [['dark',1440,900],['light',1440,900],['dark',390,844]])await run(...v)
 await fs.writeFile(path.join(out,'PREVIEW_MANIFEST.json'),JSON.stringify({
   branch:'feat/soft-cyan-theme-7dd3fc',
   git_sha:process.env.GITHUB_SHA||'local',
   accent:'#7DD3FC',
   method:'Chromium rendering of actual React/Vite website with source-backed Olist export',
   rendered_at_utc:new Date().toISOString(),
   images:files
 },null,2)+'\n')
 console.log('PASS '+files.length+' genuine soft-cyan branch screenshots')
}catch(e){console.error('FAIL:',e);process.exitCode=1}finally{await browser.close()}
