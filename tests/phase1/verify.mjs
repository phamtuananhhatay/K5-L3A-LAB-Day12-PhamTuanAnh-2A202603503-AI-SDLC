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
function validateOutput(lines, requestedTicks, interval) {
  const states = new Set(['playing', 'won', 'lost']);
  const eventData = {
    mote_picked: ['carried'], deposit: ['lantern_id', 'amount', 'deposited'],
    lantern_lit: ['lantern_id'], pulse: ['stunned_ids'],
    player_hit: ['by', 'flames', 'dropped'], shade_spawned: ['id'],
    game_over: ['result', 'reason'],
  };
  const position = value => {
    assert.ok(Array.isArray(value) && value.length === 3);
    for (const number of value) {
      assert.ok(Number.isFinite(number));
      assert.ok(Math.abs(number * 1000 - Math.round(number * 1000)) < 1e-6, 'coordinate exceeds 3 decimals');
    }
  };
  let lastSnapshotTick = -1;
  for (const [index, item] of lines.entries()) {
    assert.ok(['snapshot', 'event', 'end'].includes(item.type), `record ${index} has invalid type`);
    if (item.type === 'snapshot') {
      assert.equal(item.sim_tick, item.tick);
      assert.ok(item.tick === 0 || item.tick % interval === 0);
      assert.ok(item.tick > lastSnapshotTick);
      lastSnapshotTick = item.tick;
      assert.ok(states.has(item.state));
      assert.ok(Number.isFinite(item.time_left_s));
      assert.ok(Number.isFinite(item.score));
      assert.ok(Number.isInteger(item.player.flames) && Number.isInteger(item.player.carried));
      position(item.player.pos);
      assert.equal(item.lanterns.length, 5);
      for (const lantern of item.lanterns) {
        assert.equal(typeof lantern.id, 'string');
        position(lantern.pos);
        assert.equal(typeof lantern.lit, 'boolean');
        assert.ok(Number.isInteger(lantern.deposited));
      }
      for (const shade of item.shades) {
        assert.equal(typeof shade.id, 'string');
        position(shade.pos);
        assert.equal(typeof shade.state, 'string');
      }
      assert.ok(Number.isInteger(item.motes_active));
    } else if (item.type === 'event') {
      assert.ok(item.tick > 0 && item.tick <= requestedTicks);
      assert.ok(eventData[item.name], `unknown event ${item.name}`);
      for (const field of eventData[item.name]) assert.ok(Object.hasOwn(item.data, field), `${item.name} lacks ${field}`);
      if (item.name === 'game_over') {
        assert.ok(['won', 'lost'].includes(item.data.result));
        assert.ok(['all_lit', 'dawn', 'no_flames'].includes(item.data.reason));
      }
    } else {
      assert.equal(index, lines.length - 1, 'end must be last');
      assert.ok(Number.isInteger(item.ticks) && item.ticks <= requestedTicks);
      assert.ok(states.has(item.state));
      assert.ok(Number.isFinite(item.score));
    }
  }
}
async function run(name, { scenario, inputs, ticks = 1, every = 1, seed = 42 } = {}) {
  const out = join(dir, `${name}.jsonl`);
  created.push(out);
  const args = ['src/headless.mjs', '--seed', String(seed), '--night', '1'];
  if (scenario) args.push('--scenario', `tests/phase1/${scenario}.scenario.json`);
  if (inputs) args.push('--inputs', `tests/phase1/${inputs}.inputs.json`);
  args.push('--ticks', String(ticks));
  if (every !== null) args.push('--snapshot-every', String(every));
  args.push('--out', out);
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, `${name}: ${result.stderr}`);
  const bytes = await readFile(out);
  const lines = bytes.toString('utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines[0].type, 'snapshot');
  assert.equal(lines[0].tick, 0);
  assert.equal(lines.at(-1).type, 'end');
  validateOutput(lines, ticks, every ?? 10);
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

  const generated1 = await run('generated1', { ticks: 120, every: 10 });
  const generated2 = await run('generated2', { ticks: 120, every: 10 });
  check('default seeded entities are byte-identical', () => assert.ok(generated1.bytes.equals(generated2.bytes)));

  const sequence = await run('sequence', { scenario: 'sequence', inputs: 'sequence', ticks: 16 });
  check('multi-action sequence preserves and updates state', () => {
    assert.deepEqual(sequence.events.map(item => [item.tick, item.name]), [
      [1, 'mote_picked'], [1, 'mote_picked'], [2, 'deposit'], [2, 'lantern_lit'], [4, 'pulse'],
    ]);
    assert.equal(sequence.snapshots.find(item => item.tick === 1).player.carried, 4);
    assert.equal(sequence.snapshots.find(item => item.tick === 2).player.carried, 1);
    assert.equal(sequence.snapshots.find(item => item.tick === 4).player.carried, 0);
    assert.equal(sequence.snapshots.find(item => item.tick === 4).shades[0].state, 'stunned');
    assert.deepEqual(sequence.snapshots.find(item => item.tick === 15).player.pos, [1, 0, 0]);
    assert.equal(sequence.snapshots.find(item => item.tick === 16).player.pos[0], 1);
    assert.equal(sequence.end.score, 125);
  });

  const boundary = await run('boundary', { scenario: 'boundary' });
  check('pickup uses horizontal distance and includes exact boundary', () => {
    assert.equal(boundary.events.length, 1);
    assert.equal(boundary.snapshots[1].motes_active, 1);
    assert.equal(boundary.snapshots[1].player.carried, 1);
  });

  const defaultInterval = await run('default-interval', { scenario: 'empty', ticks: 11, every: null });
  check('snapshot-every defaults to ten', () => {
    assert.deepEqual(defaultInterval.snapshots.map(item => item.tick), [0, 10]);
    assert.equal(defaultInterval.end.ticks, 11);
  });

  const badOut = join(dir, 'invalid.jsonl');
  const invalid = spawnSync(process.execPath, [
    'src/headless.mjs', '--seed', '42', '--night', '1',
    '--inputs', 'tests/phase1/invalid.inputs.json', '--ticks', '1', '--out', badOut,
  ], { encoding: 'utf8' });
  check('invalid frame ticks exit 2 with stderr', () => {
    assert.equal(invalid.status, 2);
    assert.match(invalid.stderr, /strictly/);
  });

  const invalidScenario = spawnSync(process.execPath, [
    'src/headless.mjs', '--seed', '42', '--night', '1',
    '--scenario', 'tests/phase1/invalid.scenario.json', '--ticks', '1', '--out', badOut,
  ], { encoding: 'utf8' });
  check('invalid scenario exits 2 with stderr', () => {
    assert.equal(invalidScenario.status, 2);
    assert.match(invalidScenario.stderr, /scenario\.motes/);
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
