import {SOURCES} from './_knowledge.mjs'
import {SITE_SOURCES} from './_site-index.mjs'

const ignore=new Set('the a an and or in on at to of for from with this that those these you your yours i me my we our us is are was were be been it its do does did have has had will would could can please tell say explain show give used use about website page application tell more information details help what which when why how very all'.split(' '))
const words=(str)=>String(str).toLowerCase().replace(/k[ -]?means/g,'kmeans').replace(/fp[ -]?growth/g,'fpgrowth').replace(/duckdb[ -]?wasm/g,'duckdbwasm').replace(/\bdata mining\b/g,'datamining').match(/[a-z0-9]+/g)?.filter(w=>w.length>=2&&!ignore.has(w))||[]
const map={
 data:['dataset','csv','olist','warehouse','source','manifest'],
 datasets:['dataset','csv','olist'], used:['dataset','source','olist'],
 ai:['assistant','gemini','model'], bot:['assistant','gemini'], yourself:['assistant','overview','project'],
 architecture:['duckdbwasm','react','vite','parquet'], stack:['architecture','react','vite'],
 insights:['analytics','charts','research'], graph:['charts','atlas'], graphs:['charts','atlas'],
 page:['navigation','workspace'], pages:['navigation','workspace'], features:['workspace','dashboard','mining'],
 dashboard:['analytics','workspace'], reports:['research','analytics'], source:['olist','dataset'],
 algorithm:['classification','clustering','apriori'], algorithms:['classification','clustering','apriori'],
 predictive:['prediction','risk'], delivery:['late','risk'], late:['delivery','risk'],
 orders:['order','warehouse'], sales:['revenue','payment'], threshold:['model','risk'],
 comparison:['compare','metrics'], trained:['training','model'], sql:['duckdb','olap'],
 columns:['schema','warehouse'], schema:['warehouse','fact','dimension'],
 trends:['analytics','cohort'], patterns:['fpgrowth','apriori','eclat'],
 customers:['customer','cohort'], file:['csv','parquet'], files:['csv','parquet']
}
function intent(question){
 const q=question.trim().toLowerCase()
 if(/(?:who are you|about yourself|introduce yourself|what can you do|how can you help|^help(?: me)?\??$)/.test(q))return 'PromisePulse project assistant website overview architecture dataset dashboard navigation'
 if(/(?:data used|which data|what data|source of data|data source|dataset used|where.*data.*from)/.test(q))return 'Olist Kaggle dataset eight raw CSV source files customers sellers orders order items payments reviews products product category translations historical 2016 2018 warehouse manifest'
 if(/(?:what.*on.*website|all.*features|website pages|whole website|all.*modules)/.test(q))return 'PromisePulse dashboard analytics workspaces research atlas 12 workspaces six mining lab modules navigation'
 return question
}
const records=[...SOURCES.map(x=>({...x,curated:true})),...SITE_SOURCES.map(x=>({...x,curated:false}))]
 .map(x=>({...x,body:new Set(words(x.text)),heading:new Set(words(x.title+' '+(x.terms||'')))}))]
export function findEvidence(question,limit=6){
 const canonical=intent(question)
 const original=words(canonical)
 if(!original.length)return []
 const expanded=new Set(original)
 for(const t of original)for(const v of map[t]||[])expanded.add(v)
 const query=[...expanded]
 const ranked=records.map(x=>{
   let score=0,hits=0
   for(const t of query){
     const inHeading=x.heading.has(t),inBody=x.body.has(t)
     if(inHeading||inBody){hits++;score+=inHeading?5:1.5}
     else if(t.length>=5&&[...x.heading].some(w=>w.startsWith(t))){hits++;score+=2}
   }
   if(x.curated&&score>0)score+=3
   return {x,score,hits}
 }).filter(y=>y.score>=2&&y.hits>=1).sort((a,b)=>b.score-a.score||b.hits-a.hits)
 if(!ranked.length)return []
 // Deduplicate adjacent snippets from the same guide when other sources are relevant.
 const chosen=[],seen=new Map()
 for(const {x} of ranked){
   const n=seen.get(x.url)||0
   if(n>=2)continue
   chosen.push({id:x.id,title:x.title,url:x.url,text:x.text})
   seen.set(x.url,n+1)
   if(chosen.length>=limit)break
 }
 return chosen
}
