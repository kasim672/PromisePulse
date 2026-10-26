import {useEffect,useRef,useState} from 'react'
import type {FormEvent,KeyboardEvent} from 'react'
import {ArrowUp,BookOpen,MessageCircle,ShieldCheck,SquareArrowOutUpRight,X} from 'lucide-react'

type Source={id:string;title:string;url:string}
type Message={role:'user'|'assistant';text:string;sources?:Source[];error?:boolean}
const examples=[
 'What is PromisePulse and how does it work?',
 'Explain the DuckDB-Wasm architecture',
 'How does K-Means work in the Clustering Lab?',
 'What are the delivery-risk model limitations?'
]
export function ProjectAssistant(){
 const [open,setOpen]=useState(false)
 const [question,setQuestion]=useState('')
 const [messages,setMessages]=useState<Message[]>([])
 const [working,setWorking]=useState(false)
 const trigger=useRef<HTMLButtonElement>(null)
 const entry=useRef<HTMLTextAreaElement>(null)
 const end=useRef<HTMLDivElement>(null)
 const request=useRef<AbortController|null>(null)
 useEffect(()=>{
  if(!open)return
  const onKey=(event:globalThis.KeyboardEvent)=>{
   if(event.key==='Escape'){event.stopPropagation();close()}
  }
  document.addEventListener('keydown',onKey)
  const id=window.setTimeout(()=>entry.current?.focus(),0)
  return()=>{document.removeEventListener('keydown',onKey);window.clearTimeout(id)}
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[open])
 useEffect(()=>{if(open)end.current?.scrollIntoView({block:'end',behavior:'auto'})},[messages,working,open])
 useEffect(()=>()=>{request.current?.abort()},[])
 const close=()=>{request.current?.abort();request.current=null;setWorking(false);setOpen(false);trigger.current?.focus()}
 const ask=async(text:string)=>{
  const q=text.trim()
  if(working||!q||q.length>450)return
  if(/^(hi|hey|hello)$/i.test(q)){
   setMessages(prev=>[...prev.slice(-11),{role:'user',text:q},{role:'assistant',text:'Hello! I can explain PromisePulse, its historical Olist dataset, DuckDB-Wasm architecture, data-mining algorithms, and model evaluation. What would you like to know?'}])
   setQuestion('')
   return
  }
  if(q.length<3){
   setMessages(prev=>[...prev.slice(-11),{role:'user',text:q},{role:'assistant',text:'Please enter a PromisePulse question of at least 3 characters. For example: What is PromisePulse?',error:true}])
   setQuestion('')
   return
  }
  setQuestion('')
  setMessages(prev=>[...prev.slice(-11),{role:'user',text:q}])
  setWorking(true)
  const controller=new AbortController()
  request.current=controller
  try{
   const response=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q}),signal:controller.signal})
   const body:unknown=await response.json().catch(()=>null)
   const result=body&&typeof body==='object'?body as {answer?:unknown;sources?:unknown;error?:unknown}:null
   if(!response.ok||typeof result?.answer!=='string'){
    const msg=typeof result?.error==='string'?result.error:response.status===404?'The /api/ask route was not found on '+window.location.origin+'. Open the Vite development address (usually http://127.0.0.1:5173), run npm run dev from the web folder, and refresh. This is a missing local route, not a Gemini key error.':'The assistant could not answer right now. Please try again.'
    throw new Error(msg)
   }
   if(controller.signal.aborted)return
   const sources=Array.isArray(result.sources)?result.sources.filter((s:unknown):s is Source=>typeof s==='object'&&s!==null&&typeof (s as Source).title==='string'&&typeof (s as Source).url==='string'&&String((s as Source).url).startsWith('https://github.com/kasim672/PromisePulse/')).slice(0,4):[]
   setMessages(prev=>[...prev,{role:'assistant',text:result.answer as string,sources}])
  }catch(error){
   if(!controller.signal.aborted)setMessages(prev=>[...prev,{role:'assistant',text:error instanceof Error?error.message:'Unable to contact the assistant.',error:true}])
  }finally{if(request.current===controller){request.current=null;setWorking(false)}}
 }
 const send=(event:FormEvent)=>{event.preventDefault();void ask(question)}
 const onEntryKey=(event:KeyboardEvent<HTMLTextAreaElement>)=>{
  if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();void ask(question)}
 }
 const trap=(event:KeyboardEvent<HTMLDivElement>)=>{
  if(event.key!=='Tab')return
  const nodes=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),textarea:not(:disabled),a[href]')].filter(el=>el.offsetParent!==null)
  if(!nodes.length)return
  const first=nodes[0],last=nodes[nodes.length-1]
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 }
 return <>
  <button ref={trigger} type="button" className="project-ai-trigger" aria-label="Ask PromisePulse AI" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><MessageCircle size={20} aria-hidden="true"/><span>Ask PromisePulse AI</span></button>
  {open&&<div className="project-ai-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
   <div className="project-ai-dialog" role="dialog" aria-modal="true" aria-labelledby="project-ai-title" onKeyDown={trap}>
    <div className="project-ai-header">
     <div className="project-ai-heading"><span className="project-ai-symbol"><BookOpen size={21} aria-hidden="true"/></span><div><h2 id="project-ai-title">PromisePulse Research Assistant</h2><p>Gemini · Answers grounded in this project</p></div></div>
     <button className="project-ai-close" type="button" aria-label="Close AI assistant" onClick={close}><X size={21}/></button>
    </div>
    <div className="project-ai-messages" role="log" aria-live="polite" aria-label="Assistant conversation">
     {messages.length===0&&<div className="project-ai-intro">
      <ShieldCheck size={27} aria-hidden="true"/>
      <h3>Ask about the research behind the dashboard</h3>
      <p>Explore the documented warehouse, Olist dataset, SQL architecture, data-mining labs and model limitations.</p>
      <div className="project-ai-suggestions">{examples.map(text=><button type="button" key={text} onClick={()=>{void ask(text)}} disabled={working}>{text}</button>)}</div>
     </div>}
     {messages.map((msg,i)=><article key={i} className={'project-ai-message '+msg.role+(msg.error?' is-error':'')}>
      <strong>{msg.role==='user'?'You':'PromisePulse AI'}</strong>
      <p>{msg.text}</p>
      {Boolean(msg.sources?.length)&&<div className="project-ai-sources"><span>Related project sources</span>{msg.sources?.map(s=><a href={s.url} target="_blank" rel="noopener noreferrer" key={s.id}>{s.title}<SquareArrowOutUpRight size={12} aria-hidden="true"/></a>)}</div>}
     </article>)}
     {working&&<div className="project-ai-thinking" role="status"><span className="project-ai-dots" aria-hidden="true"/><span>Checking PromisePulse documentation with Gemini…</span></div>}
     <div ref={end}/>
    </div>
    <form className="project-ai-composer" onSubmit={send}>
     <label htmlFor="project-ai-question">Ask a question about PromisePulse</label>
     <div className="project-ai-composer-row"><textarea ref={entry} id="project-ai-question" rows={2} value={question} maxLength={450} onChange={e=>setQuestion(e.target.value)} onKeyDown={onEntryKey} placeholder="e.g. Why is the model's precision low?" disabled={working}/><button type="submit" aria-label="Send question" disabled={working||question.trim().length<3}><ArrowUp size={19}/></button></div>
     <p>Project documentation only. Historical data (2016–2018). Avoid sharing personal data or API keys. Your question is sent to Gemini for processing.</p>
    </form>
   </div>
  </div>}
 </>
}
