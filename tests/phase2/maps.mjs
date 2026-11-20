import assert from 'node:assert/strict';
import { MAPS, surfacesAt } from '../../src/maps.mjs';

assert.deepEqual([1,2,3].map(night => MAPS[night].lanterns.length), [5,6,7]);
assert.deepEqual([1,2,3].map(night => MAPS[night].motePoints.length), [24,24,30]);
assert.deepEqual([1,2,3].map(night => MAPS[night].shadePoints.length), [12,16,16]);
assert.deepEqual(MAPS[1].lanterns[0].pos, [0,0,25]);
assert.deepEqual(MAPS[2].lanterns[5].pos, [53,0,-10]);
assert.deepEqual(MAPS[3].lanterns[0].pos, [0,6,6]);
assert.deepEqual(surfacesAt(1,40,0), [0]);
assert.deepEqual(surfacesAt(1,40.001,0), []);
assert.deepEqual(surfacesAt(2,35,2), [0]);
assert.deepEqual(surfacesAt(2,35,2.001), []);
assert.deepEqual(surfacesAt(3,0,13), [0,3]);
assert.deepEqual(surfacesAt(3,0,-13), [0]);
assert.deepEqual(surfacesAt(3,0,5), [0,6]);
const rampMiddle = surfacesAt(3,27*Math.cos(Math.PI/6),27*Math.sin(Math.PI/6));
assert.ok(rampMiddle.some(y => Math.abs(y - 1.5) < 1e-9));
console.log('PASS: three map layouts, exact edges, bridge, tiers and ramps');
