import { createGame, INITIAL_INPUT, step, snapshot, TUNING, capacity, fuelValue, lightCost, receivingLanterns } from './core.mjs';
import { settings, saveSettings, startAudio, sound } from './audio.mjs';
import { HEX, color } from './colors.mjs';
import { KeyboardInput, physicalKey, GAME_KEYS } from './input.mjs';
import {createBenchmark,stepBenchmark,frameMetrics} from './benchmark.mjs';
import {DEFAULT_BINDINGS,ACTION_LABELS,rebind,actionDown} from './controls.mjs';

const canvas = document.querySelector('#scene');
canvas.tabIndex=0;
canvas.style.outline='none';
const focusGame=()=>canvas.focus({preventScroll:true});
const errorBox = document.querySelector('#error');
const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
document.documentElement.style.color=HEX.text;
const paletteStyle=document.createElement('style');paletteStyle.textContent=`html,body{background:${HEX.sky};color:${HEX.text}}#hud{color:${HEX.text}}#hud strong,#hud h1,#direction{color:${HEX.gold}}#time.urgent{color:${HEX.danger}}#flow{color:${HEX.text}}#flow button{background:${HEX.gold}}`;document.head.append(paletteStyle);
paletteStyle.textContent+=`#hud{background:none;border:0;box-shadow:none;backdrop-filter:none;position:static;padding:0}#hud h1{position:fixed;left:50%;top:58px;transform:translateX(-50%);font-size:14px}#hud>div{position:fixed;padding:10px 15px;background:#0e1430d9;border-radius:8px}#hud>div:nth-of-type(1){left:18px;top:18px}#hud>div:nth-of-type(2){display:none}#hud>div:nth-of-type(3){right:18px;top:18px}#hud>div:nth-of-type(4){left:50%;top:18px;transform:translateX(-50%)}#hud>div:nth-of-type(5){right:18px;top:62px}#direction{top:112px!important}`;
paletteStyle.textContent+=`[data-colorblind=true] #time.urgent{color:#FFFFFF}#cells{max-width:65vw;white-space:nowrap}#fuel-status{position:fixed;left:18px;top:72px;padding:10px;background:#0e1430d9;border-radius:8px;font-size:13px;line-height:1.7}.low-fuel{color:${HEX.danger};animation:fuelBlink 1s steps(2,end) infinite}[data-colorblind=true] .low-fuel{color:#FFFFFF}@keyframes fuelBlink{50%{opacity:.35}}`;
if (!gl) {
  errorBox.style.display = 'block';
  errorBox.textContent = 'Trình duyệt cần WebGL2 để chơi game.';
  throw new Error('WebGL2 unavailable');
}

const vertexSource = `#version 300 es
in vec3 position;
in vec4 vertexColor;
uniform mat4 mvp;
out vec4 tint;
void main() { gl_Position = mvp * vec4(position, 1.0); tint=vertexColor; }`;
const fragmentSource = `#version 300 es
precision mediump float;
in vec4 tint;
out vec4 pixel;
void main() { pixel = tint; }`;
function shader(type, source) {
  const result = gl.createShader(type);
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
  return result;
}
const program = gl.createProgram();
gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource));
gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
gl.useProgram(program);
const positionLocation = gl.getAttribLocation(program, 'position');
const vertexColorLocation = gl.getAttribLocation(program, 'vertexColor');
const mvpLocation = gl.getUniformLocation(program, 'mvp');
const colorLocation = gl.getUniformLocation(program, 'color');
const ambientLocation = gl.getUniformLocation(program, 'ambient');
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

function makeMesh(vertices) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  return { buffer, vertices, count: vertices.length / 3 };
}
const cube = makeMesh([
  // front, back, left, right, top, bottom
  -.5,-.5,.5, .5,-.5,.5, .5,.5,.5, -.5,-.5,.5, .5,.5,.5, -.5,.5,.5,
  .5,-.5,-.5, -.5,-.5,-.5, -.5,.5,-.5, .5,-.5,-.5, -.5,.5,-.5, .5,.5,-.5,
  -.5,-.5,-.5, -.5,-.5,.5, -.5,.5,.5, -.5,-.5,-.5, -.5,.5,.5, -.5,.5,-.5,
  .5,-.5,.5, .5,-.5,-.5, .5,.5,-.5, .5,-.5,.5, .5,.5,-.5, .5,.5,.5,
  -.5,.5,.5, .5,.5,.5, .5,.5,-.5, -.5,.5,.5, .5,.5,-.5, -.5,.5,-.5,
  -.5,-.5,-.5, .5,-.5,-.5, .5,-.5,.5, -.5,-.5,-.5, .5,-.5,.5, -.5,-.5,.5,
]);
function circleMesh(segments = 48) {
  const vertices = [];
  for (let i = 0; i < segments; i++) {
    const a = i * Math.PI * 2 / segments;
    const b = (i + 1) * Math.PI * 2 / segments;
    vertices.push(0, 0, 0, Math.cos(b), 0, Math.sin(b), Math.cos(a), 0, Math.sin(a));
  }
  return makeMesh(vertices);
}
function coneMesh(segments = 12) {
  const vertices = [];
  for (let i = 0; i < segments; i++) {
    const a = i * Math.PI * 2 / segments;
    const b = (i + 1) * Math.PI * 2 / segments;
    vertices.push(0, 1, 0, Math.cos(a), 0, Math.sin(a), Math.cos(b), 0, Math.sin(b));
  }
  return makeMesh(vertices);
}
const disk = circleMesh();
const cone = coneMesh();
const paperTear=makeMesh([-.25,.3,0, -.05,.08,0, -.2,-.15,0, -.05,.08,0, .18,-.04,0, .1,-.3,0]);

