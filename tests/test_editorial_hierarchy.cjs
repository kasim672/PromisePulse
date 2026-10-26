const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.join(__dirname, '..')
const components = ['Welcome','App','Premium','AnalyticsAtlas','ResearchWorkspace','SyllabusHub','SyllabusLab']
const source = Object.fromEntries(components.map(name=>[
  name, fs.readFileSync(path.join(root,'web/src',name+'.tsx'),'utf8')
]))
const oldDecorations = [
  'welcome-marquee', 'welcome-eyebrow', 'welcome-verified',
  'className="pp-overline"', 'className="section-eyebrow"',
  'className="atlas-mini-label"', 'className="pp-historical"',
  'className="micro-tag"', '01 / CAPABILITIES',
  'INSIGHT COMMAND CENTER', 'RESEARCH-GRADE EXPLORATORY INTELLIGENCE',
  'THE PROMISEPULSE RESEARCH EXPERIENCE', 'HISTORICAL BRAZIL · 2016–2018'
]
for (const [page,text] of Object.entries(source)) {
 for (const label of oldDecorations) {
  assert.ok(!text.includes(label),page+' still contains decorative label '+label)
 }
}
assert.match(source.Welcome, /<h1>Every order holds/)
assert.match(source.Welcome, /<h2>Analytics overview<\/h2>/)
assert.match(source.Welcome, /<h3>Monthly orders<\/h3>|<h3><Activity[^>]*\/> Monthly orders<\/h3>/)
assert.match(source.Premium, /<h3 className="pp-map-meta">Orders by Brazilian state<\/h3>/)
assert.match(source.App, /aria-label="Main navigation"/,'preserve working sidebar navigation')
assert.match(source.SyllabusLab, /className="syllabus-tabs"/,'preserve lab tabs')
assert.match(source.SyllabusHub, /syllabus-hub-grid/,'preserve hub cards')
const styles = fs.readFileSync(path.join(root,'web/src/editorial.css'),'utf8')
assert.match(styles,/\.atlas-chart-heading h3/)
assert.match(styles,/\.welcome-proof h3/)
const imports = fs.readFileSync(path.join(root,'web/src/main.tsx'),'utf8')
assert.match(imports,/import '\.\/editorial\.css'/)
console.log('PASS: editorial hierarchy is clean across all seven primary React screens')
