// Coordinates from Ticket-02. Gameplay tuning is deliberately kept separate.
function ring(cx, cz, radius, count, offset = 0, y = 0) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (offset + index * 360 / count) * Math.PI / 180;
    return [cx + radius * Math.cos(angle), y, cz + radius * Math.sin(angle)];
  });
}
function lamps(positions) {
  return positions.map((pos, index) => ({ id: `L${index + 1}`, pos }));
}

export const MAPS = {
  1: {
    name: 'Đêm 1 — Đảo Bến',
    islands: [{ center: [0, 0, 0], radius: 40 }],
    bridges: [], ramps: [], platforms: [], pads: [], obstacles: [],
    lanterns: lamps([[0,0,25], [23.8,0,7.7], [14.7,0,-20.2], [-14.7,0,-20.2], [-23.8,0,7.7]]),
    motePoints: [...ring(0,0,12,8), ...ring(0,0,33,16)],
    shadePoints: ring(0,0,37,12,15),
    shadeIntervalTicks: 480, shadeLimit: 6,
    charms: [],
  },
  2: {
    name: 'Đêm 2',
    islands: [{ center: [0,0,0], radius: 28 }, { center: [70,0,0], radius: 28 }],
    bridges: [{ minX: 26, maxX: 44, minZ: -2, maxZ: 2, y: 0 }],
    ramps: [], platforms: [], obstacles: [],
    pads: [
      { pos: [20,0,18], radius: 1, verticalSpeed: 14, horizontalSpeed: 24, target: [70,0,0] },
      { pos: [50,0,-18], radius: 1, verticalSpeed: 14, horizontalSpeed: 24, target: [0,0,0] },
    ],
    lanterns: lamps([[0,0,20], [17,0,-10], [-17,0,-10], [70,0,20], [87,0,-10], [53,0,-10]]),
    motePoints: [...ring(0,0,10,4), ...ring(0,0,22,8), ...ring(70,0,10,4), ...ring(70,0,22,8)],
    shadePoints: [...ring(0,0,26,8,22.5), ...ring(70,0,26,8,22.5)],
    shadeIntervalTicks: 420, shadeLimit: 8,
    charms: [{ id: 'C1', pos: [35,0,0] }],
  },
  3: {
    name: 'Đêm 3',
    islands: [{ center: [0,0,0], radius: 45 }],
    bridges: [],
    ramps: [30,150].map(angle => ({ angle, width: 3, innerRadius: 24, outerRadius: 30, bottom: 0, top: 3 })),
    platforms: [
      { innerRadius: 12, outerRadius: 24, positiveZ: true, y: 3 },
      { innerRadius: 0, outerRadius: 8, positiveZ: false, y: 6 },
    ],
    pads: [{ pos: [0,3,13], radius: 1, verticalSpeed: 12, horizontalSpeed: 8, target: [0,6,0] }],
    obstacles: [{ pos: [0,6,0], radius: 2, height: 8 }],
    lanterns: lamps([[0,6,6], [18,3,10], [-18,3,10], [35,0,-10], [-35,0,-10], [20,0,-35], [-20,0,-35]]),
    motePoints: [
      ...ring(0,0,34,18),
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (20 + i * 20) * Math.PI / 180;
        return [18 * Math.cos(a),3,18 * Math.sin(a)];
      }),
      ...ring(0,0,5,4,45,6),
    ],
    shadePoints: ring(0,0,43,16),
    shadeIntervalTicks: 360, shadeLimit: 10,
    charms: [{ id: 'C1', pos: [30,0,25] }, { id: 'C2', pos: [-30,0,25] }],
  },
};

// Return all supporting surfaces, bottom first. Physics must select a surface
// reachable from the player's feet rather than teleporting up vertical walls.
export function surfacesAt(night, x, z) {
  const map = MAPS[night];
  if (!map) throw new Error(`Unknown night: ${night}`);
  const surfaces = [];
  for (const island of map.islands) {
    if (Math.hypot(x - island.center[0], z - island.center[2]) <= island.radius) surfaces.push(island.center[1]);
  }
  for (const bridge of map.bridges) {
    if (x >= bridge.minX && x <= bridge.maxX && z >= bridge.minZ && z <= bridge.maxZ) surfaces.push(bridge.y);
  }
  const radius = Math.hypot(x,z);
  for (const platform of map.platforms) {
    if (radius >= platform.innerRadius && radius <= platform.outerRadius && (!platform.positiveZ || z > 0)) surfaces.push(platform.y);
  }
  for (const ramp of map.ramps) {
    const angle = ramp.angle * Math.PI / 180;
    const along = x * Math.cos(angle) + z * Math.sin(angle);
    const across = -x * Math.sin(angle) + z * Math.cos(angle);
    if (along >= ramp.innerRadius && along <= ramp.outerRadius && Math.abs(across) <= ramp.width / 2) {
      surfaces.push(ramp.bottom + (ramp.outerRadius - along) / (ramp.outerRadius - ramp.innerRadius) * (ramp.top - ramp.bottom));
    }
  }
  return [...new Set(surfaces)].sort((a,b) => a-b);
}
