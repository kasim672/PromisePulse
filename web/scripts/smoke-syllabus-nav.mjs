import { chromium } from 'playwright'

const base = process.env.PP_BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']})
const failures = []

async function run(viewport, colorScheme) {
  const context = await browser.newContext({viewport, colorScheme, reducedMotion: 'reduce'})
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(base, {waitUntil: 'domcontentloaded', timeout: 60000})
    await page.locator('.pp-welcome').waitFor({state: 'visible', timeout: 120000})
    const nav = page.getByRole('navigation', {name: 'Main navigation'})
    const trigger = nav.getByRole('button', {name: 'Data Mining Lab', exact: true})
    const submenu = page.locator('#syllabus-nav-submenu')
    await trigger.click()
    await submenu.waitFor({state: 'visible'})
    if (await trigger.getAttribute('aria-expanded') !== 'true') throw Error('Trigger not marked expanded')
    const bounds = await page.evaluate(() => {
      const panel = document.querySelector('#syllabus-nav-submenu').getBoundingClientRect()
      const button = document.querySelector('.syllabus-nav-trigger').getBoundingClientRect()
      return {
        visible: panel.top >= 0 && panel.left >= 0 && panel.bottom <= innerHeight + 1 && panel.right <= innerWidth + 1,
        direction: innerWidth > 1099 ? panel.left >= button.right : panel.bottom <= button.top,
        panel: [panel.left, panel.top, panel.right, panel.bottom],
        button: [button.left, button.top, button.right, button.bottom]
      }
    })
    if (!bounds.visible || !bounds.direction) throw Error('Flyout not properly placed: ' + JSON.stringify(bounds))
    if (await submenu.getByRole('button').count() !== 7) throw Error('Expected syllabus hub + 6 modules')
    await page.keyboard.press('Escape')
    await submenu.waitFor({state: 'hidden'})
    if (await trigger.getAttribute('aria-expanded') !== 'false') throw Error('Escape did not collapse menu')
    if (await trigger.evaluate(el => document.activeElement === el) !== true) throw Error('Escape did not restore focus')
    await trigger.click()
    await submenu.waitFor({state: 'visible'})
    await page.locator('header .brand').click()
    await submenu.waitFor({state: 'hidden'})
    await trigger.click()
    await submenu.getByRole('button', {name: 'Syllabus Hub', exact: true}).click()
    await page.locator('.syllabus-hub-grid .syllabus-hub-card').first().waitFor({state: 'visible', timeout: 120000})
    await trigger.click()
    await submenu.getByRole('button', {name: 'Clustering Lab', exact: true}).click()
    await page.locator('.syllabus-page .syllabus-card').first().waitFor({state: 'visible', timeout: 120000})
    if (await submenu.isVisible()) throw Error('Menu remains open after module navigation')
    if (errors.length) throw Error('Runtime error(s): ' + errors.join('; '))
    console.log('PASS navigation: ' + viewport.width + 'x' + viewport.height + ' ' + colorScheme)
  } finally {
    await context.close()
  }
}

try {
  for (const [viewport, theme] of [
    [{width: 1440, height: 900}, 'light'],
    [{width: 1440, height: 900}, 'dark'],
    [{width: 390, height: 844}, 'light'],
    [{width: 390, height: 844}, 'dark']
  ]) await run(viewport, theme)
} catch (error) {
  failures.push(error.stack || String(error))
} finally {
  await browser.close()
}
if (failures.length) {
  console.error('FAIL syllabus flyout: ' + failures.join('\n'))
  process.exitCode = 1
}
