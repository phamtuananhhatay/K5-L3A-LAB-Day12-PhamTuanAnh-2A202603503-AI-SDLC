export const TUNING = Object.freeze({
  player_speed: 6, carry_capacity: 5, lantern_cost: 3,
  lantern_count_night1: 5, pickup_radius: 1, interact_radius: 2,
  pulse_cost: 1, pulse_radius: 5, night1_duration_s: 300,
  flames: 3, invuln_s: 1, hit_drop_ratio: 0,
  pulse_stun_s: 2, pulse_push_m: 3, pulse_cooldown_s: 3,
  safe_radius: 4, shade_speed: 2, shade_hit_radius: 0.8,
  fall_enabled: false,
  score: { per_mote: 10, per_lantern: 100, per_stun: 5, per_second_left: 1, per_flame_left: 50 },
});

const DT = 1 / 60;
const ISLAND_RADIUS = 30;
const horizontalDistance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const copyPos = pos => [...pos];

function seededRandom(seed) {
  let value = (seed | 0) || 0x6d2b79f5;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 0x100000000;
  };
}

function defaultLanterns() {
  return Array.from({ length: 5 }, (_, index) => {
    const angle = (index * Math.PI * 2) / 5;
    return {
      id: `L${index + 1}`,
      pos: [20 * Math.cos(angle), 0, 20 * Math.sin(angle)],
      lit: false,
      deposited: 0,
    };
  });
}

export function createGame(seed = 1, scenario = {}) {
  const random = seededRandom(seed);
  const lanterns = defaultLanterns();
  for (const patch of scenario.lanterns ?? []) {
    const lantern = lanterns.find(item => item.id === patch.id);
    if (!lantern) continue;
    if (patch.pos) lantern.pos = copyPos(patch.pos);
    if (patch.deposited !== undefined) lantern.deposited = patch.deposited;
    if (patch.lit !== undefined) lantern.lit = patch.lit;
  }

  const defaultMotes = Array.from({ length: 24 }, (_, index) => {
    const angle = index * 2.399963229728653 + random() * 0.3;
    const radius = 5 + Math.sqrt(random()) * 21;
    return { id: `M${index + 1}`, pos: [radius * Math.cos(angle), 0, radius * Math.sin(angle)] };
  });
  const defaultShades = [
    { id: 'S1', pos: [16, 0.7, 10], state: 'chase', stunTicks: 0 },
    { id: 'S2', pos: [-18, 0.7, -8], state: 'chase', stunTicks: 0 },
  ];
  const motes = scenario.motes !== undefined
    ? scenario.motes.map((pos, index) => ({ id: `M${index + 1}`, pos: copyPos(pos) }))
    : scenario.random_motes === false ? [] : defaultMotes;
  const shades = scenario.shades !== undefined
    ? scenario.shades.map((item, index) => ({ id: item.id ?? `S${index + 1}`, pos: copyPos(item.pos), state: 'chase', stunTicks: 0 }))
    : scenario.random_shades === false ? [] : defaultShades;
  return {
    tick: 0, state: 'playing', timeLeft: scenario.time_left_s ?? TUNING.night1_duration_s,
    score: 0,
    player: {
      pos: copyPos(scenario.player?.pos ?? [0, 0, 0]),
      carried: scenario.player?.carried ?? 0,
      flames: scenario.player?.flames ?? TUNING.flames,
      velocityY: 0, invulnTicks: 0, pulseCooldownTicks: 0,
    },
    lanterns, motes, shades,
  };
}

function movePlayer(game, input, edges) {
  const player = game.player;
  const [x, z] = input.move;
  const yaw = input.cam_yaw_deg * Math.PI / 180;
  let worldX = x * Math.cos(yaw) + z * Math.sin(yaw);
  let worldZ = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const length = Math.hypot(worldX, worldZ);
  if (length > 1) { worldX /= length; worldZ /= length; }
  player.pos[0] += worldX * TUNING.player_speed * DT;
  player.pos[2] += worldZ * TUNING.player_speed * DT;
  const radius = Math.hypot(player.pos[0], player.pos[2]);
  if (radius > ISLAND_RADIUS - 0.5) {
    const factor = (ISLAND_RADIUS - 0.5) / radius;
    player.pos[0] *= factor;
    player.pos[2] *= factor;
  }
  if (edges.jump && player.pos[1] <= 0) player.velocityY = 6;
  if (player.velocityY !== 0 || player.pos[1] > 0) {
    player.pos[1] += player.velocityY * DT;
    player.velocityY -= 14 * DT;
    if (player.pos[1] <= 0) { player.pos[1] = 0; player.velocityY = 0; }
  }
}

function collectMotes(game, events) {
  for (let index = game.motes.length - 1; index >= 0; index--) {
    if (game.player.carried >= TUNING.carry_capacity) break;
    if (horizontalDistance(game.player.pos, game.motes[index].pos) <= TUNING.pickup_radius + 1e-9) {
      game.motes.splice(index, 1);
      game.player.carried++;
      game.score += TUNING.score.per_mote;
      events.push({ name: 'mote_picked', data: { carried: game.player.carried } });
    }
  }
}

function interact(game, events) {
  const lantern = game.lanterns
    .filter(item => !item.lit && horizontalDistance(game.player.pos, item.pos) <= TUNING.interact_radius + 1e-9)
    .sort((a, b) => horizontalDistance(game.player.pos, a.pos) - horizontalDistance(game.player.pos, b.pos))[0];
  if (!lantern || game.player.carried === 0) return;
  const amount = Math.min(game.player.carried, TUNING.lantern_cost - lantern.deposited);
  if (amount <= 0) return;
  game.player.carried -= amount;
  lantern.deposited += amount;
  events.push({ name: 'deposit', data: { lantern_id: lantern.id, amount, deposited: lantern.deposited } });
  if (lantern.deposited >= TUNING.lantern_cost) {
    lantern.lit = true;
    game.score += TUNING.score.per_lantern;
    events.push({ name: 'lantern_lit', data: { lantern_id: lantern.id } });
  }
}

