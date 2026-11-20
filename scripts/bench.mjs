import {writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {platform,release} from 'node:os';
import {openBrowser,wait} from './browser-runtime.mjs';
const args=process.argv.slice(2);const option=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const seed=Number(option('--seed',42)),duration=Number(option('--duration',30)),out=option('--out','bench.json');
if(!Number.isInteger(seed)||!Number.isFinite(duration)||duration<=0)throw new Error('Invalid seed/duration');
const browser=await openBrowser({port:4194,visible:true});
try{
 await browser.navigate(`/?bench=1&seed=${seed}&duration=${duration}`);
 let result;for(let i=0;i<(duration+30)*10;i++){try{result=await browser.evaluate(`import('/src/game.mjs').then(m=>m.inspectBenchmark())`);if(result?.done)break;}catch{}await wait(100);}
 if(!result?.done)throw new Error('Benchmark timed out');
 const version=await browser.send('Browser.getVersion');const renderer=await browser.evaluate(`(()=>{const g=document.querySelector('canvas').getContext('webgl2'),e=g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);})()`);
 const output={contract_version:'1.3',...result.metrics,load_ms:Math.max(0,result.first_frame_epoch-performance.timeOrigin),peak_mem_mb:null,vsync_off:false,renderer:`WebGL2 / ${version.product} / ${renderer}`,os:`${platform()} ${release()}`};
 await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(output,null,2)+'\n');
 await writeFile(out.replace(/\.json$/,'')+'.scene.json',JSON.stringify(result.scene,null,2));console.log(JSON.stringify(output,null,2));
  await writeFile(out.replace(/\.json$/,'')+'.frames.json',JSON.stringify(result.frame_times_ms));
}finally{await browser.close();}
