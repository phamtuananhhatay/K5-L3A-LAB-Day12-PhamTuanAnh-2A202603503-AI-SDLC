import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { TUNING } from '../src/core.mjs';

const contract = JSON.parse(await readFile(new URL('../game.contract.json', import.meta.url), 'utf8'));
if (JSON.stringify(contract.tuning) !== JSON.stringify(TUNING)) {
  throw new Error('game.contract.json tuning differs from the shared game logic');
}
for (const file of ['src/core.mjs', 'src/maps.mjs', 'src/audio.mjs', 'src/headless.mjs', 'src/game.mjs', 'scripts/serve.mjs']) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('PASS: source syntax and Test Contract tuning');
