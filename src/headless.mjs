import { readFile, writeFile } from 'node:fs/promises';
import { createGame, INITIAL_INPUT, snapshot, step } from './core.mjs';

class InputFileError extends Error {}
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const nonnegativeInteger = value => Number.isInteger(value) && value >= 0;
const vector = (value, length = 3) => Array.isArray(value) && value.length === length && value.every(finite);

function parseArgs(argv) {
  const options = { snapshotEvery: 10 };
  const names = {
    '--seed': 'seed', '--night': 'night', '--scenario': 'scenario',
    '--inputs': 'inputs', '--ticks': 'ticks', '--out': 'out',
    '--snapshot-every': 'snapshotEvery',
  };
  for (let index = 0; index < argv.length; index += 2) {
    const name = names[argv[index]];
    if (!name || index + 1 >= argv.length) throw new Error(`Invalid argument: ${argv[index]}`);
    if (options[name] !== undefined && name !== 'snapshotEvery') throw new Error(`Duplicate argument: ${argv[index]}`);
    options[name] = argv[index + 1];
  }
  for (const name of ['seed', 'night', 'ticks', 'snapshotEvery']) {
    const value = Number(options[name]);
    if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
    options[name] = value;
  }
  if (![1,2,3].includes(options.night) || !nonnegativeInteger(options.ticks) || options.snapshotEvery <= 0 || !options.out) {
    throw new Error('Expected --night 1/2/3, --ticks >= 0, --snapshot-every > 0 and --out');
  }
  return options;
}

async function loadJson(path, label) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { throw new InputFileError(`Invalid ${label} file: ${error.message}`); }
}

function validateScenario(value) {
  if (!isObject(value)) throw new InputFileError('scenario must be an object');
  if (value.player !== undefined) {
    if (!isObject(value.player)) throw new InputFileError('scenario.player must be an object');
    if (value.player.pos !== undefined && !vector(value.player.pos)) throw new InputFileError('scenario.player.pos must be [x,y,z]');
    for (const name of ['carried', 'flames', 'invuln_ticks', 'dash_cd_ticks', 'pulse_cd_ticks', 'charm_ticks', 'successful_lights']) {
      if (value.player[name] !== undefined && !nonnegativeInteger(value.player[name])) throw new InputFileError(`scenario.player.${name} must be a nonnegative integer`);
    }
  }
  for (const name of ['random_motes', 'random_shades', 'random_drifters', 'wind_enabled']) {
    if (value[name] !== undefined && typeof value[name] !== 'boolean') throw new InputFileError(`scenario.${name} must be boolean`);
  }
  if (value.motes !== undefined && (!Array.isArray(value.motes) || !value.motes.every(item => vector(item)))) {
    throw new InputFileError('scenario.motes must be an array of [x,y,z]');
  }
  if (value.shades !== undefined && (!Array.isArray(value.shades) || !value.shades.every(item => isObject(item) && vector(item.pos) && (item.id === undefined || typeof item.id === 'string') && (item.state === undefined || ['spawning','wander','chase','recoil','stunned','drain'].includes(item.state)) && (item.state_ticks_left === undefined || nonnegativeInteger(item.state_ticks_left)) && (item.target_lantern_id === undefined || (typeof item.target_lantern_id === 'string' && /^L[1-7]$/.test(item.target_lantern_id)))))) {
    throw new InputFileError('scenario.shades must be an array of objects with pos');
  }
  if (value.lanterns !== undefined && (!Array.isArray(value.lanterns) || !value.lanterns.every(item =>
    isObject(item) && /^L[1-7]$/.test(item.id) &&
    (item.pos === undefined || vector(item.pos)) &&
    (item.lit === undefined || typeof item.lit === 'boolean') &&
    (item.fuel === undefined || (finite(item.fuel) && item.fuel >= 0 && item.fuel <= 100)) &&
    (item.ever_lit === undefined || typeof item.ever_lit === 'boolean') &&
    (item.deposited === undefined || nonnegativeInteger(item.deposited))))) {
    throw new InputFileError('scenario.lanterns must update valid lantern IDs with fuel in [0,100]');
  }
  if (value.time_left_s !== undefined && (!finite(value.time_left_s) || value.time_left_s < 0)) {
    throw new InputFileError('scenario.time_left_s must be nonnegative');
  }
  if(value.drifters!==undefined&&(!Array.isArray(value.drifters)||!value.drifters.every(d=>isObject(d)&&vector(d.pos)&&(d.id===undefined||typeof d.id==='string')&&(d.state===undefined||['idle','chase','flee','removed'].includes(d.state))&&(d.stolen===undefined||nonnegativeInteger(d.stolen))&&(d.state_ticks_left===undefined||nonnegativeInteger(d.state_ticks_left)))))throw new InputFileError('Invalid scenario.drifters');
  if(value.charms!==undefined&&(!Array.isArray(value.charms)||!value.charms.every(c=>isObject(c)&&typeof c.id==='string'&&(c.pos===undefined||vector(c.pos))&&(c.available===undefined||typeof c.available==='boolean')&&(c.respawn_s===undefined||(finite(c.respawn_s)&&c.respawn_s>=0)))))throw new InputFileError('Invalid scenario.charms');
}

function validateInputs(value) {
  if (!isObject(value) || !Array.isArray(value.frames)) throw new InputFileError('inputs.frames must be an array');
  let previousTick = -1;
  for (const frame of value.frames) {
    if (!isObject(frame) || !nonnegativeInteger(frame.tick) || frame.tick <= previousTick) {
      throw new InputFileError('input frame ticks must increase strictly');
    }
    previousTick = frame.tick;
    if (frame.move !== undefined && (!vector(frame.move, 2) || frame.move.some(number => number < -1 || number > 1))) {
      throw new InputFileError('frame.move must be [x,z] with each component in [-1,1]');
    }
    if (frame.cam_yaw_deg !== undefined && !finite(frame.cam_yaw_deg)) throw new InputFileError('frame.cam_yaw_deg must be finite');
    for (const name of ['jump', 'interact', 'pulse', 'dash', 'pause']) {
      if (frame[name] !== undefined && typeof frame[name] !== 'boolean') throw new InputFileError(`frame.${name} must be boolean`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scenario = args.scenario ? await loadJson(args.scenario, 'scenario') : {};
  const inputs = args.inputs ? await loadJson(args.inputs, 'inputs') : { frames: [] };
  validateScenario(scenario);
  validateInputs(inputs);
  const game = createGame(args.seed, scenario, args.night);
  const lines = [JSON.stringify({type:'event',tick:0,name:'night_start',data:{night:args.night}}), JSON.stringify(snapshot(game))];
  let input = { ...INITIAL_INPUT, move: [...INITIAL_INPUT.move] };
  let previousInput = { ...input };
  let frameIndex = 0;
  for (let tick = 0; tick < args.ticks && !['won','lost'].includes(game.state); tick++) {
    if (frameIndex < inputs.frames.length && inputs.frames[frameIndex].tick === tick) {
      input = { ...input, ...inputs.frames[frameIndex] };
      frameIndex++;
    }
    for (const event of step(game, input, previousInput)) lines.push(JSON.stringify(event));
    if (game.tick % args.snapshotEvery === 0) lines.push(JSON.stringify(snapshot(game)));
    previousInput = { ...input };
  }
  lines.push(JSON.stringify({ type: 'end', ticks: game.tick, state: game.state, score: game.score }));
  await writeFile(args.out, `${lines.join('\n')}\n`, 'utf8');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = error instanceof InputFileError ? 2 : 1;
});
