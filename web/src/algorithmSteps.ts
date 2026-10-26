/* Deterministic teaching examples. These are NOT a replay of fitted Olist models.
 * Each frame is calculated from the explicitly displayed toy input. */
export type Algorithm='K-Means'|'Decision Tree'|'Apriori'|'FP-Growth'|'Eclat'
export type Point={id:string;x:number;y:number}
export type Frame={title:string;detail:string;formula:string;highlight:string[];note:string;iteration?:number;centroids?:Point[];assignments?:number[];items?:{name:string;count:number;pass:boolean}[];tree?:{path:string;count:number}[]}
export const points:Point[]=[
 {id:'A',x:1,y:1},{id:'B',x:1.6,y:2},{id:'C',x:2.2,y:1},
 {id:'D',x:6,y:6},{id:'E',x:7.3,y:6.4},{id:'F',x:6.4,y:7.5},
]
/** Visible, pedagogical baskets; not inferred from category co-occurrence in Olist */
export const baskets=[
 {id:'T1',items:['A','B','C']},{id:'T2',items:['A','B']},
 {id:'T3',items:['B','C']},{id:'T4',items:['A','C']},
 {id:'T5',items:['A','B','C']},
]
const signature=(items:string[])=>items.slice().sort().join('+')
const count=(items:string[])=>baskets.filter(b=>items.every(x=>b.items.includes(x))).length
const summary=(items:string[][],min=3)=>items.map(xs=>({name:signature(xs),count:count(xs),pass:count(xs)>=min}))
const fmt=(n:number)=>n.toFixed(2).replace(/\.00$/,'')
export function kMeansFrames():Frame[]{
 let centers:Point[]=[{id:'C1',x:1,y:1},{id:'C2',x:2.2,y:1}]
 const out:Frame[]=[{title:'Choose two initial centers',detail:'Start with C1=(1,1), C2=(2.2,1). These are deliberately close so you can see the assignment change.',formula:'k = 2; Euclidean distance',highlight:points.map(p=>p.id),centroids:centers,iteration:0,note:'Six illustrative points (A–F); this is not the published 950-customer fit.'}]
 for(let i=1;i<=7;i++){
  const labels=points.map(p=>{
   const d=centers.map(c=>(p.x-c.x)**2+(p.y-c.y)**2)
   return d[0]<=d[1]?0:1
  })
  out.push({title:'Assign points to their nearest center',detail:points.map((p,k)=>p.id+'→C'+(labels[k]+1)).join(' · '),formula:'cluster(x) = arg minⱼ ||x − Cⱼ||²',highlight:points.map(p=>p.id),centroids:centers.map(x=>({...x})),assignments:labels,iteration:i,note:'Assignments are recomputed from the displayed coordinates and current centers.'})
  const next=centers.map((c,k)=>{
   const group=points.filter((_,j)=>labels[j]===k)
   return group.length?{...c,x:group.reduce((s,p)=>s+p.x,0)/group.length,y:group.reduce((s,p)=>s+p.y,0)/group.length}:c
  })
  out.push({title:'Update each center to its group mean',detail:next.map((c,j)=>'C'+(j+1)+' = ('+fmt(c.x)+', '+fmt(c.y)+')').join(' · '),formula:'Cⱼ = mean(points assigned to j)',highlight:points.map(p=>p.id),centroids:next.map(c=>({...c})),assignments:labels,iteration:i,note:'These means are calculated, not a prerecorded animation.'})
  const stable=next.every((c,j)=>Math.abs(c.x-centers[j].x)<1e-9&&Math.abs(c.y-centers[j].y)<1e-9)
  centers=next
  if(stable){out.push({title:'Stop: centers have converged',detail:'No center moved in this update. The partition is stable for this teaching example.',formula:'maxⱼ ||Cⱼ(t) − Cⱼ(t−1)|| = 0',highlight:points.map(x=>x.id),centroids:next,assignments:labels,iteration:i,note:'Real Olist clustering uses scaled RFM inputs, multiple initializations and a bounded sample.'});break}
 }
 return out
}
export function decisionFrames():Frame[]{
 return [
  {title:'Inspect a sample order',detail:'Example order has 3 items and a 6-day promised window. The label to be predicted is whether the delivery will be late.',formula:'Inputs available at checkout: item count, promised days',highlight:['order'],note:'The chosen split rules illustrate tree traversal; they are not extracted from the fitted Olist Decision Tree.'},
  {title:'Test the root split',detail:'Is promised delivery window shorter than 5 days? In our example, 6 < 5 is false, so move to the right branch.',formula:'6 < 5 → false',highlight:['root','right'],note:'A fitted tree would learn splits by reducing impurity on training examples.'},
  {title:'Follow the second split',detail:'Is the order item count greater than 2? 3 > 2 is true, so follow the higher-volume branch.',formula:'3 > 2 → true',highlight:['right','deep'],note:'The example shows logical decisions, not a calibrated risk probability.'},
  {title:'Read the illustrative leaf',detail:'This demonstration leaf is marked “higher late-delivery risk.” It is not a live prediction, and it was not evaluated against the Olist test set.',formula:'path = [window≥5, items>2]',highlight:['deep','leaf'],note:'Use the existing Classification Lab charts for actual fitted-model metrics.'}
 ]
}
export function aprioriFrames():Frame[]{
 const a=[['A'],['B'],['C']],b=[['A','B'],['A','C'],['B','C']],c=[['A','B','C']]
 return [
 {title:'Make five transaction baskets',detail:'Each example transaction is a set of distinct items. Set minimum support count to 3 of 5 transactions.',formula:'min support = 3 / 5 = 60%',highlight:baskets.map(x=>x.id),note:'All five baskets shown here are illustrative.'},
 {title:'Count frequent single items',detail:'Count each item in the five displayed baskets.',formula:'L₁ = {x | count(x) ≥ 3}',highlight:['A','B','C'],items:summary(a),note:'Every item qualifies, so pairs can be generated.'},
 {title:'Generate and count all 2-item candidates',detail:'Join frequent singletons. The itemset supports are computed from the visible baskets.',formula:'C₂ = join(L₁, L₁)',highlight:b.map(signature),items:summary(b),note:'Only candidates meeting the minimum support progress.'},
 {title:'Prune the failed candidate',detail:'The pair B+C appears in only three baskets; this example deliberately uses a higher threshold of 4 to demonstrate pruning.',formula:'Pruning example: count(B+C) = 3 < 4',highlight:['B+C'],items:summary(b,4),note:'Threshold raised explicitly to 4 / 5 for this demonstration stage.'},
 {title:'Generate a 3-item candidate',detail:'For the original minimum count of 3, all three pairs qualify. Their union is A+B+C.',formula:'C₃ = {{A,B,C}}; all two-item subsets qualify',highlight:['A+B+C'],items:summary(c),note:'The triple occurs twice, so it does not meet the original support threshold.'},
 {title:'Stop when no larger itemsets survive',detail:'The frequent itemsets at count ≥3 are the three singletons and all three pairs. The triple fails.',formula:'L₃ = ∅ → stop',highlight:[],items:summary(c),note:'The original Olist itemsets and real support denominators remain in the empirical rule panel.'},
 ]
}
export function fpFrames():Frame[]{
 const orders=baskets.map(b=>b.items.slice().sort())
 const counts=new Map<string,number>()
 const out:Frame[]=[{title:'Count and order the frequent items',detail:'All three items occur four times in the five example transactions. Use alphabetical order to break ties.',formula:'frequency(A)=4, frequency(B)=4, frequency(C)=4',highlight:['A','B','C'],items:summary([['A'],['B'],['C']]),note:'The ordered baskets are visible below.'}]
 for(let i=0;i<orders.length;i++){
  let key=''
  for(const item of orders[i]){key+=(key?'/':'')+item;counts.set(key,(counts.get(key)||0)+1)}
  out.push({title:'Insert '+baskets[i].id+' into the FP-tree',detail:'Insert '+orders[i].join('→')+'. Shared prefix nodes increment their counts instead of creating duplicate branches.',formula:'count(prefix) ← count(prefix) + 1',highlight:[baskets[i].id],tree:[...counts].map(([path,count])=>({path,count})),note:'Every displayed prefix count is calculated from inserted baskets.'})
 }
 out.push({title:'Mine a conditional pattern base',detail:'Paths containing C end in A/B/C, A/C, and B/C. Summing these prefix weights identifies frequent co-occurrence with C.',formula:'conditional prefix paths for C; min support count = 3',highlight:['C','A+C','B+C'],tree:[...counts].map(([path,count])=>({path,count})),items:summary([['A','C'],['B','C']]),note:'Full FP-Growth recursively builds conditional FP-trees; this small view shows the prefix evidence.'})
 return out
}
export function eclatFrames():Frame[]{
 const ids=(items:string[])=>baskets.filter(b=>items.every(i=>b.items.includes(i))).map(b=>b.id)
 return [
 {title:'Convert horizontal baskets into TID sets',detail:'Read each item vertically as a list of transaction identifiers.',formula:'TID(A)={'+ids(['A']).join(',')+'}',highlight:['A','B','C'],items:summary([['A'],['B'],['C']]),note:'All TID sets come directly from the five visible transactions.'},
 ...([['A','B'],['A','C'],['B','C'],['A','B','C']] as string[][]).map(xs=>({title:'Intersect TID sets for '+signature(xs),detail:'Matching transactions: '+(ids(xs).join(', ')||'none')+'. Each intersection retains only IDs present in every input set.',formula:xs.map(x=>'TID('+x+')').join(' ∩ ')+' = {'+ids(xs).join(',')+'}',highlight:[signature(xs)],items:summary([xs]),note:'Count ≥3 is frequent; the triple appears only twice.'})),
 {title:'Prune infrequent supersets',detail:'The triple has support count 2, below the minimum 3. Do not extend this prefix further.',formula:'|TID(A+B+C)| = 2 < 3',highlight:['A+B+C'],items:summary([['A','B','C']]),note:'Eclat and Apriori agree on the frequent sets for these same baskets.'}
 ]
}
export function makeFrames(name:Algorithm):Frame[]{switch(name){case 'K-Means':return kMeansFrames();case 'Decision Tree':return decisionFrames();case 'Apriori':return aprioriFrames();case 'FP-Growth':return fpFrames();case 'Eclat':return eclatFrames()}}
