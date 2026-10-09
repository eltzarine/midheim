/* ================= Monde : sol peint, falaises, objets facettés ================= */
const TBASE={0:'#3c8a80',1:'#4f9c94',2:'#93ad4c',3:'#d58c4c',4:'#6a913c',5:'#a8613c',6:'#e9eff0',7:'#cf9358',8:'#8a6034',9:'#e6c88a',10:'#bfb19b',11:'#76894a'};
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi;const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
const isWater=v=>v===0||v===1;
function pebble(g,x,y,r,col){poly(g,[x-r,y,x-r*.4,y-r*.8,x+r*.6,y-r*.6,x+r,y+r*.1,x+r*.2,y+r*.6],shade(col,-.22));poly(g,[x-r,y,x-r*.4,y-r*.8,x+r*.6,y-r*.6,x+r*.1,y-r*.1],shade(col,.12))}
function renderChunk(cx,cy){const c=document.createElement('canvas');c.width=CHK*TS;c.height=CHK*TS+CPAD;const g=c.getContext('2d');g.translate(0,CPAD);
  const x0=cx*CHK,y0=cy*CHK;
  // 1) sol : couleur de base + grandes nuances douces
  for(let ty=y0;ty<y0+CHK;ty++)for(let tx=x0;tx<x0+CHK;tx++){const v=wT(tx,ty),px=(tx-x0)*TS,py=(ty-y0)*TS;const base=TBASE[v]||TBASE[2];
    const n=vnoise(tx/7,ty/7,4)-.5,n2=vnoise(tx/2.3,ty/2.3,8)-.5;const k=isWater(v)?n*.12:n*.16+n2*.025;
    g.fillStyle=shade(base,k);g.fillRect(px,py,TS+.5,TS+.5)}
  // 1b) bords arrondis entre terrains : chaque case déborde en disque sur ses voisines (ordre de priorité)
  const PRIO=[3,9,5,2,4,11,6,7];
  for(const pv of PRIO)for(let ty=y0-1;ty<=y0+CHK;ty++)for(let tx=x0-1;tx<=x0+CHK;tx++){const v=wT(tx,ty);if(v!==pv)continue;let diff=false;
      for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=wT(tx+dx,ty+dy);if(n!==v&&!isWater(n)&&n!==8&&n!==10)diff=true}if(!diff)continue;
      const px=(tx-x0)*TS,py=(ty-y0)*TS;const n=vnoise(tx/7,ty/7,4)-.5,n2=vnoise(tx/2.3,ty/2.3,8)-.5;g.fillStyle=shade(TBASE[v],n*.16+n2*.06);
      const r=v===7?17:19+hash2(tx,ty,31)*5;g.beginPath();g.arc(px+16+(hash2(tx,ty,32)-.5)*8,py+16+(hash2(tx,ty,33)-.5)*8,r,0,6.28);g.fill()}
  // 2) détails du sol
  for(let ty=y0;ty<y0+CHK;ty++)for(let tx=x0;tx<x0+CHK;tx++){const v=wT(tx,ty),px=(tx-x0)*TS,py=(ty-y0)*TS,h=hash2(tx,ty,1),h2=hash2(tx,ty,2);const base=TBASE[v]||TBASE[2];
    if(v===2||v===4||v===11){for(let k=0;k<3;k++){const a=hash2(tx,ty,10+k),b=hash2(tx,ty,20+k);const gx=px+a*28,gy=py+b*28;poly(g,[gx,gy,gx+1.5,gy-5,gx+3,gy],shade(base,k%2?-.2:.18))}
      if(h2<.08)pebble(g,px+h*26+3,py+h2*200%26+4,2.5,'#a59a88')}
    else if(v===3){if(h<.5)pebble(g,px+4+h*22,py+6+h2*20,1.6+h*2,'#9a6a48');if(h2<.35){g.strokeStyle=shade(base,-.28);g.lineWidth=1;g.beginPath();let x=px+4+h*12,y=py+6+h2*10;g.moveTo(x,y);for(let k=0;k<3;k++){x+=4+hash2(tx,ty,30+k)*5;y+=2+hash2(tx,ty,40+k)*6;g.lineTo(x,y)}g.stroke()}
      if(h>.8){g.fillStyle=shade(base,-.12);g.beginPath();g.ellipse(px+16,py+16,9,4,0,0,6.28);g.fill()}}
    else if(v===7){const hz=wT(tx-1,ty)===7||wT(tx+1,ty)===7,vt=wT(tx,ty-1)===7||wT(tx,ty+1)===7;g.fillStyle=shade(base,-.2);
      const up=wT(tx,ty-1)===7,dn=wT(tx,ty+1)===7,lf=wT(tx-1,ty)===7,rt=wT(tx+1,ty)===7;g.globalAlpha=.6;if(hz&&!(up&&dn)){g.fillRect(px,py+(up?20:10),TS,2)}if(vt&&!(lf&&rt)){g.fillRect(px+(lf?20:10),py,2,TS)}g.globalAlpha=1;
      if(h<.4)pebble(g,px+h*28+2,py+h2*26+3,1.8,'#8a6a48')}
    else if(v===6){g.fillStyle='rgba(150,180,205,.28)';g.beginPath();g.ellipse(px+h2*20+6,py+h*22+6,8,3,0,0,6.28);g.fill()}
    else if(v===9){if(h<.3){g.fillStyle='rgba(255,255,255,.25)';g.fillRect(px+h*24,py+h2*24,3,2)}}
    else if(v===10){g.strokeStyle='rgba(70,60,50,.35)';g.lineWidth=1;const off=(ty%2)*8;for(let r=0;r<2;r++)for(let k=-1;k<2;k++){const bx=px+k*16+off+(r?8:0),by=py+r*16;g.strokeRect(bx+.5,by+.5,15,15)}
      g.fillStyle='rgba(255,255,255,.06)';g.fillRect(px+2,py+2,12,2)}
    else if(v===8){g.fillStyle='#b3a994';g.fillRect(px,py,TS,TS);g.strokeStyle='rgba(70,60,48,.35)';g.lineWidth=1;const off=(ty%2)*8;for(let r=0;r<3;r++)for(let k=-1;k<3;k++)g.strokeRect(px+k*14+off+(r%2?7:0)+.5,py+r*11+.5,14,11);
      g.fillStyle='rgba(255,255,255,.08)';g.fillRect(px+2,py+2,10,2);const up=wT(tx,ty-1),dn=wT(tx,ty+1);
      if(isWater(up)){g.fillStyle='#8c826f';g.fillRect(px,py,TS,5);g.fillStyle='#d4cbb8';g.fillRect(px,py,TS,2)}if(isWater(dn)){g.fillStyle='#8c826f';g.fillRect(px,py+TS-5,TS,5);g.fillStyle='#6b6253';g.fillRect(px,py+TS,TS,9);g.fillStyle='#2a5450';g.beginPath();g.arc(px+TS/2,py+TS+9,8,Math.PI,0);g.fill()}}
    else if(isWater(v)){if(h2<.22){g.strokeStyle='rgba(220,245,240,.22)';g.lineWidth=1.2;g.beginPath();g.moveTo(px+4+h*10,py+10+h2*12);g.lineTo(px+16+h*10,py+10+h2*12);g.stroke()}}
    if(v===11&&h2<.3){g.fillStyle='rgba(60,110,110,.55)';g.beginPath();g.ellipse(px+16,py+18,10,5,0,0,6.28);g.fill()}
    const dc=WORLD.deco[ty*WORLD.W+tx];
    if(dc===1){const cols=['#f2d65a','#e8705a','#fbf6e6','#b88ae8'];for(let k=0;k<4;k++){const fx=px+6+hash2(tx,ty,60+k)*20,fy=py+6+hash2(tx,ty,70+k)*20;g.fillStyle='#4f7a2a';g.fillRect(fx-.5,fy,1,3);g.fillStyle=cols[Math.floor(hash2(tx,ty,50+k)*4)];g.beginPath();g.arc(fx,fy,1.9,0,6.28);g.fill()}}
    else if(dc===2){facetBlob(g,px+16,py+20,8,'#5a8530',tx*31+ty,6)}
    else if(dc===3){g.strokeStyle='#7a6a44';g.lineWidth=1.2;g.beginPath();for(let k=0;k<5;k++){g.moveTo(px+16,py+24);g.lineTo(px+9+k*3.5,py+13+hash2(tx,ty,80+k)*4)}g.stroke()}
    else if(dc===4){for(let k=0;k<5;k++){const x=px+6+k*5;poly(g,[x,py+26,x+1+(hash2(tx,ty,90+k)-.5)*4,py+11,x+2.5,py+26],k%2?'#6f8a3e':'#8aa64a')}}
    else if(dc===5){g.fillStyle='#f3e4cc';g.beginPath();g.arc(px+16,py+18,3,0,6.28);g.fill();g.fillStyle='#d9c4a4';g.beginPath();g.arc(px+17,py+19,1.6,0,6.28);g.fill()}}
  // 3) falaises : la terre surplombe l'eau (faces de roche + écume)
  for(let ty=y0-1;ty<y0+CHK;ty++)for(let tx=x0-1;tx<=x0+CHK;tx++){const v=wT(tx,ty);if(isWater(v)||v===8)continue;const px=(tx-x0)*TS,py=(ty-y0)*TS;
    const low=v===9||v===11;const dn=wT(tx,ty+1);
    if(isWater(dn)){const hgt=low?5:13+hash2(tx,ty,4)*5;const rock=v===6?'#8f9aa6':v===9?'#c9a46a':'#9a5634';
      const pts=[px,py+TS];for(let k=0;k<=4;k++)pts.push(px+k*8,py+TS+hgt+(hash2(tx*5+k,ty,6)-.5)*5);pts.push(px+TS,py+TS);poly(g,pts,shade(rock,-.12));
      for(let k=0;k<4;k++){const sx=px+k*8;poly(g,[sx,py+TS,sx+8,py+TS,sx+5,py+TS+hgt*.9],shade(rock,k%2?-.32:.08))}
      g.fillStyle='rgba(225,248,240,.7)';for(let k=0;k<4;k++){const fx=px+k*8+hash2(tx,ty,40+k)*4;g.fillRect(fx,py+TS+hgt-1+Math.sin(k)*1.5,6,1.6)}
      g.fillStyle=shade(TBASE[v]||TBASE[2],.14);g.fillRect(px,py+TS-2,TS,2)}
    if(isWater(wT(tx+1,ty))&&!low){g.fillStyle='rgba(60,30,20,.28)';g.fillRect(px+TS-3,py,3,TS)}
    if(isWater(wT(tx-1,ty))&&!low){g.fillStyle='rgba(255,240,210,.18)';g.fillRect(px,py,2,TS)}
    if(isWater(wT(tx,ty-1))){g.fillStyle='rgba(225,248,240,.55)';g.fillRect(px,py-1.5,TS,2)}}
  // 4) montagnes : pics facettés dessinés de haut en bas
  for(let ty=y0-1;ty<y0+CHK+1;ty++)for(let tx=x0;tx<x0+CHK;tx++){if(wT(tx,ty)!==5)continue;const px=(tx-x0)*TS,py=(ty-y0)*TS,h=hash2(tx,ty,3);
    const high=wT(tx-1,ty)===5&&wT(tx+1,ty)===5&&wT(tx,ty-1)===5&&wT(tx,ty+1)===5;const top=py-12-h*16-(high?8:0),cxp=px+16+(h-.5)*10;const L1=px-8,R1=px+TS+8,B=py+TS+2,mid=cxp+(h-.5)*6;
    poly(g,[L1,B,cxp,top,mid,B],'#c27a4c');poly(g,[cxp,top,R1,B,mid,B],'#7a4228');poly(g,[cxp,top,mid,B,cxp-4,B-10],'#a8613c');
    if(high||h>.62){poly(g,[cxp,top,cxp-7,top+11,cxp-2,top+8,cxp+2,top+12,cxp+7,top+10],'#f4f6f4');poly(g,[cxp,top,cxp+7,top+10,cxp+2,top+12],'#cfd8dc')}}
  return c}
