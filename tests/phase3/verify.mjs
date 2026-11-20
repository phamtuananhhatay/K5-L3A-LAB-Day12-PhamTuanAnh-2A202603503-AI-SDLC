import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createGame,step,snapshot,INITIAL_INPUT,receivingLanterns,capacity} from '../../src/core.mjs';

const keep=process.argv.includes('--evidence');
const folder=keep?'docs/proof/phase-3':mkdtempSync(join(tmpdir(),'lantern-p3-'));
mkdirSync(folder,{recursive:true});
const empty={random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,charms:[]};
const get=(value,path)=>path.split('.').reduce((object,key)=>object[key],value);
let count=0;
const cases=JSON.parse(readFileSync('tests/phase3/cases.json','utf8'));
try{
for(const c of cases){
 const scenario={...empty,...c.scenario};
 const input={frames:c.frames??[]};
 const scenarioPath=join(folder,`${c.name}.scenario.json`),inputPath=join(folder,`${c.name}.inputs.json`),out=join(folder,`${c.name}.jsonl`);
 writeFileSync(scenarioPath,JSON.stringify(scenario,null,2));writeFileSync(inputPath,JSON.stringify(input,null,2));
 const args=['src/headless.mjs','--seed','42','--night',String(c.night??1),'--scenario',scenarioPath,'--inputs',inputPath,'--ticks',String(c.ticks),'--snapshot-every','1','--out',out];
 const result=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(result.status,0,`${c.name}: ${result.stderr}`);
 const bytes=readFileSync(out);const records=bytes.toString().trim().split('\n').map(JSON.parse);
 const snaps=records.filter(r=>r.type==='snapshot'),last=snaps.at(-1),events=records.filter(r=>r.type==='event'&&r.name!=='night_start');
 assert.equal(records.at(-1).type,'end');assert.equal(snaps[0].tick,0);
 for(const [key,value]of Object.entries(c.values))assert.deepEqual(get(last,key),value,`${c.name}: ${key}`);
 if(c.events)assert.deepEqual(events.map(e=>e.name),c.events,c.name);
 for(const [name,data]of Object.entries(c.eventData??{}))assert.deepEqual(events.find(e=>e.name===name)?.data,data,`${c.name}: ${name}`);
 for(const s of snaps)for(const l of s.lanterns){assert.equal(typeof l.ever_lit,'boolean');assert.ok(Number.isInteger(l.relit_count));assert.ok(l.fuel>=0&&l.fuel<=100);assert.ok(Math.abs(l.fuel*10-Math.round(l.fuel*10))<1e-7);if(!l.lit)assert.equal(l.fuel,0);}
 assert.ok(!events.some(e=>e.data?.reason==='all_lit'));
 const again=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(again.status,0);assert.ok(bytes.equals(readFileSync(out)),`${c.name}: nondeterministic`);
 console.log(`PASS ${c.name} (values/events/schema + identical bytes)`);count++;
}
function check(name,fn){fn();count++;console.log(`PASS ${name}`);}
check('full lamp excluded; nearest eligible and ID tie-break',()=>{
 const g=createGame(1,{...empty,lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:100},{id:'L2',pos:[1,0,0]},{id:'L3',pos:[-1,0,0]}]});
 assert.deepEqual(receivingLanterns(g).map(l=>l.id),['L2','L3']);
 g.player.carried=10;step(g,{...INITIAL_INPUT,interact:true});
 // Stage2 decay makes a previously full lamp eligible before interaction.
 assert.equal(g.player.carried,9);assert.equal(g.lanterns[0].fuelUnits,6000);
});
check('safe threshold uses exact unrounded fuel',()=>{
 const make=fuel=>createGame(1,{...empty,lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel}],shades:[{id:'S1',pos:[5,0,0],state:'chase'}]});
 const at=make(30+1/60),below=make(30);step(at,INITIAL_INPUT);step(below,INITIAL_INPUT);
 assert.equal(at.lanterns[0].fuelUnits,1800);assert.ok(at.shades[0].safe);assert.ok(at.shades[0].pos[0]>5);
 assert.equal(below.lanterns[0].fuelUnits,1799);assert.equal(below.shades[0].safe,false);assert.ok(below.shades[0].pos[0]<5);
});
check('wander selects nearest weak lamp, chase retains player',()=>{
 const scenario={...empty,player:{pos:[30,0,0]},lanterns:[{id:'L1',pos:[-5,0,0],lit:true,fuel:20},{id:'L2',pos:[5,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[0,0,0],state:'wander'}]};
 const g=createGame(1,scenario);step(g,INITIAL_INPUT);assert.equal(g.shades[0].targetLanternId,'L1');assert.ok(g.shades[0].pos[0]<0);
 scenario.player.pos=[15,0,0];scenario.shades[0].state='chase';const chase=createGame(1,scenario);step(chase,INITIAL_INPUT);assert.equal(chase.shades[0].state,'chase');assert.ok(chase.shades[0].pos[0]>0);
});
check('drain exits for player, extinguished target, range, restored fuel; stun recovers to wander',()=>{
 for(const reason of ['player','out','range','refuel']){
  const scenario={...empty,player:{pos:reason==='player'?[5,0,0]:[20,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:reason!=='out',fuel:reason==='refuel'?40:20}],shades:[{id:'S1',pos:reason==='range'?[3,0,0]:[1,0,0],state:'drain',target_lantern_id:'L1'}]};
  const g=createGame(1,scenario);step(g,INITIAL_INPUT);assert.notEqual(g.shades[0].state,'drain',reason);
 }
 const g=createGame(1,{...empty,shades:[{pos:[3,0,0],state:'stunned',state_ticks_left:1}]});step(g,INITIAL_INPUT);assert.equal(g.shades[0].state,'wander');
});
check('capacity grows on relight and resets next night',()=>{
 const g=createGame(1,{...empty,player:{carried:5,successful_lights:4},lanterns:[{id:'L1',pos:[0,0,0],ever_lit:true}]});step(g,{...INITIAL_INPUT,interact:true});assert.equal(capacity(g.player),20);assert.equal(capacity(createGame(1,empty,2).player),10);
});
check('integer decay extinguishes once at exactly tick6000',()=>{
 const g=createGame(1,{...empty,time_left_s:101,lanterns:[{id:'L1',lit:true}]});let out=0;for(let i=0;i<5999;i++)out+=step(g,INITIAL_INPUT).filter(e=>e.name==='lantern_out').length;
 assert.equal(g.lanterns[0].fuelUnits,1);assert.equal(out,0);const events=step(g,INITIAL_INPUT);assert.equal(g.lanterns[0].fuelUnits,0);assert.equal(events.filter(e=>e.name==='lantern_out').length,1);
});
check('drain event cadence and safe-zone restoration within30 ticks',()=>{
 const g=createGame(1,{...empty,player:{pos:[20,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[1,0,0],state:'drain',target_lantern_id:'L1'}]});
 const ticks=[];for(let i=0;i<120;i++)for(const e of step(g,INITIAL_INPUT))if(e.name==='fuel_drain')ticks.push(e.tick);assert.deepEqual(ticks,[60,120]);
 const protectedGame=createGame(1,{...empty,player:{carried:2},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[0,0,0],state:'drain',target_lantern_id:'L1'}]});
 step(protectedGame,{...INITIAL_INPUT,interact:true});for(let i=0;i<29;i++)step(protectedGame,INITIAL_INPUT);
 assert.ok(Math.hypot(protectedGame.shades[0].pos[0],protectedGame.shades[0].pos[2])>=6-1e-9);assert.equal(protectedGame.player.flames,3);
});
check('invalid new scenario fields return code2',()=>{
 let index=0;
 for(const scenario of [{player:{successful_lights:-1}},{lanterns:[{id:'L1',fuel:101}]},{lanterns:[{id:'L1',ever_lit:1}]},{shades:[{pos:[0,0,0],state:'drain',target_lantern_id:7}]}]){
 const path=join(folder,`invalid-${++index}.json`);writeFileSync(path,JSON.stringify(scenario));const r=spawnSync(process.execPath,['src/headless.mjs','--seed','1','--night','1','--scenario',path,'--ticks','1','--out',join(folder,'invalid.jsonl')],{encoding:'utf8'});assert.equal(r.status,2);assert.ok(r.stderr);if(keep)writeFileSync(join(folder,`invalid-${index}.result.json`),JSON.stringify({exit_code:r.status,stderr:r.stderr},null,2));
 }
});
const summary={passed:count,scenario_cases:cases.length,direct_boundary_groups:count-cases.length,deterministic:true};
if(keep)writeFileSync(join(folder,'summary.json'),JSON.stringify(summary,null,2));
console.log(`Phase3: ${count} checks passed`);
}finally{if(!keep)rmSync(folder,{recursive:true,force:true});}
