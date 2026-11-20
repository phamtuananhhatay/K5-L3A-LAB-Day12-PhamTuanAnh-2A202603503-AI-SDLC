import { createGame, INITIAL_INPUT, step, TUNING } from './core.mjs';

const canvas = document.querySelector('#scene');
const errorBox = document.querySelector('#error');
const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
if (!gl) {
  errorBox.style.display = 'block';
  errorBox.textContent = 'Trình duyệt cần WebGL2 để chơi game.';
  throw new Error('WebGL2 unavailable');
}

const vertexSource = `#version 300 es
in vec3 position;
uniform mat4 mvp;
void main() { gl_Position = mvp * vec4(position, 1.0); }`;
const fragmentSource = `#version 300 es
precision mediump float;
uniform vec4 color;
out vec4 pixel;
void main() { pixel = color; }`;
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
const mvpLocation = gl.getUniformLocation(program, 'mvp');
const colorLocation = gl.getUniformLocation(program, 'color');
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

function makeMesh(vertices) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  return { buffer, count: vertices.length / 3 };
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
function draw(mesh, pos, scale, rgba, rotation = 0) {
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(mvpLocation, false, multiply(viewProjection, model(pos, scale, rotation)));
  gl.uniform4fv(colorLocation, rgba);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
}

let game = createGame(42);
let previousInput = { ...INITIAL_INPUT };
let cameraYaw = 0;
let pulseFlash = 0;
const keys = new Set();
const handled = new Set(['Space', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyQ', 'KeyR']);
window.addEventListener('keydown', event => {
  if (handled.has(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === 'KeyR' && !event.repeat) restart();
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
function restart() {
  game = createGame(42);
  previousInput = { ...INITIAL_INPUT };
  pulseFlash = 0;
  document.querySelector('#message').style.display = 'none';
}
function currentInput() {
  if (keys.has('ArrowLeft')) cameraYaw += 1.5;
  if (keys.has('ArrowRight')) cameraYaw -= 1.5;
  return {
    move: [Number(keys.has('KeyD')) - Number(keys.has('KeyA')), Number(keys.has('KeyW')) - Number(keys.has('KeyS'))],
    cam_yaw_deg: cameraYaw,
    jump: keys.has('Space'), interact: keys.has('KeyF'), pulse: keys.has('KeyQ'),
  };
}
function updateHud() {
  document.querySelector('#flames').textContent = game.player.flames;
  document.querySelector('#carried').textContent = game.player.carried;
  document.querySelector('#lit').textContent = game.lanterns.filter(item => item.lit).length;
  document.querySelector('#time').textContent = Math.ceil(game.timeLeft);
  document.querySelector('#score').textContent = game.score;
  if (game.state !== 'playing') {
    document.querySelector('#message').style.display = 'flex';
    document.querySelector('#result').textContent = game.state === 'won' ? 'ĐẢO ĐÃ SÁNG LẠI!' : 'ĐÊM NAY MÂY THẤT BẠI';
  }
}
function render(time) {
  const width = Math.max(1, Math.floor(canvas.clientWidth * Math.min(devicePixelRatio, 2)));
  const height = Math.max(1, Math.floor(canvas.clientHeight * Math.min(devicePixelRatio, 2)));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  gl.viewport(0, 0, width, height);
  gl.clearColor(.055, .07, .15, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const yaw = cameraYaw * Math.PI / 180;
  const p = game.player.pos;
  const eye = [p[0] - Math.sin(yaw) * 15, p[1] + 12, p[2] - Math.cos(yaw) * 15];
  const target = [p[0], p[1] + 0.7, p[2]];
  viewProjection = multiply(perspective(width / height), lookAt(eye, target));

  draw(disk, [0, -0.06, 0], [30, 1, 30], [.12, .23, .25, 1]);
  draw(disk, [0, -0.04, 0], [28.7, 1, 28.7], [.16, .28, .29, 1]);
  gl.depthMask(false);
  for (const lantern of game.lanterns) {
    if (lantern.lit) draw(disk, [lantern.pos[0], 0.01, lantern.pos[2]], [TUNING.safe_radius, 1, TUNING.safe_radius], [1, .66, .2, .2]);
  }
  if (pulseFlash > 0) draw(disk, [p[0], 0.03, p[2]], [TUNING.pulse_radius, 1, TUNING.pulse_radius], [1, .8, .3, .15 * pulseFlash / 20]);
  gl.depthMask(true);

  for (const lantern of game.lanterns) {
    const [x, y, z] = lantern.pos;
    draw(cube, [x, y + 1, z], [.22, 2, .22], [.43, .29, .32, 1]);
    draw(cube, [x, y + 2.15, z], [1, .85, 1], lantern.lit ? [1, .64, .18, 1] : [.29, .22, .41, 1]);
    draw(cone, [x, y + 2.58, z], [.75, .5, .75], [.56, .23, .27, 1]);
  }
  for (const mote of game.motes) {
    draw(cube, [mote.pos[0], .45 + Math.sin(time * .003 + mote.pos[0]) * .15, mote.pos[2]], [.3, .3, .3], [1, .88, .34, 1], time * .001);
  }
  for (const shade of game.shades) {
    const [x, y, z] = shade.pos;
    draw(cone, [x, y, z], [1.1, 1.55, 1.1], shade.state === 'stunned' ? [.38, .36, .77, 1] : [.15, .07, .24, 1]);
    draw(cube, [x - .23, y + .85, z + .46], [.12, .12, .08], [1, .32, .62, 1]);
    draw(cube, [x + .23, y + .85, z + .46], [.12, .12, .08], [1, .32, .62, 1]);
  }
  draw(cone, [p[0], p[1], p[2]], [.62, 1.45, .62], [.42, .7, .85, 1]);
  draw(disk, [p[0], p[1] + 1.45, p[2]], [.82, 1, .82], [.71, .5, .28, 1]);
  draw(cone, [p[0], p[1] + 1.45, p[2]], [.7, .55, .7], [.73, .53, .3, 1]);
  draw(cube, [p[0] + .56, p[1] + .9, p[2]], [.23, .35, .23], [1, .68, .2, 1]);
}

let lastTime = 0, accumulator = 0;
function frame(now) {
  if (!lastTime) lastTime = now;
  accumulator = Math.min(.25, accumulator + (now - lastTime) / 1000);
  lastTime = now;
  while (accumulator >= 1 / 60) {
    if (game.state === 'playing') {
      const input = currentInput();
      const events = step(game, input, previousInput);
      if (events.some(event => event.name === 'pulse')) pulseFlash = 20;
      previousInput = input;
      updateHud();
    }
    pulseFlash = Math.max(0, pulseFlash - 1);
    accumulator -= 1 / 60;
  }
  render(now);
  requestAnimationFrame(frame);
}
updateHud();
requestAnimationFrame(frame);
