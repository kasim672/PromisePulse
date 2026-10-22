/* PromisePulse UI smoke test: runs against built Vite preview, no fake data.
   Install playwright in the CI job; screenshots are uploaded as workflow artifacts. */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const base = 'http://127.0.0.1:4173'
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  cwd: process.cwd(), stdio: ['ignore', 'inherit', 'inherit'], detached: false,
})
let browser
const routes = ['Overview', 'Intelligence', 'OLAP Lab', 'Risk Center', 'Data Catalog', 'Pipeline & Quality']
const ensure = (condition, message) => { if (!condition) throw new Error(message) }
async function ready() {
  for (let attempt=0; attempt<50; attempt++) {
    if (server.exitCode!==null) throw new Error('Preview server exited')
    try { const response=await fetch(base); if(response.ok) return } catch { /* awaiting startup */ }
    await delay(300)
  }
  throw new Error('Preview server did not start')
}
try {
  await ready()
  await mkdir('artifacts', { recursive:true })
  browser = await chromium.launch({headless:true,args:['--no-sandbox']})
  for(const viewport of [
    {name:'desktop',width:1920,height:858,isMobile:false},
    {name:'tablet',width:820,height:1024,isMobile:false},
    {name:'mobile',width:390,height:844,isMobile:true},
    {name:'small-mobile',width:360,height:740,isMobile:true}
  ]) {
    const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.isMobile,deviceScaleFactor:1})
    const errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000})
    await page.getByRole('navigation',{name:'Primary workspace'}).waitFor()
    await page.locator('.pp-home').first().waitFor({timeout:120000})
    const warehouseText = await page.locator('.header-version').textContent()
    ensure(warehouseText?.includes('WAREHOUSE READY'), viewport.name+' warehouse did not load')
    ensure(await page.locator('nav.main-nav button').count()===6,'Expected exactly six navigation items')
    for (const route of routes) {
      await page.getByRole('navigation',{name:'Primary workspace'}).getByRole('button',{name:route,exact:true}).click()
      await page.getByRole('navigation',{name:'Primary workspace'}).getByRole('button',{name:route,exact:true}).evaluate(node=>{
        if(node.getAttribute('aria-current')!=='page') throw new Error('aria-current not updated')
      })
      const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}))
      ensure(width.scroll<=width.viewport+3,route+' overflows '+viewport.name+': '+JSON.stringify(width))
      ensure(await page.locator('main#main-content').isVisible(),route+' main content hidden')
      if(route==='OLAP Lab'||route==='Data Catalog') {
        ensure(await page.locator('pre.sql-code').count()===0,route+' exposes SQL preview')
      }
    }
    await page.getByRole('navigation',{name:'Primary workspace'}).getByRole('button',{name:'Overview'}).click()
    await page.screenshot({path:join('artifacts',viewport.name+'-overview.png'),fullPage:true,animations:'disabled'})
    ensure(errors.length===0,viewport.name+' browser errors: '+errors.join('; '))
    console.log('PASS', viewport.name, 'six routes, no overflow, screenshot saved')
    await page.close()
  }
} finally {
  if(browser) await browser.close()
  if(server.exitCode===null) server.kill('SIGTERM')
}
