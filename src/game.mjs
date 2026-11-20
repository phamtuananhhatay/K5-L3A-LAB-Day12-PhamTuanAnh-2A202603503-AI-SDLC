import { createGame, INITIAL_INPUT, step, snapshot, TUNING } from './core.mjs';
import { settings, saveSettings, startAudio, sound } from './audio.mjs';
import { HEX, color } from './colors.mjs';

const canvas = document.querySelector('#scene');
const errorBox = document.querySelector('#error');
const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
document.documentElement.style.color=HEX.text;
const paletteStyle=document.createElement('style');paletteStyle.textContent=`html,body{background:${HEX.sky};color:${HEX.text}}#hud{color:${HEX.text}}#hud strong,#hud h1,#direction{color:${HEX.gold}}#time.urgent{color:${HEX.danger}}#flow{color:${HEX.text}}#flow button{background:${HEX.gold}}`;document.head.append(paletteStyle);
paletteStyle.textContent+=`#hud{background:none;border:0;box-shadow:none;backdrop-filter:none;position:static;padding:0}#hud h1{position:fixed;left:50%;top:58px;transform:translateX(-50%);font-size:14px}#hud>div{position:fixed;padding:10px 15px;background:#0e1430d9;border-radius:8px}#hud>div:nth-of-type(1){left:18px;top:18px}#hud>div:nth-of-type(2){display:none}#hud>div:nth-of-type(3){right:18px;top:18px}#hud>div:nth-of-type(4){left:50%;top:18px;transform:translateX(-50%)}#hud>div:nth-of-type(5){right:18px;top:62px}#direction{top:112px!important}`;
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
let opaqueVertices=[],transparentVertices=[];
const frameBuffer=gl.createBuffer();
function draw(mesh, pos, scale, rgba, rotation = 0, emissive = false) {
  const progress = game.lanterns.filter(l=>l.lit).length / game.lanterns.length;
  const ambient=emissive?1:.15+.55*progress,c=Math.cos(rotation),s=Math.sin(rotation);
  const dest=rgba[3]<1?transparentVertices:opaqueVertices;
  for(let i=0;i<mesh.vertices.length;i+=3){const x=mesh.vertices[i]*scale[0],y=mesh.vertices[i+1]*scale[1],z=mesh.vertices[i+2]*scale[2];dest.push(pos[0]+c*x+s*z,pos[1]+y,pos[2]-s*x+c*z,rgba[0]*ambient,rgba[1]*ambient,rgba[2]*ambient,rgba[3]);}
}
function flush(){
  gl.bindBuffer(gl.ARRAY_BUFFER,frameBuffer);gl.enableVertexAttribArray(positionLocation);gl.enableVertexAttribArray(vertexColorLocation);gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,28,0);gl.vertexAttribPointer(vertexColorLocation,4,gl.FLOAT,false,28,12);gl.uniformMatrix4fv(mvpLocation,false,viewProjection);
  for(const [vertices,depth]of [[opaqueVertices,true],[transparentVertices,false]]){gl.depthMask(depth);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/7);}gl.depthMask(true);opaqueVertices=[];transparentVertices=[];
}

