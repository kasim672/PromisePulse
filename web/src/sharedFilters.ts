import {useEffect,useState} from 'react'
export type FilterYear='all'|'2016'|'2017'|'2018'
export type FilterState='ALL'|string
export type SharedFilters={year:FilterYear;state:FilterState}
const key='promisepulse-shared-filters-v1'
const eventName='promisepulse:filters'
const initial:SharedFilters={year:'all',state:'ALL'}
function valid(input:unknown):SharedFilters{
 if(!input||typeof input!=='object')return {...initial}
 const raw=input as Partial<SharedFilters>
 return {year:['all','2016','2017','2018'].includes(String(raw.year))?raw.year as FilterYear:'all',state:typeof raw.state==='string'&&/^(ALL|[A-Z]{2})$/.test(raw.state)?raw.state:'ALL'}
}
export function getSharedFilters():SharedFilters{
 try{return valid(JSON.parse(localStorage.getItem(key)||'null'))}catch{return {...initial}}
}
export function setSharedFilters(update:Partial<SharedFilters>){
 const value=valid({...getSharedFilters(),...update})
 try{localStorage.setItem(key,JSON.stringify(value))}catch{/*private mode*/}
 window.dispatchEvent(new CustomEvent<SharedFilters>(eventName,{detail:value}))
}
export function useSharedFilters():[SharedFilters,(next:Partial<SharedFilters>)=>void]{
 const [value,setValue]=useState<SharedFilters>(getSharedFilters)
 useEffect(()=>{
  const sameTab=(ev:Event)=>setValue(valid((ev as CustomEvent<SharedFilters>).detail))
  const crossTab=(ev:StorageEvent)=>{if(ev.key===key)setValue(getSharedFilters())}
  window.addEventListener(eventName,sameTab)
  window.addEventListener('storage',crossTab)
  return ()=>{window.removeEventListener(eventName,sameTab);window.removeEventListener('storage',crossTab)}
 },[])
 return [value,setSharedFilters]
}
