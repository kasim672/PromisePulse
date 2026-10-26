/**
 * Browser QA and screenshot capture against real mining_lab.json and Olist data.
 * Export first with scripts/build_mining_lab.py; no fake fallback metrics.
 */
import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
const root=process.env.PP_BASE_URL||'http://127.0.0.1:4173'
const folder=path.resolve(process.cwd(),'../docs/screenshots/v5')
await fs.mkdir(folder,{recursive:true})
const labels=['Warehouse & ETL','Data Lakes','EDA & Preprocessing','Classification Lab','Clustering Lab','Pattern Mining']
const slug=['warehouse-etl','data-lakes','eda-preprocessing','classification-regression','clustering-dendrogram','apriori-fpgrowth-eclat']
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const screenshots=[],errors=[]
async function navigateToModule(page,label){
 const nav=page.getByRole('navigation',{name:'Main navigation'})
 await nav.getByRole('button',{name:'Data Mining Lab',exact:true}).click()
 const grid=page.locator('.syllabus-hub-grid .syllabus-hub-card')
 await grid.first().waitFor({state:'visible',timeout:120000})
 if(label==='Syllabus Hub')return
 const i=labels.indexOf(label)
 if(i<0)throw Error('Unknown analysis area '+label)
 await grid.nth(i).getByRole('button',{name:'Open analysis',exact:true}).click()
 await page.getByRole('navigation',{name:'Data Mining Lab sections'}).getByRole('button',{name:label,exact:true}).waitFor({state:'visible'})
}
async function capture(theme,viewport,mobile=false){
 const ctx=await browser.newContext({viewport,deviceScaleFactor:1,colorScheme:theme,reducedMotion:'reduce'})
 await ctx.addInitScript(value=>localStorage.setItem('promisepulse-theme',value),theme)
 const page=await ctx.newPage()
 page.on('pageerror',err=>errors.push(String(err)))
 await page.goto(root,{waitUntil:'domcontentloaded',timeout:100000})
 await page.locator('.pp-welcome').waitFor({timeout:120000})
 const suffix=(mobile?'-mobile':'')+'-'+theme
 await navigateToModule(page,'Syllabus Hub')
 await page.locator('.syllabus-hub-grid .syllabus-hub-card').first().waitFor({state:'visible',timeout:120000})
 await page.waitForFunction(()=>document.querySelectorAll('.syllabus-hub-stat-grid strong').length===6,null,{timeout:120000})
 const cards=await page.locator('.syllabus-hub-grid .syllabus-hub-card').count()
 if(cards!==6)throw Error('Lab overview must contain all analysis areas, got '+cards)
 await page.getByRole('button',{name:'Modelling',exact:true}).click()
 if(await page.locator('.syllabus-hub-grid .syllabus-hub-card').count()!==2)throw Error('Syllabus phase filter failed')
 await page.getByRole('button',{name:'All',exact:true}).click()
 const first='syllabus-hub'+suffix+'.png'
 await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo({top:0,behavior:'instant'})})
 await page.screenshot({path:path.join(folder,first),fullPage:true,animations:'disabled'})
 screenshots.push(first)
 console.log('Verified Data Mining Lab overview: '+first)
 for(let i=0;i<labels.length;i++){
  if(mobile&&i!==2&&i!==4)continue
  await navigateToModule(page,labels[i])
  await page.locator('.syllabus-page').waitFor({timeout:100000})
  await page.locator('.syllabus-page .syllabus-card').first().waitFor({state:'visible',timeout:120000})
  await page.locator('.syllabus-pending').waitFor({state:'hidden',timeout:120000})
  const alert=await page.locator('.syllabus-error,.atlas-error').allTextContents()
  if(alert.length)throw Error(labels[i]+': '+alert.join(' | '))
  const count=await page.locator('.syllabus-page .atlas-chart-card').count()
  if(count<2)throw Error(labels[i]+': expected empirical chart cards, got '+count)
  if(i===4){
    const countDendro=await page.locator('.syllabus-dendrogram polyline').count()
    if(countDendro<10)throw Error('Real dendrogram linkage not rendered')
  }
  if(i===5&&!mobile){
    const rules=await page.locator('.syllabus-rule-network button').count()
    if(rules===0)console.log('No association rules satisfy eligible support criteria; honest empty view')
  }
  await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo({top:0,behavior:'instant'})})
  const filename=slug[i]+suffix+'.png'
  await page.screenshot({path:path.join(folder,filename),fullPage:true,animations:'disabled'})
  screenshots.push(filename)
  console.log(labels[i]+': '+count+' real analytical figures; saved '+filename)
 }
 if(!mobile){
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Overview',exact:true}).click()
  await page.locator('.pp-dashboard').waitFor({timeout:120000})
  await page.waitForFunction(()=>[...document.querySelectorAll('.pp-placeholder')].every(x=>!x.textContent?.includes('Querying historical warehouse')),null,{timeout:120000})
  const filename='preserved-overview-'+theme+'.png'
  await page.screenshot({path:path.join(folder,filename),fullPage:true,animations:'disabled'})
  screenshots.push(filename)
 }
 await ctx.close()
}
try{
 await capture('light',{width:1440,height:900})
 await capture('dark',{width:1440,height:900})
 await capture('light',{width:390,height:844},true)
 if(errors.length)throw Error('JavaScript runtime exception: '+errors.slice(0,4).join('; '))
 const manifest={source:'Actual Olist Parquet and offline scikit-learn/mlxtend export',when_utc:new Date().toISOString(),viewports:['1440x900 light/dark','390x844 mobile light'],screenshots,notes:'Six working syllabus modules plus syllabus hub, empirical figures, both theme modes and original Overview preserved; train-only fitted preprocessing'}
 await fs.writeFile(path.join(folder,'CAPTURE_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n')
 console.log('PASS: '+screenshots.length+' authentic university module captures')
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}
