let context, gain, musicTimer;
function loadSettings(){try{return JSON.parse(localStorage.getItem('lantern-settings')||'null')??{};}catch{return {};}}
export const settings = {volume:.35,sensitivity:1,colorblind:false,...loadSettings()};
export function saveSettings(){localStorage.setItem('lantern-settings',JSON.stringify(settings));if(gain)gain.gain.value=settings.volume;}
function init(){if(!context){context=new AudioContext();gain=context.createGain();gain.gain.value=settings.volume;gain.connect(context.destination);}context.resume();}
function tone(frequency,duration=.12,type='sine',level=.15){if(!context)return;const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(level,context.currentTime);g.gain.exponentialRampToValueAtTime(.001,context.currentTime+duration);o.connect(g);g.connect(gain);o.start();o.stop(context.currentTime+duration);}
export function startAudio(){init();if(!musicTimer){let n=0;const notes=[130.81,164.81,196,246.94,196,164.81,146.83,196];musicTimer=setInterval(()=>tone(notes[n++%notes.length],1.7,'sine',.035),1800);}}
export function sound(name){const notes={mote_picked:880,lantern_lit:660,pulse:220,player_hit:110,jump:440,dash:330,won:1046,lost:98,shade_spawned:146,countdown:523,wind:196,charm_picked:990};tone(notes[name]??440,name==='lantern_lit'?.6:.16,name==='player_hit'?'triangle':'sine');}