function pulse(game, events) {
  const player = game.player;
  if (player.carried < TUNING.pulse_cost || player.pulseCooldownTicks > 0) return;
  player.carried -= TUNING.pulse_cost;
  player.pulseCooldownTicks = Math.round(TUNING.pulse_cooldown_s * 60);
  const stunnedIds = [];
  for (const shade of game.shades) {
    const distance = horizontalDistance(shade.pos, player.pos);
    if (distance > TUNING.pulse_radius + 1e-9) continue;
    const directionX = distance > 1e-9 ? (shade.pos[0] - player.pos[0]) / distance : 1;
    const directionZ = distance > 1e-9 ? (shade.pos[2] - player.pos[2]) / distance : 0;
    shade.pos[0] += directionX * TUNING.pulse_push_m;
    shade.pos[2] += directionZ * TUNING.pulse_push_m;
    shade.stunTicks = Math.round(TUNING.pulse_stun_s * 60);
    shade.state = 'stunned';
    stunnedIds.push(shade.id);
    game.score += TUNING.score.per_stun;
  }
  events.push({ name: 'pulse', data: { stunned_ids: stunnedIds } });
}

function keepShadesOutsideLight(game, shade) {
  for (const lantern of game.lanterns) {
    if (!lantern.lit) continue;
    const distance = horizontalDistance(shade.pos, lantern.pos);
    if (distance >= TUNING.safe_radius) continue;
    const dx = distance > 1e-9 ? (shade.pos[0] - lantern.pos[0]) / distance : 1;
    const dz = distance > 1e-9 ? (shade.pos[2] - lantern.pos[2]) / distance : 0;
    shade.pos[0] = lantern.pos[0] + dx * TUNING.safe_radius;
    shade.pos[2] = lantern.pos[2] + dz * TUNING.safe_radius;
  }
}

function updateShades(game) {
  for (const shade of game.shades) {
    if (shade.stunTicks > 0) {
      shade.stunTicks--;
      shade.state = 'stunned';
    } else {
      shade.state = 'chase';
      const distance = horizontalDistance(shade.pos, game.player.pos);
      if (distance > 1e-9) {
        const travel = Math.min(distance, TUNING.shade_speed * DT);
        shade.pos[0] += (game.player.pos[0] - shade.pos[0]) / distance * travel;
        shade.pos[2] += (game.player.pos[2] - shade.pos[2]) / distance * travel;
      }
    }
    keepShadesOutsideLight(game, shade);
  }
}

function hitPlayer(game, events) {
  const player = game.player;
  if (player.invulnTicks > 0) return;
  if (!game.shades.some(shade => shade.state !== 'stunned' && horizontalDistance(shade.pos, player.pos) <= TUNING.shade_hit_radius + 1e-9)) return;
  player.flames = Math.max(0, player.flames - 1);
  const dropped = Math.floor(player.carried * TUNING.hit_drop_ratio);
  player.carried -= dropped;
  player.invulnTicks = Math.round(TUNING.invuln_s * 60);
  events.push({ name: 'player_hit', data: { by: 'shade', flames: player.flames, dropped } });
}

export function step(game, input, previousInput) {
  if (game.state !== 'playing') return [];
  const events = [];
  const edges = {
    jump: input.jump && !previousInput.jump,
    interact: input.interact && !previousInput.interact,
    pulse: input.pulse && !previousInput.pulse,
  };
  const player = game.player;
  if (player.invulnTicks > 0) player.invulnTicks--;
  if (player.pulseCooldownTicks > 0) player.pulseCooldownTicks--;
  movePlayer(game, input, edges);
  collectMotes(game, events);
  if (edges.interact) interact(game, events);
  if (edges.pulse) pulse(game, events);
  updateShades(game);
  hitPlayer(game, events);
  game.timeLeft = Math.max(0, game.timeLeft - DT);
  game.tick++;
  let result;
  if (game.lanterns.every(lantern => lantern.lit)) result = ['won', 'all_lit'];
  else if (player.flames <= 0) result = ['lost', 'no_flames'];
  else if (game.timeLeft <= 0) result = ['lost', 'dawn'];
  if (result) {
    game.state = result[0];
    if (result[0] === 'won') {
      game.score += Math.floor(game.timeLeft) * TUNING.score.per_second_left;
      game.score += player.flames * TUNING.score.per_flame_left;
    }
    events.push({ name: 'game_over', data: { result: result[0], reason: result[1] } });
  }
  return events.map(event => ({ type: 'event', tick: game.tick, ...event }));
}

const roundCoord = value => Math.round(value * 1000) / 1000;
const roundedPos = pos => pos.map(roundCoord);

export function snapshot(game) {
  return {
    type: 'snapshot', tick: game.tick, sim_tick: game.tick,
    state: game.state, time_left_s: Math.round(game.timeLeft * 1e6) / 1e6,
    score: game.score,
    player: { pos: roundedPos(game.player.pos), flames: game.player.flames, carried: game.player.carried },
    lanterns: game.lanterns.map(item => ({ id: item.id, pos: roundedPos(item.pos), lit: item.lit, deposited: item.deposited })),
    shades: game.shades.map(item => ({ id: item.id, pos: roundedPos(item.pos), state: item.state })),
    motes_active: game.motes.length,
  };
}

export const INITIAL_INPUT = Object.freeze({ move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false });
