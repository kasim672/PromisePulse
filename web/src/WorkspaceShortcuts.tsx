import {useState} from 'react'
import {ArrowDown,ArrowRight,ArrowUp,RotateCcw,Star} from 'lucide-react'
import type {Tab} from './types'
const options:{page:Tab;name:string;description:string}[]=[
 {page:'Overview',name:'Overview',description:'Orders, delivery outcomes and revenues'},
 {page:'Analytics Atlas',name:'Analytics Atlas',description:'Historical charts and SQL filters'},
 {page:'Customer Cohorts',name:'Customer Cohorts',description:'Customer activity and spending'},
 {page:'Delivery Lab',name:'Delivery Lab',description:'Delivery time and promise windows'},
 {page:'OLAP Lab',name:'OLAP Lab',description:'Interactive warehouse queries'},
 {page:'Risk Center',name:'Risk Center',description:'Historical risk investigation'},
 {page:'Syllabus Hub',name:'Data Mining Lab',description:'Algorithms, clustering and patterns'},
 {page:'Pipeline & Quality',name:'Pipeline & Quality',description:'Data provenance and checks'}
]
const key='promisepulse-workspace-order-v1'
function savedOrder():Tab[]{
 try{
  const stored=JSON.parse(localStorage.getItem(key)||'null')
  if(!Array.isArray(stored))return options.map(x=>x.page)
  const valid=stored.filter((x):x is Tab=>options.some(o=>o.page===x))
  return [...new Set([...valid,...options.map(x=>x.page)])]
 }catch{return options.map(x=>x.page)}
}
export function WorkspaceShortcuts({onNavigate}:{onNavigate:(tab:Tab)=>void}){
 const [pages,setPages]=useState<Tab[]>(savedOrder)
 const [customize,setCustomize]=useState(false)
 const change=(next:Tab[])=>{setPages(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{/* private mode */}}
 const move=(index:number,by:number)=>{
  const to=index+by;if(to<0||to>=pages.length)return
  const next=[...pages];[next[index],next[to]]=[next[to],next[index]];change(next)
 }
 return <section className="workspace-shortcuts" aria-label="Workspace shortcuts">
  <div className="workspace-shortcuts-heading"><div><h2>Your workspaces</h2><p>Choose an analysis, or arrange shortcuts for this browser.</p></div><button type="button" aria-pressed={customize} onClick={()=>setCustomize(c=>!c)}>{customize?'Finish arranging':'Arrange shortcuts'}</button></div>
  <div className="workspace-shortcuts-grid">{pages.map((page,i)=>{
   const choice=options.find(o=>o.page===page)!
   return <div className="workspace-shortcut" key={page}>
    <button type="button" className="workspace-shortcut-open" onClick={()=>onNavigate(page)}><Star size={17} aria-hidden="true"/><span><strong>{choice.name}</strong><small>{choice.description}</small></span><ArrowRight size={17} aria-hidden="true"/></button>
    {customize&&<div className="workspace-shortcut-actions"><button type="button" aria-label={'Move '+choice.name+' earlier'} disabled={i===0} onClick={()=>move(i,-1)}><ArrowUp size={16}/></button><button type="button" aria-label={'Move '+choice.name+' later'} disabled={i===pages.length-1} onClick={()=>move(i,1)}><ArrowDown size={16}/></button></div>}
   </div>
  })}</div>
  {customize&&<button type="button" className="workspace-shortcut-reset" onClick={()=>change(options.map(x=>x.page))}><RotateCcw size={15}/> Restore default order</button>}
 </section>
}
