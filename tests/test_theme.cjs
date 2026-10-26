/** Lightweight repository contract checks; run with node tests/test_theme.cjs.
 * Browser-based contrast, focus and responsive QA remains a separate step.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8')

const app = read('web/src/App.tsx')
const premium = read('web/src/Premium.tsx')
const entry = read('web/src/main.tsx')
const html = read('web/index.html')
const css = read('web/src/theme.css')

assert.match(entry, /import '\.\/measured-glass\.css'\s+import '\.\/theme\.css'/, 'theme must load after measured styles')
assert.match(html, /localStorage\.getItem\('promisepulse-theme'\)/, 'theme must be applied before paint')
assert.match(html, /prefers-color-scheme: dark/, 'use OS preference on first visit')
assert.match(app, /useState<Theme>\(initialTheme\)/, 'initialize global mode')
assert.match(app, /setTheme\(current => current === 'dark' \? 'light' : 'dark'\)/, 'working theme button')
assert.match(app, /localStorage\.setItem\(THEME_KEY, theme\)/, 'persist mode across visits')
assert.match(app, /window\.addEventListener\('storage', syncTheme\)/, 'sync choice between tabs')
assert.match(app, /aria-label=\{theme === 'dark' \? 'Switch to light mode' : 'Switch to dark mode'\}/, 'accessible toggle label')
for (const selector of [
  '.panel', '.pp-block', '.pp-map-plot', '.pp-map-inspector', '.pp-kpi',
  '.pp-insights-hero', '.op-tab', '.filter-grid input', '.table-scroll th',
  '.pp-order-table td', '.source-hero', '.lineage-node', '.command-dialog',
  '.site-footer'
]) {
  assert.ok(css.includes('html[data-theme="dark"] ' + selector), 'missing dark treatment: ' + selector)
}
for (const token of ['--pp-chart-green','--pp-chart-blue','--pp-chart-grid','--pp-map-low','--pp-map-high','--pp-map-selected']) {
  assert.ok(css.includes(token), 'missing chart/map theme token: '+token)
  assert.ok(premium.includes(token), 'charts or map not using theme token: '+token)
}
assert.match(css, /prefers-reduced-motion:reduce/, 'respect reduced motion')

/* Chat light mode must not reuse the translucent Cadra glass surfaces.
   These contrast checks cover the primary response, muted copy, cyan links and
   the user bubble. Dark mode keeps the original component palette. */
const chat = read('web/src/project-assistant.css')
for (const selector of [
  '.project-ai-dialog', '.project-ai-header', '.project-ai-messages',
  '.project-ai-message', '.project-ai-message.user', '.project-ai-sources a',
  '.project-ai-composer', '.project-ai-composer textarea',
  '.project-ai-composer button:disabled'
]) {
  assert.ok(chat.includes('html[data-theme="light"] ' + selector + ' {'),
    'light chatbot needs an explicit opaque style for ' + selector)
}
assert.match(chat,/\.project-ai-trigger\{right:12px;bottom:86px;/,'mobile AI launcher must clear bottom navigation')
assert.doesNotMatch(chat,/html\[data-theme="dark"\]\s+\.project-ai-/,
  'dark chatbot appearance should not be changed by light-only overrides')
assert.match(chat,/--ai-surface:\s*#f8fbff/i)
assert.match(chat,/--ai-panel:\s*#ffffff/i)
assert.match(chat,/--ai-ink:\s*#10263e/i)
assert.match(chat,/--ai-muted:\s*#4b6077/i)
function contrast(foreground,background) {
  const lum = (hex) => {
    const rgb = hex.slice(1).match(/.{2}/g).map(x => parseInt(x,16)/255)
      .map(x => x <= 0.04045 ? x/12.92 : ((x+0.055)/1.055)**2.4)
    return rgb[0]*0.2126 + rgb[1]*0.7152 + rgb[2]*0.0722
  }
  const values = [lum(foreground),lum(background)].sort((a,b)=>b-a)
  return (values[0]+0.05)/(values[1]+0.05)
}
for (const [foreground,background] of [
  ['#10263e','#ffffff'], // assistant copy
  ['#4b6077','#ffffff'], // secondary copy
  ['#082f49','#def2ff'], // user messages
  ['#075985','#f2f9fe'], // document links
  ['#082f49','#7dd3fc'], // send button
  ['#53697f','#ffffff']  // textarea placeholder
]) {
  assert.ok(contrast(foreground,background) >= 4.5,
    'chat light palette fails WCAG AA normal text contrast: '+foreground+' / '+background)
}

console.log('PASS: persisted light/dark appearance, chart tokens, route surface coverage and keyboard labels and accessible chatbot light palette')
