import {access,copyFile} from 'node:fs/promises'
import {constants} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const template=path.join(web,'.env.example')
const target=path.join(web,'.env')
try{
 await access(template,constants.R_OK)
 await copyFile(template,target,constants.COPYFILE_EXCL)
 console.log('Created web/.env (git-ignored). Edit GEMINI_API_KEY there, then run npm run dev.')
}catch(error){
 if(error?.code==='EEXIST'){
  console.log('web/.env already exists. Left your existing settings untouched.')
 }else{
  console.error('Unable to create web/.env from the template:',error?.message||error)
  process.exitCode=1
 }
}
