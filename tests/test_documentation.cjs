const fs=require('node:fs')
const path=require('node:path')
const assert=require('node:assert/strict')

const root=path.resolve(__dirname,'..')
const docs=['README.md','docs/ARCHITECTURE_V5.md','docs/DEPLOYMENT.md','docs/SCREENSHOT_GALLERY_CURRENT.md']
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
assert.equal(manifest.release,'PromisePulse 5.0 with post-release editorial typography cleanup')
assert.ok(manifest.git_sha&&manifest.captured_at_utc,'screenshots must have commit and time provenance')
assert.ok(Array.isArray(manifest.images)&&manifest.images.length>=10)
for(const filename of manifest.images){
 assert.match(filename,/\.png$/)
 const file=path.join(dir,filename)
 assert.ok(fs.existsSync(file),'screenshot missing: '+filename)
 assert.ok(fs.statSync(file).size>20_000,'screenshot implausibly small: '+filename)
}
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8')
assert.match(readme,/PromisePulse 5\.0/)
assert.match(readme,/precision ≈ 0\.049/)
assert.match(readme,/Root directory.*\bweb\b/)
assert.doesNotMatch(readme,/feature branch only/i)
assert.doesNotMatch(readme,/V6 features implemented/i)
console.log('PASS docs: '+checked+' local links, '+manifest.images.length+' authentic screenshot files, valid SVG, V5 provenance')
