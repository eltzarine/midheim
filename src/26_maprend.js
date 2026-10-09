/* ================= Rendu de la carte (statique) ================= */
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath()}
const THEME_PAL=[
  {floor:['#2b2739','#2e2a3e','#292536','#2c283b'],brick:['#3e3756','#443c5e','#39324f','#40395a'],mortar:'#262033',cap:'#5c5379',top:'#16131e',rim:'#25202f',banner:'#8e2f3a',moss:.04},
  {floor:['#29302b','#2c342f','#272e29','#2a322c'],brick:['#36443b','#3b4a40','#324037','#384640'],mortar:'#1f2822',cap:'#56685a',top:'#121813',rim:'#1f2721',banner:'#2f5e8e',moss:.2},
  {floor:['#33282b','#372b2e','#302528','#352a2c'],brick:['#4a3233','#523838','#45302f','#4e3535'],mortar:'#2a1c1d',cap:'#71504c',top:'#1a1112',rim:'#2b1d1e',banner:'#6b3f8e',moss:0},
  {floor:['#262230','#29243a','#231f2d','#27223a'],brick:['#33293f','#3a2f48','#2e2639','#372c44'],mortar:'#1c1726',cap:'#4f4166',top:'#0f0c15',rim:'#1f1a29',banner:'#5a1f2a',moss:0},
  {floor:['#6b4a2c','#70502f','#664628','#6e4d2d'],brick:['#8a6a48','#93724e','#7f6140','#8d6d4a'],mortar:'#4a3420',cap:'#a07a4c',top:'#2a1d12',rim:'#3e2a18',banner:'#7a2a2a',moss:0}];
