import {createGame,step,INITIAL_INPUT,TUNING} from '../src/core.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
const args=process.argv.slice(2),option=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const seed=Number(option('--seed',7)),nights=Number(option('--nights',10)),out=option('--out','soak.json');
if(!Number.isInteger(seed)||!Number.isInteger(nights)||nights<1)throw new Error('Invalid seed/nights');
function rng(seed){let n=seed>>>0;return()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};}
const start=performance.now();let game=createGame(seed,{},1);global.gc?.();const memStart=process.memoryUsage().rss/1048576;const results=[];let crashes=0;
for(let i=0;i<nights;i++){
 const night=i%3+1;if(i>0)game=createGame(seed+i,{},night);const random=rng(seed+i);let previous={...INITIAL_INPUT},move=[0,0];
 try{for(let tick=0;tick<TUNING[`night${night}_duration_s`]*60&&!['won','lost'].includes(game.state);tick++){
  if(tick%30===0){const a=random()*Math.PI*2;move=[Math.cos(a),Math.sin(a)];}
  const input={...INITIAL_INPUT,move,jump:random()<.05,dash:random()<.03,pulse:random()<.02,interact:random()<.1};step(game,input,previous);previous=input;
 }results.push(game.state);}catch(error){crashes++;results.push('crashed');console.error(`Night ${i}: ${error.message}`);}
 game=null;
 // Reset the completed night in this same process before endpoint RSS.
 game=createGame(seed+i,{},night);
}
global.gc?.();const report={nights,crashes,results,mem_start_mb:memStart,mem_end_mb:process.memoryUsage().rss/1048576,duration_s:(performance.now()-start)/1000};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log(report);