function drawWater(x0,y0,x1,y1,T){const m=WORLD;const a=Math.max(0,Math.floor(x0/TS)),b=Math.min(m.W-1,Math.floor(x1/TS)),c=Math.max(0,Math.floor(y0/TS)),d=Math.min(m.H-1,Math.floor(y1/TS));
  ctx.fillStyle='rgba(230,250,245,.35)';
  for(let ty=c;ty<=d;ty++)for(let tx=a;tx<=b;tx++){const v=m.t[ty*m.W+tx];if(!isWater(v))continue;const h=hash2(tx,ty,5);const ph=(T*.5+h*6)%3;if(ph>1.2)continue;
    const px=tx*TS+h*20,py=ty*TS+8+hash2(tx,ty,6)*16;const w=3+Math.sin(ph*2.6)*5;ctx.fillRect(px,py,Math.max(1,w),1.4)}}

/* objets du monde : 1 pin, 2 feuillu, 3 pin enneigé, 4 rocher, 5 saule, 6 pierre levée, 7 mur, 8 tonneaux, 9 rondins, 10 lanterne, 11 caisses, 12 charrette, 13 clôture */
function drawTreeObj(k,tx,ty,alpha){const g=ctx,x=(tx+.5)*TS,y=(ty+1)*TS-4,h=hash2(tx,ty,9),T=G.time,sw=Math.sin(T*1.1+tx*.7+ty)*1.1;
  if(alpha<1)g.globalAlpha=alpha;
  if(k===1||k===3){const s=.95+h*.35;dshadow(g,x+6,y,16*s,5);g.fillStyle='#5a3a22';g.fillRect(x-2.5,y-10,5,10);g.fillStyle='#3e2818';g.fillRect(x+.5,y-10,2,10);
    const col=k===3?'#4f7266':'#3f7a34';for(let i=0;i<3;i++){const yy=y-8-i*12*s,w=(16-i*3.6)*s;cone(g,x+sw*i*.4,yy,w,22*s,shade(col,i*.06),k===3)}}
  else if(k===2||k===5){const s=.95+h*.3;dshadow(g,x+8,y,18*s,6);g.fillStyle='#6a4428';poly(g,[x-3,y,x-2,y-16,x+2,y-16,x+3,y],'#6a4428');g.fillStyle='#4a2e1a';g.fillRect(x,y-16,2.5,16);
    const col=k===5?'#7c9a4a':['#5a8a32','#6b9a38','#4f7f2e'][Math.floor(h*3)];facetBlob(g,x+sw,y-28*s,15*s,col,tx*7+ty*13,8);facetBlob(g,x-7*s+sw,y-22*s,9*s,shade(col,-.06),tx*3+ty,6);facetBlob(g,x+8*s+sw,y-23*s,9*s,shade(col,.04),tx+ty*5,6);
    if(k===5){g.strokeStyle='#6f8c48';g.lineWidth=1.5;g.beginPath();for(let i=0;i<5;i++){const xx=x-12+i*6+sw;g.moveTo(xx,y-22);g.quadraticCurveTo(xx+2,y-12,xx,y-5)}g.stroke()}}
  else if(k===4){dshadow(g,x+4,y,15,5);const c='#9a8f80';poly(g,[x-13,y,x-11,y-10,x-3,y-17,x+8,y-15,x+13,y-6,x+12,y],shade(c,-.15));poly(g,[x-11,y-10,x-3,y-17,x+8,y-15,x+2,y-8],shade(c,.2));poly(g,[x+8,y-15,x+13,y-6,x+12,y,x+2,y-8],shade(c,-.32))}
  else if(k===6){dshadow(g,x+4,y,10,4);poly(g,[x-8,y,x-6,y-34,x+1,y-41,x+1,y],'#a9a7a2');poly(g,[x+1,y-41,x+7,y-32,x+8,y,x+1,y],'#77746e');g.strokeStyle='rgba(120,210,230,.6)';g.lineWidth=1.5;g.beginPath();g.moveTo(x-3,y-26);g.lineTo(x+1,y-20);g.lineTo(x-2,y-13);g.stroke()}
  else if(k===7){dshadow(g,x+6,y,18,5);prism(g,x-16,y-8,32,8,22,'#8a8276');for(let i=0;i<4;i++)prism(g,x-16+i*9,y-36,6,4,6,'#9a9286',{edge:false});g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=1;for(let r=0;r<2;r++){g.beginPath();g.moveTo(x-16,y-6-r*8);g.lineTo(x+16,y-6-r*8);g.stroke()}}
  else if(k===8){dshadow(g,x+4,y,15,5);const cols=['#c8483c','#6b4a8e','#3a6a8e'];cyl(g,x-6,y-2,6,14,cols[Math.floor(h*3)],'#2a2a30');cyl(g,x+5,y+1,6,13,cols[Math.floor(h*3+1)%3],'#2a2a30');g.fillStyle='rgba(255,255,255,.2)';g.fillRect(x-10,y-12,1.5,8)}
  else if(k===9){dshadow(g,x+4,y,17,5);for(let r=0;r<3;r++)for(let i=0;i<3-r;i++){const lx=x-12+i*9+r*4.5,ly=y-4-r*6.5;g.fillStyle=shade('#8a5a30',-.1-r*.02);g.fillRect(lx-1,ly-3,9,7);g.fillStyle='#d2a26a';g.beginPath();g.ellipse(lx+8,ly+.5,2.6,3.4,0,0,6.28);g.fill();g.strokeStyle='#9a6a38';g.lineWidth=.6;g.beginPath();g.arc(lx+8,ly+.5,1.4,0,6.28);g.stroke()}}
  else if(k===10){dshadow(g,x+4,y,6,2.5);g.fillStyle='#2e2a30';g.fillRect(x-1.5,y-32,3,32);g.fillRect(x-4,y-2,8,2);g.fillRect(x-1.5,y-34,9,2);prism(g,x+3,y-30,7,3,9,'#3a3440',{edge:false});
    const on=G.night||(G.m&&G.m.kind!=='world');g.fillStyle=on?'#ffd27a':'#e8e0a0';g.fillRect(x+4.5,y-37,4,6);if(on){g.fillStyle='rgba(255,210,120,.25)';g.beginPath();g.arc(x+6.5,y-34,10,0,6.28);g.fill()}}
  else if(k===11){dshadow(g,x+4,y,15,5);prism(g,x-12,y-10,13,10,11,'#a87a44');prism(g,x+1,y-8,11,8,9,'#9a6c3a');prism(g,x-7,y-14,11,7,8,'#b8884e');g.strokeStyle='rgba(70,40,20,.5)';g.lineWidth=1;g.strokeRect(x-12,y-21,13,11)}
  else if(k===12){dshadow(g,x+6,y,20,5);prism(g,x-15,y-12,28,10,9,'#8a5a30');g.fillStyle='#6b4a28';for(let i=0;i<4;i++)g.fillRect(x-14+i*7,y-21,1.5,9);for(const wx of[-10,8]){g.fillStyle='#4a3020';g.beginPath();g.arc(x+wx,y-3,5.5,0,6.28);g.fill();g.fillStyle='#8a6034';g.beginPath();g.arc(x+wx,y-3,2,0,6.28);g.fill()}
    g.fillStyle='#d8c06a';g.beginPath();g.ellipse(x-3,y-23,9,4,0,0,6.28);g.fill()}
  else if(k===13){g.fillStyle='#5a3e24';for(const px2 of[-14,0,14]){prism(g,x+px2-2,y-3,4,3,16,'#6b4a2a',{edge:false})}g.strokeStyle='#8a7a6a';g.lineWidth=1;g.beginPath();for(const hh of[-9,-14]){g.moveTo(x-14,y+hh);g.lineTo(x+14,y+hh)}g.stroke()}
  g.globalAlpha=1}