function multiply(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) result[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k];
    }
  }
  return result;
}
function perspective(aspect) {
  const near = 0.1, far = 150, f = 1 / Math.tan(Math.PI / 6);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, 2 * far * near / (near - far), 0,
  ]);
}
function lookAt(eye, target) {
  let z = [eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]];
  let length = Math.hypot(...z); z = z.map(value => value / length);
  let x = [z[2], 0, -z[0]];
  length = Math.hypot(...x); x = x.map(value => value / length);
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -x.reduce((sum, value, i) => sum + value * eye[i], 0),
    -y.reduce((sum, value, i) => sum + value * eye[i], 0),
    -z.reduce((sum, value, i) => sum + value * eye[i], 0), 1,
  ]);
}
function model(pos, scale, rotation = 0) {
  const c = Math.cos(rotation), s = Math.sin(rotation);
  return new Float32Array([
    c * scale[0], 0, -s * scale[0], 0,
    0, scale[1], 0, 0,
    s * scale[2], 0, c * scale[2], 0,
    pos[0], pos[1], pos[2], 1,
  ]);
}
let viewProjection;
const opaqueVertices=new Float32Array(1048576),transparentVertices=new Float32Array(262144);
let opaqueCount=0,transparentCount=0;
const frameBuffer=gl.createBuffer();
function draw(mesh, pos, scale, rgba, rotation = 0, emissive = false) {
  const progress = game.lanterns.filter(l=>l.lit).length / game.lanterns.length;
  const ambient=emissive?1:.15+.55*progress,c=Math.cos(rotation),s=Math.sin(rotation);
  const transparent=rgba[3]<1,dest=transparent?transparentVertices:opaqueVertices;let offset=transparent?transparentCount:opaqueCount;
  if(offset+mesh.count*7>dest.length)throw new Error('Render batch capacity exceeded');
  for(let i=0;i<mesh.vertices.length;i+=3){const x=mesh.vertices[i]*scale[0],y=mesh.vertices[i+1]*scale[1],z=mesh.vertices[i+2]*scale[2];dest[offset++]=pos[0]+c*x+s*z;dest[offset++]=pos[1]+y;dest[offset++]=pos[2]-s*x+c*z;dest[offset++]=rgba[0]*ambient;dest[offset++]=rgba[1]*ambient;dest[offset++]=rgba[2]*ambient;dest[offset++]=rgba[3];}
  if(transparent)transparentCount=offset;else opaqueCount=offset;
}
function flush(){
  gl.bindBuffer(gl.ARRAY_BUFFER,frameBuffer);gl.enableVertexAttribArray(positionLocation);gl.enableVertexAttribArray(vertexColorLocation);gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,28,0);gl.vertexAttribPointer(vertexColorLocation,4,gl.FLOAT,false,28,12);gl.uniformMatrix4fv(mvpLocation,false,viewProjection);
  for(const [vertices,count,depth]of [[opaqueVertices,opaqueCount,true],[transparentVertices,transparentCount,false]]){gl.depthMask(depth);gl.bufferData(gl.ARRAY_BUFFER,vertices.subarray(0,count),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,count/7);}gl.depthMask(true);opaqueCount=0;transparentCount=0;
}

