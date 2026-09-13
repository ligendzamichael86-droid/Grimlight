// Prototyp "Horden-Bogen": 30 Gegner auf einer Gruft-Karte, Y-Sort, Ueberlapp.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { PALETTE } from '/home/coder/Grimlight/game/js/art/palette.js';
import { SPRITES } from '/home/coder/Grimlight/game/js/art/sprites_figuren.js';
import { TILE_ART } from '/home/coder/Grimlight/game/js/art/sprites_tiles.js';
const hexRgb = s => [parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
const CRC_TAB=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xffffffff;for(const x of b)c=CRC_TAB[(c^x)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type,'ascii'),data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(td));return Buffer.concat([len,td,crc]);}
function pngBytes(w,h,rgba){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;rgba.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);}
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
function leinwand(w,h){return {w,h,px:Buffer.alloc(w*h*4)};}
function setPx(cv,x,y,rgb,a=255){if(x<0||y<0||x>=cv.w||y>=cv.h)return;const i=(y*cv.w+x)*4;
 if(a>=255){cv.px[i]=rgb[0];cv.px[i+1]=rgb[1];cv.px[i+2]=rgb[2];cv.px[i+3]=255;}
 else{const f=a/255;cv.px[i]=Math.round(cv.px[i]*(1-f)+rgb[0]*f);cv.px[i+1]=Math.round(cv.px[i+1]*(1-f)+rgb[1]*f);cv.px[i+2]=Math.round(cv.px[i+2]*(1-f)+rgb[2]*f);cv.px[i+3]=255;}}
function kachle(cv,keys){for(let y=0;y<cv.h;y++)for(let x=0;x<cv.w;x++){
 const tx=Math.floor(x/16),ty=Math.floor(y/16);const g=TILE_ART[keys[(tx*7+ty*11)%keys.length]];
 const ch=g[y%16][x%16];if(ch==='.')continue;setPx(cv,x,y,hexRgb(PALETTE[ch]));}}
function zeichne(cv,ox,oy,grid,flip=false,weiss=null){const H=grid.length,W=grid[0].length;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const ch=grid[y][flip?W-1-x:x];if(ch==='.')continue;
  setPx(cv,ox+x,oy+y, weiss?weiss:hexRgb(PALETTE[ch]));}}
function schatten(cv,cx,baseY,w,big=false){
 const ws=big?[0.90,0.95,0.85,0.65,0.40]:[0.90,0.95,0.70,0.40];
 const as=big?[0.34,0.44,0.36,0.24,0.12]:[0.34,0.40,0.20,0.10];
 const dys=big?[-1,0,1,2,3]:[-1,0,1,2];
 for(let i=0;i<ws.length;i++){const ww=Math.max(1,Math.round(w*ws[i]));
  for(let x=Math.round(cx-ww/2);x<Math.round(cx-ww/2)+ww;x++) setPx(cv,x,baseY-dys[i],[0,0,0],Math.round(as[i]*255));}}
function nnHoch(cv,f){const o=leinwand(cv.w*f,cv.h*f);
 for(let y=0;y<o.h;y++)for(let x=0;x<o.w;x++){const i=((Math.floor(y/f))*cv.w+Math.floor(x/f))*4,j=(y*o.w+x)*4;
  o.px[j]=cv.px[i];o.px[j+1]=cv.px[i+1];o.px[j+2]=cv.px[i+2];o.px[j+3]=255;}return o;}
function nnHalb(cv){const o=leinwand(Math.floor(cv.w/2),Math.floor(cv.h/2));
 for(let y=0;y<o.h;y++)for(let x=0;x<o.w;x++){const i=((y*2)*cv.w+x*2)*4,j=(y*o.w+x)*4;
  o.px[j]=cv.px[i];o.px[j+1]=cv.px[i+1];o.px[j+2]=cv.px[i+2];o.px[j+3]=255;}return o;}

