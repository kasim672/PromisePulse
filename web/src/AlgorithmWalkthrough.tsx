import {useEffect,useState} from 'react'
import {ArrowLeft,ArrowRight,BookOpen} from 'lucide-react'
type Algorithm='Decision Tree'|'K-Means'|'Apriori'|'FP-Growth'|'Eclat'
type Stage={heading:string;description:string;example:string}
const stages:Record<Algorithm,Stage[]>={
 'Decision Tree':[
 {heading:'Choose a target',description:'A supervised classifier needs historical labeled examples and predictors available at the decision time.',example:'Outcome: delivered after the promised date; use only features known when ordering.'},
 {heading:'Evaluate possible splits',description:'For each candidate split, measure how much it reduces impurity in the training data.',example:'Gini = 1 − Σ(p(class)²). Smaller child-node impurity is preferred.'},
 {heading:'Grow and regularize',description:'Apply depth and minimum-leaf constraints so rare events do not cause excessive branching.',example:'Fit on the training window; select limits on validation observations.'},
 {heading:'Evaluate later orders',description:'Apply the frozen tree to out-of-time orders and compare predicted labels to observed delivery outcomes.',example:'Review precision, recall and confusion counts—not only accuracy.'}
 ],
 'K-Means':[
 {heading:'Prepare customer features',description:'Construct recency, frequency and monetary features; scale them before computing distances.',example:'Historical customer RFM sample, with reproducible random seed.'},
 {heading:'Initialize centroids',description:'Choose k starting points. Initialization can change the solution.',example:'For k = 2, start with two centres in standardized RFM space.'},
 {heading:'Assign and update',description:'Assign each customer to the nearest centroid and replace each centroid with its assigned mean.',example:'Repeat until assignments stop changing or the iteration limit is reached.'},
 {heading:'Validate clusters',description:'Compare solutions using inertia, silhouette and segment profiles. Large imbalances require care.',example:'The deployed clustering panel shows recorded results from a bounded sample.'}
 ],
 Apriori:[
 {heading:'Build transaction baskets',description:'Represent each qualifying order as a set of distinct purchased product categories.',example:'Order A: {books, office}; Order B: {office, toys}.'},
 {heading:'Count singletons',description:'Calculate support for each item; prune any set below minimum support.',example:'support(office) = baskets containing office / all eligible baskets.'},
 {heading:'Generate candidate sets',description:'Join frequent (k−1)-itemsets to generate k-itemset candidates; prune subsets that failed.',example:'If {books, toys} is infrequent, any larger set containing it can be pruned.'},
 {heading:'Derive association rules',description:'Calculate confidence and lift from observed joint supports.',example:'confidence(A→B)=support(A∪B)/support(A); lift=confidence/support(B).'}
 ],
 'FP-Growth':[
 {heading:'Prepare frequent items',description:'Calculate singleton support and order frequent items by descending support.',example:'Prune rare categories using the selected minimum support.'},
 {heading:'Build a shared prefix tree',description:'Insert each ordered basket into an FP-tree, incrementing shared prefix counts.',example:'Common category prefixes reuse nodes instead of enumerating candidate sets.'},
 {heading:'Construct conditional patterns',description:'For each item, collect paths ending at that item and build a conditional pattern base.',example:'The base contains weighted prefixes leading to that category.'},
 {heading:'Mine and validate',description:'Recursively enumerate frequent sets and compare their supports to Apriori and Eclat.',example:'Identical baskets and support threshold must yield consistent itemsets.'}
 ],
 Eclat:[
 {heading:'Index baskets vertically',description:'Map every category to the set of transaction IDs that contain it.',example:'office → {A,B,D}; toys → {B,D}.'},
 {heading:'Intersect transaction sets',description:'The support count for a combined itemset equals the size of its TID-set intersection.',example:'TID(office ∪ toys) = {B,D}; support count = 2.'},
 {heading:'Grow frequent prefixes',description:'Expand only combinations that meet support and maintain the vertical representation.',example:'Support is anti-monotonic, so failed itemsets need no supersets.'},
 {heading:'Compare with other miners',description:'Cross-check itemsets and association rules on the same qualifying baskets.',example:'Performance comparisons require repeat runs, same inputs and measured memory.'}
 ]
}
const algorithms=Object.keys(stages) as Algorithm[]
export function AlgorithmWalkthrough({topic}:{topic:'classification'|'clustering'|'patterns'}){
 const choices=topic==='classification'?algorithms.slice(0,1):topic==='clustering'?algorithms.slice(1,2):algorithms.slice(2)
 const [algorithm,setAlgorithm]=useState<Algorithm>(choices[0])
 const [step,setStep]=useState(0)
 useEffect(()=>{setAlgorithm(choices[0]);setStep(0)},[topic])
 const current=stages[algorithm][step]
 return <section className="pp-block algorithm-walkthrough" aria-label="Algorithm walkthrough">
  <div className="pp-block-header"><div><h3><BookOpen size={20} aria-hidden="true"/> Algorithm walkthrough</h3><p>Educational method demonstration. The examples below are illustrative; they do not substitute for trained Olist results.</p></div></div>
  <div className="algorithm-choices" role="group" aria-label="Choose algorithm">{choices.map(name=><button key={name} type="button" aria-pressed={algorithm===name} onClick={()=>{setAlgorithm(name);setStep(0)}}>{name}</button>)}</div>
  <ol className="algorithm-progress" aria-label="Algorithm steps">{stages[algorithm].map((stage,i)=><li key={stage.heading}><button type="button" aria-current={i===step?'step':undefined} onClick={()=>setStep(i)}><span>{i+1}</span>{stage.heading}</button></li>)}</ol>
  <article className="algorithm-detail" aria-live="polite"><p>Step {step+1} of {stages[algorithm].length}</p><h4>{current.heading}</h4><p>{current.description}</p><code>{current.example}</code></article>
  <div className="algorithm-actions"><button type="button" disabled={step===0} onClick={()=>setStep(s=>s-1)}><ArrowLeft size={16}/> Previous</button><button type="button" disabled={step===stages[algorithm].length-1} onClick={()=>setStep(s=>s+1)}>Next step <ArrowRight size={16}/></button></div>
 </section>
}
