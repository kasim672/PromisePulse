import {chromium} from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
const base=process.env.PP_BASE_URL||'http://127.0.0.1:4173/'
const screenshots=path.resolve(process.cwd(),'.screenshots-header-search')
await fs.mkdir(screenshots,{recursive:true})
const browser=await chromium.launch({headless:true,channel:process.env.PP_BROWSER_CHANNEL==='chrome'?'chrome':undefined,args:['--no-sandbox','--disable-dev-shm-usage']})
const cases=[{width:1440,height:900,theme:'dark'},{width:1440,height:900,theme:'light'},{width:900,height:800,theme:'dark'},{width:760,height:840,theme:'dark'},{width:390,height:844,theme:'dark'},{width:320,height:700,theme:'light'}]
try{
 for(const {width,height,theme} of cases){
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce',deviceScaleFactor:1})
  await context.addInitScript(value=>localStorage.setItem('promisepulse-theme',value),theme)
  const page=await context.newPage(),jsErrors=[]
  page.on('pageerror',e=>jsErrors.push(e.message))
  try{
   await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000})
   await page.locator('.header-search').waitFor({state:'visible',timeout:90000})
   if(await page.locator('.header-version,.header-online').count())throw Error('Header status badge still in DOM')
   if(await page.getByText('WAREHOUSE CONNECTED',{exact:true}).count())throw Error('Removed status text still visible')
   const header=page.locator('.header-inner')
   const search=page.locator('.header-search')
   const themeBox=await page.locator('.theme-toggle').boundingBox()
   const searchBox=await search.boundingBox()
   const cta=page.locator('.header-cta')
   const ctaVisible=await cta.isVisible()
   const ctaBox=ctaVisible?await cta.boundingBox():null
   if(!themeBox||!searchBox)throw Error('Search or theme toggle has no bounds')
   if(searchBox.x+searchBox.width>themeBox.x+2)throw Error('Search must be before the theme toggle without overlapping it')
   if(ctaBox&&themeBox.x+themeBox.width>ctaBox.x+2)throw Error('Theme toggle overlaps Explore data')
   const children=await page.locator('.header-actions').locator(':scope > button').evaluateAll(nodes=>nodes.map(node=>node.className))
   if(children[0]!=='header-search'||children[1]!=='theme-toggle'||children[2]!=='header-cta')throw Error('Header order must be Search → Theme → Explore data')
   if(width>=900&&searchBox.width<220)throw Error('Search did not expand into available desktop header space')
   if(width<=480&&searchBox.width<34)throw Error('Mobile search no longer usable')
   const empty=await header.evaluate(node=>({header:node.getBoundingClientRect().width,remaining:node.getBoundingClientRect().right-[...node.children].map(e=>e.getBoundingClientRect().right).reduce((x,v)=>Math.max(x,v),0),pageOverflow:document.documentElement.scrollWidth-window.innerWidth}))
   if(empty.pageOverflow>3)throw Error('Horizontal overflow: '+empty.pageOverflow+'px')
   await page.screenshot({path:path.join(screenshots,`header-${width}-${theme}.png`),animations:'disabled'})
   await search.click()
   await page.getByRole('dialog',{name:'Find a PromisePulse section'}).waitFor({state:'visible',timeout:12000})
   await page.getByRole('textbox',{name:'Search sections'}).fill('OLAP')
   await page.getByRole('button',{name:/OLAP Lab/}).first().waitFor({state:'visible',timeout:12000})
   await page.keyboard.press('Escape')
   if(await page.getByRole('dialog',{name:'Find a PromisePulse section'}).isVisible())throw Error('Escape did not dismiss search')
   if(jsErrors.length)throw Error('JavaScript errors: '+jsErrors.slice(0,2).join('; '))
   console.log(`PASS: ${width}x${height} ${theme}; search ${Math.round(searchBox.width)}px; status gone; no overflow; palette works`)
  }finally{await context.close()}
 }
 console.log('PASS: responsive header search replaces the warehouse badge across six viewports')
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}