// deterministische Hordenaufstellung
const TYPEN=[
 {k:'skeleton',key:'skeleton_0',aabb:[12,14],n:12},
 {k:'ghoul',key:'ghoul_0',aabb:[14,14],n:8},
 {k:'hound',key:'hound_0',aabb:[14,12],n:5},
 {k:'rust',key:'rust_0',aabb:[14,16],n:4},
 {k:'warden',key:'warden_idle',aabb:[20,24],n:1},
];
let seed=12345; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
const ents=[];
for(const t of TYPEN)for(let i=0;i<t.n;i++){
 const x=20+rnd()*(320-60), y=24+rnd()*(180-60);
 ents.push({...t,x,y,flip:rnd()<0.5});}
ents.sort((a,b)=>(a.y+a.aabb[1])-(b.y+b.aabb[1]));

function baue({rim=false,flash=null,boden}){
 const cv=leinwand(320,180); kachle(cv,boden);
 for(const e of ents) schatten(cv,e.x+e.aabb[0]/2,Math.round(e.y+e.aabb[1]-1),e.aabb[0],e.aabb[0]>=18&&e.aabb[1]>=20);
 ents.forEach((e,i)=>{const g=SPRITES[e.key];
  const ox=Math.round(e.x+e.aabb[0]/2-g[0].length/2), oy=Math.round(e.y+e.aabb[1]-g.length);
  const w = flash!==null && i%flash===0 ? [255,255,255] : null;
  zeichne(cv,ox,oy,g,e.flip,w);});
 return cv;}
const GRUFT=['stone_floor','stone_floor_v1','stone_floor_v2','stone_floor_v3','stone_floor_cracked'];
const GRAS=['grass_g5_00'];
const OUT='/tmp/claude-1000/-home-coder/2135f5db-b185-41ca-95a9-9bd4f9302d40/scratchpad/';
for(const [tag,boden] of [['gruft',GRUFT],['gras',GRAS]]){
 const cv=baue({boden});
 writeFileSync(OUT+`horde_${tag}_1x.png`,pngBytes(cv.w,cv.h,cv.px));
 const s6=nnHoch(cv,4); writeFileSync(OUT+`horde_${tag}_4x.png`,pngBytes(s6.w,s6.h,s6.px));
 const sq=nnHoch(nnHalb(cv),4); writeFileSync(OUT+`horde_${tag}_squint.png`,pngBytes(sq.w,sq.h,sq.px));
}
const fl=baue({boden:GRUFT,flash:3});
writeFileSync(OUT+'horde_gruft_flash_4x.png',pngBytes(nnHoch(fl,4).w,nnHoch(fl,4).h,nnHoch(fl,4).px));

// Messung: Schwarzanteil der Szene + Ueberlapp-Rate
function messe(){
 const belegt=new Map();let schwarz=0,gegnerTexel=0;
 ents.forEach((e,i)=>{const g=SPRITES[e.key];const W=g[0].length,H=g.length;
  const ox=Math.round(e.x+e.aabb[0]/2-W/2),oy=Math.round(e.y+e.aabb[1]-H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const ch=g[y][e.flip?W-1-x:x];if(ch==='.')continue;
   gegnerTexel++; if(ch==='k'||ch==='n')schwarz++;
   const kx=(oy+y)*400+(ox+x); if(!belegt.has(kx))belegt.set(kx,[]); belegt.get(kx).push(i);}});
 let verdeckt=0; for(const v of belegt.values()) if(v.length>1) verdeckt+=v.length-1;
 // Beruehrung: wie viele Gegner teilen mind. 1 Texelposition mit einem anderen
 const beruehrt=new Set(); for(const v of belegt.values()) if(v.length>1) v.forEach(i=>beruehrt.add(i));
 return {gegnerTexel,schwarz,schwarzPct:100*schwarz/gegnerTexel,ueberlappTexel:verdeckt,
   ueberlapptePct:100*beruehrt.size/ents.length,flaecheAnteil:100*belegt.size/(320*180)};}
console.log(JSON.stringify(messe(),null,1));
console.log('Gegner gesamt', ents.length);
