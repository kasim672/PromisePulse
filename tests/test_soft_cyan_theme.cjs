const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const root=path.resolve(__dirname,'..')
const src=path.join(root,'web/src')
const css=fs.readdirSync(src).filter(x=>x.endsWith('.css'))
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8')
const files=css.map(f=>({name:f,text:read('web/src/'+f)}))
const main=read('web/src/main.tsx')
const theme=read('web/src/theme.css')
const glass=read('web/src/measured-glass.css')
const premium=read('web/src/premium.css')
const welcome=read('web/src/expansion.css')
const atlas=read('web/src/atlas.css')
const lab=read('web/src/syllabus-hub.css')
const hex=/#[0-9a-f]{6}(?:[0-9a-f]{2})?\b/gi
function hue(hex){
 const s=hex.substring(1,7)
 const rgb=[0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255)
 const max=Math.max(...rgb),min=Math.min(...rgb),delta=max-min
 if(delta===0)return {h:0,s:0}
 const h=60*(max===rgb[0]?((rgb[1]-rgb[2])/delta)%6:max===rgb[1]?(rgb[2]-rgb[0])/delta+2:(rgb[0]-rgb[1])/delta+4)
 return {h:(h+360)%360,s:delta}
}
let checked=0
for(const {name,text} of files){
 for(const m of text.matchAll(hex)){
  const {h,s}=hue(m[0])
  assert.ok(!(h>=65&&h<=125&&s>.15),name+' still contains a lime/yellow-green hardcoded color: '+m[0])
  checked++
 }
}
assert.match(glass,/--pp-accent-cyan:\s*#7dd3fc/i)
assert.match(glass,/--pp-accent-cyan-hover:\s*#bae6fd/i)
assert.match(glass,/--pp-accent-cyan-ink:\s*#082f49/i)
assert.match(theme,/--pp-accent-cyan:\s*#7dd3fc/i)
assert.match(theme,/--pp-chart-green:\s*var\(--pp-accent-cyan\)/i)
assert.match(theme,/--pp-map-selected:\s*#7dd3fc/i)
assert.match(premium,/\.header-cta,\.primary-btn\{[^}]*background:#7dd3fc/i)
assert.match(theme,/\.pp-kpi-light\s*\{[^}]*#bae6fd,#38bdf8/i)
assert.match(atlas,/--atlas-selected:\s*#7dd3fc/i)
assert.match(lab,/--atlas-selected:#7dd3fc/i)
assert.match(welcome,/\.welcome-primary\{[^}]*background:#111/i)
assert.match(welcome,/html\[data-theme="dark"\] \.welcome-primary\{[^}]*background:#7dd3fc/i)
assert.match(glass,/\.header-nav-item\.active[^}]*background:var\(--pp-accent-cyan\)/i)
const importedCss=[...main.matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1])
for(const f of ['measured-glass.css','theme.css','premium.css','atlas.css','expansion.css','syllabus.css','syllabus-hub.css','algorithm-playground.css'])assert.ok(importedCss.includes(f),'theme file not loaded: '+f)
assert.ok(importedCss.indexOf('theme.css')>importedCss.indexOf('measured-glass.css'),'dark palette must override light')
const react=read('web/src/SyllabusLab.tsx')
assert.ok(!react.includes('#a1c663'),'old olive cluster accent persists')
assert.match(react,/#0e7490/i)
console.log('PASS cyan theme: '+files.length+' stylesheets, '+checked+' colors, cyan buttons/cards/chart/map/lab accents, no lime hardcoded swatches')
