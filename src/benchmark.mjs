import {createGame} from './core.mjs';
function rng(seed){let n=seed>>>0;return()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};}
export function createBenchmark(seed=42){
 const random=rng(seed);const points=n=>Array.from({length:n},(_,i)=>{const a=i*2.399963229728653+random()*.12,r=38*Math.sqrt((i+.5)/n);return[r*Math.cos(a),0,r*Math.sin(a)];});
 const g=createGame(seed,{random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,charms:[],motes:points(100),shades:points(200).map((pos,i)=>({id:`S${i+1}`,pos,state:'wander'})),lanterns:[1,2,3].map(n=>({id:`L${n}`,lit:true,fuel:100}))},1);
 return g;
}
export function stepBenchmark(g){
 g.tick++;g.simTick++;
 // Same wander target policy as ordinary gameplay: no weak lamps, so move
 // toward the nearest unlit lamp, keeping outside active safe regions.
 for(const s of g.shades){
  const target=g.lanterns.filter(l=>!l.lit).sort((a,b)=>Math.hypot(a.pos[0]-s.pos[0],a.pos[2]-s.pos[2])-Math.hypot(b.pos[0]-s.pos[0],b.pos[2]-s.pos[2])||a.id.localeCompare(b.id))[0];
  const safe=g.lanterns.find(l=>l.lit&&Math.hypot(s.pos[0]-l.pos[0],s.pos[2]-l.pos[2])<6);
  if(safe){const dx=s.pos[0]-safe.pos[0],dz=s.pos[2]-safe.pos[2],d=Math.hypot(dx,dz)||1;s.pos[0]+=dx/d*.2;s.pos[2]+=dz/d*.2;continue;}
  const dx=target.pos[0]-s.pos[0],dz=target.pos[2]-s.pos[2],d=Math.hypot(dx,dz);if(d<1e-9)continue;
  const x=s.pos[0]+dx/d*4/60,z=s.pos[2]+dz/d*4/60;
  if(!g.lanterns.some(l=>l.lit&&Math.hypot(x-l.pos[0],z-l.pos[2])<=6)){s.pos[0]=x;s.pos[2]=z;}
 }
}
export function frameMetrics(times){
 if(!times.length)throw new Error('No benchmark frames measured');const sum=times.reduce((a,b)=>a+b,0),sorted=[...times].sort((a,b)=>a-b),k=Math.max(1,Math.ceil(.01*times.length));
 return{avg_fps:1000*times.length/sum,p1_low_fps:1000/(sorted.slice(-k).reduce((a,b)=>a+b,0)/k),frame_ms_p95:sorted[Math.ceil(.95*sorted.length)-1],frames:times.length};
}
