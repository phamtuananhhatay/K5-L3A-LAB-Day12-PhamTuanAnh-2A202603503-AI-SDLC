import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGame, step, snapshot, INITIAL_INPUT, TUNING } from '../../src/core.mjs';
const evidence=process.argv.includes('--evidence');
const folder=evidence?'docs/proof/phase-3/regression':mkdtempSync(join(tmpdir(),'lantern-p2-'));
mkdirSync(folder,{recursive:true});
let passed=0;
try{
for(const c of JSON.parse(readFileSync('tests/phase2/cases.json','utf8'))){
 const scenario=join(folder,`${c.name}.scenario.json`),inputs=join(folder,`${c.name}.inputs.json`),out=join(folder,`${c.name}.jsonl`);
 writeFileSync(scenario,JSON.stringify(c.scenario,null,2));writeFileSync(inputs,JSON.stringify(c.inputs,null,2));
 const args=['src/headless.mjs','--seed','42','--night',String(c.night),'--ticks',String(c.ticks),'--scenario',scenario,'--inputs',inputs,'--snapshot-every','1','--out',out];
 const run=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const bytes=readFileSync(out);const lines=bytes.toString().trim().split('\n').map(JSON.parse);const snaps=lines.filter(l=>l.type==='snapshot'),last=snaps.at(-1),end=lines.at(-1),ex=c.expect;
 assert.equal(snaps[0].tick,0);assert.equal(end.type,'end');assert.equal(last.night,c.night);
 for(const field of ['motes','drifters','charms'])assert.ok(Array.isArray(last[field]));
 for(const field of ['state','sim_tick','time_left_s','motes_active','score'])if(ex[field]!==undefined)assert.equal(last[field],ex[field],`${c.name}.${field}`);
 for(const field of ['carried','flames','charm_s'])if(ex[field]!==undefined)assert.equal(last.player[field],ex[field],`${c.name}.${field}`);
 if(ex.pos)assert.deepEqual(last.player.pos,ex.pos);
 if(ex.event)assert.ok(lines.some(l=>l.name===ex.event),`${c.name} event`);
 if(ex.stolen!==undefined)assert.equal(last.drifters[0].stolen,ex.stolen);
 if(ex.shade_x!==undefined)assert.equal(last.shades[0].pos[0],ex.shade_x);
 for(const field of ['shades','drifters'])if(ex[field]!==undefined)assert.equal(last[field].length,ex[field]);
 if(ex.wind_active!==undefined)assert.equal(last.wind.active,ex.wind_active);
 if(ex.airborne)assert.ok(last.player.pos[1]>0&&!last.player.grounded);
 const rerun=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(rerun.status,0);assert.ok(bytes.equals(readFileSync(out)),`${c.name} not deterministic`);
 console.log(`PASS ${c.name} (values + byte determinism)`);passed++;
}
// Phase-1 behaviors retained with the mandated replacement tuning.
const g=createGame(2,{random_motes:false,random_shades:false,motes:[[0,0,1]]});
step(g,INITIAL_INPUT);assert.equal(g.player.carried,1);assert.equal(g.score,0);
const diagonal=createGame(1,{random_motes:false,random_shades:false});step(diagonal,{...INITIAL_INPUT,move:[1,1]});assert.ok(Math.abs(Math.hypot(diagonal.player.pos[0],diagonal.player.pos[2])-.1)<1e-9);
const dead=createGame(1,{player:{flames:0},lanterns:[1,2,3,4,5].map(n=>({id:`L${n}`,lit:true})),random_shades:false});step(dead,INITIAL_INPUT);assert.equal(dead.state,'lost');
for(const [name,flag,data]of [
 ['duplicate-ticks','--inputs',{frames:[{tick:0},{tick:0}]}],
 ['bad-move','--inputs',{frames:[{tick:0,move:[2,0]}]}],
 ['bad-shade','--scenario',{shades:[{pos:[0,0,0],state:'bad'}]}],
 ['bad-pause','--inputs',{frames:[{tick:0,pause:1}]}],
 ['broken-json','--scenario',null],
]){
 const file=join(folder,`${name}.json`);writeFileSync(file,data===null?'{broken':JSON.stringify(data));
 const result=spawnSync(process.execPath,['src/headless.mjs','--seed','42','--night','1',flag,file,'--ticks','1','--out',join(folder,'invalid-output.jsonl')],{encoding:'utf8'});
 assert.equal(result.status,2,`${name} must exit 2`);assert.ok(result.stderr.trim());
 if(evidence)writeFileSync(join(folder,`${name}.result.json`),JSON.stringify({exit_code:result.status,stderr:result.stderr},null,2));
}
console.log('PASS invalid inputs/scenarios: duplicate ticks, move range, shade state, pause type, malformed JSON');
assert.equal(snapshot(g).player.invuln,false);assert.equal(TUNING.lantern_cost,10);
console.log(`PASS ${passed} phase-2 scenarios + standardized regression checks`);
}finally{if(!evidence)rmSync(folder,{recursive:true,force:true});}