function renderMap(m){
  const c=document.createElement('canvas');c.width=m.W*TS;c.height=m.H*TS;const g=c.getContext('2d');const R=mulberry((m.f|0)*77+3);const P=THEME_PAL[m.theme||0];
  const T=(tx,ty)=>(tx<0||ty<0||tx>=m.W||ty>=m.H)?1:m.t[ty*m.W+tx];const W1=(tx,ty)=>T(tx,ty)===1;
  const torchAt=new Set(m.torches.map(t=>t.x+','+t.y));
  const rug=new Set();for(const r of m.rooms){if(R()<.32&&r.w>=9&&r.h>=7&&(!m.vault||r!==m.vault)){for(let y=r.y+2;y<r.y+r.h-2;y++)for(let x=r.x+2;x<r.x+r.w-2;x++)rug.add(x+','+y);r.rug=true}}
  // sols
  for(let ty=0;ty<m.H;ty++)for(let tx=0;tx<m.W;tx++){if(W1(tx,ty))continue;const px=tx*TS,py=ty*TS;
    g.fillStyle=P.floor[Math.floor(R()*4)];g.fillRect(px,py,TS,TS);
    if(R()<.3){g.fillStyle='rgba(0,0,0,.22)';g.fillRect(px+15,py,1.5,TS)}
    g.fillStyle='rgba(255,255,255,.045)';g.fillRect(px,py,TS,1.5);g.fillRect(px,py,1.5,TS);g.fillStyle='rgba(0,0,0,.28)';g.fillRect(px,py+TS-1.5,TS,1.5);g.fillRect(px+TS-1.5,py,1.5,TS)}
  // tapis
  for(const r of m.rooms){if(!r.rug)continue;const x0=(r.x+2)*TS+4,y0=(r.y+2)*TS+4,w=(r.w-4)*TS-8,h=(r.h-4)*TS-8;
    g.fillStyle='rgba(0,0,0,.3)';g.fillRect(x0+3,y0+4,w,h);g.fillStyle='#5b1f27';g.fillRect(x0,y0,w,h);g.strokeStyle='#c9a23a';g.lineWidth=3;g.strokeRect(x0+5,y0+5,w-10,h-10);g.lineWidth=1;g.strokeStyle='#8a3a42';g.strokeRect(x0+11,y0+11,w-22,h-22);
    g.fillStyle='#c9a23a';for(let k=x0+16;k<x0+w-12;k+=14){g.fillRect(k,y0+2,3,3);g.fillRect(k,y0+h-5,3,3)}
    g.fillStyle='rgba(201,162,58,.25)';const cx=x0+w/2,cy=y0+h/2;g.beginPath();g.moveTo(cx,cy-18);g.lineTo(cx+26,cy);g.lineTo(cx,cy+18);g.lineTo(cx-26,cy);g.closePath();g.fill();
    g.fillStyle='#e0c27a';for(let k=x0+2;k<x0+w;k+=5){g.fillRect(k,y0-3,1.5,3);g.fillRect(k,y0+h,1.5,3)}}
  // détails au sol
  for(let ty=0;ty<m.H;ty++)for(let tx=0;tx<m.W;tx++){const v=T(tx,ty);if(v===1)continue;const px=tx*TS,py=ty*TS;const onRug=rug.has(tx+','+ty);
    if(!onRug&&v===0&&m.kind!=='house'){const q=R();
      if(q<P.moss+.03){g.fillStyle='rgba(98,150,70,.45)';for(let k=0;k<7;k++){g.beginPath();g.arc(px+6+R()*20,py+6+R()*20,1.5+R()*2.5,0,6.28);g.fill()}}
      else if(q<P.moss+.09){g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=1;g.beginPath();let x=px+4+R()*10,y=py+4+R()*8;g.moveTo(x,y);for(let k=0;k<3;k++){x+=4+R()*5;y+=3+R()*5;g.lineTo(x,y)}g.stroke()}
      else if(q<P.moss+.19){g.fillStyle='rgba(255,255,255,.08)';for(let k=0;k<3;k++)g.fillRect(px+3+R()*24,py+3+R()*24,2,2)}
      else if(q<P.moss+.215){g.strokeStyle='#d8d0bc';g.lineWidth=2;const cx=px+16,cy=py+16;g.beginPath();g.moveTo(cx-7,cy-4);g.lineTo(cx+7,cy+4);g.moveTo(cx-7,cy+4);g.lineTo(cx+7,cy-4);g.stroke();g.fillStyle='#d8d0bc';for(const[a,b]of[[-7,-4],[7,4],[-7,4],[7,-4]]){g.beginPath();g.arc(cx+a,cy+b,1.8,0,6.28);g.fill()}}
      else if(q<P.moss+.222){const cx=px+16,cy=py+17;g.fillStyle='#ddd5c0';g.beginPath();g.arc(cx,cy,5,0,6.28);g.fill();g.fillRect(cx-3,cy+2,6,4);g.fillStyle='#1b1620';g.fillRect(cx-3,cy-1,2,2);g.fillRect(cx+1,cy-1,2,2)}
      else if(q<P.moss+.24){g.fillStyle='rgba(90,120,190,.22)';g.beginPath();g.ellipse(px+16,py+18,11,5,0,0,6.28);g.fill();g.fillStyle='rgba(200,220,255,.25)';g.fillRect(px+10,py+16,6,1)}}
    if(T(tx,ty-1)===1){g.fillStyle='rgba(0,0,0,.34)';g.fillRect(px,py,TS,9);g.fillStyle='rgba(0,0,0,.15)';g.fillRect(px,py+9,TS,5)}
    if(T(tx-1,ty)===1){g.fillStyle='rgba(0,0,0,.2)';g.fillRect(px,py,6,TS)}
    if(T(tx,ty-1)===1&&T(tx-1,ty)===1&&R()<.4){g.strokeStyle='rgba(230,230,240,.28)';g.lineWidth=.8;g.beginPath();for(let k=0;k<4;k++){const a=k/3*Math.PI/2;g.moveTo(px,py);g.lineTo(px+Math.cos(a)*14,py+Math.sin(a)*14)}for(const rr2 of[5,10]){g.moveTo(px+rr2,py);g.quadraticCurveTo(px+rr2*.6,py+rr2*.6,px,py+rr2)}g.stroke()}
    if(T(tx,ty-1)===1&&T(tx+1,ty)===1&&R()<.3){g.strokeStyle='rgba(230,230,240,.25)';g.lineWidth=.8;g.beginPath();for(let k=0;k<4;k++){const a=Math.PI/2+k/3*Math.PI/2;g.moveTo(px+TS,py);g.lineTo(px+TS+Math.cos(a)*14,py+Math.sin(a)*14)}g.stroke()}
    if(v===3){for(let k=0;k<5;k++){g.fillStyle=['#1d1928','#17141f','#110f18','#0c0a12','#07060b'][k];g.fillRect(px-2+k*3,py-2+k*3,TS+4-k*6,TS+4-k*6);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(px-2+k*3,py-2+k*3,TS+4-k*6,1)}}
    if(v===4){g.fillStyle='#2a2638';g.fillRect(px+3,py+3,TS-6,TS-6);g.fillStyle='#57507a';g.fillRect(px+5,py+5,TS-10,TS-10);g.fillStyle='#6d6596';g.fillRect(px+5,py+5,TS-10,2);g.strokeStyle='rgba(127,240,232,.35)';g.lineWidth=1;g.beginPath();g.arc(px+16,py+16,6,0,6.28);g.moveTo(px+16,py+8);g.lineTo(px+16,py+24);g.moveTo(px+8,py+16);g.lineTo(px+24,py+16);g.stroke()}
    if(v===5){g.fillStyle='#1b1826';g.fillRect(px+3,py+3,TS-6,TS-6);g.fillStyle='#0d0b13';for(let a=0;a<3;a++)for(let b=0;b<3;b++){g.beginPath();g.arc(px+8+a*8,py+8+b*8,2.2,0,6.28);g.fill()}g.strokeStyle='#3a3450';g.lineWidth=1;g.strokeRect(px+3.5,py+3.5,TS-7,TS-7)}
  }
  // murs
  for(let ty=0;ty<m.H;ty++)for(let tx=0;tx<m.W;tx++){if(!W1(tx,ty))continue;const px=tx*TS,py=ty*TS;
    if(!W1(tx,ty+1)){
      g.fillStyle=P.mortar;g.fillRect(px,py,TS,TS);
      for(let r=0;r<3;r++){const yy=py+6+r*8;const off=((r+tx)%2)*8;for(let bx=-off;bx<TS;bx+=16){const x0=Math.max(px,px+bx),x1=Math.min(px+TS,px+bx+15);if(x1<=x0)continue;g.fillStyle=P.brick[Math.floor(R()*4)];g.fillRect(x0,yy,x1-x0,7);g.fillStyle='rgba(255,255,255,.07)';g.fillRect(x0,yy,x1-x0,1);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x0,yy+6,x1-x0,1)}}
      g.fillStyle=P.cap;g.fillRect(px,py,TS,5);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(px,py,TS,1);g.fillStyle='rgba(0,0,0,.45)';g.fillRect(px,py+TS-3,TS,3);
      if(!torchAt.has(tx+','+ty)){const q=R();
        if(q<.05){g.fillStyle='#2b1e14';g.fillRect(px+8,py+5,16,2);g.fillStyle=P.banner;g.beginPath();g.moveTo(px+9,py+7);g.lineTo(px+23,py+7);g.lineTo(px+23,py+27);g.lineTo(px+16,py+22);g.lineTo(px+9,py+27);g.closePath();g.fill();g.fillStyle='rgba(0,0,0,.25)';g.fillRect(px+20,py+7,3,18);g.fillStyle='#e0b23a';g.beginPath();g.arc(px+16,py+14,3.5,0,6.28);g.fill();g.fillStyle=P.banner;g.beginPath();g.arc(px+16,py+14,1.5,0,6.28);g.fill()}
        else if(q<.08){g.fillStyle='#0d0b12';g.beginPath();g.arc(px+16,py+18,7,Math.PI,0);g.lineTo(px+23,py+27);g.lineTo(px+9,py+27);g.fill();g.fillStyle='#ddd5c0';g.beginPath();g.arc(px+16,py+21,4,0,6.28);g.fill();g.fillStyle='#0d0b12';g.fillRect(px+14,py+20,1.5,1.5);g.fillRect(px+17,py+20,1.5,1.5)}
        else if(q<.11){g.strokeStyle='#6d6a78';g.lineWidth=1.5;for(const cx of[px+10,px+22]){for(let k=0;k<4;k++){g.beginPath();g.ellipse(cx,py+8+k*5,1.6,2.6,0,0,6.28);g.stroke()}}}
        else if(q<.19){g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=1;g.beginPath();let x=px+6+R()*20,y=py+6;g.moveTo(x,y);for(let k=0;k<3;k++){x+=R()*8-4;y+=6;g.lineTo(x,y)}g.stroke()}
        else if(q<.19+P.moss){g.fillStyle='rgba(98,150,70,.55)';for(let k=0;k<4;k++){const x=px+3+R()*26;g.fillRect(x,py+4,3,4+R()*10)}}}
    }else{
      g.fillStyle=P.top;g.fillRect(px,py,TS,TS);if(R()<.3){g.fillStyle='rgba(255,255,255,.025)';g.fillRect(px+R()*24,py+R()*24,8,6)}
      g.fillStyle=P.rim;if(!W1(tx-1,ty))g.fillRect(px,py,3,TS);if(!W1(tx+1,ty))g.fillRect(px+TS-3,py,3,TS);if(!W1(tx,ty-1))g.fillRect(px,py,TS,3)}
  }
  // décors (tonneaux, caisses, jarres, bougies)
  for(const q of m.props||[]){const px=q.x*TS,py=q.y*TS;g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(px+16,py+27,12,4,0,0,6.28);g.fill();
    if(q.k===0){g.fillStyle='#6e4422';rr(g,px+6,py+5,20,23,6);g.fill();g.fillStyle='#8a5a2b';g.fillRect(px+10,py+5,4,23);g.fillStyle='#3a3a44';g.fillRect(px+6,py+9,20,2.5);g.fillRect(px+6,py+21,20,2.5);g.fillStyle='#9c6a35';g.beginPath();g.ellipse(px+16,py+6,9,3,0,0,6.28);g.fill()}
    else if(q.k===1){g.fillStyle='#7a5129';g.fillRect(px+4,py+12,24,16);g.fillStyle='#8f6232';g.fillRect(px+9,py+2,16,12);g.strokeStyle='#4e3216';g.lineWidth=1.5;g.strokeRect(px+4.5,py+12.5,23,15);g.strokeRect(px+9.5,py+2.5,15,11);g.beginPath();g.moveTo(px+5,py+13);g.lineTo(px+27,py+27);g.moveTo(px+10,py+3);g.lineTo(px+24,py+13);g.stroke()}
    else if(q.k===2){for(const[ox,sz]of[[10,8],[21,6]]){g.fillStyle='#9a5a35';g.beginPath();g.ellipse(px+ox,py+20,sz,sz+1,0,0,6.28);g.fill();g.fillStyle='#7a4428';g.fillRect(px+ox-3,py+20-sz-4,6,4);g.fillStyle='rgba(255,255,255,.15)';g.fillRect(px+ox-sz*.5,py+16,2,5)}}
    else{g.fillStyle='#5a4a3a';g.fillRect(px+6,py+22,20,5);for(const[ox,h]of[[10,12],[16,16],[22,9]]){g.fillStyle='#efe6cf';g.fillRect(px+ox-2,py+22-h,4,h);g.fillStyle='#d8c9a0';g.fillRect(px+ox-2,py+22-h,4,2)}}}
  return c;
}