// maisons : murs de planches, toits en deux pans (tôle ondulée façon image)
function drawBuilding(b,T){const kd=b.kind;if(!(kd==='auberge'||kd==='marchand'||kd==='forge'||kd==='maison'||kd==='temple')){drawBuildingBase(b,T);return}
  const g=ctx,x=b.x*TS,y=b.y*TS,w=b.w*TS,h=b.h*TS,dx=(b.door.x+.5)*TS;const roof=b.roof||'#5a8a6a';const wall=kd==='forge'?'#a89a88':'#d9b98a';
  g.fillStyle='rgba(50,25,10,.3)';g.beginPath();g.moveTo(x+6,y+h);g.lineTo(x+w+14,y+h);g.lineTo(x+w+24,y+h-10);g.lineTo(x+w+10,y+h-12);g.closePath();g.fill();
  // façade avant + mur de côté visible
  g.fillStyle=wall;g.fillRect(x,y,w,h);g.fillStyle=shade(wall,-.22);g.fillRect(x+w-6,y,6,h);g.fillStyle='rgba(90,60,30,.25)';for(let k=4;k<w-6;k+=7)g.fillRect(x+k,y+2,1.2,h-2);
  g.fillStyle='#5a3e24';g.fillRect(x,y+h-4,w,4);g.fillRect(x,y,3,h);g.fillRect(x+w-9,y,3,h);
  // fenêtres
  for(let k=0;k<b.w;k++){const wx=x+k*TS+10;if(Math.abs(wx+6-dx)<22)continue;g.fillStyle='#3a2818';g.fillRect(wx-1,y+h*.3-1,14,12);g.fillStyle=G.night?'#ffd27a':'#7a9aa8';g.fillRect(wx,y+h*.3,12,10);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(wx+1,y+h*.3+1,4,3);g.fillStyle='#3a2818';g.fillRect(wx+5.5,y+h*.3,1,10)}
  // porte
  g.fillStyle='#3a2818';g.fillRect(dx-10,y+h-26,20,26);g.fillStyle='#7a5530';g.fillRect(dx-8,y+h-24,16,24);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(dx-8,y+h-24,16,3);g.fillStyle='#e2b65e';g.fillRect(dx+4,y+h-12,2,2);
  // toit à deux pans
  const ov=8,rh=h*.62+10,ry=y+6;g.fillStyle=shade(roof,.1);g.beginPath();g.moveTo(x-ov,ry);g.lineTo(x+w*.5,ry-rh);g.lineTo(x+w*.5,ry+2);g.closePath();g.fill();
  g.fillStyle=shade(roof,-.25);g.beginPath();g.moveTo(x+w*.5,ry-rh);g.lineTo(x+w+ov,ry);g.lineTo(x+w*.5,ry+2);g.closePath();g.fill();
  g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;for(let k=1;k<8;k++){const f=k/8;g.beginPath();g.moveTo(x-ov+(w*.5+ov)*f,ry-rh*f);g.lineTo(x-ov+(w*.5+ov)*f+2,ry+2);g.stroke();g.beginPath();g.moveTo(x+w+ov-(w*.5+ov)*f,ry-rh*f);g.lineTo(x+w+ov-(w*.5+ov)*f-2,ry+2);g.stroke()}
  g.fillStyle=shade(roof,-.4);g.fillRect(x-ov,ry,w+ov*2,3);
  if(kd==='forge'){prism(g,x+w-22,ry-rh*.7,10,6,18,'#6a625a');if(Math.random()<.06)parts.push({k:'smoke',x:x+w-17,y:ry-rh*.7-20,vx:4,vy:-14,life:2.5,max:2.5,r:6})}
  if(b.act&&(kd==='auberge'||kd==='marchand'||kd==='forge')){const sx=dx+22,sy=y+h-30;g.strokeStyle='#3a2818';g.lineWidth=2;g.beginPath();g.moveTo(sx-6,sy-4);g.lineTo(sx+10,sy-4);g.stroke();prism(g,sx-2,sy-2,16,14,0,'#efe6cf',{edge:false});g.strokeStyle='#5a3e24';g.strokeRect(sx-2,sy-2,16,14);
    g.fillStyle='#3a2818';if(kd==='forge'){g.fillRect(sx+1,sy+2,10,3);g.fillRect(sx+4,sy+5,4,4)}else if(kd==='marchand'){g.beginPath();g.arc(sx+6,sy+5,4,0,6.28);g.fill();g.fillStyle='#e2b65e';g.beginPath();g.arc(sx+6,sy+5,2.5,0,6.28);g.fill()}else{g.fillRect(sx+2,sy+6,10,4);g.fillRect(sx+2,sy+2,3,4)}}}

