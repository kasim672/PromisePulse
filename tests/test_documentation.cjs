const fs=require('node:fs')
const path=require('node:path')
const assert=require('node:assert/strict')

const root=path.resolve(__dirname,'..')
const docs=['README.md','docs/ARCHITECTURE_V5.md','docs/DEPLOYMENT.md','docs/SCREENSHOT_GALLERY_CURRENT.md','docs/THEME_SYSTEM.md','docs/USER_GUIDE.md']
let checked=0
for(const document of docs){
 const input=fs.readFileSync(path.join(root,document),'utf8')
 for(const match of input.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){
  const dest=match[1].trim().split('#')[0]
  if(!dest||/^(https?:\/\/|mailto:|data:)/i.test(dest))continue
  const target=path.resolve(path.dirname(path.join(root,document)),dest)
  assert.ok(target.startsWith(root+path.sep)||target===root,document+': unexpected link outside project '+dest)
  assert.ok(fs.existsSync(target),document+': missing local image or document '+dest)
  checked++
 }
}
const svg=fs.readFileSync(path.join(root,'docs/architecture.svg'),'utf8')
assert.match(svg,/^<svg\s[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
assert.match(svg,/<\/svg>\s*$/)
assert.match(svg,/<title\b/)
assert.doesNotMatch(svg,/<div\b/i,'diagram must be a standalone SVG, not HTML wrapping an empty SVG')

const dir=path.join(root,'docs/screenshots/current')
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'CAPTURE_MANIFEST.json'),'utf8'))
assert.equal(manifest.release,'PromisePulse 5.0 with editorial typography, interactive mining algorithms and soft cyan #7DD3FC')
assert.ok(manifest.git_sha&&manifest.captured_at_utc,'screenshots must have commit and time provenance')
assert.ok(Array.isArray(manifest.images)&&manifest.images.length===16, '13 dashboard captures plus 3 assistant captures')
for(const name of ['assistant-light.png','assistant-dark.png','mobile-assistant-light.png'])assert.ok(manifest.images.includes(name),'current capture should include '+name)
for(const filename of manifest.images){
 assert.match(filename,/\.png$/)
 const file=path.join(dir,filename)
 assert.ok(fs.existsSync(file),'screenshot missing: '+filename)
 assert.ok(fs.statSync(file).size>20_000,'screenshot implausibly small: '+filename)
}
const algorithmManifest=JSON.parse(fs.readFileSync(path.join(dir,'ALGORITHM_CAPTURE_MANIFEST.json'),'utf8'))
assert.ok(algorithmManifest.source_sha&&algorithmManifest.captured_at_utc,'teaching screenshots must preserve capture provenance')
assert.equal(algorithmManifest.source_sha,manifest.git_sha,'page and algorithm screenshots must come from the same source revision')
assert.equal(algorithmManifest.images.length,15,'five algorithms must have desktop light/dark and mobile captures')
for(const method of ['decision-tree','k-means','apriori','fp-growth','eclat']){
 for(const name of ['algorithm-'+method+'-light.png','algorithm-'+method+'-dark.png','mobile-algorithm-'+method+'-light.png']){
  assert.ok(algorithmManifest.images.includes(name),'missing method screenshot from manifest: '+name)
  const file=path.join(dir,name)
  assert.ok(fs.existsSync(file),'missing captured algorithm screenshot: '+name)
  assert.ok(fs.statSync(file).size>20000,'algorithm screenshot implausibly small: '+name)
 }
}
const guide=fs.readFileSync(path.join(root,'docs/ALGORITHM_PLAYGROUND.md'),'utf8')
assert.match(guide,/illustrative/i,'teaching examples must be clearly distinguished from Olist experiments')
const teaching=JSON.parse(fs.readFileSync(path.join(dir,'ALGORITHM_CAPTURE_MANIFEST.json'),'utf8'))
assert.ok(teaching.captured_at_utc&&teaching.source_sha,'algorithm screenshots require provenance')
assert.equal(teaching.images.length,15,'five methods in desktop light/dark and mobile')
for(const file of teaching.images){
 assert.match(file,/^((mobile-)?algorithm-)[\w-]+\.png$/)
 assert.ok(fs.statSync(path.join(dir,file)).size>20_000,'missing verified algorithm screenshot: '+file)
}
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8')
assert.match(readme,/PromisePulse 5\.0/)
assert.match(readme,/#7DD3FC/,'README should describe current cyan palette')
assert.match(readme,/docs\/THEME_SYSTEM\.md/,'README should link to current design guide')
const themeGuide=fs.readFileSync(path.join(root,'docs/THEME_SYSTEM.md'),'utf8')
assert.match(themeGuide,/#7DD3FC/)
assert.match(themeGuide,/deployment-rate-limit/i,'design documentation must distinguish merged source from deployment')
assert.match(svg,/#7DD3FC/,'architecture figure must reflect cyan presentation layer')
assert.match(readme,/precision ≈ 0\.049/)
assert.match(readme,/docs\/RELEASE_NOTES\.md/,'current release notes must be linked')
assert.match(readme,/docs\/screenshots\/current\/assistant-light\.png/,'README should include a real current chatbot screenshot')
assert.match(fs.readFileSync(path.join(root,'docs/ARCHITECTURE_V5.md'),'utf8'),/web\/api\/_retrieval\.mjs/,'architecture must describe evidence retrieval')
assert.match(fs.readFileSync(path.join(root,'docs/DEPLOYMENT.md'),'utf8'),/GEMINI_MODEL=gemini-3\.5-flash/,'deployment guide must match configured model default')
assert.match(fs.readFileSync(path.join(root,'docs/SCREENSHOT_GALLERY_CURRENT.md'),'utf8'),/mobile-assistant-light\.png/,'gallery must link new mobile assistant capture')
assert.match(readme,/Root directory.*\bweb\b/)
assert.doesNotMatch(readme,/feature branch only/i)
assert.doesNotMatch(readme,/V6 features implemented/i)
console.log('PASS docs: '+checked+' local links, '+manifest.images.length+' cyan UI screenshots, '+algorithmManifest.images.length+' algorithm screenshots, valid SVG, V5 provenance')
