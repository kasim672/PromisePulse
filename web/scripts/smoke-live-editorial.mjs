import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const target=process.env.PP_LIVE_URL||'https://promise-pulse-rose.vercel.app/'
const artifacts=path.resolve(process.cwd(),'.screenshots-live')
await fs.mkdir(artifacts,{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const forbidden=/RESEARCH-GRADE EXPLORATORY INTELLIGENCE|THE PROMISEPULSE RESEARCH EXPERIENCE|INSIGHT COMMAND CENTER|HISTORICAL BRAZIL · 2016–2018|V 4\.0/i
async function inspect(width,height,theme){
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce',deviceScaleFactor:1})
 await context.addInitScript(mode=>localStorage.setItem('promisepulse-theme',mode),theme)
 const page=await context.newPage()
 const exceptions=[]
 page.on('pageerror',err=>exceptions.push(String(err)))
 try{
  // Production deploys can finish shortly after the GitHub push starts CI.
  let ready=false
  for(let attempt=0;attempt<18;attempt++){
   await page.goto(target+'?typography-check='+encodeURIComponent(process.env.GITHUB_SHA||'latest'),{waitUntil:'domcontentloaded',timeout:60000})
   await page.locator('.pp-welcome').waitFor({state:'visible',timeout:45000})
   const text=await page.locator('.pp-welcome').innerText()
   if(!forbidden.test(text)&&await page.locator('.welcome-visual-top h2').count()===1){ready=true;break}
   await new Promise(r=>setTimeout(r,8000))
  }
  if(!ready)throw Error('Production has not picked up the new editorial layout')
  const title=page.locator('.welcome-story h1')
  if(!await title.isVisible())throw Error('Main landing headline missing')
  const cards=await page.locator('.welcome-number-grid strong').count()
  if(cards!==3)throw Error('Historical KPI cards missing')
  await page.screenshot({path:path.join(artifacts,`home-${width}-${theme}.png`),animations:'disabled'})
  const nav=page.getByRole('navigation',{name:'Main navigation'})
  await nav.getByRole('button',{name:'Overview',exact:true}).click()
  await page.locator('.pp-dashboard').waitFor({state:'visible',timeout:90000})
  if(forbidden.test(await page.locator('main').innerText()))throw Error('Overview still contains old eyebrow text')
  await nav.getByRole('button',{name:'Analytics Atlas',exact:true}).click()
  await page.locator('.atlas-page').waitFor({state:'visible',timeout:90000})
  if(await page.locator('.atlas-mini-label,.pp-overline,.section-eyebrow').count())throw Error('Atlas still contains decorative eyebrow elements')
  await nav.getByRole('button',{name:'Data Mining Lab',exact:true}).click()
  await page.locator('.syllabus-hub-grid .syllabus-hub-card').first().waitFor({state:'visible',timeout:90000})
  await page.locator('.syllabus-hub-grid .syllabus-hub-card').first().getByRole('button',{name:'Open analysis'}).click()
  await page.getByRole('navigation',{name:'Data Mining Lab sections'}).getByRole('button',{name:'Warehouse & ETL',exact:true}).waitFor({state:'visible',timeout:90000})
  await nav.getByRole('button',{name:'Data Mining Lab',exact:true}).click()
  await page.locator('.syllabus-hub-grid .syllabus-hub-card').nth(4).getByRole('button',{name:'Open analysis'}).click()
  const visual=page.getByRole('region',{name:'Interactive algorithm visualizer'})
  await visual.waitFor({state:'visible',timeout:90000})
  await visual.getByRole('button',{name:'Next step'}).click()
  await visual.getByRole('heading',{name:'Assign points to their nearest center'}).waitFor({state:'visible',timeout:90000})
  console.log('PASS: deployed K-Means visualizer navigation and actual step calculation')
  if(exceptions.length)throw Error('Browser exception(s): '+exceptions.slice(0,3).join('; '))
  console.log(`PASS: production ${width}x${height} ${theme}, home / overview / atlas / lab`)
 }finally{await context.close()}
}
try{
 for(const [w,h,t] of [[1440,900,'light'],[1440,900,'dark'],[390,844,'light'],[390,844,'dark']])await inspect(w,h,t)
 console.log('PASS: production website has updated editorial typography across desktop and mobile')
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}
