import {useMemo,useState} from 'react'
import {ArrowLeft,ArrowRight,RotateCcw} from 'lucide-react'
import {baskets,makeFrames,points} from './algorithmSteps'
import type {Algorithm,Frame} from './algorithmSteps'

const variants:Record<'classification'|'clustering'|'patterns',Algorithm[]>={
 classification:['Decision Tree'],clustering:['K-Means'],patterns:['Apriori','FP-Growth','Eclat']
}
function KMeansPlot({frame}:{frame:Frame}){
 const colors=['var(--atlas-series)','var(--atlas-selected)']
 const px=(n:number)=>38+n*49
 const py=(n:number)=>330-n*39
 return <svg className="algorithm-scene" viewBox="0 0 500 362" role="img" aria-label={'Six sample points and '+(frame.centroids?.length||0)+' centroids at iteration '+(frame.iteration||0)}>
   {[0,2,4,6,8].map(i=><g key={i}><line x1={px(i)} x2={px(i)} y1="20" y2="330" stroke="var(--atlas-grid)"/><line x1="38" x2="456" y1={py(i)} y2={py(i)} stroke="var(--atlas-grid)"/><text x="16" y={py(i)+4} fill="var(--atlas-muted)" fontSize="12">{i}</text></g>)}
   {points.map((point,i)=><g key={point.id}>
    <circle cx={px(point.x)} cy={py(point.y)} r="12" fill={frame.assignments?colors[frame.assignments[i]]:'var(--atlas-series)'} opacity=".8"/>
    <text x={px(point.x)} y={py(point.y)-17} fontSize="16" textAnchor="middle" fill="var(--atlas-ink)" fontWeight="600">{point.id}</text>
   </g>)}
   {frame.centroids?.map((point,i)=><g key={point.id}>
    <line x1={px(point.x)-11} y1={py(point.y)-11} x2={px(point.x)+11} y2={py(point.y)+11} stroke={colors[i]} strokeWidth="5"/>
    <line x1={px(point.x)-11} y1={py(point.y)+11} x2={px(point.x)+11} y2={py(point.y)-11} stroke={colors[i]} strokeWidth="5"/>
    <text x={px(point.x)+20} y={py(point.y)+4} fill="var(--atlas-ink)" fontSize="15">{point.id}</text>
   </g>)}
   <text x="440" y="350" fill="var(--atlas-muted)" fontSize="13" textAnchor="end">x-coordinate</text>
  </svg>
}
function DecisionPlot({frame}:{frame:Frame}){
 const highlight=new Set(frame.highlight)
 const nodes=[{key:'root',x:250,y:55,head:'Promised window',sub:'< 5 days?',fill:'No: 6 days'},
  {key:'left',x:85,y:155,head:'Short window',sub:'other path',fill:'Yes'},
  {key:'right',x:340,y:155,head:'Item count',sub:'> 2?',fill:'No'},
  {key:'deep',x:340,y:265,head:'Higher volume',sub:'3 > 2: Yes',fill:''},
  {key:'leaf',x:340,y:362,head:'Illustrative leaf',sub:'Higher risk',fill:''}]
 return <svg className="algorithm-scene" viewBox="0 0 510 427" role="img" aria-label="Decision Tree walkthrough with highlighted selected path">
   {[['root','left'],['root','right'],['right','deep'],['deep','leaf']].map(([a,b])=>{const n1=nodes.find(n=>n.key===a)!,n2=nodes.find(n=>n.key===b)!;return <line key={a+b} x1={n1.x} y1={n1.y+27} x2={n2.x} y2={n2.y-30} stroke={highlight.has(b)?'var(--atlas-selected)':'var(--atlas-grid)'} strokeWidth={highlight.has(b)?4:2}/>})}
   {nodes.map(n=><g key={n.key} transform={`translate(${n.x-74} ${n.y-27})`}>
     <rect rx="12" width="148" height="58" stroke={highlight.has(n.key)?'var(--atlas-selected)':'var(--atlas-divider)'} strokeWidth={highlight.has(n.key)?3:1} fill="var(--atlas-surface)"/>
     <text x="74" y="23" fontWeight="700" fill="var(--atlas-ink)" textAnchor="middle" fontSize="14">{n.head}</text>
     <text x="74" y="42" fill="var(--atlas-muted)" textAnchor="middle" fontSize="12">{n.sub}</text>
   </g>)}
   <text x="22" y="419" fill="var(--atlas-muted)" fontSize="12">Branch rules are illustrative, not the published fitted model.</text>
  </svg>
}
function BasketScene({frame,algorithm}:{frame:Frame;algorithm:Algorithm}){
 const active=new Set(frame.highlight)
 return <div className="algorithm-basket-scene">
  <div className="algorithm-transactions" aria-label="Five illustrative baskets">
   {baskets.map(b=><div key={b.id} className={active.has(b.id)?'selected':''}><strong>{b.id}</strong><span>{b.items.join(' · ')}</span></div>)}
  </div>
  {frame.items&&<div className="algorithm-candidate-grid" aria-label="Computed itemset supports">
   {frame.items.map(item=><div key={item.name} className={item.pass?'frequent':'pruned'}><strong>{item.name}</strong><span>{item.count} / 5 baskets</span><small>{item.pass?'Frequent':'Below threshold'}</small></div>)}
  </div>}
  {algorithm==='FP-Growth'&&frame.tree&&<div className="algorithm-prefix-scene"><h4>FP-tree prefix counts</h4><div role="list">{frame.tree.map(t=><div role="listitem" key={t.path}><span>root → {t.path.split('/').join(' → ')}</span><strong>{t.count}</strong></div>)}</div></div>}
  {algorithm==='Eclat'&&<p className="algorithm-eclat-note">TID sets are computed by intersecting the transaction identifiers above.</p>}
 </div>
}
export function AlgorithmPlayground({topic}:{topic:'classification'|'clustering'|'patterns'}){
 const choices=variants[topic]
 const [selected,setSelected]=useState<Algorithm>(choices[0])
 const [step,setStep]=useState(0)
 const algorithm=choices.includes(selected)?selected:choices[0]
 const frames=useMemo(()=>makeFrames(algorithm),[algorithm])
 const safe=Math.min(step,frames.length-1)
 const frame=frames[safe]
 return <section className="pp-block algorithm-playground" aria-label="Interactive algorithm visualizer">
  <header className="algorithm-playground-head">
   <div><h2>Explore the algorithm, step by step</h2><p>Change each step to see how the procedure works on a small, visible teaching example.</p></div>
   <button type="button" className="algorithm-reset" onClick={()=>setStep(0)}><RotateCcw size={16} aria-hidden="true"/> Restart</button>
  </header>
  {choices.length>1&&<div className="algorithm-methods" role="group" aria-label="Choose a mining algorithm">{choices.map(name=><button type="button" key={name} aria-pressed={algorithm===name} onClick={()=>{setSelected(name);setStep(0)}}>{name}</button>)}</div>}
  <div className="algorithm-step-nav" role="group" aria-label="Select a calculation step">{frames.map((f,i)=><button key={i} type="button" title={f.title} aria-label={'Step '+(i+1)+': '+f.title} aria-current={i===safe?'step':undefined} onClick={()=>setStep(i)}>{i+1}</button>)}</div>
  <div className="algorithm-step-layout">
   <div className="algorithm-stage">{algorithm==='K-Means'?<KMeansPlot frame={frame}/>:algorithm==='Decision Tree'?<DecisionPlot frame={frame}/>:<BasketScene frame={frame} algorithm={algorithm}/>}</div>
   <article className="algorithm-explanation" aria-live="polite" aria-atomic="true">
    <p>Step {safe+1} of {frames.length}</p>
    <h3>{frame.title}</h3>
    <p>{frame.detail}</p>
    <div className="algorithm-equation"><strong>Calculation</strong><code>{frame.formula}</code></div>
    <p className="algorithm-caveat">{frame.note}</p>
    <div className="algorithm-step-actions"><button type="button" disabled={safe===0} onClick={()=>setStep(v=>Math.max(0,v-1))}><ArrowLeft size={16}/> Previous</button><button type="button" disabled={safe===frames.length-1} onClick={()=>setStep(v=>Math.min(frames.length-1,v+1))}>Next step <ArrowRight size={16}/></button></div>
   </article>
  </div>
  <p className="algorithm-boundary">Teaching example only. The existing charts and experimental metrics below use the published Olist mining export and remain unchanged.</p>
 </section>
}
