import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGame, INITIAL_INPUT, step } from '../../src/core.mjs';

const dir = await mkdtemp(join(tmpdir(), 'lantern-verify-'));
const created = [];
let count = 0;
function check(name, fn) {
  fn();
  count++;
  console.log(`PASS ${name}`);
}
async function run(name, { scenario, inputs, ticks = 1, every = 1, seed = 42 } = {}) {
  const out = join(dir, `${name}.jsonl`);
  created.push(out);
  const args = ['src/headless.mjs', '--seed', String(seed), '--night', '1'];
  if (scenario) args.push('--scenario', `tests/phase1/${scenario}.scenario.json`);
  if (inputs) args.push('--inputs', `tests/phase1/${inputs}.inputs.json`);
  args.push('--ticks', String(ticks), '--snapshot-every', String(every), '--out', out);
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, `${name}: ${result.stderr}`);
  const bytes = await readFile(out);
  const lines = bytes.toString('utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines[0].type, 'snapshot');
  assert.equal(lines[0].tick, 0);
  assert.equal(lines.at(-1).type, 'end');
  return { lines, bytes, events: lines.filter(item => item.type === 'event'), snapshots: lines.filter(item => item.type === 'snapshot'), end: lines.at(-1) };
}

try {
  const zero = await run('zero', { scenario: 'empty', ticks: 0 });
  check('scenario tick 0 and five lanterns', () => {
    assert.deepEqual(zero.lines.map(item => item.type), ['snapshot', 'end']);
    assert.deepEqual(zero.snapshots[0].lanterns.map(item => item.id), ['L1', 'L2', 'L3', 'L4', 'L5']);
    assert.equal(zero.end.ticks, 0);
  });

  const move = await run('move', { scenario: 'empty', inputs: 'move' });
  check('camera-relative movement at 60 Hz', () => {
    assert.deepEqual(move.snapshots[1].player.pos, [0.1, 0, 0]);
    assert.equal(move.snapshots[1].sim_tick, 1);
  });

  const pickup = await run('pickup', { scenario: 'pickup' });
  check('mote pickup changes state and score', () => {
    assert.deepEqual(pickup.events.map(item => item.name), ['mote_picked']);
    assert.equal(pickup.events[0].tick, 1);
    assert.deepEqual(pickup.events[0].data, { carried: 1 });
    assert.equal(pickup.snapshots[1].motes_active, 0);
    assert.equal(pickup.snapshots[1].score, 10);
  });

  const deposit = await run('deposit', { scenario: 'deposit', inputs: 'deposit' });
  check('deposit and lantern lighting', () => {
    assert.deepEqual(deposit.events.map(item => item.name), ['deposit', 'lantern_lit']);
    assert.deepEqual(deposit.events[0].data, { lantern_id: 'L1', amount: 3, deposited: 3 });
    assert.equal(deposit.snapshots[1].lanterns[0].lit, true);
    assert.equal(deposit.snapshots[1].player.carried, 0);
    assert.equal(deposit.snapshots[1].score, 100);
  });

  const pulse = await run('pulse', { scenario: 'pulse', inputs: 'pulse' });
  check('pulse costs light and stuns/pushes shade', () => {
    assert.deepEqual(pulse.events[0].data, { stunned_ids: ['S1'] });
    assert.equal(pulse.snapshots[1].player.carried, 0);
    assert.equal(pulse.snapshots[1].shades[0].state, 'stunned');
    assert.equal(pulse.snapshots[1].shades[0].pos[0], 5);
  });

  const hit = await run('hit', { scenario: 'hit' });
  check('shade collision removes one flame', () => {
    assert.equal(hit.events[0].name, 'player_hit');
    assert.deepEqual(hit.events[0].data, { by: 'shade', flames: 2, dropped: 0 });
  });

  const win = await run('win', { scenario: 'win', inputs: 'deposit', ticks: 100 });
  check('last lantern wins and stops early', () => {
    assert.deepEqual(win.events.map(item => item.name), ['deposit', 'lantern_lit', 'game_over']);
    assert.deepEqual(win.events.at(-1).data, { result: 'won', reason: 'all_lit' });
    assert.equal(win.end.ticks, 1);
    assert.equal(win.end.state, 'won');
    assert.equal(win.end.score, 549);
  });

  const loss = await run('loss', { scenario: 'loss' });
  check('zero flames loses', () => {
    assert.deepEqual(loss.events.at(-1).data, { result: 'lost', reason: 'no_flames' });
    assert.equal(loss.end.state, 'lost');
  });

  const dawn = await run('dawn', { scenario: 'dawn' });
  check('timer expiry loses', () => {
    assert.deepEqual(dawn.events.at(-1).data, { result: 'lost', reason: 'dawn' });
    assert.equal(dawn.end.state, 'lost');
  });

  const repeat = await run('repeat', { scenario: 'pickup' });
  check('same seed/scenario/input is byte-identical', () => assert.ok(pickup.bytes.equals(repeat.bytes)));

  const badOut = join(dir, 'invalid.jsonl');
  const invalid = spawnSync(process.execPath, [
    'src/headless.mjs', '--seed', '42', '--night', '1',
    '--inputs', 'tests/phase1/invalid.inputs.json', '--ticks', '1', '--out', badOut,
  ], { encoding: 'utf8' });
  check('invalid frame ticks exit 2 with stderr', () => {
    assert.equal(invalid.status, 2);
    assert.match(invalid.stderr, /strictly/);
  });

  check('horizontal radius includes the boundary', () => {
    const near = createGame(1, { random_motes: false, random_shades: false, motes: [[1, 4, 0]], shades: [] });
    const far = createGame(1, { random_motes: false, random_shades: false, motes: [[1.001, 0, 0]], shades: [] });
    step(near, INITIAL_INPUT, INITIAL_INPUT);
    step(far, INITIAL_INPUT, INITIAL_INPUT);
    assert.equal(near.player.carried, 1);
    assert.equal(far.player.carried, 0);
  });

  check('lit lantern keeps shade outside safe radius', () => {
    const game = createGame(1, {
      random_motes: false, random_shades: false, motes: [],
      shades: [{ id: 'S1', pos: [5, 0, 0] }],
      lanterns: [{ id: 'L1', pos: [0, 0, 0], lit: true }],
    });
    for (let tick = 0; tick < 90; tick++) step(game, INITIAL_INPUT, INITIAL_INPUT);
    assert.ok(Math.hypot(game.shades[0].pos[0], game.shades[0].pos[2]) >= 4 - 1e-9);
    assert.equal(game.state, 'playing');
  });

  check('held pulse fires only on false-to-true transition', () => {
    const game = createGame(1, { random_motes: false, random_shades: false, player: { carried: 5 }, motes: [], shades: [] });
    const held = { ...INITIAL_INPUT, pulse: true };
    let pulses = 0;
    let previous = INITIAL_INPUT;
    for (let tick = 0; tick < 200; tick++) {
      pulses += step(game, held, previous).filter(event => event.name === 'pulse').length;
      previous = held;
    }
    assert.equal(pulses, 1);
    assert.equal(game.player.carried, 4);
  });

  console.log(`Phase 1 headless checks: ${count} passed`);
} finally {
  for (const file of created) await unlink(file);
  await rmdir(dir);
}