const urlOptions=new URLSearchParams(location.search);
const benchmarkMode=urlOptions.get('bench')==='1';
const benchmarkDuration=Number(urlOptions.get('duration')??30);
const benchmarkState={done:false,first_frame_epoch:0,measureStart:0,times:[],last:0};
const previewPath={fuel:'/tests/phase3/preview.json',win:'/tests/phase4/win.json',lose:'/tests/phase4/lose.json',cues:'/tests/phase4/cues.json'}[urlOptions.get('scene')];
const previewScenario=previewPath?await fetch(previewPath).then(response=>{if(!response.ok)throw new Error('Cannot load diagnostic scenario');return response.json();}):{};
let game = benchmarkMode?createBenchmark(Number(urlOptions.get('seed')??42)):createGame(42,previewScenario);
let previousInput = { ...INITIAL_INPUT };
let cameraYaw = 0;
let pulseFlash = 0;
let screen = 'menu', totalScore = 0, night = 1;
let wonScores = [null, null, null];
let scoreSubmitted = false;
let bindingToCapture=null;
let recentSpawn=null;
let fpsFrames=0, fpsTime=0, averageFps=0;
const panel=document.createElement('section');panel.id='flow';document.body.append(panel);
const style=document.createElement('style');style.textContent=`#flow{position:fixed;inset:0;background:#10162be8;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;color:#ffe2a3;overflow-y:auto;padding:20px;box-sizing:border-box}#flow button{font:inherit;padding:12px 28px;background:#f6c56c;border:0;border-radius:8px;cursor:pointer}#flow button:disabled{opacity:.5;cursor:not-allowed}#flow input[type="text"]{font:inherit;padding:10px 16px;background:#1a223f;border:1px solid #f6c56c;border-radius:6px;color:#ffe2a3;font-size:16px;outline:none;text-align:center}#flow table{border-collapse:collapse;margin:10px 0;min-width:440px;max-width:90vw;font-size:15px}#flow th,#flow td{padding:8px 14px;text-align:center;border-bottom:1px solid #334166}#flow th{color:#f6c56c;border-bottom:2px solid #f6c56c}#flow .error{color:#ff6565;font-size:14px}#flow .success{color:#65ff88;font-size:14px}#flow .row-actions{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}#flow h2{font-size:36px}#flow label{display:flex;gap:20px}#cells{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);font-size:23px;letter-spacing:4px}#cooldowns{position:fixed;bottom:65px;right:20px;padding:10px;background:#12162bcc}#direction{position:fixed;top:16px;right:20px;color:#ffdb77}#time.urgent{color:#ff6565;animation:blink .6s infinite alternate}@keyframes blink{to{opacity:.25}}`;document.head.append(style);
for(const id of ['cells','cooldowns','direction','fuel-status']){const el=document.createElement('div');el.id=id;document.body.append(el);}
const accessibilityStyle=document.createElement('style');accessibilityStyle.textContent=`:root{--ui-scale:1}body :is(div,p,strong,label,span,button,input,select,td,th,li,h1,h3){font-size:calc(18px * var(--ui-scale))!important}#flow{justify-content:flex-start;padding-top:45px}#flow>*{flex-shrink:0}#hint{white-space:normal;max-width:94vw;width:max-content}#cells{letter-spacing:1px;max-width:75vw;bottom:85px}#cooldowns{bottom:130px;right:12px}#announcements{position:fixed;top:110px;left:50%;transform:translateX(-50%);max-width:55vw;background:#0e1430dd;padding:8px;pointer-events:none}#spawn-arrow{position:fixed;color:#F2C14E;background:#0e1430dd;padding:8px;pointer-events:none}[data-reduced-motion=true] *{animation:none!important;transition:none!important}`;document.head.append(accessibilityStyle);
for(const id of ['announcements','spawn-arrow']){const e=document.createElement('div');e.id=id;e.setAttribute('role','status');e.setAttribute('aria-live','polite');document.body.append(e);}
function applyAccessibility(){document.documentElement.style.setProperty('--ui-scale',settings.largeText?'1.25':'1');document.documentElement.dataset.reducedMotion=String(settings.reducedMotion);document.documentElement.dataset.colorblind=String(settings.colorblind);}
const keyLabel=code=>code.replace('Key','').replace('Digit','').replace('Left','').replace('Right','');
function updateCues(){const messages=[];const seconds=Math.ceil(game.timeLeft);if(seconds<=10)messages.push(`⚠ Bình minh sau ${seconds} giây`);if(game.night===3&&game.windEnabled&&game.simTick%1800>=1680)messages.push('⚠ Gió mạnh sắp thổi');if(game.lanterns.some(l=>l.lit&&l.fuelUnits<1800))messages.push('⚠ Có đèn dưới30dầu — cần châm dầu');const arrow=document.querySelector('#spawn-arrow');if(recentSpawn&&game.simTick<=recentSpawn.until){messages.push('⚠ Bóng Mực vừa xuất hiện');const shade=game.shades.find(s=>s.id===recentSpawn.id);if(shade){const angle=Math.atan2(shade.pos[0]-game.player.pos[0],shade.pos[2]-game.player.pos[2])-cameraYaw*Math.PI/180;const dx=-Math.sin(angle),dy=-Math.cos(angle);const factor=1/Math.max(Math.abs(dx),Math.abs(dy),.001);arrow.style.left=`${50+dx*factor*43}%`;arrow.style.top=`${50+dy*factor*35}%`;arrow.textContent='➤ Bóng Mực';arrow.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;arrow.style.display='block';}}else arrow.style.display='none';document.querySelector('#announcements').textContent=messages.join(' · ');document.querySelector('#announcements').style.display=messages.length?'block':'none';}
function showPanel(title,buttons){bindingToCapture=null;panel.replaceChildren();const h=document.createElement('h2');h.textContent=title;panel.append(h);for(const [label,action]of buttons){const b=document.createElement('button');b.textContent=label;b.onclick=action;panel.append(b);}panel.style.display='flex';}
function formatDate(iso){try{const d=new Date(iso);if(isNaN(d.getTime()))return iso;const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;}catch{return iso;}}
async function showLeaderboard(back){panel.replaceChildren();const h=document.createElement('h2');h.textContent='BẢNG XẾP HẠNG';panel.append(h);const loading=document.createElement('p');loading.textContent='Đang tải...';panel.append(loading);const backBtn=document.createElement('button');backBtn.textContent='Quay lại';backBtn.onclick=back;try{const response=await fetch('/api/leaderboard');if(!response.ok)throw new Error('Không thể tải bảng điểm');const data=await response.json();loading.remove();if(!data.entries||data.entries.length===0){const emptyMsg=document.createElement('p');emptyMsg.textContent='Chưa có điểm nào được lưu.';panel.append(emptyMsg);}else{const table=document.createElement('table');table.innerHTML='<thead><tr><th>Hạng</th><th>Tên</th><th>Điểm</th><th>Số Đêm thắng</th><th>Thời gian</th></tr></thead>';const tbody=document.createElement('tbody');data.entries.slice(0,10).forEach((entry,idx)=>{const tr=document.createElement('tr');const tdRank=document.createElement('td');tdRank.textContent=`#${idx+1}`;const tdName=document.createElement('td');tdName.textContent=entry.name;const tdScore=document.createElement('td');tdScore.textContent=entry.score;const tdNights=document.createElement('td');tdNights.textContent=entry.nights_won;const tdTime=document.createElement('td');tdTime.textContent=formatDate(entry.achieved_at);tr.append(tdRank,tdName,tdScore,tdNights,tdTime);tbody.append(tr);});table.append(tbody);panel.append(table);}}catch(err){loading.textContent=`Lỗi tải bảng điểm: ${err.message}`;}panel.append(backBtn);panel.style.display='flex';}
function showFinalResultScreen(isWonNight3){panel.replaceChildren();const title=isWonNight3?'BÌNH MINH — CHIẾN THẮNG!':`THUA ĐÊM ${night}`;const h=document.createElement('h2');h.textContent=title;panel.append(h);const wonCount=wonScores.filter(s=>typeof s==='number').length;const totalWon=wonScores.reduce((sum,s)=>sum+(s||0),0);const summary=document.createElement('p');summary.style.fontSize='18px';summary.textContent=`Tổng điểm hành trình: ${totalWon} điểm · ${wonCount} Đêm thắng`;panel.append(summary);const saveContainer=document.createElement('div');saveContainer.style.display='flex';saveContainer.style.flexDirection='column';saveContainer.style.alignItems='center';saveContainer.style.gap='8px';const msg=document.createElement('div');msg.style.minHeight='22px';if(!scoreSubmitted){const inputRow=document.createElement('div');inputRow.style.display='flex';inputRow.style.gap='10px';inputRow.style.alignItems='center';const input=document.createElement('input');input.type='text';input.id='player-name';input.placeholder='Tên (3–12 ký tự)';input.maxLength=12;const saveBtn=document.createElement('button');saveBtn.textContent='Lưu điểm';const doSubmit=async()=>{if(scoreSubmitted||saveBtn.disabled)return;const name=input.value.trim();if(!/^[A-Za-z0-9_]{3,12}$/.test(name)){msg.textContent='Tên cần có 3–12 ký tự, chỉ gồm chữ không dấu, số và _';msg.className='error';return;}saveBtn.disabled=true;saveBtn.textContent='Đang lưu...';try{const res=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,score:totalWon,nights_won:wonCount,seed:42})});const resData=await res.json();if(!res.ok)throw new Error(resData.error||'Lỗi khi lưu điểm');scoreSubmitted=true;input.disabled=true;saveBtn.remove();msg.textContent=`Đã lưu điểm cho ${name}!`;msg.className='success';}catch(err){saveBtn.disabled=false;saveBtn.textContent='Lưu điểm';msg.textContent=err.message;msg.className='error';}};saveBtn.onclick=doSubmit;input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();doSubmit();}};inputRow.append(input,saveBtn);saveContainer.append(inputRow);}else{msg.textContent='Điểm của bạn đã được ghi nhận.';msg.className='success';}saveContainer.append(msg);panel.append(saveContainer);const actions=document.createElement('div');actions.className='row-actions';if(!isWonNight3){const retryBtn=document.createElement('button');retryBtn.textContent='Chơi lại Đêm';retryBtn.onclick=restart;actions.append(retryBtn);}const lbBtn=document.createElement('button');lbBtn.textContent='Bảng xếp hạng';lbBtn.onclick=()=>showLeaderboard(()=>showFinalResultScreen(isWonNight3));actions.append(lbBtn);const menuBtn=document.createElement('button');menuBtn.textContent='Về menu';menuBtn.onclick=menu;actions.append(menuBtn);panel.append(actions);panel.style.display='flex';}
function intro(){screen='intro';showPanel(`Đêm ${night} — ${['Đảo Bến','Cầu Tre','Tháp Chuông'][night-1]}`,[['Ông Đăng: Giữ đảo sáng tới bình minh. Bắt đầu!',()=>{startAudio();restart();}]]);}
function menu(){screen='menu';showPanel('ĐẢO ĐÈN LỒNG',[['Bắt đầu hành trình',()=>{night=1;wonScores=[null,null,null];scoreSubmitted=false;intro();}],['Bảng xếp hạng',()=>showLeaderboard(menu)],['Cài đặt',()=>showSettings(menu)]]);}
function showSettings(back){showPanel('Cài đặt',[['Quay lại',back]]);for(const [key,label,min,max,stepValue]of [['volume','Âm lượng',0,1,.05],['sensitivity','Độ nhạy chuột',.2,3,.1]]){const row=document.createElement('label');row.textContent=label;const range=document.createElement('input');range.type='range';range.min=min;range.max=max;range.step=stepValue;range.value=settings[key];range.oninput=()=>{settings[key]=Number(range.value);saveSettings();};row.append(range);panel.append(row);}
  const row=document.createElement('label');row.textContent='Bảng màu dễ phân biệt';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.id='colorblind-setting';checkbox.checked=settings.colorblind;checkbox.onchange=()=>{settings.colorblind=checkbox.checked;saveSettings();document.documentElement.dataset.colorblind=String(settings.colorblind);};row.append(checkbox);panel.append(row);
  for(const [key,label]of [['reducedMotion','Giảm chuyển động'],['largeText','Chữ lớn ×1.25']]){const row=document.createElement('label');row.textContent=label;const input=document.createElement('input');input.type='checkbox';input.id=key;input.checked=settings[key];input.onchange=()=>{settings[key]=input.checked;saveSettings();applyAccessibility();};row.append(input);panel.append(row);}
  const heading=document.createElement('h3');heading.textContent='Đổi phím';panel.append(heading);
  const error=document.createElement('p');error.id='binding-error';error.setAttribute('role','status');panel.append(error);
  for(const [action,label]of Object.entries(ACTION_LABELS)){const row=document.createElement('label');row.textContent=label;const button=document.createElement('button');button.dataset.action=action;button.textContent=settings.bindings[action];button.onclick=()=>{bindingToCapture={action,button,error};button.textContent='Nhấn phím mới…';};row.append(button);panel.append(row);}
  const reset=document.createElement('button');reset.textContent='Khôi phục mặc định';reset.id='reset-bindings';reset.onclick=()=>{settings.bindings={...DEFAULT_BINDINGS};bindingToCapture=null;saveSettings();showSettings(back);};panel.append(reset);
}
function pauseMenu(){showPanel('Tạm dừng',[['Tiếp tục',()=>togglePause()],['Chơi lại Đêm',restart],['Cài đặt',()=>showSettings(pauseMenu)],['Về menu',menu]]);}
function togglePause(){if(screen!=='playing')return;const input={...INITIAL_INPUT,pause:true};step(game,input,INITIAL_INPUT);previousInput={...INITIAL_INPUT};keyboard.clear();if(game.state==='paused')pauseMenu();else{panel.style.display='none';focusGame();}}
const keyboard = new KeyboardInput();
window.addEventListener('keydown', event => {
  const code=physicalKey(event);
  if(bindingToCapture){event.preventDefault();event.stopPropagation();if(!code)return;const {action,button,error}=bindingToCapture;try{settings.bindings=rebind(settings.bindings,action,code);saveSettings();button.textContent=code;error.textContent='Đã lưu phím';bindingToCapture=null;}catch(e){error.textContent=e.message;}return;}
  if(!code||screen!=='playing')return;
  if(event.target instanceof HTMLInputElement)return;
  const accepted=new Set([...Object.values(settings.bindings),'ArrowLeft','ArrowRight','KeyR','KeyF','KeyP','ShiftRight']);if(!accepted.has(code))return;
  event.preventDefault();
  if(actionDown(new Set([code]),settings.bindings,'pause')){if(!event.repeat)togglePause();return;}
  if(code==='KeyR'&&!Object.values(settings.bindings).includes(code)){if(!event.repeat)restart();return;}
  if(game.state==='playing')keyboard.press(code);
},true);
window.addEventListener('keyup', event => {const code=physicalKey(event);if(code)keyboard.release(code);},true);
window.addEventListener('blur', () => keyboard.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden)keyboard.clear();});
canvas.addEventListener('pointerdown',focusGame);
canvas.addEventListener('mousemove',event=>{if(event.buttons===1&&screen==='playing'&&game.state==='playing')cameraYaw-=event.movementX*.15*settings.sensitivity;});
function restart() {
  game = createGame(42,previewScenario,night);
  screen='playing';panel.style.display='none';keyboard.clear();focusGame();
  previousInput = { ...INITIAL_INPUT };
  pulseFlash = 0;
  scoreSubmitted = false;
  recentSpawn=null;
  document.querySelector('#message').style.display = 'none';
}
function currentInput() {
  const keys=keyboard.sample();
  if (keys.has('ArrowLeft')&&!Object.values(settings.bindings).includes('ArrowLeft')) cameraYaw += 1.5;
  if (keys.has('ArrowRight')&&!Object.values(settings.bindings).includes('ArrowRight')) cameraYaw -= 1.5;
  return {
    // The camera looks along +Z at yaw 0, so screen-right is world -X.
    move: [Number(actionDown(keys,settings.bindings,'left'))-Number(actionDown(keys,settings.bindings,'right')),Number(actionDown(keys,settings.bindings,'forward'))-Number(actionDown(keys,settings.bindings,'backward'))],
    cam_yaw_deg: cameraYaw,
    jump:actionDown(keys,settings.bindings,'jump'),interact:actionDown(keys,settings.bindings,'interact'),pulse:actionDown(keys,settings.bindings,'pulse'),dash:actionDown(keys,settings.bindings,'dash'),
  };
}
function updateHud() {
  applyAccessibility();updateCues();
  document.documentElement.dataset.colorblind=String(settings.colorblind);
  document.querySelector('#hud h1').textContent=`ĐẢO ĐÈN LỒNG · ĐÊM ${night}`;
  document.querySelector('#flames').textContent = game.player.flames;
  document.querySelector('#carried').textContent = game.player.carried;
  document.querySelector('#lit').parentElement.innerHTML=`Đèn đang sáng: <strong id="lit">${game.lanterns.filter(item => item.lit).length}</strong> / ${game.lanterns.length} · Cần ${Math.ceil(TUNING.win_ratio*game.lanterns.length)} lúc bình minh`;
  const seconds=Math.ceil(game.timeLeft);
  document.querySelector('#time').textContent = `${settings.colorblind&&seconds<=30?'⚠ ':''}${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  document.querySelector('#time').classList.toggle('urgent',seconds<=30);
  document.querySelector('#score').textContent = game.score;
  const nearby = receivingLanterns(game)[0];
  const hint = document.querySelector('#hint');
  if (nearby) {
    hint.textContent = nearby.lit
      ? `E — Châm dầu ${nearby.id} (${fuelValue(nearby).toFixed(1)}/100) · Mỗi đom đóm +10 dầu`
      : `E — ${nearby.ever_lit?'Thắp lại':'Nạp ánh sáng'} ${nearby.id} (${nearby.deposited}/${lightCost(nearby)}) · Đang mang ${game.player.carried}`;
  } else {
    hint.textContent = 'WASD · Space nhảy · Shift lướt · E nạp · Q tỏa sáng · Kéo chuột xoay camera · Esc tạm dừng';
  }
  const limit=capacity(game.player);
  document.querySelector('#cells').textContent=`${game.player.carried} / ${limit} `+'●'.repeat(Math.min(game.player.carried,limit))+'○'.repeat(Math.max(0,limit-game.player.carried));
  document.querySelector('#cells').style.fontSize=limit>14?'17px':'23px';
  const status=document.querySelector('#fuel-status');status.replaceChildren();
  for(const l of game.lanterns){const row=document.createElement('div');const low=l.lit&&l.fuelUnits<TUNING.low_fuel_threshold*60;row.classList.toggle('low-fuel',low);row.textContent=`${settings.colorblind&&low?'⚠ ':''}${l.id}: ${l.lit?`${fuelValue(l).toFixed(1)} dầu`:l.ever_lit?'Tắt — thắp lại 5':'Chưa thắp — cần 10'}`;status.append(row);}
  document.querySelector('#cooldowns').textContent=`Lướt: ${(game.player.dashCooldownTicks/60).toFixed(1)}s · Tỏa sáng: ${(game.player.pulseCooldownTicks/60).toFixed(1)}s · Bùa: ${Math.ceil(game.player.charmTicks/60)}s`;
  const needingCare=game.lanterns.filter(l=>!l.lit||l.fuelUnits<TUNING.low_fuel_threshold*60);
  const nearest=needingCare.sort((a,b)=>Math.hypot(a.pos[0]-game.player.pos[0],a.pos[2]-game.player.pos[2])-Math.hypot(b.pos[0]-game.player.pos[0],b.pos[2]-game.player.pos[2]))[0];
  document.querySelector('#direction').textContent=nearest?`➤ ${nearest.id} · ${Math.round(Math.hypot(nearest.pos[0]-game.player.pos[0],nearest.pos[2]-game.player.pos[2]))} m`:'';
  if(nearest){const a=Math.atan2(nearest.pos[0]-game.player.pos[0],nearest.pos[2]-game.player.pos[2])-cameraYaw*Math.PI/180;document.querySelector('#direction').style.transform=`rotate(${-a}rad)`;}
  if(nearest&&viewProjection){const [x,y,z]=nearest.pos;const m=viewProjection;const w=m[3]*x+m[7]*y+m[11]*z+m[15];const sx=(m[0]*x+m[4]*y+m[8]*z+m[12])/w,sy=(m[1]*x+m[5]*y+m[9]*z+m[13])/w;document.querySelector('#direction').style.visibility=w<=0||Math.abs(sx)>1||Math.abs(sy)>1?'visible':'hidden';}
  if (game.state !== 'playing') {
    if(game.state==='paused')return;
    screen='result';sound(game.state);
    if(game.state==='won'){
      wonScores[night-1]=game.score;
      if(night===3)showFinalResultScreen(true);
      else showPanel(`Thắng Đêm ${night} · ${game.score} điểm`,[['Đêm tiếp theo',()=>{night++;intro();}],['Về menu',menu]]);
    } else {
      showFinalResultScreen(false);
    }
  }
}
function render(time) {
  const width = Math.max(1, Math.floor(canvas.clientWidth * Math.min(devicePixelRatio, 2)));
  const height = Math.max(1, Math.floor(canvas.clientHeight * Math.min(devicePixelRatio, 2)));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  gl.viewport(0, 0, width, height);
  gl.clearColor(...color('sky'));
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const yaw = cameraYaw * Math.PI / 180;
  const p = game.player.pos;
  const orbit=(time-benchmarkState.firstFrameTime)/15000*Math.PI*2;
  const eye = benchmarkMode?[30*Math.cos(orbit),15,30*Math.sin(orbit)]:[p[0] - Math.sin(yaw) * 15, p[1] + 12, p[2] - Math.cos(yaw) * 15];
  const target = benchmarkMode?[0,0,0]:[p[0], p[1] + 0.7, p[2]];
  viewProjection = multiply(perspective(width / height), lookAt(eye, target));

  const litFraction = game.lanterns.filter(lantern => lantern.lit).length / TUNING.lantern_count_night1;
  draw(disk,[35,-1,0],[140,1,140],color('sea'),0,true);
  for(const island of game.map.islands){draw(disk,[island.center[0],-.08,island.center[2]],[island.radius,1,island.radius],color('sand'));draw(disk,[island.center[0],-.06,island.center[2]],[island.radius-.8,1,island.radius-.8],color('grass'));}
  for(const bridge of game.map.bridges){draw(cube,[(bridge.minX+bridge.maxX)/2,-.1,0],[bridge.maxX-bridge.minX,.2,4],color('wood'));}
  for(const platform of game.map.platforms){
    // An annulus is triangulated rather than drawn as a filled disk.
    const vertices=[];const start=platform.positiveZ?0:0,end=platform.positiveZ?Math.PI:Math.PI*2;
    for(let i=0;i<48;i++){const a=start+(end-start)*i/48,b=start+(end-start)*(i+1)/48;const r=platform.innerRadius,R=platform.outerRadius;vertices.push(r*Math.cos(a),0,r*Math.sin(a),R*Math.cos(a),0,R*Math.sin(a),R*Math.cos(b),0,R*Math.sin(b),r*Math.cos(a),0,r*Math.sin(a),R*Math.cos(b),0,R*Math.sin(b),r*Math.cos(b),0,r*Math.sin(b));}
    if(!platform.mesh)platform.mesh=makeMesh(vertices);
    draw(platform.mesh,[0,platform.y,0],[1,1,1],color('grass',p[1]<platform.y?.2:1));
  }
  for(const ramp of game.map.ramps){if(!ramp.mesh){const a=ramp.angle*Math.PI/180;const point=(r,w,y)=>[Math.cos(a)*r-Math.sin(a)*w,y,Math.sin(a)*r+Math.cos(a)*w];const A=point(30,-1.5,0),B=point(30,1.5,0),C=point(24,-1.5,3),D=point(24,1.5,3);ramp.mesh=makeMesh([...A,...B,...C,...B,...D,...C]);}draw(ramp.mesh,[0,.01,0],[1,1,1],[.65,.5,.3,1]);}
  for(const obstacle of game.map.obstacles){if(!obstacle.mesh){const vertices=[];for(let i=0;i<24;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12;vertices.push(Math.cos(a),0,Math.sin(a),Math.cos(b),0,Math.sin(b),Math.cos(a),1,Math.sin(a),Math.cos(b),0,Math.sin(b),Math.cos(b),1,Math.sin(b),Math.cos(a),1,Math.sin(a));}obstacle.mesh=makeMesh(vertices);}draw(obstacle.mesh,obstacle.pos,[obstacle.radius,obstacle.height,obstacle.radius],color('wood',p[1]<obstacle.pos[1]?.15:1));}
  for(const pad of game.map.pads)draw(disk,[pad.pos[0],pad.pos[1]+.03,pad.pos[2]],[1,1,1],[.3,.9,.75,1],0,true);
  gl.depthMask(false);
  for (const lantern of game.lanterns) {
    if (lantern.lit && lantern.fuelUnits>=TUNING.low_fuel_threshold*60) {
      draw(disk, [lantern.pos[0], lantern.pos[1]+0.01, lantern.pos[2]], [TUNING.safe_radius, 1, TUNING.safe_radius], [1, .66, .2, .45]);
      draw(disk, [lantern.pos[0], lantern.pos[1]+0.02, lantern.pos[2]], [1.5, 1, 1.5], [1, .78, .3, .4]);
    }
  }
  if (pulseFlash > 0&&!settings.reducedMotion) draw(disk, [p[0], p[1]+0.03, p[2]], [TUNING.pulse_radius, 1, TUNING.pulse_radius], [1, .8, .3, .15 * pulseFlash / 20]);
  gl.depthMask(true);

  for (const lantern of game.lanterns) {
    const [x, y, z] = lantern.pos;
    const weak=lantern.lit&&lantern.fuelUnits<TUNING.low_fuel_threshold*60;
    const blinkOn=!weak||Math.floor(game.simTick/30)%2===0;
    const accent=settings.colorblind?[1,1,1,1]:color('danger');
    draw(cube, [x, y + 1, z], [.22, 2, .22], color('wood'));
    draw(cube, [x, y + 2.15, z], [1, lantern.lit?.85:.68, 1], color(lantern.lit&&blinkOn?'lamp':'lampOff'),0,lantern.lit&&blinkOn);
    if(lantern.lit&&blinkOn)draw(cube,[x,y+2.15,z],[.7,.9,1.01],color('lampCore'),0,true);
    if(!lantern.lit)draw(paperTear,[x,y+2.15,z-.51],[1,.8,1],color('shade'),0,true);
    draw(cone, [x, y + (lantern.lit?2.58:2.495), z], [.75, .5, .75], [.56, .23, .27, 1]);
    if(lantern.lit){
      const ratio=lantern.fuelUnits/(TUNING.fuel_max*60),barRotation=cameraYaw*Math.PI/180;
      draw(cube,[x,y+3.3,z],[1.6,.15,.08],color('lampOff'),barRotation,true);
      if(blinkOn)draw(cube,[x,y+3.3,z-.05],[1.6*ratio,.13,.1],weak?accent:color('gold'),barRotation,true);
    }
    // Show partial deposits so a successful transfer is not mistaken for a lit lamp.
    if (!lantern.lit) {
      for (let i = 0; i < lightCost(lantern); i++) {
        draw(cube, [x + (i - (lightCost(lantern)-1)/2) * .2, y + 3.3, z], [.14, .14, .14], color(i < lantern.deposited?'gold':'lampOff'),0,true);
      }
    }
  }
  for (const mote of game.motes) {
    draw(cube, [mote.pos[0], mote.pos[1]+.45 + Math.sin(time * .003 + mote.pos[0]) * .15, mote.pos[2]], [.3, .3, .3], color('mote'), time * .001,true);
  }
  for(const c of game.charms)if(c.available){draw(cube,[c.pos[0],c.pos[1]+.7,c.pos[2]],[.6,.9,.15],color('gold'),time*.001,true);draw(cube,[c.pos[0],c.pos[1]+.7,c.pos[2]],[.5,.8,.17],color('red'),time*.001,true);}
  for(const d of game.drifters)draw(cube,[d.pos[0],d.pos[1]+.7,d.pos[2]],[1.5,.18,.4],color('drifter'),time*.002,true);
  if(game.night===3&&(game.wind.active||game.simTick%1800>=1680)){for(let i=0;i<12;i++){const a=time*.001+i;draw(cube,[p[0]+Math.sin(a)*5,p[1]+1+i*.15,p[2]+Math.cos(a)*5],[.25,.03,.1],[.8,.7,.3,1],a,true);}}
  for (const shade of game.shades) {
    const [x, y, z] = shade.pos;
    const shadeAccent=settings.colorblind?[0,179/255,1,1]:color('shadeEdge');
    draw(cone, [x, y, z], [1.15, 1.6, 1.15], shadeAccent,0,true);
    draw(cone, [x, y+.03, z], [1.1, 1.55, 1.1], color(shade.state==='stunned'?'stunned':'shade'),0,true);
    draw(cube, [x - .23, y + .85, z + .46], [.12, .12, .08], shadeAccent,0,true);
    draw(cube, [x + .23, y + .85, z + .46], [.12, .12, .08], shadeAccent,0,true);
  }
  draw(cone, [p[0], p[1], p[2]], [.62, 1.45, .62], color('coat'),0,true);
  draw(cube,[p[0],p[1]+1,p[2]],[.65,.15,.65],color('red'),0,true);
  draw(disk, [p[0], p[1] + 1.45, p[2]], [.82, 1, .82], color('sand'),0,true);
  draw(cone, [p[0], p[1] + 1.45, p[2]], [.7, .55, .7], color('sand'),0,true);
  draw(cube, [p[0] + .56, p[1] + .9, p[2]], [.23, .35, .23], color('lamp'),0,true);
  flush();
}

let lastTime = 0, accumulator = 0;
let nextHudAt=0;
function frame(now) {
  if(benchmarkMode&&!benchmarkState.first_frame_epoch){benchmarkState.first_frame_epoch=Date.now();benchmarkState.firstFrameTime=now;}
  if (!lastTime) lastTime = now;
  accumulator = Math.min(.25, accumulator + (now - lastTime) / 1000);
  lastTime = now;
  fpsFrames++;if(now-fpsTime>=1000){averageFps=fpsFrames*1000/(now-fpsTime);fpsFrames=0;fpsTime=now;canvas.dataset.fps=averageFps.toFixed(1);}
  while (accumulator >= 1 / 60) {
    if(benchmarkMode){if(!benchmarkState.done)stepBenchmark(game);}
    else if (screen==='playing'&&game.state === 'playing') {
      const input = currentInput();
      if(input.jump&&!previousInput.jump&&game.player.grounded)sound('jump');
      const events = step(game, input, previousInput);
      for(const event of events)if(event.name==='shade_spawned')recentSpawn={id:event.data.id,until:game.simTick+300};
      for(const event of events)sound(event.name);
      const sec=Math.ceil(game.timeLeft);if(sec<=10&&Math.ceil(game.timeLeft+1/60)!==sec)sound('countdown');
      if(night===3&&game.simTick%1800===1680)sound('wind');
      if (events.some(event => event.name === 'pulse')) pulseFlash = 20;
      previousInput = input;
    }
    else if(screen==='playing'&&game.state==='paused')step(game,INITIAL_INPUT,INITIAL_INPUT);
    pulseFlash = Math.max(0, pulseFlash - 1);
    accumulator -= 1 / 60;
  }
  // Keep DOM work out of the fixed-step loop to reduce long input frames.
  if(screen==='playing'&&(now>=nextHudAt||['won','lost'].includes(game.state))){updateHud();nextHudAt=now+100;}
  render(now);
  if(benchmarkMode&&!benchmarkState.done){
    if(now-benchmarkState.firstFrameTime>=3000){
      if(!benchmarkState.measureStart){benchmarkState.measureStart=now;benchmarkState.last=now;}
      else if(now-benchmarkState.measureStart<=benchmarkDuration*1000){benchmarkState.times.push(now-benchmarkState.last);benchmarkState.last=now;}
      else{benchmarkState.metrics=frameMetrics(benchmarkState.times);benchmarkState.done=true;}
    }
  }
  requestAnimationFrame(frame);
}
updateHud();
applyAccessibility();
menu();
if(benchmarkMode){screen='benchmark';panel.style.display='none';settings.reducedMotion=false;settings.largeText=false;settings.colorblind=false;}
const previewNight=Number(new URLSearchParams(location.search).get('night'));
if([1,2,3].includes(previewNight)){night=previewNight;intro();}
requestAnimationFrame(frame);

// Read-only observation for browser integration checks.
export function inspectGame(){return {...snapshot(game),screen,averageFps,journey:{scores:[...wonScores],nights_won:wonScores.filter(s=>typeof s==='number').length,score:wonScores.reduce((sum,s)=>sum+(s??0),0)}};}
export function inspectBenchmark(){return{done:benchmarkState.done,metrics:benchmarkState.metrics,frame_times_ms:benchmarkState.done?benchmarkState.times:undefined,first_frame_epoch:benchmarkState.first_frame_epoch,scene:{night:game.night,shades:game.shades.length,motes:game.motes.length,states:[...new Set(game.shades.map(s=>s.state))],player:game.player.pos,lanterns:game.lanterns.map(l=>({id:l.id,lit:l.lit,fuel:fuelValue(l)})),camera:{radius:30,height:15,initial:[30,15,0],seconds_per_orbit:15},frozen:['spawn','damage','pickup','fuel','game_over'],creative_extras:false}};}
