import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
export const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function openBrowser({port=4194,visible=false,dataFile}={}){
 const profile=await mkdtemp(join(tmpdir(),'lantern-release-'));let server,chrome,ws;
 const pending=new Map();
 const startup=(child,pattern)=>new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error(log.slice(-2000)||'Startup timeout')),20000);child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(new Error(`Process exited ${code}: ${log.slice(-1500)}`));});for(const stream of [child.stdout,child.stderr])stream?.on('data',chunk=>{log+=chunk;const match=log.match(pattern);if(match){clearTimeout(timer);resolve(match[1]??true);}});});
 const close=async()=>{ws?.close();chrome?.kill();server?.kill();await wait(500);if(resolve(profile).startsWith(resolve(tmpdir())+sep)){try{await rm(profile,{recursive:true,force:true});}catch{}}};
 try{
  server=spawn(process.execPath,['scripts/serve.mjs',...(dataFile?['--data',dataFile]:[])],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe'],windowsHide:true});await startup(server,/Đảo Đèn Lồng:/);
  const candidates=[process.env.CHROME_PATH,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
  const executable=candidates.find(p=>p&&existsSync(p));if(!executable)throw new Error('Chrome/Chromium missing. Set CHROME_PATH to an installed browser executable.');
  chrome=spawn(executable,[...(!visible?['--headless=new']:[]),'--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-sandbox','--disable-gpu-sandbox','--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:!visible});
  const endpoint=await startup(chrome,/DevTools listening on (ws:\/\/[^\s]+)/);ws=new WebSocket(endpoint);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let id=0;const listeners=new Map();ws.onmessage=event=>{const msg=JSON.parse(event.data);if(pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(new Error(msg.error.message)):p.resolve(msg.result);}else for(const listener of listeners.get(msg.method)??[])listener(msg.params,msg.sessionId);};
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(new Error(`CDP timeout ${method}`));},120000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
  const base=`http://127.0.0.1:${port}`;const {targetId}=await send('Target.createTarget',{url:base});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false},sessionId);
  const ready=async(selector='#flow button')=>{for(let i=0;i<200;i++){try{if(await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`))return;}catch{}await wait(50);}throw new Error(`UI not ready: ${selector}`);};
  const navigate=async path=>{await send('Page.navigate',{url:base+path},sessionId);await wait(200);};
  return{base,sessionId,send,evaluate,ready,navigate,close,on:(method,fn)=>{if(!listeners.has(method))listeners.set(method,[]);listeners.get(method).push(fn);}};
 }catch(error){await close();throw error;}
}
