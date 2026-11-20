export const HEX = Object.freeze({
  sky:'#0E1430',fog:'#1B2350',grass:'#2F5D50',sand:'#C9B48A',wood:'#6B4A2F',sea:'#12384A',
  lamp:'#FFB347',lampCore:'#FFE9B0',lampOff:'#5B5F6E',mote:'#FFF6C2',moteHalo:'#FFE58A',
  shade:'#120A1A',shadeEdge:'#7A3CFF',stunned:'#3A3450',coat:'#E8E2D0',red:'#C8102E',
  gold:'#F2C14E',drifter:'#8FA3B8',danger:'#FF5A5F',text:'#F5F1E6',
});
export const color=(name,alpha=1)=>[...HEX[name].slice(1).match(/../g).map(channel=>parseInt(channel,16)/255),alpha];
