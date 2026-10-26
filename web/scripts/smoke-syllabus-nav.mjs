import { chromium } from 'playwright'

const base = process.env.PP_BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']})
const analysisAreas = ['Warehouse & ETL','Data Lakes','EDA & Preprocessing','Classification Lab','Clustering Lab','Pattern Mining']
const failures = []

async function run(viewport, colorScheme) {
  const context = await browser.newContext({viewport, colorScheme, reducedMotion: 'reduce'})
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(base, {waitUntil: 'domcontentloaded', timeout: 60000})
    await page.locator('.pp-welcome').waitFor({state: 'visible', timeout: 120000})
    const dock = page.getByRole('navigation', {name: 'Main navigation'})
    const launcher = dock.getByRole('button', {name: 'Data Mining Lab', exact: true})

    // Clicking the graduation-cap icon must navigate, not open a flyout.
    await launcher.click()
    await page.locator('.syllabus-hub-grid .syllabus-hub-card').first().waitFor({state:'visible',timeout:120000})
    if (await page.locator('.syllabus-nav-submenu').count() !== 0) throw Error('Old sidebar popup is still present')
    if (await page.locator('.syllabus-hub-grid .syllabus-hub-card').count() !== 6) throw Error('Overview is missing an analysis card')
    const hubCopy = await page.locator('.syllabus-hub').innerText()
    if (/30\s*(contact\s*)?hours|6\s*modules|research environment|academic laboratory|MODULE 0/i.test(hubCopy)) {
      throw Error('Classroom placeholder text still visible on overview')
    }

    // Each visible analysis card opens the correct interactive lab.
    await page.locator('.syllabus-hub-grid .syllabus-hub-card').first().getByRole('button', {name:'Open analysis'}).click()
    let tabs = page.getByRole('navigation', {name:'Data Mining Lab sections'})
    await tabs.getByRole('button', {name: 'Warehouse & ETL', exact:true}).waitFor({state:'visible'})
    for (const name of analysisAreas.slice(1)) {
      await tabs.getByRole('button', {name, exact:true}).click()
      await page.locator('.syllabus-page .syllabus-card').first().waitFor({state:'visible',timeout:120000})
      if (await tabs.getByRole('button',{name,exact:true}).getAttribute('aria-current') !== 'page') {
        throw Error('Internal tab failed to activate: '+name)
      }
      const pageText = await page.locator('.syllabus-page').innerText()
      if (/Academic laboratory|30-hour university syllabus|MODULE \d OF 6/i.test(pageText)) {
        throw Error('Classroom placeholder text still visible in '+name)
      }
    }
    await tabs.getByRole('button', {name:'Overview', exact:true}).click()
    await page.locator('.syllabus-hub-grid .syllabus-hub-card').first().waitFor({state:'visible'})
    await launcher.click() // Selecting the icon on the hub must not produce a popover.
    if (await page.locator('.syllabus-nav-submenu').count()) throw Error('Popover unexpectedly reopened')
    if (errors.length) throw Error('Runtime error(s): '+errors.join('; '))
    console.log('PASS direct lab navigation: '+viewport.width+'x'+viewport.height+' '+colorScheme)
  } finally {
    await context.close()
  }
}

try {
  for (const [viewport, theme] of [
    [{width:1440,height:900}, 'light'],
    [{width:1440,height:900}, 'dark'],
    [{width:390,height:844}, 'light'],
    [{width:390,height:844}, 'dark']
  ]) await run(viewport,theme)
} catch (error) {
  failures.push(error.stack||String(error))
} finally {
  await browser.close()
}
if (failures.length) {
  console.error('FAIL direct lab navigation: '+failures.join('\n'))
  process.exitCode=1
}
