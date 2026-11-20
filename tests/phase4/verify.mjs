import assert from 'node:assert/strict';
import {createBenchmark,stepBenchmark,frameMetrics} from '../../src/benchmark.mjs';
import {DEFAULT_BINDINGS,rebind,validateBindings,actionDown} from '../../src/controls.mjs';
const g=createBenchmark(42),again=createBenchmark(42);assert.deepEqual(g.motes,again.motes);assert.deepEqual(g.shades,again.shades);assert.equal(g.shades.length,200);assert.equal(g.motes.length,100);assert.equal(g.lanterns.filter(l=>l.lit).length,3);
const pos=[...g.shades[0].pos];for(let i=0;i<240;i++)stepBenchmark(g);assert.equal(g.motes.length,100);assert.equal(g.shades.length,200);assert.deepEqual(g.player.pos,[0,0,0]);assert.equal(g.player.flames,3);assert.equal(g.score,0);assert.equal(g.state,'playing');assert.ok(g.lanterns.filter(l=>l.lit).every(l=>l.fuelUnits===6000));assert.ok(g.shades.every(s=>s.state==='wander'));assert.notDeepEqual(g.shades[0].pos,pos);
const metrics=frameMetrics([10,10,10,10,60]);assert.equal(metrics.avg_fps,50);assert.equal(metrics.p1_low_fps,1000/60);assert.equal(metrics.frame_ms_p95,60);assert.equal(metrics.frames,5);
validateBindings(DEFAULT_BINDINGS);assert.throws(()=>rebind(DEFAULT_BINDINGS,'forward','KeyS'),/Trùng/);const rebound=rebind(DEFAULT_BINDINGS,'forward','KeyI');assert.ok(actionDown(new Set(['KeyI']),rebound,'forward'));assert.equal(actionDown(new Set(['KeyW']),rebound,'forward'),false);assert.deepEqual(DEFAULT_BINDINGS.forward,'KeyW');
console.log('PASS Phase4 benchmark scene/freeze, deterministic population, exact frame metric formulas, rebinding and conflict validation');