/* ================= Le Pont de Lathandre : grand pont de pierre (arches, parapets, piliers au soleil doré) ================= */
function bridgeRect(){const B=WORLD.bridge;return{X0:B.x0*TS-8,X1:(B.x1+1)*TS+8,Y0:B.y0*TS,Y1:(B.y1+1)*TS}}
function stoneBlocks(g,x,y,w,h,col,bh){g.fillStyle=col;g.fillRect(x,y,w,h);g.strokeStyle='rgba(40,32,24,.35)';g.lineWidth=1;bh=bh||8;
  for(let r=0;r*bh<h;r++){const yy=y+r*bh;g.beginPath();g.moveTo(x,yy+.5);g.lineTo(x+w,yy+.5);g.stroke();for(let k=(r%2)*9;k<w;k+=18){g.beginPath();g.moveTo(x+k+.5,yy);g.lineTo(x+k+.5,Math.min(y+h,yy+bh));g.stroke()}}}
function drawLathBridge(T){if(!WORLD.bridge)return;const{X0,X1,Y0,Y1}=bridgeRect();if(Math.abs((X0+X1)/2-L.x)>1400||Math.abs((Y0+Y1)/2-L.y)>1100)return;const g=ctx,W=X1-X0;
  // face sud : arches au-dessus de la rivière
  const FH=46;stoneBlocks(g,X0,Y1,W,FH,'#8f8572',9);const n=3,span=W/n;
  for(let k=0;k<n;k++){const cx=X0+span*(k+.5),aw=span*.38,top=Y1+12;g.fillStyle='#173f3d';g.beginPath();g.moveTo(cx-aw,Y1+FH);g.lineTo(cx-aw,top+aw*.55);g.quadraticCurveTo(cx-aw,top,cx,top);g.quadraticCurveTo(cx+aw,top,cx+aw,top+aw*.55);g.lineTo(cx+aw,Y1+FH);g.closePath();g.fill();
    g.strokeStyle='#c9bfa9';g.lineWidth=3;g.beginPath();g.moveTo(cx-aw,Y1+FH);g.lineTo(cx-aw,top+aw*.55);g.quadraticCurveTo(cx-aw,top,cx,top);g.quadraticCurveTo(cx+aw,top,cx+aw,top+aw*.55);g.lineTo(cx+aw,Y1+FH);g.stroke();
    g.fillStyle='#d8cfba';g.fillRect(cx-3,top-5,6,7);
    g.fillStyle='rgba(200,240,235,.35)';for(let j=0;j<3;j++)g.fillRect(cx-aw*.6+Math.sin(T*1.5+j+k)*3,Y1+FH-5-j*4,aw*1.2*(1-j*.25),1.5)}
  for(let k=0;k<=n;k++){const px=X0+span*k;const cw=k===0||k===n?0:12;if(cw){g.fillStyle='#7c735f';g.beginPath();g.moveTo(px-cw,Y1+FH);g.lineTo(px,Y1+FH+14);g.lineTo(px+cw,Y1+FH);g.closePath();g.fill();
      g.fillStyle='rgba(235,250,245,.7)';for(let j=0;j<4;j++)g.fillRect(px-cw-4+j*7+Math.sin(T*3+j)*1.5,Y1+FH+12+Math.sin(T*2+j)*1.2,5,1.6)}}
  g.fillStyle='rgba(0,0,0,.25)';g.fillRect(X0,Y1,W,4);
  // tablier : dalles et soleil de Lathandre incrusté
  g.fillStyle='#bdb39e';g.fillRect(X0,Y0,W,Y1-Y0);g.strokeStyle='rgba(70,58,44,.3)';g.lineWidth=1;
  for(let r=0,yy=Y0;yy<Y1;r++,yy+=14){for(let x=X0+(r%2)*10;x<X1;x+=20)g.strokeRect(x+.5,yy+.5,20,14)}
  g.fillStyle='rgba(255,255,255,.07)';g.fillRect(X0,Y0+(Y1-Y0)/2-12,W,24);
  const cx=(X0+X1)/2,cy=(Y0+Y1)/2;g.save();g.translate(cx,cy);g.scale(1,.62);g.fillStyle='#8a7350';g.beginPath();g.arc(0,0,30,0,6.28);g.fill();g.fillStyle='#e0b45c';
  for(let k=0;k<16;k++){g.rotate(Math.PI/8);g.beginPath();g.moveTo(-4,14);g.lineTo(0,29);g.lineTo(4,14);g.closePath();g.fill()}g.beginPath();g.arc(0,0,13,0,6.28);g.fill();g.fillStyle='#f6dc8a';g.beginPath();g.arc(-2,-2,7,0,6.28);g.fill();g.restore();
  // bord nord (devant le joueur côté rivière amont)
  drawParapet(X0,X1,Y0-2,true)}
