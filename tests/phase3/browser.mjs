import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';

const output='docs/proof/phase-3';await mkdir(output,{recursive:true});
const profile=await mkdtemp(join(tmpdir(),'lantern-phase3-browser-'));
const port=4184,base=`http://127.0.0.1:${port}`;
let chrome,ws,server;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function startup(child,pattern){return new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error(`Startup timeout: ${log.slice(-1500)}`)),15000);child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(new Error(`Startup exit ${code}: ${log.slice(-1500)}`));});for(const stream of [child.stdout,child.stderr])stream?.on('data',data=>{log+=data;const match=log.match(pattern);if(match){clearTimeout(timer);resolve(match[1]??true);}});});}
try{
 server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});await startup(server,/Đảo Đèn Lồng:/);
 const executable=process.env.CHROME_PATH??'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
 chrome=spawn(executable,['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-sandbox','--disable-gpu-sandbox','--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await startup(chrome,/DevTools listening on (ws:\/\/[^\s]+)/);
 ws=new WebSocket(endpoint);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let id=0;const pending=new Map();ws.onmessage=event=>{const msg=JSON.parse(event.data);const promise=pending.get(msg.id);if(promise){pending.delete(msg.id);msg.error?promise.reject(new Error(msg.error.message)):promise.resolve(msg.result);}};
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:base});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 async function ready(){for(let i=0;i<100;i++){try{if(await evaluate(`Boolean(document.querySelector('#flow button'))`))return;}catch{}await wait(50);}throw new Error('Game UI did not load');}
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false},sessionId);await ready();
 await evaluate(`document.querySelectorAll('#flow button')[1].click();document.querySelector('#colorblind-setting').click();true`);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('lantern-settings')).colorblind`),true);
 await send('Page.navigate',{url:`${base}/?scene=fuel&night=1`},sessionId);await wait(300);await ready();
 await evaluate(`document.querySelector('#flow button').click();true`);await wait(200);
 const read=()=>evaluate(`import('/src/game.mjs').then(m=>m.inspectGame())`);
 const before=await read();assert.equal(before.player.capacity,14);assert.equal(before.player.carried,5);
 assert.equal(await evaluate(`document.documentElement.dataset.colorblind`),'true');
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('#time')).color`),'rgb(255, 255, 255)');
 assert.ok(await evaluate(`document.querySelector('#time').textContent.includes('⚠')`));
 assert.ok(await evaluate(`document.querySelector('#cells').textContent.includes('/ 14')`));
 assert.ok(await evaluate(`document.querySelector('#hint').textContent.includes('Châm dầu')`));
 const beforeImage=await send('Page.captureScreenshot',{format:'png'},sessionId);await writeFile(join(output,'colorblind-low-fuel.png'),Buffer.from(beforeImage.data,'base64'));
 await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE'}));true`);await wait(100);await evaluate(`window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyE'}));true`);
 const after=await read();assert.equal(after.player.carried,0);assert.equal(after.score,25);assert.ok(after.lanterns[0].fuel>60);assert.equal(after.player.capacity,14);
 await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyP'}));true`);const paused=await read();await wait(250);const still=await read();assert.equal(still.sim_tick,paused.sim_tick);assert.equal(still.lanterns[0].fuel,paused.lanterns[0].fuel);
 await evaluate(`document.querySelector('#flow button').click();true`);
 const benchmark=await evaluate(`new Promise(resolve=>{let frames=0;const start=performance.now();function count(now){frames++;if(now-start>=3000)resolve({frames,seconds:(now-start)/1000,average_fps:frames*1000/(now-start)});else requestAnimationFrame(count);}requestAnimationFrame(count);})`);
 const image=await send('Page.captureScreenshot',{format:'png'},sessionId);await writeFile(join(output,'refueled.png'),Buffer.from(image.data,'base64'));
 const report={viewport:[1280,720],colorblind_persisted:true,warning_white_and_icon:true,capacity_hud:true,refuel:true,pause_freezes_fuel:true,...benchmark};await writeFile(join(output,'browser-check.json'),JSON.stringify(report,null,2));
 console.log('PASS Phase3 browser',report);
}finally{
 ws?.close();chrome?.kill();server?.kill();await wait(500);
 if(resolve(profile).startsWith(resolve(tmpdir())+sep)&&profile.includes('lantern-phase3-browser-')){try{await rm(profile,{recursive:true,force:true});}catch{}}
}
