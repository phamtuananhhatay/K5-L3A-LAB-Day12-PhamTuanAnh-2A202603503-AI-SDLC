// Browser-only input adapter. Physical keys remain independent of keyboard
// layout, and a tap between two simulation steps survives until sampled.
const keyNames={w:'KeyW',a:'KeyA',s:'KeyS',d:'KeyD',e:'KeyE',f:'KeyF',q:'KeyQ',r:'KeyR',' ':'Space',Shift:'ShiftLeft',Escape:'Escape',p:'KeyP',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'};
const legacyCodes={65:'KeyA',68:'KeyD',69:'KeyE',70:'KeyF',80:'KeyP',81:'KeyQ',82:'KeyR',83:'KeyS',87:'KeyW',32:'Space',16:'ShiftLeft',27:'Escape',37:'ArrowLeft',39:'ArrowRight'};
export const GAME_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','KeyQ','KeyR','Space','ShiftLeft','ShiftRight','Escape','KeyP','ArrowLeft','ArrowRight']);
export function physicalKey(event){
  if(GAME_KEYS.has(event.code))return event.code;
  if(typeof event.code==='string'&&/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Enter|Tab|Escape|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right))$/.test(event.code))return event.code;
  if(legacyCodes[event.keyCode])return legacyCodes[event.keyCode];
  return keyNames[event.key?.length===1?event.key.toLowerCase():event.key]??null;
}
export class KeyboardInput{
  held=new Set();
  pending=new Set();
  press(code){if(!this.held.has(code))this.pending.add(code);this.held.add(code);}
  release(code){this.held.delete(code);}
  clear(){this.held.clear();this.pending.clear();}
  sample(){const keys=new Set([...this.held,...this.pending]);this.pending.clear();return keys;}
}
