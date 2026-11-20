import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cases = [
  ['pickup', 'pickup', null, 1],
  ['deposit', 'deposit', 'deposit', 1],
  ['pulse', 'pulse', 'pulse', 1],
  ['hit', 'hit', null, 1],
  ['win', 'win', 'deposit', 1],
  ['loss', 'loss', null, 1],
  ['dawn', 'dawn', null, 1],
  ['sequence', 'sequence', 'sequence', 16],
  ['boundary', 'boundary', null, 1],
];
function run(args) {
  return spawnSync(process.execPath, ['src/headless.mjs', '--seed', '42', '--night', '1', ...args], { encoding: 'utf8' });
}
for (const [name, scenario, inputs, ticks] of cases) {
  const args = ['--scenario', `tests/phase1/${scenario}.scenario.json`];
  if (inputs) args.push('--inputs', `tests/phase1/${inputs}.inputs.json`);
  args.push('--ticks', String(ticks), '--snapshot-every', '1', '--out', `docs/proof/${name}.jsonl`);
  const result = run(args);
  assert.equal(result.status, 0, `${name}: ${result.stderr}`);
  console.log(`Captured ${name}.jsonl`);
}

const invalidCases = [
  ['invalid.inputs.json', '--inputs', 'tests/phase1/invalid.inputs.json'],
  ['invalid.scenario.json', '--scenario', 'tests/phase1/invalid.scenario.json'],
];
const failures = [];
for (const [label, flag, path] of invalidCases) {
  const result = run([flag, path, '--ticks', '1', '--out', 'docs/proof/should-not-exist.jsonl']);
  assert.equal(result.status, 2, `${label} should exit 2`);
  failures.push(`${label}: exit_code=${result.status}\nstderr=${result.stderr.trim()}`);
}

const dir = await mkdtemp(join(tmpdir(), 'lantern-evidence-'));
const paths = [join(dir, 'a.jsonl'), join(dir, 'b.jsonl')];
try {
  for (const path of paths) {
    const result = run(['--ticks', '300', '--snapshot-every', '10', '--out', path]);
    assert.equal(result.status, 0, result.stderr);
  }
  const first = await readFile(paths[0]);
  const second = await readFile(paths[1]);
  assert.ok(first.equals(second), 'deterministic outputs differ');
  const hash = createHash('sha256').update(first).digest('hex');
  await writeFile('docs/proof/contract-check.txt', `${failures.join('\n\n')}\n\ndeterminism: byte_identical=true\nseed=42 ticks=300 snapshot_every=10\nsha256=${hash}\n`, 'utf8');
  console.log('Captured invalid-file results and deterministic SHA-256');
} finally {
  for (const path of paths) await unlink(path);
  await rmdir(dir);
}
