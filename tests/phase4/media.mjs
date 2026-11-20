import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {openBrowser} from '../../scripts/browser-runtime.mjs';
const browser=await openBrowser({port:4198});
try{
 await browser.ready();
 const metadata=await browser.evaluate(`new Promise(async(resolve,reject)=>{try{const response=await fetch('/docs/demo/demo.mp4');if(!response.ok)throw new Error('Demo missing');const blob=await response.blob();const video=document.createElement('video');video.muted=true;video.controls=true;video.style.cssText='position:fixed;inset:0;width:1280px;height:720px;z-index:99999;background:black';document.body.append(video);window.demoVideo=video;video.onloadedmetadata=()=>resolve({duration_s:video.duration,width:video.videoWidth,height:video.videoHeight,bytes:blob.size,mime:blob.type});video.onerror=()=>reject(new Error('Invalid video'));video.src=URL.createObjectURL(blob);}catch(e){reject(e);}})`);
 assert.ok(metadata.duration_s>1&&metadata.duration_s<300);assert.equal(metadata.width,1280);assert.equal(metadata.height,720);
 await browser.evaluate(`new Promise(resolve=>{window.demoVideo.onseeked=resolve;window.demoVideo.currentTime=3;})`);
 const shot=await browser.send('Page.captureScreenshot',{format:'png'},browser.sessionId);await writeFile('docs/demo/preview.png',Buffer.from(shot.data,'base64'));await writeFile('docs/demo/metadata.json',JSON.stringify(metadata,null,2));console.log('PASS demo MP4',metadata);
}finally{await browser.close();}
