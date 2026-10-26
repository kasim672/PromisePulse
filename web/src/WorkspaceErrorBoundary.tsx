import {Component} from 'react'
import type {ErrorInfo,ReactNode} from 'react'
type Props={page:string;children:ReactNode;onHome:()=>void}
type State={error:Error|null}
export class WorkspaceErrorBoundary extends Component<Props,State>{
 state:State={error:null}
 static getDerivedStateFromError(error:Error):State{return {error}}
 componentDidCatch(error:Error,info:ErrorInfo){
  console.error('PromisePulse workspace error',error,info.componentStack)
 }
 componentDidUpdate(prev:Props){
  if(prev.page!==this.props.page&&this.state.error)this.setState({error:null})
 }
 render(){
  if(this.state.error)return <section className="workspace-error" role="alert">
    <h2>This workspace could not be displayed.</h2>
    <p>Your published data has not been changed. Try reopening the page or return to the overview.</p>
    <details><summary>Technical details</summary><code>{this.state.error.message}</code></details>
    <div><button type="button" onClick={()=>this.setState({error:null})}>Try again</button><button type="button" onClick={()=>{this.setState({error:null});this.props.onHome()}}>Back to overview</button></div>
   </section>
  return this.props.children
 }
}