let game = createGame(42);
let previousInput = { ...INITIAL_INPUT };
let cameraYaw = 0;
let pulseFlash = 0;
let screen = 'menu', totalScore = 0, night = 1;
let fpsFrames=0, fpsTime=0, averageFps=0;
const panel=document.createElement('section');panel.id='flow';document.body.append(panel);
const style=document.createElement('style');style.textContent=`#flow{position:fixed;inset:0;background:#10162be8;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;color:#ffe2a3}#flow button{font:inherit;padding:12px 28px;background:#f6c56c;border:0;border-radius:8px;cursor:pointer}#flow h2{font-size:36px}#flow label{display:flex;gap:20px}#cells{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);font-size:23px;letter-spacing:4px}#cooldowns{position:fixed;bottom:65px;right:20px;padding:10px;background:#12162bcc}#direction{position:fixed;top:16px;right:20px;color:#ffdb77}#time.urgent{color:#ff6565;animation:blink .6s infinite alternate}@keyframes blink{to{opacity:.25}}`;document.head.append(style);
for(const id of ['cells','cooldowns','direction']){const el=document.createElement('div');el.id=id;document.body.append(el);}
function showPanel(title,buttons){panel.replaceChildren();const h=document.createElement('h2');h.textContent=title;panel.append(h);for(const [label,action]of buttons){const b=document.createElement('button');b.textContent=label;b.onclick=action;panel.append(b);}panel.style.display='flex';}
function intro(){screen='intro';showPanel(`Đêm ${night} — ${['Đảo Bến','Cầu Tre','Tháp Chuông'][night-1]}`,[['Ông Đăng: Mang ánh sáng về từng chiếc đèn. Bắt đầu!',()=>{startAudio();restart();}]]);}
function menu(){screen='menu';showPanel('ĐẢO ĐÈN LỒNG',[['Bắt đầu hành trình',()=>{night=1;totalScore=0;intro();}],['Cài đặt',()=>showSettings(menu)]]);}
function showSettings(back){showPanel('Cài đặt',[['Quay lại',back]]);for(const [key,label,min,max,stepValue]of [['volume','Âm lượng',0,1,.05],['sensitivity','Độ nhạy chuột',.2,3,.1]]){const row=document.createElement('label');row.textContent=label;const range=document.createElement('input');range.type='range';range.min=min;range.max=max;range.step=stepValue;range.value=settings[key];range.oninput=()=>{settings[key]=Number(range.value);saveSettings();};row.append(range);panel.append(row);}}
function pauseMenu(){showPanel('Tạm dừng',[['Tiếp tục',()=>togglePause()],['Chơi lại Đêm',restart],['Cài đặt',()=>showSettings(pauseMenu)],['Về menu',menu]]);}
function togglePause(){if(screen!=='playing')return;const input={...INITIAL_INPUT,pause:true};step(game,input,INITIAL_INPUT);previousInput={...INITIAL_INPUT};if(game.state==='paused')pauseMenu();else panel.style.display='none';}
const keys = new Set();
const handled = new Set(['Space', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyE', 'KeyQ', 'KeyR', 'ShiftLeft','ShiftRight','Escape','KeyP']);
window.addEventListener('keydown', event => {
  if (handled.has(event.code)) event.preventDefault();
  keys.add(event.code);
  if(['Escape','KeyP'].includes(event.code)&&!event.repeat)togglePause();
  if (event.code === 'KeyR' && !event.repeat) restart();
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
canvas.addEventListener('mousemove',event=>{if(event.buttons===1&&screen==='playing'&&game.state==='playing')cameraYaw-=event.movementX*.15*settings.sensitivity;});
function restart() {
  game = createGame(42,{},night);
  screen='playing';panel.style.display='none';keys.clear();
  previousInput = { ...INITIAL_INPUT };
  pulseFlash = 0;
  document.querySelector('#message').style.display = 'none';
}
function currentInput() {
  if (keys.has('ArrowLeft')) cameraYaw += 1.5;
  if (keys.has('ArrowRight')) cameraYaw -= 1.5;
  return {
    // The camera looks along +Z at yaw 0, so screen-right is world -X.
    move: [Number(keys.has('KeyA')) - Number(keys.has('KeyD')), Number(keys.has('KeyW')) - Number(keys.has('KeyS'))],
    cam_yaw_deg: cameraYaw,
    jump: keys.has('Space'), interact: keys.has('KeyE')||keys.has('KeyF'), pulse: keys.has('KeyQ'), dash:keys.has('ShiftLeft')||keys.has('ShiftRight'),
  };
}
function updateHud() {
  document.querySelector('#hud h1').textContent=`ĐẢO ĐÈN LỒNG · ĐÊM ${night}`;
  document.querySelector('#flames').textContent = game.player.flames;
  document.querySelector('#carried').textContent = game.player.carried;
  document.querySelector('#lit').parentElement.innerHTML=`Đèn đã thắp: <strong id="lit">${game.lanterns.filter(item => item.lit).length}</strong> / ${game.lanterns.length}`;
  const seconds=Math.ceil(game.timeLeft);
  document.querySelector('#time').textContent = `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  document.querySelector('#time').classList.toggle('urgent',seconds<=30);
  document.querySelector('#score').textContent = game.score;
  const nearby = game.lanterns.find(lantern => Math.hypot(lantern.pos[0] - game.player.pos[0], lantern.pos[2] - game.player.pos[2]) <= TUNING.interact_radius);
  const hint = document.querySelector('#hint');
  if (nearby) {
    hint.textContent = nearby.lit
      ? `${nearby.id} đã sáng vĩnh viễn trong lượt chơi · Vùng sáng bảo vệ Mây · R chơi lại`
      : `E — Nạp ánh sáng (${nearby.deposited}/10) · Đang mang ${game.player.carried}`;
  } else {
    hint.textContent = 'WASD · Space nhảy · Shift lướt · E nạp · Q tỏa sáng · Kéo chuột xoay camera · Esc tạm dừng';
  }
  document.querySelector('#cells').textContent='●'.repeat(game.player.carried)+'○'.repeat(10-game.player.carried);
  document.querySelector('#cooldowns').textContent=`Lướt: ${(game.player.dashCooldownTicks/60).toFixed(1)}s · Tỏa sáng: ${(game.player.pulseCooldownTicks/60).toFixed(1)}s · Bùa: ${Math.ceil(game.player.charmTicks/60)}s`;
  const nearest=game.lanterns.filter(l=>!l.lit).sort((a,b)=>Math.hypot(a.pos[0]-game.player.pos[0],a.pos[2]-game.player.pos[2])-Math.hypot(b.pos[0]-game.player.pos[0],b.pos[2]-game.player.pos[2]))[0];
  document.querySelector('#direction').textContent=nearest?`➤ ${nearest.id} · ${Math.round(Math.hypot(nearest.pos[0]-game.player.pos[0],nearest.pos[2]-game.player.pos[2]))} m`:'';
  if(nearest){const a=Math.atan2(nearest.pos[0]-game.player.pos[0],nearest.pos[2]-game.player.pos[2])-cameraYaw*Math.PI/180;document.querySelector('#direction').style.transform=`rotate(${-a}rad)`;}
  if(nearest&&viewProjection){const [x,y,z]=nearest.pos;const m=viewProjection;const w=m[3]*x+m[7]*y+m[11]*z+m[15];const sx=(m[0]*x+m[4]*y+m[8]*z+m[12])/w,sy=(m[1]*x+m[5]*y+m[9]*z+m[13])/w;document.querySelector('#direction').style.visibility=w<=0||Math.abs(sx)>1||Math.abs(sy)>1?'visible':'hidden';}
  if (game.state !== 'playing') {
    if(game.state==='paused')return;
    screen='result';sound(game.state);
    if(game.state==='won'){totalScore+=game.score;if(night===3)showPanel(`BÌNH MINH — Tổng điểm ${totalScore}`,[['Về menu',menu]]);else showPanel(`Thắng Đêm ${night} · ${game.score} điểm`,[['Đêm tiếp theo',()=>{night++;intro();}]]);}
    else showPanel(`Thua Đêm ${night}`,[['Chơi lại Đêm',restart],['Về menu',menu]]);
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
  const eye = [p[0] - Math.sin(yaw) * 15, p[1] + 12, p[2] - Math.cos(yaw) * 15];
  const target = [p[0], p[1] + 0.7, p[2]];
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
    if (lantern.lit) {
      draw(disk, [lantern.pos[0], 0.01, lantern.pos[2]], [TUNING.safe_radius, 1, TUNING.safe_radius], [1, .66, .2, .45]);
      draw(disk, [lantern.pos[0], 0.02, lantern.pos[2]], [1.5, 1, 1.5], [1, .78, .3, .4]);
    }
  }
  if (pulseFlash > 0) draw(disk, [p[0], 0.03, p[2]], [TUNING.pulse_radius, 1, TUNING.pulse_radius], [1, .8, .3, .15 * pulseFlash / 20]);
  gl.depthMask(true);

  for (const lantern of game.lanterns) {
    const [x, y, z] = lantern.pos;
    draw(cube, [x, y + 1, z], [.22, 2, .22], color('wood'));
    draw(cube, [x, y + 2.15, z], [1, .85, 1], color(lantern.lit?'lamp':'lampOff'),0,lantern.lit);
    if(lantern.lit)draw(cube,[x,y+2.15,z],[.7,.9,1.01],color('lampCore'),0,true);
    draw(cone, [x, y + 2.58, z], [.75, .5, .75], [.56, .23, .27, 1]);
    // Show partial deposits so a successful transfer is not mistaken for a lit lamp.
    if (!lantern.lit) {
      for (let i = 0; i < TUNING.lantern_cost; i++) {
        draw(cube, [x + (i - 4.5) * .2, y + 3.3, z], [.14, .14, .14], color(i < lantern.deposited?'gold':'lampOff'),0,true);
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
    draw(cone, [x, y, z], [1.15, 1.6, 1.15], color('shadeEdge'));
    draw(cone, [x, y+.03, z], [1.1, 1.55, 1.1], color(shade.state==='stunned'?'stunned':'shade'),0,true);
    draw(cube, [x - .23, y + .85, z + .46], [.12, .12, .08], [1, .32, .62, 1]);
    draw(cube, [x + .23, y + .85, z + .46], [.12, .12, .08], [1, .32, .62, 1]);
  }
  draw(cone, [p[0], p[1], p[2]], [.62, 1.45, .62], color('coat'),0,true);
  draw(cube,[p[0],p[1]+1,p[2]],[.65,.15,.65],color('red'),0,true);
  draw(disk, [p[0], p[1] + 1.45, p[2]], [.82, 1, .82], color('sand'),0,true);
  draw(cone, [p[0], p[1] + 1.45, p[2]], [.7, .55, .7], color('sand'),0,true);
  draw(cube, [p[0] + .56, p[1] + .9, p[2]], [.23, .35, .23], color('lamp'),0,true);
  flush();
}

let lastTime = 0, accumulator = 0;
function frame(now) {
  if (!lastTime) lastTime = now;
  accumulator = Math.min(.25, accumulator + (now - lastTime) / 1000);
  lastTime = now;
  fpsFrames++;if(now-fpsTime>=1000){averageFps=fpsFrames*1000/(now-fpsTime);fpsFrames=0;fpsTime=now;canvas.dataset.fps=averageFps.toFixed(1);}
  while (accumulator >= 1 / 60) {
    if (screen==='playing'&&game.state === 'playing') {
      const input = currentInput();
      if(input.jump&&!previousInput.jump&&game.player.grounded)sound('jump');
      const events = step(game, input, previousInput);
      for(const event of events)sound(event.name);
      const sec=Math.ceil(game.timeLeft);if(sec<=10&&Math.ceil(game.timeLeft+1/60)!==sec)sound('countdown');
      if(night===3&&game.simTick%1800===1680)sound('wind');
      if (events.some(event => event.name === 'pulse')) pulseFlash = 20;
      previousInput = input;
      updateHud();
    }
    else if(screen==='playing'&&game.state==='paused')step(game,INITIAL_INPUT,INITIAL_INPUT);
    pulseFlash = Math.max(0, pulseFlash - 1);
    accumulator -= 1 / 60;
  }
  render(now);
  requestAnimationFrame(frame);
}
updateHud();
menu();
const previewNight=Number(new URLSearchParams(location.search).get('night'));
if([1,2,3].includes(previewNight)){night=previewNight;intro();}
requestAnimationFrame(frame);

// Read-only observation for browser integration checks.
export function inspectGame(){return {...snapshot(game),screen,averageFps};}
