import { MAPS, surfacesAt } from './maps.mjs';
export const TUNING = Object.freeze({
  player_speed:6, carry_capacity:10, lantern_cost:10, lantern_count_night1:5,
  pickup_radius:1, interact_radius:2, pulse_cost:3, pulse_radius:5,
  night1_duration_s:240, night2_duration_s:270, night3_duration_s:300,
  flames:3, invuln_s:1.5, hit_drop_ratio:0.5, pulse_stun_s:2,
  pulse_push_m:4, pulse_cooldown_s:3, safe_radius:6, shade_speed:4,
  shade_hit_radius:1, fall_enabled:true, dash_speed:14, dash_duration_s:0.2,
  dash_cooldown_s:1.5,
  fuel_max:100, fuel_decay_per_s:1, fuel_per_mote:10, relight_cost:5,
  win_ratio:.6, drain_per_s:5, low_fuel_threshold:30, capacity_max:20,
  score:{per_mote:5,per_lantern:100,per_relight:40,per_stun:5,per_drain_stun:15,per_lit_at_dawn:50,per_fuel_at_dawn:1,per_second_left:0,per_flame_left:50},
});
export const INITIAL_INPUT = Object.freeze({move:[0,0],cam_yaw_deg:0,jump:false,interact:false,pulse:false,dash:false,pause:false});
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const near=(a,b,r)=>distance(a,b)<=r+1e-9;
const vertical=(a,b)=>Math.abs(a[1]-b[1])<=1.5;
const compareIds = new Intl.Collator('en',{numeric:true}).compare;
const sorted=items=>[...items].sort((a,b)=>compareIds(a.id,b.id));
const direction=(a,b)=>{const d=distance(a,b);return d>1e-9?[(b[0]-a[0])/d,(b[2]-a[2])/d]:[1,0];};
const nextIndex=(items,prefix)=>1+Math.max(0,...items.map(item=>new RegExp(`^${prefix}([0-9]+)$`).exec(item.id)?.[1]??0).map(Number));
const translate=(pos,dir,speed)=>{pos[0]+=dir[0]*speed/60;pos[2]+=dir[1]*speed/60;};
const FUEL_SCALE = 60;
const MAX_FUEL = TUNING.fuel_max * FUEL_SCALE;
const LOW_FUEL = TUNING.low_fuel_threshold * FUEL_SCALE;
export const capacity = player => Math.min(TUNING.capacity_max, TUNING.carry_capacity + 2 * player.successfulLights);
export const fuelValue = lantern => lantern.lit ? Math.round(lantern.fuelUnits / 6) / 10 : 0;
const hasSafeZone = lantern => lantern.lit && lantern.fuelUnits >= LOW_FUEL;
export const lightCost = lantern => lantern.ever_lit ? TUNING.relight_cost : TUNING.lantern_cost;
export function receivingLanterns(game) {
  return sorted(game.lanterns)
    .filter(l => (!l.lit || l.fuelUnits < MAX_FUEL) && near(game.player.pos, l.pos, TUNING.interact_radius))
    .sort((a,b) => distance(game.player.pos,a.pos) - distance(game.player.pos,b.pos));
}
function moveShade(g,shade,dir,speed){const old=[...shade.pos];translate(shade.pos,dir,speed);if(g.map.obstacles.some(o=>near(shade.pos,o.pos,o.radius)&&shade.pos[1]>=o.pos[1]&&shade.pos[1]<o.pos[1]+o.height))shade.pos=old;}
function rng(seed){let n=seed|0;return()=>{n=(n+0x6d2b79f5)|0;let t=Math.imul(n^(n>>>15),1|n);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}

export function createGame(seed=1,scenario={},night=1){
  const map=MAPS[night];if(!map)throw new Error('night must be 1, 2 or 3');
  const random=rng(seed), p=scenario.player??{};
  const lanterns=map.lanterns.map(l=>({...l,pos:[...l.pos],lit:false,deposited:0,fuelUnits:0,ever_lit:false,relit_count:0}));
  for(const patch of scenario.lanterns??[]){
    const l=lanterns.find(l=>l.id===patch.id);if(!l)continue;
    l.pos=[...(patch.pos??l.pos)];l.lit=patch.lit??false;l.deposited=patch.deposited??0;
    l.ever_lit=patch.ever_lit??l.lit;
    l.fuelUnits=l.lit?Math.round((patch.fuel??TUNING.fuel_max)*FUEL_SCALE):0;
  }
  const points=[...map.motePoints];
  for(let i=points.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[points[i],points[j]]=[points[j],points[i]];}
  const motes=(scenario.motes??(scenario.random_motes===false?[]:points.slice(0,20))).map((m,i)=>({id:m.id??`M${i+1}`,pos:[...(Array.isArray(m)?m:m.pos)],kind:m.kind??'random',ttlTicks:m.kind==='dropped'?Math.round((m.ttl_s??8)*60):null,born:0}));
  const shades=(scenario.shades??[]).map((s,i)=>({id:s.id??`S${i+1}`,pos:[...s.pos],state:s.state??'chase',stateTicks:s.state_ticks_left??0,targetLanternId:s.target_lantern_id??null,drainTicks:0,pushTicks:0,pushDir:[1,0],born:0}));
  const charms=(scenario.charms??map.charms).map(c=>({...c,pos:[...(c.pos??map.charms.find(x=>x.id===c.id)?.pos??[0,0,0])],available:c.available??true,respawnTicks:Math.round((c.respawn_s??0)*60)}));
  const drifters=(scenario.drifters??[]).map((d,i)=>({id:d.id??`D${i+1}`,pos:[...d.pos],state:d.state??'idle',stolen:d.stolen??0,stateTicks:d.state_ticks_left??0,born:0}));
  return{night,map,random,tick:0,simTick:0,state:'playing',duration:scenario.time_left_s??TUNING[`night${night}_duration_s`],timeLeft:scenario.time_left_s??TUNING[`night${night}_duration_s`],score:0,
    player:{pos:[...(p.pos??[0,0,0])],vel:[0,0,0],grounded:surfacesAt(night,p.pos?.[0]??0,p.pos?.[2]??0).some(y=>Math.abs(y-(p.pos?.[1]??0))<.001),carried:p.carried??0,flames:p.flames??3,
      successfulLights:p.successful_lights??0,invulnTicks:p.invuln_ticks??0,pulseCooldownTicks:p.pulse_cd_ticks??0,dashCooldownTicks:p.dash_cd_ticks??0,charmTicks:p.charm_ticks??0,dashTicks:0,dashDir:[0,1],facing:[0,1],launch:null,respawnTicks:0},
    lanterns,motes,shades,charms,drifters,wind:{active:false,dir_deg:0},windEnabled:scenario.wind_enabled!==false,
    randomMotes:scenario.random_motes!==false,randomShades:scenario.random_shades!==false,randomDrifters:scenario.random_drifters!==false,
    nextMote:nextIndex(motes,'M'),nextShade:nextIndex(shades,'S'),nextDrifter:nextIndex(drifters,'D')};
}
function drop(g,count,pos){for(let i=0;i<count;i++){const a=g.random()*Math.PI*2,r=1.5+g.random();g.motes.push({id:`M${g.nextMote++}`,pos:[pos[0]+Math.cos(a)*r,pos[1],pos[2]+Math.sin(a)*r],kind:'dropped',ttlTicks:480,born:g.simTick});}}
function hit(g,by,events){const p=g.player;if(by==='shade'&&p.invulnTicks>0)return false;
  p.flames=Math.max(0,p.flames-1);const lost=p.carried;const dropped=by==='fall'?0:Math.floor(lost/2);p.carried-=by==='fall'?lost:dropped;
  if(dropped)drop(g,dropped,p.pos);p.invulnTicks=90;
  if(by==='fall'){p.respawnTicks=60;p.vel=[0,0,0];p.launch=null;p.dashTicks=0;}
  events.push({name:'player_hit',data:{by,flames:p.flames,dropped,...(by==='fall'?{lost}:{})}});return true;
}
function move(g,input,edge,events){const p=g.player;
  if(p.respawnTicks>0){p.respawnTicks--;if(p.respawnTicks===0){p.pos=[0,0,0];p.vel=[0,0,0];p.grounded=true;p.invulnTicks=90;}return;}
  const yaw=input.cam_yaw_deg*Math.PI/180,[x,z]=input.move;let dir=[x*Math.cos(yaw)+z*Math.sin(yaw),-x*Math.sin(yaw)+z*Math.cos(yaw)];const len=Math.hypot(...dir);if(len>1)dir=dir.map(v=>v/len);if(len>0)p.facing=direction([0,0,0],[dir[0],0,dir[1]]);
  if(edge.dash&&p.dashTicks===0&&(p.charmTicks>0||p.dashCooldownTicks===0)){p.dashTicks=12;p.dashDir=[...p.facing];p.dashCooldownTicks=p.charmTicks>0?0:90;events.push({name:'dash',data:{}});}
  if(edge.jump&&p.grounded){p.vel[1]=7;p.grounded=false;}
  if(p.grounded&&!p.launch){const pad=g.map.pads.find(pad=>near(p.pos,pad.pos,1)&&Math.abs(p.pos[1]-pad.pos[1])<.1);if(pad){p.launch=direction(pad.pos,pad.target).map(v=>v*pad.horizontalSpeed);p.vel[1]=pad.verticalSpeed;p.grounded=false;}}
  const speed=p.charmTicks>0?7.2:6;
  const horizontal=p.dashTicks>0?p.dashDir.map(v=>v*14):p.launch??dir.map(v=>v*speed);
  const old=[...p.pos];p.vel[0]=horizontal[0];p.vel[2]=horizontal[1];
  p.pos[0]+=horizontal[0]/60;p.pos[2]+=horizontal[1]/60;
  if(g.wind.active){const a=g.wind.dir_deg*Math.PI/180;p.pos[0]+=Math.cos(a)*2/60;p.pos[2]+=Math.sin(a)*2/60;}
  if(p.dashTicks>0)p.dashTicks--;else if(!p.grounded){p.pos[1]+=p.vel[1]/60;p.vel[1]-=20/60;}
  let surfaces=surfacesAt(g.night,p.pos[0],p.pos[2]);
  // Ground movement cannot step up a vertical wall; a ramp may rise by 0.2m/tick.
  if(p.grounded&&surfaces.some(y=>y>old[1]+.2&&!surfacesAt(g.night,old[0],old[2]).some(previous=>Math.abs(previous-y)<.001))){
    p.pos[0]=old[0];p.pos[2]=old[2];surfaces=surfacesAt(g.night,old[0],old[2]);
  }
  const landing=surfaces.filter(y=>y<=old[1]+.2&&y>=p.pos[1]-.05).at(-1);
  if((p.vel[1]<=0||p.grounded)&&landing!==undefined){p.pos[1]=landing;p.vel[1]=0;p.grounded=true;p.launch=null;}
  else if(p.grounded){p.grounded=false;p.vel[1]=0;}
  for(const obstacle of g.map.obstacles){if(near(p.pos,obstacle.pos,obstacle.radius)&&p.pos[1]>=obstacle.pos[1]&&p.pos[1]<obstacle.pos[1]+obstacle.height){p.pos[0]=old[0];p.pos[2]=old[2];}}
  if(p.pos[1]<-10)hit(g,'fall',events);
}
function collect(g,events){const p=g.player;if(p.respawnTicks)return;
  for(const m of [...g.motes])if(m.born<g.simTick&&p.carried<capacity(p)&&near(p.pos,m.pos,1)&&vertical(p.pos,m.pos)){g.motes.splice(g.motes.indexOf(m),1);p.carried++;events.push({name:'mote_picked',data:{carried:p.carried}});}
  for(const c of g.charms)if(c.available&&near(p.pos,c.pos,1)&&vertical(p.pos,c.pos)){c.available=false;c.respawnTicks=2700;p.charmTicks=600;events.push({name:'charm_picked',data:{charm_id:c.id,charm_ticks:600}});}
}
function interact(g,events){
  const p=g.player;if(p.respawnTicks)return;const l=receivingLanterns(g)[0];if(!l||p.carried===0)return;
  if(l.lit){
    const amount=Math.min(p.carried,Math.ceil((MAX_FUEL-l.fuelUnits)/(TUNING.fuel_per_mote*FUEL_SCALE)));
    if(amount===0)return;
    p.carried-=amount;l.fuelUnits=Math.min(MAX_FUEL,l.fuelUnits+amount*TUNING.fuel_per_mote*FUEL_SCALE);g.score+=amount*TUNING.score.per_mote;
    events.push({name:'refuel',data:{lantern_id:l.id,amount,fuel:fuelValue(l)}});return;
  }
  const cost=lightCost(l),amount=Math.min(p.carried,cost-l.deposited);if(amount<=0)return;
  p.carried-=amount;l.deposited+=amount;g.score+=amount*TUNING.score.per_mote;
  events.push({name:'deposit',data:{lantern_id:l.id,amount,deposited:l.deposited}});
  if(l.deposited===cost){
    const relight=l.ever_lit;l.lit=true;l.fuelUnits=MAX_FUEL;l.ever_lit=true;
    if(relight)l.relit_count++;
    p.successfulLights++;g.score+=relight?TUNING.score.per_relight:TUNING.score.per_lantern;
    events.push({name:'lantern_lit',data:{lantern_id:l.id,relight}});
  }
}

function updateFuel(g,events){
  // 60 integer units = 1 fuel. All drains in this stage are accumulated before
  // extinguishing, so several shades act on the same pre-movement state.
  for(const l of g.lanterns)if(l.lit)l.fuelUnits-=TUNING.fuel_decay_per_s;
  const draining=[];
  for(const s of sorted(g.shades)){
    const l=g.lanterns.find(l=>l.id===s.targetLanternId);
    if(s.state==='drain'&&l?.lit&&l.fuelUnits<LOW_FUEL&&near(s.pos,l.pos,2)){
      l.fuelUnits-=TUNING.drain_per_s;s.drainTicks=(s.drainTicks??0)+1;
      if(s.drainTicks%60===0)draining.push([s,l]);
    }else s.drainTicks=0;
  }
  for(const [s,l]of draining)events.push({name:'fuel_drain',data:{lantern_id:l.id,shade_id:s.id,fuel:Math.max(0,fuelValue(l))}});
  for(const l of g.lanterns)if(l.lit&&l.fuelUnits<=0){
    l.lit=false;l.fuelUnits=0;l.deposited=0;
    events.push({name:'lantern_out',data:{lantern_id:l.id}});
  }
}
function pulse(g,events){const p=g.player;if(p.respawnTicks||p.carried<3||p.pulseCooldownTicks)return;p.carried-=3;p.pulseCooldownTicks=180;const ids=[];
  const inRange=pos=>Math.hypot(pos[0]-p.pos[0],pos[1]-p.pos[1]-.8,pos[2]-p.pos[2])<=5+1e-9;
  for(const s of sorted(g.shades))if(inRange(s.pos)){const wasDraining=s.state==='drain';s.state='stunned';s.stateTicks=120;s.pushTicks=15;s.pushDir=direction(p.pos,s.pos);s.drainTicks=0;ids.push(s.id);g.score+=wasDraining?TUNING.score.per_drain_stun:TUNING.score.per_stun;}
  for(const d of g.drifters)if(inRange(d.pos)){
    if(d.state==='chase'){d.state='flee';d.stateTicks=240;}
    else if(d.state==='flee'&&d.stolen>0){const amount=d.stolen;drop(g,amount,d.pos);d.stolen=0;d.stateTicks=120;events.push({name:'drifter_drop',data:{drifter_id:d.id,amount}});}
  }
  events.push({name:'pulse',data:{stunned_ids:ids}});
}
function enemies(g,events){const p=g.player;
  for(const s of sorted(g.shades)){
    const protectedBy=g.lanterns.find(l=>hasSafeZone(l)&&near(s.pos,l.pos,6));
    s.safe=Boolean(protectedBy);
    if(protectedBy){if(s.state==='drain'){s.state='wander';s.drainTicks=0;}const dir=direction(protectedBy.pos,s.pos);const d=distance(protectedBy.pos,s.pos);translate(s.pos,dir,Math.max(.1,(6-d)*60/Math.max(1,s.safeTicks??30)));s.safeTicks=Math.max(1,(s.safeTicks??30)-1);}
    else{s.safeTicks=30;if(s.pushTicks>0){moveShade(g,s,s.pushDir,4*60/15);s.pushTicks--;}
      else if(s.state==='recoil'){moveShade(g,s,s.pushDir,2);}
      else if(s.state!=='stunned'&&s.state!=='spawning'){
        const d=distance(s.pos,p.pos);
        if(s.state==='drain'){
          const target=g.lanterns.find(l=>l.id===s.targetLanternId);
          if(d<=6){s.state='chase';s.drainTicks=0;}
          else if(!target?.lit||target.fuelUnits>=LOW_FUEL||!near(s.pos,target.pos,2)){s.state='wander';s.drainTicks=0;}
        }else if(s.state==='chase'&&d>18)s.state='wander';
        else if(d<=12&&!s.justRecovered)s.state='chase';
        let target=null;
        if(s.state==='wander'){
          const weak=sorted(g.lanterns).filter(l=>l.lit&&l.fuelUnits<LOW_FUEL);
          const candidates=weak.length?weak:sorted(g.lanterns).filter(l=>!l.lit);
          target=candidates.sort((a,b)=>distance(s.pos,a.pos)-distance(s.pos,b.pos))[0];
          s.targetLanternId=target?.id??null;
          if(target?.lit&&near(s.pos,target.pos,2)){s.state='drain';s.drainTicks=0;}
        }
        if(s.state!=='drain'){
          const dir=s.state==='chase'?direction(s.pos,p.pos):target?direction(s.pos,target.pos):[Math.cos(g.simTick/180),Math.sin(g.simTick/180)];
          const old=[...s.pos];moveShade(g,s,dir,g.night===3?4.5:4);
          if(g.lanterns.some(l=>hasSafeZone(l)&&near(s.pos,l.pos,6)))s.pos=old;
          if(s.state==='wander'&&target?.lit&&near(s.pos,target.pos,2)){s.state='drain';s.drainTicks=0;}
        }
      }
    }
  }
  for(const d of sorted(g.drifters)){
    if(d.state==='removed')continue;
    if(d.state==='idle'||d.state==='chase')d.state=p.carried>=5&&near(p.pos,d.pos,15)?'chase':'idle';
    if(d.state==='flee'){translate(d.pos,direction(p.pos,d.pos),7);if(d.stateTicks<=0)d.state='removed';}
    else if(d.state==='chase')translate(d.pos,direction(d.pos,p.pos),7);
    else translate(d.pos,[Math.cos(g.simTick/120),Math.sin(g.simTick/120)],2);
    if(!p.respawnTicks&&d.state==='chase'&&near(p.pos,d.pos,1.2)){const amount=Math.min(3,p.carried);p.carried-=amount;d.stolen=amount;d.state='flee';d.stateTicks=240;events.push({name:'drifter_steal',data:{drifter_id:d.id,amount,carried:p.carried}});}
  }
  g.drifters=g.drifters.filter(d=>d.state!=='removed');
  if(!p.respawnTicks)for(const s of sorted(g.shades))if(!s.safe&&s.state!=='stunned'&&s.state!=='spawning'&&s.state!=='recoil'&&near(p.pos,s.pos,1)&&vertical(p.pos,s.pos)){
    if(hit(g,'shade',events)){s.state='recoil';s.stateTicks=60;s.pushDir=direction(p.pos,s.pos);}break;
  }
}
function spawn(g,events){const t=g.simTick;
  if(g.randomMotes&&t%240===0&&g.motes.length<30){const free=g.map.motePoints.filter(pos=>!g.motes.some(m=>distance(m.pos,pos)<.1));if(free.length){const pos=free[Math.floor(g.random()*free.length)];g.motes.push({id:`M${g.nextMote++}`,pos:[...pos],kind:'random',ttlTicks:null,born:t});}}
  if(g.randomShades&&t>=300&&(t===300||(t-300)%g.map.shadeIntervalTicks===0)){
    for(let i=0;i<(t===300?2:1)&&g.shades.length<g.map.shadeLimit;i++){const points=g.map.shadePoints.filter(pos=>distance(pos,g.player.pos)>=15);if(!points.length)break;const pos=points[Math.floor(g.random()*points.length)];const id=`S${g.nextShade++}`;g.shades.push({id,pos:[...pos],state:'spawning',stateTicks:60,pushTicks:0,pushDir:[1,0],born:t});events.push({name:'shade_spawned',data:{id}});}
  }
  if(g.night>1&&g.randomDrifters&&t%1200===0&&g.drifters.length<2){const pos=g.map.shadePoints[Math.floor(g.random()*g.map.shadePoints.length)];g.drifters.push({id:`D${g.nextDrifter++}`,pos:[...pos],state:'idle',stolen:0,stateTicks:0,born:t});}
}
export function step(g,input,previous=INITIAL_INPUT){if(g.state==='won'||g.state==='lost')return[];
  const events=[];const edge=Object.fromEntries(['jump','dash','pulse','interact','pause'].map(k=>[k,input[k]&&!previous[k]]));g.tick++;
  if(edge.pause){g.state=g.state==='paused'?'playing':'paused';events.push({name:g.state==='paused'?'paused':'resumed',data:{}});}
  if(g.state==='paused')return events.map(e=>({type:'event',tick:g.tick,...e}));
  g.simTick++;g.timeLeft=Math.max(0,g.duration-g.simTick/60);const p=g.player;
  for(const key of ['invulnTicks','pulseCooldownTicks','dashCooldownTicks','charmTicks'])p[key]=Math.max(0,p[key]-1);
  for(const s of g.shades){s.justRecovered=false;if(s.stateTicks>0)s.stateTicks--;if(s.stateTicks===0&&['stunned','recoil','spawning'].includes(s.state)){s.justRecovered=s.state==='stunned';s.state='wander';}}
  for(const d of g.drifters)if(d.stateTicks>0)d.stateTicks--;
  for(const m of g.motes)if(m.ttlTicks!==null)m.ttlTicks--;g.motes=g.motes.filter(m=>m.ttlTicks===null||m.ttlTicks>0);
  for(const c of g.charms)if(!c.available){c.respawnTicks=Math.max(0,c.respawnTicks-1);if(!c.respawnTicks)c.available=true;}
  updateFuel(g,events);
  if(g.night===3&&g.windEnabled){const phase=g.simTick%1800;if(phase===0)g.wind.dir_deg=g.random()*360;g.wind.active=g.simTick>=1800&&phase<300;}else g.wind.active=false;
  move(g,input,edge,events);collect(g,events);if(edge.interact)interact(g,events);if(edge.pulse)pulse(g,events);enemies(g,events);spawn(g,events);
  let result;if(p.flames<=0)result=['lost','no_flames'];else if(g.timeLeft<=0){
    const lit=g.lanterns.filter(l=>l.lit);
    result=lit.length>=Math.ceil(TUNING.win_ratio*g.lanterns.length)?['won','dawn_survived']:['lost','dawn'];
  }
  if(result){g.state=result[0];if(g.state==='won'){
    g.score+=g.lanterns.filter(l=>l.lit).reduce((sum,l)=>sum+TUNING.score.per_lit_at_dawn+Math.floor(l.fuelUnits/FUEL_SCALE),0)+p.flames*TUNING.score.per_flame_left;
  }events.push({name:'game_over',data:{result:result[0],reason:result[1]}});}
  return events.map(e=>({type:'event',tick:g.tick,...e}));
}
const round=v=>Math.round(v*1000)/1000;
const pos=p=>p.map(round);
export function snapshot(g){const p=g.player;return{type:'snapshot',tick:g.tick,sim_tick:g.simTick,night:g.night,state:g.state,time_left_s:Math.round(g.timeLeft*1e6)/1e6,score:g.score,wind:{...g.wind},
  player:{pos:pos(p.pos),vel:pos(p.vel),grounded:p.grounded,flames:p.flames,carried:p.carried,capacity:capacity(p),invuln:p.invulnTicks>0,dash_cd_s:p.dashCooldownTicks/60,pulse_cd_s:p.pulseCooldownTicks/60,charm_s:p.charmTicks/60},
  lanterns:g.lanterns.map(l=>({id:l.id,pos:pos(l.pos),lit:l.lit,deposited:l.deposited,fuel:fuelValue(l),ever_lit:l.ever_lit,relit_count:l.relit_count})),shades:g.shades.map(s=>({id:s.id,pos:pos(s.pos),state:s.state})),
  motes_active:g.motes.length,motes:g.motes.map(m=>({id:m.id,pos:pos(m.pos),kind:m.kind,ttl_s:m.ttlTicks===null?null:m.ttlTicks/60})),
  drifters:g.drifters.map(d=>({id:d.id,pos:pos(d.pos),state:d.state,stolen:d.stolen})),charms:g.charms.map(c=>({id:c.id,available:c.available,respawn_s:c.respawnTicks/60}))};}
