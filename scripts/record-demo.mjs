import {openBrowser,wait} from './browser-runtime.mjs';
import {mkdir,writeFile,readFile,mkdtemp,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
const folder=await mkdtemp(join(tmpdir(),'lantern-demo-'));const browser=await openBrowser({port:4197,dataFile:join(folder,'scores.json')});
await mkdir('docs/demo',{recursive:true});
try{
 await browser.ready();await browser.evaluate(`document.querySelector('#flow button').click();document.querySelector('#flow button').click();true`);
 await browser.evaluate(`(()=>{
 const mime=['video/mp4;codecs=avc1.42001E','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw new Error('MP4 MediaRecorder unsupported');
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const ctx=canvas.getContext('2d');
 window.demoCaption='Chơi trực tiếp — WASD, nhảy, lướt';window.demoLines=[];window.demoRunning=true;
 const recorder=new MediaRecorder(canvas.captureStream(30),{mimeType:mime,videoBitsPerSecond:1600000});const chunks=[];
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 window.finishDemo=()=>new Promise(resolve=>{recorder.onstop=()=>{window.demoRunning=false;const blob=new Blob(chunks,{type:mime});const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);};recorder.stop();});
 function draw(){ctx.drawImage(document.querySelector('#scene'),0,0,1280,720);ctx.fillStyle='#0e1430ee';ctx.fillRect(0,0,1280,95);ctx.font='bold 26px sans-serif';ctx.fillStyle='#f2c14e';ctx.fillText('ĐẢO ĐÈN LỒNG — DEMO v1.0.0',25,33);ctx.font='22px sans-serif';ctx.fillStyle='#f5f1e6';ctx.fillText(window.demoCaption,25,66);
 const state=['#flames','#carried','#lit','#time','#score'].map(id=>document.querySelector(id)?.textContent??'');ctx.fillText('Lửa: '+state[0]+' | Đom đóm: '+state[1]+' | Đèn: '+state[2]+' | Giờ: '+state[3]+' | Điểm: '+state[4],25,705);
 if(window.demoLines.length){ctx.fillStyle='#0e1430ee';ctx.fillRect(10,115,1260,540);ctx.font='19px monospace';ctx.fillStyle='#f5f1e6';window.demoLines.slice(0,24).forEach((line,i)=>ctx.fillText(line.slice(0,105),25,145+i*21));}
 if(window.demoRunning)requestAnimationFrame(draw);
 }recorder.start(1000);draw();return true;
 })()`);
 const key=async(code,down)=>browser.evaluate(`window.dispatchEvent(new KeyboardEvent('${down?'keydown':'keyup'}',{code:${JSON.stringify(code)}}));true`);
 await key('KeyW',true);await wait(2600);await key('Space',true);await wait(150);await key('Space',false);await wait(700);await key('KeyW',false);
 await key('KeyA',true);await wait(1300);await key('ShiftLeft',true);await wait(250);await key('ShiftLeft',false);await key('KeyA',false);await key('KeyD',true);await wait(800);await key('KeyD',false);await wait(1500);
 const commandLog=[];
 for(const [label,args]of [['Hồi quy Phase1–3 + input',['tests/phase1/verify.mjs']],['Phase4: bảng điểm và xuất CLI',['tests/phase4/leaderboard.mjs']],['Phase4: scene benchmark và công thức',['tests/phase4/verify.mjs']]]){
  await browser.evaluate(`window.demoCaption=${JSON.stringify(label+' — đang chạy lệnh thật')};window.demoLines=${JSON.stringify(['node '+args.join(' '),'Đang chạy…'])};true`);
  const result=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:8*1024*1024});if(result.status!==0)throw new Error(result.stderr||result.stdout);commandLog.push({command:'node '+args.join(' '),exit_code:result.status,stdout:result.stdout});
  await browser.evaluate(`window.demoLines=${JSON.stringify(['node '+args.join(' '),'exit code: 0',...result.stdout.trim().split('\n').slice(-19)])};true`);await wait(5500);
 }
 const headlessOut=join(folder,'headless.jsonl');const command=['src/headless.mjs','--seed','42','--night','1','--ticks','120','--out',headlessOut];const run=spawnSync(process.execPath,command,{encoding:'utf8'});if(run.status!==0)throw new Error(run.stderr);const end=JSON.parse((await readFile(headlessOut,'utf8')).trim().split('\n').at(-1));
 await browser.evaluate(`window.demoCaption='Headless — output thật, không GPU';window.demoLines=${JSON.stringify(['node src/headless.mjs --seed 42 --night 1 --ticks 120 --out headless.jsonl','exit code: 0',JSON.stringify(end)])};true`);await wait(6500);
 for(const [file,label]of [['bench.json','Benchmark chuẩn: 200 Bóng Mực, 100 đom đóm — kết quả đã đo thật'],['soak.json','Soak: 10 Đêm cùng tiến trình — kết quả đã chạy thật']]){
  const content=await readFile(file,'utf8');await browser.evaluate(`window.demoCaption=${JSON.stringify(label)};window.demoLines=${JSON.stringify([file,...content.split('\n')])};true`);await wait(9000);
 }
 const log=spawnSync('git',['log','-5','--oneline'],{encoding:'utf8'}).stdout;
 await browser.evaluate(`window.demoCaption='Harness và lịch sử — bằng chứng tái hiện được';window.demoLines=${JSON.stringify(['AGENTS.md + skills/verify-phase/SKILL.md','node scripts/build.mjs','node tests/phase1/verify.mjs','node scripts/bench.mjs --seed 42 --duration 30 --out bench.json','node --expose-gc scripts/soak.mjs --seed 7 --nights 10 --out soak.json','',...log.trim().split('\n'),'','README.md: hướng dẫn chạy trong 2 lệnh','Benchmark/soak trên là kết quả đo thật đã lưu, không dựng số liệu.'])};true`);await wait(7000);
 const base64=await browser.evaluate('window.finishDemo()');const bytes=Buffer.from(base64,'base64');if(bytes.subarray(4,8).toString()!=='ftyp')throw new Error('Output is not an MP4 container');
 await writeFile('docs/demo/demo.mp4',bytes);await writeFile('docs/demo/verification-log.json',JSON.stringify({commands:commandLog,headless_end:end,bytes:bytes.length,note:'Actual browser gameplay captured using MediaRecorder MP4 at30fps; terminal outputs are actual subprocess output; bench/soak panels show previously measured committed artifacts. No narration.'},null,2));console.log(`MP4 saved (${bytes.length} bytes)`);
}finally{await browser.close();if(resolve(folder).startsWith(resolve(tmpdir())+sep))await rm(folder,{recursive:true,force:true});}
