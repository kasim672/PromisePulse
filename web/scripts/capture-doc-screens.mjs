/**
 * Automated REAL-APP screenshot capture for the PromisePulse documentation.
 * Run only against the launched Vite server with the bundled Olist Parquet data.
 * No dummy chart values, fabricated route geometry or fake screenshots.
 *
 * npm install --no-save --package-lock=false playwright
 * npx playwright install chromium
 * PP_BASE_URL=http://127.0.0.1:4173 node scripts/capture-doc-screens.mjs
 */
import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const base=process.env.PP_BASE_URL||'http://127.0.0.1:4173'
const dest=path.resolve(process.cwd(),'../docs/screenshots/v3')
await fs.mkdir(dest,{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const images=[]
const appErrors=[]
const routes=[
  ['Overview','overview'],
  ['Intelligence','intelligence'],
  ['Analytics Atlas','atlas-commerce'],
  ['OLAP Lab','olap-lab'],
  ['Risk Center','risk-center'],
  ['Data Catalog','data-catalog'],
  ['Pipeline & Quality','pipeline-quality']
]
async function waitForRenderedData(page){
  // Wait for active historical SQL results in *all* visible blocks, not just
  // the initial DuckDB connection. A connected header can precede SQL results.
  await page.waitForFunction(() => {
    const loadingCopy=Array.from(document.querySelectorAll('.pp-placeholder'))
      .some(el => (el.textContent || '').includes('Querying historical warehouse'))
    const atlasLoad=document.querySelector('.atlas-loading')
    const placeholder=document.querySelector('.spinner')
    const kpi=document.querySelector('.pp-dashboard .pp-kpi strong')
    const pendingKpi=!!kpi && /[·.]{3}/.test(kpi.textContent || '')
    return !loadingCopy && !atlasLoad && !placeholder && !pendingKpi
  },null,{timeout:120000})
}
async function newPage(viewport,theme){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,colorScheme:theme,reducedMotion:'reduce',locale:'en-US'})
  await context.addInitScript(choice=>{
    try{localStorage.setItem('promisepulse-theme',choice)}catch{}
  },theme)
  const page=await context.newPage()
  page.on('pageerror',error=>appErrors.push(String(error)))
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000})
  // The header status is hidden by responsive CSS on mobile; verify the actual content instead.
  await page.locator('.pp-dashboard').waitFor({state:'visible',timeout:120000})
  await waitForRenderedData(page)
  return {page,context}
}
async function navigate(page,title){
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:title,exact:true}).click()
  await page.locator('main').getByText(title,{exact:false}).first().waitFor({timeout:10000}).catch(()=>{})
  // Wait for the active route rather than taking a screenshot of a spinner.
  await waitForRenderedData(page)
}
async function save(page,filename,selector){
  if(selector) await page.locator(selector).first().waitFor({state:'visible',timeout:40000})
  await page.evaluate(async()=>{
    await document.fonts.ready
    window.scrollTo({top:0,left:0,behavior:'instant'})
  })
  await waitForRenderedData(page)
  const errors=await page.locator('.atlas-error,.pp-error').allTextContents()
  if(errors.length)throw new Error(filename+' has visible errors: '+errors.join(' | '))
  // Snapshot is the actual rendered route, retaining all data-source disclosures.
  await page.screenshot({path:path.join(dest,filename),fullPage:true,animations:'disabled',caret:'hide'})
  images.push(filename)
  console.log('Captured '+filename)
}
try{
  for(const theme of ['light','dark']){
    const {page,context}=await newPage({width:1440,height:900},theme)
    await save(page,'overview-'+theme+'.png','.pp-dashboard')
    for(const [route,filename] of routes.slice(1)){
      await navigate(page,route)
      if(route==='Analytics Atlas')await page.locator('.atlas-chart-card .atlas-svg').first().waitFor({state:'visible',timeout:90000})
      await save(page,filename+'-'+theme+'.png')
    }
    await navigate(page,'Analytics Atlas')
    await page.getByRole('navigation',{name:'Analytics lenses'}).getByRole('button',{name:/Research laboratory/}).click()
    await page.locator('.atlas-matrix-card .atlas-matrix-table').first().waitFor({state:'visible',timeout:90000})
    await page.locator('.atlas-loading').first().waitFor({state:'hidden',timeout:90000}).catch(()=>{})
    await save(page,'atlas-laboratory-'+theme+'.png')
    await context.close()
  }
  const {page,context}=await newPage({width:390,height:844},'light')
  await save(page,'overview-mobile-light.png','.pp-dashboard')
  await navigate(page,'Analytics Atlas')
  await page.locator('.atlas-chart-card .atlas-svg').first().waitFor({state:'visible',timeout:90000})
  await save(page,'atlas-commerce-mobile-light.png')
  await context.close()
  if(appErrors.length) throw new Error('Browser runtime exceptions: '+appErrors.slice(0,8).join('; '))
  const manifest={source:'Actual PromisePulse React/Vite app running the repository Parquet files, headless Chromium/Playwright',base_url:'localhost (not a public demonstration server)',captured_utc:new Date().toISOString(),viewport_desktop:'1440x900',viewport_mobile:'390x844',screenshots:images}
  await fs.writeFile(path.join(dest,'CAPTURE_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n')
  console.log('PASS: '+images.length+' authentic application screenshots written to '+dest)
}catch(e){console.error(e);process.exitCode=1}
finally{await browser.close()}
