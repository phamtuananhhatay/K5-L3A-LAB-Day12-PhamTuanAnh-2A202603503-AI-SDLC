import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync,readFileSync,mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir,cpus,platform} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {TUNING} from '../../src/core.mjs';
const dir=mkdtempSync(join(tmpdir(),'lantern-phase3-benchmark-'));
try{
 const ticks=TUNING.night3_duration_s*60,scenario=join(dir,'scenario.json'),out=join(dir,'output.jsonl');
 writeFileSync(scenario,JSON.stringify({player:{invuln_ticks:ticks+1},wind_enabled:false}));
 const start=performance.now();const result=spawnSync(process.execPath,['src/headless.mjs','--seed','42','--night','3','--scenario',scenario,'--ticks',String(ticks),'--out',out],{encoding:'utf8'});
 const seconds=(performance.now()-start)/1000;assert.equal(result.status,0,result.stderr);
 const records=readFileSync(out,'utf8').trim().split('\n').map(JSON.parse),end=records.at(-1);
 assert.equal(end.ticks,18000);assert.equal(end.state,'lost');assert.equal(records.findLast(e=>e.name==='game_over').data.reason,'dawn');assert.ok(seconds<=30);
 mkdirSync('docs/proof/phase-3',{recursive:true});const report={node:process.version,platform:platform(),cpu:cpus()[0].model,ticks:end.ticks,seconds,limit_seconds:30,scenario:'full300s Night3 with default spawning; invulnerability prevents early death, wind disabled to prevent falling; no lamps lit, result dawn. CLI and JSONL writing included.'};
 writeFileSync('docs/proof/phase-3/headless-benchmark.json',JSON.stringify(report,null,2));console.log(report);
}finally{if(resolve(dir).startsWith(resolve(tmpdir())+sep)&&dir.includes('lantern-phase3-benchmark-'))rmSync(dir,{recursive:true,force:true});}
