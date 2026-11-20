import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 42000 + Math.floor(Math.random() * 10000);
const child = spawn(process.execPath, ['scripts/serve.mjs'], {
  env: { ...process.env, PORT: String(port) },
  stdio: 'pipe',
});

try {
  let response;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      response = await fetch(`http://127.0.0.1:${port}/`);
      break;
    } catch {
      await delay(100);
    }
  }
  if (!response?.ok) throw new Error('Local smoke page did not start');
  const html = await response.text();
  if (!html.includes('Đảo Đèn Lồng') || !html.includes('/src/game.mjs')) {
    throw new Error('Game page is missing the WebGL2 entry point');
  }
  const core = await fetch(`http://127.0.0.1:${port}/src/core.mjs`);
  if (!core.ok || !(await core.text()).includes('export function step')) {
    throw new Error('Server cannot load the shared game logic');
  }
  console.log('PASS: Node server returns the game page and shared game logic');
} finally {
  child.kill();
}
