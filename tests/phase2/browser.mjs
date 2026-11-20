import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const profile=await mkdtemp(join(tmpdir(),'lantern-browser-'));
const executable=process.env.CHROME_PATH??'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome=spawn(executable,['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-sandbox','--disable-gpu-sandbox',...(process.env.SOFTWARE_RENDERING?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]),'--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe']});
let ws;
try{
 const endpoint=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error(`Chrome did not start: ${log.slice(-1000)}`)),15000);chrome.once('error',reject);chrome.stderr.on('data',chunk=>{log+=chunk;const match=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});});
 ws=new WebSocket(endpoint);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let id=0;const pending=new Map();ws.onmessage=event=>{const message=JSON.parse(event.data);if(pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);}};
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'http://127.0.0.1:4173/'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false},sessionId);
 await evaluate(`new Promise(resolve=>{const check=()=>document.querySelector('#flow button')?resolve(true):setTimeout(check,50);check();})`);
 assert.equal(await evaluate(`document.querySelector('#flow h2').textContent`),'ĐẢO ĐÈN LỒNG');
 await evaluate(`document.querySelector('#flow button').click();document.querySelector('#flow button').click();true`);
 const read=()=>evaluate(`import('/src/game.mjs').then(m=>m.inspectGame())`);
 const before=await read();
 await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD',key:'d'}));true`);
 await evaluate(`new Promise(resolve=>setTimeout(resolve,500))`);
 await evaluate(`window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyD',key:'d'}));true`);
 const after=await read();assert.ok(after.player.pos[0]<before.player.pos[0],'D must move screen-right (-X at yaw 0)');
 await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyP'}));true`);const paused=await read();assert.equal(paused.state,'paused');
 await evaluate(`new Promise(resolve=>setTimeout(resolve,250))`);assert.equal((await read()).sim_tick,paused.sim_tick);
 await evaluate(`document.querySelector('#flow button').click();true`);assert.equal((await read()).state,'playing');
 const benchmark=await evaluate(`new Promise(resolve=>{let frames=0;const start=performance.now();function count(now){frames++;if(now-start>=5000)resolve({frames,seconds:(now-start)/1000,average_fps:frames*1000/(now-start)});else requestAnimationFrame(count);}requestAnimationFrame(count);})`);
 const {data}=await send('Page.captureScreenshot',{format:'png'},sessionId);await writeFile('docs/proof/phase-2/browser.png',Buffer.from(data,'base64'));
 const renderer=await evaluate(`(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);})()`);
 await writeFile('docs/proof/phase-2/browser-check.json',JSON.stringify({viewport:[1280,720],renderer,menu:true,start:true,screen_right:true,pause_resume:true,...benchmark,meets_30_fps:benchmark.average_fps>=30},null,2));
 console.log('PASS browser menu/start, D direction, pause/resume',benchmark);
 assert.ok(benchmark.average_fps>=30,'FPS below required 30; see browser-check.json');
 for(const night of [2,3]){
  await send('Page.navigate',{url:`http://127.0.0.1:4173/?night=${night}`},sessionId);
  await new Promise(resolve=>setTimeout(resolve,750));
  await evaluate(`new Promise(resolve=>{const check=()=>document.querySelector('#flow button')?resolve(true):setTimeout(check,50);check();})`);
  await evaluate(`document.querySelector('#flow button').click();true`);
  const state=await read();assert.equal(state.night,night);assert.equal(state.lanterns.length,night+4);
  await evaluate(`new Promise(resolve=>setTimeout(resolve,400))`);
  const image=await send('Page.captureScreenshot',{format:'png'},sessionId);await writeFile(`docs/proof/phase-2/night-${night}.png`,Buffer.from(image.data,'base64'));
  console.log(`PASS browser night ${night} starts with ${night+4} lanterns`);
 }
}finally{if(ws)ws.close();chrome.kill();await new Promise(resolve=>setTimeout(resolve,500));try{await rm(profile,{recursive:true,force:true});}catch{}}
