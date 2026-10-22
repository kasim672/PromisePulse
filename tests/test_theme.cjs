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
console.log('PASS: persisted light/dark appearance, chart tokens, route surface coverage and keyboard labels')
