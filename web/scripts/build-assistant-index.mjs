/** Generate a server-only, searchable website evidence index from committed docs and published
 * aggregated data. No user-submitted files or network content enter the knowledge base.
 * Run automatically before npm run dev / npm run build.
 */
import {readFile,writeFile} from 'node:fs/promises'
import {dirname,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
const web=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const root=resolve(web,'..')
const guides=[
 'README.md','docs/USER_GUIDE.md','docs/ARCHITECTURE_V5.md',
 'docs/RESEARCH_REPRODUCIBILITY.md','docs/SYLLABUS_V5.md',
 'docs/ANALYTICS_ATLAS_METHODOLOGY.md','docs/ALGORITHM_PLAYGROUND.md',
 'docs/RESEARCH_EXPANSION_V4.md','docs/DEPLOYMENT.md',
 'docs/GEMINI_RESEARCH_ASSISTANT.md','docs/THEME_SYSTEM.md',
 'docs/RELEASE_REVIEW_V5.md','docs/V5_STUDENT_REVIEW_GUIDE.md'
]
const chunks=[]
function add(path,title,content){
 const lines=content.replace(/\r/g,'').split('\n')
 let section=title,buf=''
 const push=()=>{
  const body=buf.trim()
  if(body.length>75)chunks.push({id:'site-'+chunks.length,title:title+' — '+section,url:'/'+path,text:body.slice(0,1800)})
  buf=''
 }
 for(const line of lines){
  if(/^#{1,3} /.test(line)){push();section=line.replace(/^#+\s*/,'').trim().slice(0,90);continue}
  if(buf.length+line.length>1100)push()
  buf+=line+'\n'
 }
 push()
}
for(const path of guides){
 const content=await readFile(resolve(root,path),'utf8')
 const title=path==='README.md'?'Project README':path.split('/').at(-1).replace(/\.md$/,'').replace(/_/g,' ')
 add(path,title,content)
}
const manifest=JSON.parse(await readFile(resolve(web,'public/data/manifest.json'),'utf8'))
for(const [part,obj] of Object.entries(manifest))add('web/public/data/manifest.json','Published Olist manifest','## '+part+'\n'+JSON.stringify(obj,null,2))
const mining=JSON.parse(await readFile(resolve(web,'public/data/mining_lab.json'),'utf8'))
const use={
 source:mining.source,
 warehouse:mining.warehouse,
 eda:{summary:mining.eda.summary,missing:mining.eda.missing,quality:mining.eda.quality,states:mining.eda.states},
 classification:{metrics:mining.classification.metrics,train_rows:mining.classification.train_rows,test_rows:mining.classification.test_rows,features:mining.classification.features,selection:mining.classification.selection},
 regression:mining.regression,
 clustering:{sample_size:mining.clustering.sample_size,population_size:mining.clustering.population_size,features:mining.clustering.features,k_search:mining.clustering.k_search,chosen_k:mining.clustering.chosen_k,algorithms:mining.clustering.algorithms,profiles:mining.clustering.profiles,caveats:mining.clustering.caveats},
 patterns:{available:mining.patterns.available,eligible:mining.patterns.eligible,multiple_category_orders:mining.patterns.multiple_category_orders,all_distinct_order_baskets:mining.patterns.all_distinct_order_baskets,min_support:mining.patterns.min_support,min_confidence:mining.patterns.min_confidence,algorithms:mining.patterns.algorithms,frequent_itemsets:(mining.patterns.frequent_itemsets||[]).slice(0,12),closed_itemsets_total:mining.patterns.closed_itemsets_total,rules:(mining.patterns.rules||[]).slice(0,12),caveats:mining.patterns.caveats}
}
for(const [part,obj] of Object.entries(use))add('web/public/data/mining_lab.json','Published data mining lab results','## '+part+'\n'+JSON.stringify(obj,null,2))
const contents="// GENERATED from committed PromisePulse docs and published aggregate JSON exports.\n// Server-side ONLY: indexed evidence for website and research answers.\n// Changes to source documents require refreshing this index.\nexport const SITE_SOURCES="+JSON.stringify(chunks)+";\n"
const path=resolve(web,'api/_site-index.mjs')
let old=''
try{old=await readFile(path,'utf8')}catch(e){if(e.code!=='ENOENT')throw e}
if(old!==contents)await writeFile(path,contents)
console.log('[PromisePulse AI] Indexed '+chunks.length+' website reference passages')
