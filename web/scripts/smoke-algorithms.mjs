import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
const url=process.env.PP_BASE_URL||'http://127.0.0.1:4173/'
const dir=path.resolve('../docs/screenshots/current')
const browser=await chromium.launch({headless:true,channel:process.env.PP_BROWSER_CHANNEL==='chrome'?'chrome':undefined,args:['--no-sandbox','--disable-dev-shm-usage']})
const names=[]
async function test(theme,width,height){
 const ctx=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'})
 await ctx.addInitScript(v=>localStorage.setItem('promisepulse-theme',v),theme)
 const page=await ctx.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 const mobile=width<500
 const capture=async name=>{const file=(mobile?'mobile-':'')+'algorithm-'+name+'-'+theme+'.png';await page.screenshot({path:path.join(dir,file),animations:'disabled',fullPage:true});names.push(file)}
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'})
  const cyan=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--pp-accent-cyan').trim().toLowerCase())
  if(cyan!=='#7dd3fc')throw Error('Expected soft cyan release for screenshots: '+cyan)
  const nav=page.getByRole('navigation',{name:'Main navigation'})
  const hub=()=>nav.getByRole('button',{name:'Data Mining Lab',exact:true}).click()
  const open=async index=>{await hub();const cards=page.locator('.syllabus-hub-grid .syllabus-hub-card');await cards.first().waitFor({state:'visible',timeout:90000});await cards.nth(index).getByRole('button',{name:'Open analysis'}).click();await page.getByRole('region',{name:'Interactive algorithm visualizer'}).waitFor({state:'visible',timeout:90000})}
  await open(3)
  const lab=page.getByRole('region',{name:'Interactive algorithm visualizer'})
  await lab.getByRole('button',{name:'Next step'}).click()
  await lab.getByRole('heading',{name:'Test the root split'}).waitFor()
  await lab.getByRole('button',{name:'Restart'}).click()
  await capture('decision-tree')
  await open(4)
  await lab.getByRole('button',{name:'Next step'}).click()
  await lab.getByRole('heading',{name:'Assign points to their nearest center'}).waitFor()
  await lab.getByRole('button',{name:'Next step'}).click()
  await lab.getByRole('heading',{name:'Update each center to its group mean'}).waitFor()
  await capture('k-means')
  await open(5)
  for(const [algo,name,label] of [
   ['Apriori','apriori','Generate and count all 2-item candidates'],
   ['FP-Growth','fp-growth','Insert T1 into the FP-tree'],
   ['Eclat','eclat','Intersect TID sets for A+B']
  ]){
   await lab.getByRole('button',{name:algo,exact:true}).click()
   await lab.getByRole('button',{name:'Next step'}).click()
   if(algo==='Apriori')await lab.getByRole('button',{name:'Next step'}).click()
   await lab.getByRole('heading',{name:label}).waitFor()
   await capture(name)
  }
  if(errors.length)throw Error(errors.join('; '))
  console.log('PASS algorithms '+theme+' '+width+'x'+height)
 }finally{await ctx.close()}
}
async function testRecovery(){
 const ctx=await browser.newContext({viewport:{width:1200,height:800}})
 const page=await ctx.newPage()
 try{
  let blockWarehouse=true
  await page.route('**/data/manifest.json',route=>blockWarehouse?route.fulfill({status:503,body:'Temporary failure'}):route.continue())
  await page.goto(url,{waitUntil:'domcontentloaded'})
  await page.getByRole('button',{name:'Retry loading data'}).waitFor({timeout:90000})
  blockWarehouse=false
  await page.getByRole('button',{name:'Retry loading data'}).click()
  // The header status badge was removed; wait for actual data-backed chart output.
  await page.locator('.welcome-history svg').waitFor({state:'visible',timeout:90000})
  let blockMining=true
  await page.route('**/data/mining_lab.json',route=>blockMining?route.fulfill({status:503,body:'Temporary failure'}):route.continue())
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Data Mining Lab',exact:true}).click()
  await page.getByRole('button',{name:'Retry loading data'}).waitFor({timeout:90000})
  blockMining=false
  await page.getByRole('button',{name:'Retry loading data'}).click()
  await page.locator('.syllabus-hub-stat-grid strong').first().waitFor({timeout:90000})
  console.log('PASS warehouse + mining lab retry')
 }finally{await ctx.close()}
}
try{
 await fs.mkdir(dir,{recursive:true})
 for(const v of [['light',1440,900],['dark',1440,900],['light',390,844]])await test(...v)
 if(process.env.PP_SKIP_RECOVERY!=='1')await testRecovery()
 await fs.writeFile(path.join(dir,'ALGORITHM_CAPTURE_MANIFEST.json'),JSON.stringify({source:'Real Chromium rendering deterministic educational examples; empirical Olist results remain separate',captured_at_utc:new Date().toISOString(),source_sha:process.env.GITHUB_SHA||'local',images:names},null,2)+'\n')
 console.log('PASS '+names.length+' source screenshots and error recovery')
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}
