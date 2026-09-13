import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { PALETTE } from '/home/coder/Grimlight/game/js/art/palette.js';
import { SPRITES } from '/home/coder/Grimlight/game/js/art/sprites_figuren.js';
import { TILE_ART } from '/home/coder/Grimlight/game/js/art/sprites_tiles.js';
const hexRgb=s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
const CRC_TAB=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xffffffff;for(const x of b)c=CRC_TAB[(c^x)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(t,d){const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t,'ascii'),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc32(td));return Buffer.concat([l,td,c]);}
function png(w,h,px){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;px.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);}
 const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
const cvN=(w,h)=>({w,h,px:Buffer.alloc(w*h*4)});
function sp(cv,x,y,rgb,a=255){if(x<0||y<0||x>=cv.w||y>=cv.h)return;const i=(y*cv.w+x)*4;const f=a/255;
 cv.px[i]=Math.round(cv.px[i]*(1-f)+rgb[0]*f);cv.px[i+1]=Math.round(cv.px[i+1]*(1-f)+rgb[1]*f);cv.px[i+2]=Math.round(cv.px[i+2]*(1-f)+rgb[2]*f);cv.px[i+3]=255;}
function kachle(cv,keys){for(let y=0;y<cv.h;y++)for(let x=0;x<cv.w;x++){const tx=(x/16|0),ty=(y/16|0);
 const g=TILE_ART[keys[(tx*7+ty*11)%keys.length]];const ch=g[y%16][x%16];if(ch==='.')continue;sp(cv,x,y,hexRgb(PALETTE[ch]));}}
function up(cv,f){const o=cvN(cv.w*f,cv.h*f);for(let y=0;y<o.h;y++)for(let x=0;x<o.w;x++){const i=(((y/f|0)*cv.w)+(x/f|0))*4,j=(y*o.w+x)*4;o.px[j]=cv.px[i];o.px[j+1]=cv.px[i+1];o.px[j+2]=cv.px[i+2];o.px[j+3]=255;}return o;}
function half(cv){const o=cvN(cv.w/2|0,cv.h/2|0);for(let y=0;y<o.h;y++)for(let x=0;x<o.w;x++){const i=((y*2)*cv.w+x*2)*4,j=(y*o.w+x)*4;o.px[j]=cv.px[i];o.px[j+1]=cv.px[i+1];o.px[j+2]=cv.px[i+2];o.px[j+3]=255;}return o;}
// Knaeuel: 4 Reihen x 5 Gegner, X-Abstand 7 px (starke X-Ueberlappung), Y-Abstand 5
const REIHEN=[['skeleton_0',12,14],['ghoul_0',14,14],['rust_0',14,16],['skeleton_0',12,14]];
const OUT='/tmp/claude-1000/-home-coder/2135f5db-b185-41ca-95a9-9bd4f9302d40/scratchpad/';
function bild(rim){
 const cv=cvN(120,90); kachle(cv,['stone_floor','stone_floor_v1','stone_floor_v2']);
 const ents=[];
 REIHEN.forEach((r,ri)=>{for(let i=0;i<5;i++) ents.push({key:r[0],w:r[1],h:r[2],x:10+i*9+ri*3,y:14+ri*14});});
 ents.sort((a,b)=>(a.y+a.h)-(b.y+b.h));
 for(const e of ents){const ws=[0.90,0.95,0.70,0.40],as=[0.34,0.40,0.20,0.10],dys=[-1,0,1,2];
  for(let i=0;i<4;i++){const ww=Math.max(1,Math.round(e.w*ws[i]));const x0=Math.round(e.x+e.w/2-ww/2);
   for(let x=x0;x<x0+ww;x++)sp(cv,x,Math.round(e.y+e.h-1)-dys[i],[0,0,0],Math.round(as[i]*255));}}
 for(const e of ents){const g=SPRITES[e.key],W=g[0].length,H=g.length;
  const ox=Math.round(e.x+e.w/2-W/2),oy=Math.round(e.y+e.h-H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const ch=g[y][x];if(ch==='.')continue;sp(cv,ox+x,oy+y,hexRgb(PALETTE[ch]));}
  if(rim){ // Simulation: 1px heller Saum auf der Oberkante jeder Spalte + linke Kante
   for(let x=0;x<W;x++){for(let y=0;y<H;y++){if(g[y][x]!=='.'){sp(cv,ox+x,oy+y,hexRgb(PALETTE['1']));break;}}}
   for(let y=0;y<H;y++){for(let x=0;x<W;x++){if(g[y][x]!=='.'){sp(cv,ox+x,oy+y,hexRgb(PALETTE['1']));break;}}}
  }}
 return cv;}
for(const [tag,rim] of [['ohne',false],['mit',true]]){
 const cv=bild(rim); writeFileSync(OUT+`knaeuel_${tag}rim_4x.png`,png(up(cv,4).w,up(cv,4).h,up(cv,4).px));
 const sq=up(half(cv),4); writeFileSync(OUT+`knaeuel_${tag}rim_squint.png`,png(sq.w,sq.h,sq.px));}
console.log('ok');
