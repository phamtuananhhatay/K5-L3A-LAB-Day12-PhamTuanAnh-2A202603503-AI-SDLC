import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync,readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir,cpus,platform} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'lantern-bench-'));
try{
const scenario=join(dir,'scenario.json'),out=join(dir,'output.jsonl');
writeFileSync(scenario,JSON.stringify({player:{invuln_ticks:21601},wind_enabled:false}));
const start=performance.now();const result=spawnSync(process.execPath,['src/headless.mjs','--seed','42','--night','3','--scenario',scenario,'--ticks','21600','--out',out],{encoding:'utf8'});
const seconds=(performance.now()-start)/1000;assert.equal(result.status,0,result.stderr);const end=JSON.parse(readFileSync(out,'utf8').trim().split('\n').at(-1));assert.equal(end.ticks,21600);assert.equal(end.state,'lost');assert.ok(seconds<=30);
const report={node:process.version,platform:platform(),cpu:cpus()[0].model,ticks:end.ticks,seconds,limit_seconds:30,scenario:'night3 default spawning enabled, player invulnerability 21601 ticks prevents early death; wind disabled to prevent falling; full 360 seconds including CLI and JSONL writing'};
writeFileSync('docs/proof/phase-2/headless-benchmark.json',JSON.stringify(report,null,2));console.log(report);
}finally{rmSync(dir,{recursive:true,force:true});}