function drawParapet(X0,X1,y,north){const g=ctx,W=X1-X0,H=north?8:10;
  g.fillStyle='rgba(0,0,0,.22)';g.fillRect(X0,y+(north?4:2),W,6);
  stoneBlocks(g,X0,y-H,W,H+2,'#9d927d',5);g.fillStyle='#d6cdb9';g.fillRect(X0,y-H-4,W,5);g.fillStyle='#ebe4d2';g.fillRect(X0,y-H-4,W,1.6);
  for(let x=X0+14;x<X1-10;x+=26){g.fillStyle='#cfc5b0';g.fillRect(x,y-H-9,10,6);g.fillStyle='#ebe4d2';g.fillRect(x,y-H-9,10,1.6);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x+8,y-H-9,2,6)}}
function drawBridgePylon(x,y,T,banner){const g=ctx;dshadow(g,x+4,y+2,16,5);const w=22,h=58;
  stoneBlocks(g,x-w/2,y-h,w,h,'#9a8f7a',8);poly(g,[x-w/2,y-h,x+w/2,y-h,x+w/2+3,y-h-5,x-w/2-3,y-h-5],'#d6cdb9');g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x+w/2-4,y-h,4,h);
  g.fillStyle='#e0b45c';g.beginPath();g.arc(x,y-h+16,5.5,0,6.28);g.fill();g.strokeStyle='#e0b45c';g.lineWidth=1.4;for(let k=0;k<8;k++){const a=k/8*6.28;g.beginPath();g.moveTo(x+Math.cos(a)*7,y-h+16+Math.sin(a)*7);g.lineTo(x+Math.cos(a)*10,y-h+16+Math.sin(a)*10);g.stroke()}
  if(banner){const sw=Math.sin(T*2.4+x)*2.5;poly(g,[x-6,y-h+26,x+6,y-h+26,x+6+sw*.4,y-h+48,x+sw,y-h+43,x-6+sw*.4,y-h+48],'#7a2a2a');g.fillStyle='#e0b45c';g.beginPath();g.arc(x+sw*.3,y-h+35,3,0,6.28);g.fill()}
  // brasero
  g.fillStyle='#4a3a2a';g.fillRect(x-6,y-h-11,12,6);g.fillStyle='#2a2018';g.fillRect(x-7,y-h-12,14,2);
  for(let k=0;k<3;k++){const fl=Math.sin(T*9+k*2+x)*2,hh=10+k*3+Math.sin(T*7+k)*2;g.fillStyle=['#ff8a2b','#ffb347','#fff0a0'][k];g.beginPath();g.moveTo(x-6+k*2,y-h-11);g.quadraticCurveTo(x+fl,y-h-11-hh*1.4,x+6-k*2,y-h-11);g.closePath();g.fill()}
  if(Math.random()<.08&&parts.length<340)parts.push({k:'ember',x:x+(Math.random()-.5)*6,y:y-h-20,vx:(Math.random()-.5)*10,vy:-30,life:1,max:1})}
function bridgeProps(Z,T){if(!WORLD.bridge)return;const{X0,X1,Y0,Y1}=bridgeRect();
  Z.push([Y1+2,()=>drawParapet(X0,X1,Y1+1,false)]);
  for(const[x,y,b]of[[X0,Y0,1],[X1,Y0,1],[X0,Y1+6,0],[X1,Y1+6,0]])Z.push([y,()=>drawBridgePylon(x,y,T,b)])}
