import { spawn } from 'node:child_process';
import { mkdtemp, readFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const command = args[0] === '--' ? args.slice(1) : args;
if (command.length === 0 || command.includes('--out')) {
  console.error('Usage: node scripts/check-determinism.mjs -- <headless command and args without --out>');
  process.exit(2);
}

const dir = await mkdtemp(join(tmpdir(), 'lantern-determinism-'));
const paths = [join(dir, 'first.jsonl'), join(dir, 'second.jsonl')];
async function run(out) {
  const child = spawn(command[0], [...command.slice(1), '--out', out], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.stdout.resume();
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  if (code !== 0) throw new Error(`Headless exited ${code}: ${stderr}`);
  return readFile(out);
}

try {
  const first = await run(paths[0]);
  const second = await run(paths[1]);
  if (!first.equals(second)) throw new Error('FAIL: JSONL outputs differ');
  console.log(`PASS: identical JSONL output (${first.length} bytes)`);
} finally {
  for (const path of paths) {
    try { await unlink(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await rmdir(dir);
}
