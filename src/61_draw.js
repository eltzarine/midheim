function drawDrop(k,x,y){const g=ctx,t=G.time;g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y+8,6,2,0,0,6.28);g.fill();
  if(k===1){const w=Math.abs(Math.cos(t*4+x));g.fillStyle='#b8862a';g.beginPath();g.ellipse(x,y,5*w+1,5,0,0,6.28);g.fill();g.fillStyle='#f0c95a';g.beginPath();g.ellipse(x,y,4*w+.5,4,0,0,6.28);g.fill();if(w>.6){g.fillStyle='#fff3c0';g.fillRect(x-1,y-3,1.5,1.5)}}
  else if(k===2){g.fillStyle='#8a6a3a';g.fillRect(x-2,y-11,4,3);g.fillStyle='rgba(220,230,255,.5)';g.fillRect(x-2.5,y-8,5,3);g.fillStyle='rgba(220,230,255,.35)';g.beginPath();g.arc(x,y,6,0,6.28);g.fill();g.fillStyle='#d24a3f';g.beginPath();g.arc(x,y+1,5,0,Math.PI*2);g.fill();g.fillStyle='rgba(255,255,255,.7)';g.fillRect(x-3,y-3,1.5,3)}
  else if(k===3){g.fillStyle='#ff5a6e';g.beginPath();g.arc(x-3,y-2,4,0,6.28);g.arc(x+3,y-2,4,0,6.28);g.fill();g.beginPath();g.moveTo(x-7,y);g.lineTo(x,y+7);g.lineTo(x+7,y);g.fill();g.fillStyle='rgba(255,255,255,.6)';g.fillRect(x-4,y-4,2,2)}
  else if(k===4){g.save();g.translate(x,y);g.rotate(Math.sin(t*3)*.3);g.shadowColor='#f0c95a';g.shadowBlur=10;g.strokeStyle='#f0c95a';g.lineWidth=3;g.beginPath();g.arc(-5,0,4,0,6.28);g.moveTo(-1,0);g.lineTo(9,0);g.lineTo(9,4);g.moveTo(5,0);g.lineTo(5,3);g.stroke();g.restore()}
  else if(k===5){g.save();g.shadowColor='#7ff0e8';g.shadowBlur=8;g.fillStyle='#4fc9c0';g.beginPath();g.moveTo(x,y-8);g.lineTo(x+6,y-2);g.lineTo(x,y+8);g.lineTo(x-6,y-2);g.closePath();g.fill();g.restore();g.fillStyle='#bff8f3';g.beginPath();g.moveTo(x,y-8);g.lineTo(x+3,y-2);g.lineTo(x,y);g.lineTo(x-3,y-2);g.fill()}}
function drawChest(c,op){const g=ctx,px=c.x*TS+4,py=c.y*TS+8;const base=c.vault?'#a8782a':c.locked?'#553672':'#6e4422',hi=c.vault?'#e2b54a':c.locked?'#8a64b4':'#9a6534',band=c.vault?'#fff0b0':'#c9c7d4';
  g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(px+12,py+21,14,4,0,0,6.28);g.fill();
  g.fillStyle=base;rr(g,px,py+5,24,15,2);g.fill();g.fillStyle='rgba(0,0,0,.2)';g.fillRect(px,py+12,24,1);g.fillStyle=band;g.fillRect(px+3,py+5,2.5,15);g.fillRect(px+18.5,py+5,2.5,15);
  if(op){g.fillStyle='#160d05';g.fillRect(px+2,py+3,20,4);g.fillStyle=hi;rr(g,px,py-7,24,8,3);g.fill();g.fillStyle=band;g.fillRect(px+3,py-7,2.5,8);g.fillRect(px+18.5,py-7,2.5,8);g.fillStyle='rgba(240,201,90,.2)';g.fillRect(px+4,py+2,16,3)}
  else{g.fillStyle=hi;rr(g,px,py-1,24,8,4);g.fill();g.fillStyle='rgba(255,255,255,.15)';g.fillRect(px+2,py,20,1.5);g.fillStyle=band;g.fillRect(px+3,py-1,2.5,8);g.fillRect(px+18.5,py-1,2.5,8);
    g.fillStyle=c.vault?'#fff6d0':'#e9c46a';rr(g,px+9,py+4,6,6,1.5);g.fill();g.fillStyle='#2a1d12';g.fillRect(px+11.5,py+6,1,2.5);
    if(c.locked){g.fillStyle='#e9c46a';g.fillRect(px+8.5,py+10,7,6);g.strokeStyle='#e9c46a';g.lineWidth=1.6;g.beginPath();g.arc(px+12,py+10,2.7,Math.PI,0);g.stroke();g.fillStyle='#2a1d12';g.fillRect(px+11.4,py+12,1.2,2.5)}
    if(c.vault){g.fillStyle='rgba(255,240,180,'+(.5+.5*Math.sin(G.time*5+c.id))+')';g.fillRect(px+20,py-4,2,2);g.fillRect(px+2,py+2,1.5,1.5)}}}
function drawCrate(c){const g=ctx,px=c.rx*TS+3,py=c.ry*TS+3;g.fillStyle='rgba(0,0,0,.4)';g.fillRect(px+2,py+24,26,4);g.fillStyle='#8a5a2b';g.fillRect(px,py,26,26);g.fillStyle='#9e6a34';for(let k=0;k<4;k++)g.fillRect(px+1,py+1+k*6.3,24,5);g.strokeStyle='#4e3216';g.lineWidth=2.4;g.strokeRect(px+1.2,py+1.2,23.6,23.6);g.beginPath();g.moveTo(px+3,py+3);g.lineTo(px+23,py+23);g.stroke();g.fillStyle='#c9c7d4';for(const[a,b]of[[3,3],[21,3],[3,21],[21,21]])g.fillRect(px+a,py+b,2,2)}
function drawTorch(t,T){const g=ctx,px=(t.x+.5)*TS,py=t.y*TS+13;g.fillStyle='#3a3a44';g.fillRect(px-5,py+9,10,3);g.fillStyle='#5a3b1e';g.fillRect(px-2,py+1,4,10);g.fillStyle='#4a4a56';g.fillRect(px-4,py-1,8,3);
  const fl=Math.sin(T*13+t.x)*1.6+Math.sin(T*7.3+t.y)*1;const gr=g.createRadialGradient(px,py-4,0,px,py-4,14);gr.addColorStop(0,'rgba(255,200,110,.45)');gr.addColorStop(1,'rgba(255,160,60,0)');g.fillStyle=gr;g.beginPath();g.arc(px,py-4,14,0,6.28);g.fill();
  g.fillStyle='#e8661e';g.beginPath();g.moveTo(px-4.5,py);g.quadraticCurveTo(px-5,py-8,px+fl*.5,py-13-fl);g.quadraticCurveTo(px+5,py-8,px+4.5,py);g.fill();g.fillStyle='#ffc04a';g.beginPath();g.moveTo(px-2.6,py);g.quadraticCurveTo(px-3,py-5,px+fl*.3,py-9-fl*.6);g.quadraticCurveTo(px+3,py-5,px+2.6,py);g.fill();g.fillStyle='#fff3c8';g.beginPath();g.ellipse(px,py-2,1.3,2.4,0,0,6.28);g.fill();
  if(Math.random()<.03)parts.push({k:'ember',x:px+(Math.random()-.5)*4,y:py-10,vx:(Math.random()-.5)*10,vy:-25-Math.random()*20,life:.9,max:.9})}
function drawProj(p){if(p.k===4){const v=G.bossPal||0;const c=([['#9fc6ff','#e8f2ff'],['#e8402a','#ffd0a0'],['#b9b6c6','#ffffff'],['#b067e8','#ead6ff'],['#c0305a','#ffd6e6'],['#5a3a6a','#c9a6ff'],['#7a5ad0','#e0d0ff']][v]||['#9fc6ff','#e8f2ff']);ctx.fillStyle=c[0];ctx.beginPath();ctx.arc(p.x,p.y,7,0,6.28);ctx.fill();ctx.fillStyle=c[1];ctx.beginPath();ctx.arc(p.x,p.y,3,0,6.28);ctx.fill();return}if(p.k===1){ctx.fillStyle='#ff8a2b';ctx.beginPath();ctx.arc(p.x,p.y,7,0,6.28);ctx.fill();ctx.fillStyle='#ffe08a';ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,6.28);ctx.fill()}
  else if(p.k===2){ctx.fillStyle='#fff2b0';ctx.beginPath();ctx.arc(p.x,p.y,6,0,6.28);ctx.fill();ctx.strokeStyle='#f0d36a';ctx.lineWidth=2;ctx.stroke()}
  else if(p.k===3){ctx.fillStyle='rgba(176,103,232,.35)';ctx.beginPath();ctx.arc(p.x,p.y,7,0,6.28);ctx.fill();ctx.fillStyle='#d88cff';ctx.beginPath();ctx.arc(p.x,p.y,3.6,0,6.28);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(p.x-1,p.y-1,2,2)}
  else{ctx.fillStyle='#b067e8';ctx.beginPath();ctx.arc(p.x,p.y,7,0,6.28);ctx.fill();ctx.fillStyle='#ead6ff';ctx.beginPath();ctx.arc(p.x,p.y,3,0,6.28);ctx.fill()}}
function drawEnemy(e,x,y,T){const fl=e.fl!=null?e.fl:((e.frz>0?1:0)|(e.tele>0?2:0)|(e.flash>0?4:0)|(e.elite?8:0)|(e.chg>0?16:0));
  const flash=fl&4,frz=fl&1,tele=fl&2,elite=fl&8;const g=ctx;let lx=0,ly=0;{const w=wpos(myIdx);const d=Math.hypot(w.x-x,w.y-y)||1;lx=(w.x-x)/d;ly=(w.y-y)/d}
  const chp=0,big=elite&&e.type!=='orc';
  g.fillStyle='rgba(0,0,0,.38)';g.beginPath();g.ellipse(x,y+e.r*.8,e.r*1.05,e.r*.35,0,0,6.28);g.fill();
  if(tele){g.fillStyle='rgba(255,60,40,'+(.25+.25*Math.sin(T*30))+')';g.beginPath();g.arc(x,y,e.r+10,0,6.28);g.fill();g.fillStyle='#ff4a3a';g.font='700 16px "Pixelify Sans",monospace';g.textAlign='center';g.fillText('!',x,y-e.r-16)}
  if(big){g.save();g.translate(x,y);g.scale(1.4,1.4);g.translate(-x,-y)}
  if(!(e.type!=='boss'&&e.type!=='mimic'&&drawEnemyPix(g,e,x,y,T,lx,ly,elite)))switch(e.type){
    case'slime':{ // Marionnette : un être changé en pantin sans volonté par le rituel d'Amarath
      const sw=Math.sin(T*3+e.id)*2;g.strokeStyle='rgba(200,170,255,.35)';g.lineWidth=.8;g.beginPath();for(const ox of[-6,0,6]){g.moveTo(x+ox+sw*.5,y-30);g.lineTo(x+ox*.8+sw,y-8)}g.stroke();
      g.fillStyle='#3d3a46';g.fillRect(x-5+sw*.3,y+6,3.5,7);g.fillRect(x+1.5-sw*.3,y+6,3.5,7);
      g.fillStyle='#5a5466';g.beginPath();g.moveTo(x-7,y-3);g.lineTo(x+7,y-3);g.lineTo(x+8,y+8);g.lineTo(x+3,y+6);g.lineTo(x,y+9);g.lineTo(x-4,y+6);g.lineTo(x-8,y+8);g.closePath();g.fill();
      g.strokeStyle='#9b9a86';g.lineWidth=2.5;g.lineCap='round';g.beginPath();g.moveTo(x-7,y-1);g.lineTo(x-11+sw,y+5);g.moveTo(x+7,y-1);g.lineTo(x+11+sw,y+4);g.stroke();g.lineCap='butt';
      g.fillStyle='#a3a68e';g.beginPath();g.arc(x+sw*.4,y-8,6.5,0,6.28);g.fill();g.fillStyle='#6d6f5c';g.fillRect(x-5+sw*.4,y-5,10,2);
      g.fillStyle='#d88cff';g.shadowColor='#b067e8';g.shadowBlur=6;g.fillRect(x-3.5+sw*.4+lx,y-10+ly,2,2);g.fillRect(x+1.5+sw*.4+lx,y-10+ly,2,2);g.shadowBlur=0;break}
    case'bat':{ // Rejeton vampire
      const w=Math.sin(T*16+e.id),fy=Math.sin(T*6+e.id)*2;const yy=y+fy;
      g.fillStyle='#2a0f18';for(const sd of[-1,1]){g.beginPath();g.moveTo(x,yy-4);g.quadraticCurveTo(x+sd*14,yy-10-w*4,x+sd*17,yy+2-w*3);g.lineTo(x+sd*12,yy+1);g.lineTo(x+sd*9,yy+6);g.lineTo(x+sd*5,yy+3);g.closePath();g.fill()}
      g.fillStyle='#7d1c2a';g.beginPath();g.moveTo(x-5,yy-3);g.lineTo(x+5,yy-3);g.lineTo(x+6,yy+9);g.lineTo(x-6,yy+9);g.closePath();g.fill();
      g.fillStyle='#e6dccf';g.beginPath();g.arc(x,yy-7,5.5,0,6.28);g.fill();g.fillStyle='#1a0d14';g.beginPath();g.moveTo(x-5.5,yy-8);g.quadraticCurveTo(x,yy-15,x+5.5,yy-8);g.lineTo(x,yy-10);g.closePath();g.fill();
      g.fillStyle='#ff3a3a';g.fillRect(x-3+lx,yy-8+ly,2,1.6);g.fillRect(x+1+lx,yy-8+ly,2,1.6);g.fillStyle='#fff';g.fillRect(x-1.6,yy-4,1,2);g.fillRect(x+.6,yy-4,1,2);break}
    case'archer':{ // Adepte d'Amarath
      const gl=.5+.5*Math.sin(T*5+e.id);g.fillStyle='#24152f';g.beginPath();g.moveTo(x-6,y-6);g.lineTo(x+6,y-6);g.lineTo(x+10,y+12);g.lineTo(x-10,y+12);g.closePath();g.fill();
      g.fillStyle='#3a2350';g.beginPath();g.moveTo(x-3,y-6);g.lineTo(x+3,y-6);g.lineTo(x+4,y+12);g.lineTo(x-4,y+12);g.closePath();g.fill();g.fillStyle='#c9a23a';g.fillRect(x-10,y+10,20,1.6);
      g.fillStyle='#2e1a40';g.beginPath();g.arc(x,y-10,8,0,6.28);g.fill();g.beginPath();g.moveTo(x-6,y-15);g.lineTo(x-lx*2,y-23);g.lineTo(x+6,y-15);g.fill();
      g.fillStyle='#0c0710';g.beginPath();g.ellipse(x+lx*1.5,y-9+ly,5,4.5,0,0,6.28);g.fill();g.fillStyle='#d88cff';g.fillRect(x-3+lx*2,y-10+ly,2,1.6);g.fillRect(x+1+lx*2,y-10+ly,2,1.6);
      const hx=x+lx*10,hy=y+ly*6;g.fillStyle='#b9b0a0';g.beginPath();g.arc(hx,hy,2,0,6.28);g.fill();const og=g.createRadialGradient(hx,hy-4,0,hx,hy-4,7);og.addColorStop(0,'rgba(255,255,255,'+(.8*gl)+')');og.addColorStop(.4,'rgba(176,103,232,'+(.7*gl+.2)+')');og.addColorStop(1,'rgba(176,103,232,0)');g.fillStyle=og;g.beginPath();g.arc(hx,hy-4,7,0,6.28);g.fill();
      if(elite){g.fillStyle='#c9a23a';g.fillRect(x-6,y-16,12,2)}break}
    case'orc':{ if(G.m&&G.m.soldat){ // Veilleur de l'Everwatch
        const steel=elite?'#d6d2e4':'#8d93a8',dark=elite?'#7a6a3a':'#4a5068';g.fillStyle='#2a2d3a';g.fillRect(x-6,y+8,4.5,6);g.fillRect(x+1.5,y+8,4.5,6);
        g.fillStyle='#1f3358';g.beginPath();g.moveTo(x-9,y-3);g.lineTo(x+9,y-3);g.lineTo(x+11,y+11);g.lineTo(x-11,y+11);g.closePath();g.fill();
        g.fillStyle=steel;rr(g,x-9,y-5,18,13,4);g.fill();g.fillStyle=dark;g.fillRect(x-9,y+4,18,2);
        g.fillStyle='#e8e6f2';g.beginPath();g.ellipse(x,y+0,4,2.4,0,0,6.28);g.fill();g.fillStyle='#1f3358';g.beginPath();g.arc(x,y,1.4,0,6.28);g.fill();
        g.fillStyle=steel;g.beginPath();g.arc(x,y-11,8,0,6.28);g.fill();g.fillStyle='#1a1c26';g.fillRect(x-6,y-12+ly,12,2.6);g.fillStyle=dark;g.fillRect(x-1,y-19,2,8);
        if(elite){g.fillStyle='#c0392b';g.beginPath();g.moveTo(x,y-19);g.quadraticCurveTo(x-10,y-24,x-12,y-14);g.quadraticCurveTo(x-6,y-19,x,y-17);g.fill()}
        const a=Math.atan2(ly,lx);g.save();g.translate(x+lx*9,y+ly*5);g.rotate(a);g.strokeStyle='#6b4a28';g.lineWidth=2.4;g.beginPath();g.moveTo(-8,0);g.lineTo(18,0);g.stroke();g.fillStyle='#d6d2e4';g.beginPath();g.moveTo(18,-3);g.lineTo(26,0);g.lineTo(18,3);g.fill();g.restore();
        if(tele||e.chg>0){g.fillStyle='#ff3a2a';g.fillRect(x-4,y-12,8,1.5)}break}
      const el=elite;const skin=el?'#8fa75a':'#6e9a45';const armor=el?'#d6a33c':'#6b4a2b';
      g.fillStyle='#3a2a1a';g.fillRect(x-7,y+8,5,6);g.fillRect(x+2,y+8,5,6);g.fillStyle=armor;rr(g,x-11,y-4,22,15,5);g.fill();g.fillStyle=el?'#fff0b0':'#4e3216';g.fillRect(x-11,y+4,22,2.5);g.fillStyle=skin;g.beginPath();g.arc(x-12,y+2,4,0,6.28);g.arc(x+12,y+2,4,0,6.28);g.fill();
      g.beginPath();g.arc(x,y-9,9.5,0,6.28);g.fill();g.beginPath();g.moveTo(x-9,y-11);g.lineTo(x-15,y-14);g.lineTo(x-8,y-6);g.moveTo(x+9,y-11);g.lineTo(x+15,y-14);g.lineTo(x+8,y-6);g.fill();
      g.fillStyle='#3a4a22';g.fillRect(x-7,y-13,14,2.5);g.fillStyle=e.chg>0||tele?'#ff3a2a':'#ffd23a';g.fillRect(x-5+lx,y-10+ly,3,2.5);g.fillRect(x+2+lx,y-10+ly,3,2.5);g.fillStyle='#f4ecd6';g.beginPath();g.moveTo(x-5,y-4);g.lineTo(x-4,y-9);g.lineTo(x-2.5,y-4);g.moveTo(x+5,y-4);g.lineTo(x+4,y-9);g.lineTo(x+2.5,y-4);g.fill();
      if(el){g.fillStyle='#f0c95a';g.beginPath();g.moveTo(x-8,y-16);g.lineTo(x-8,y-24);g.lineTo(x-4,y-19);g.lineTo(x,y-26);g.lineTo(x+4,y-19);g.lineTo(x+8,y-24);g.lineTo(x+8,y-16);g.closePath();g.fill();g.fillStyle='#d24a3f';g.beginPath();g.arc(x,y-20,1.6,0,6.28);g.fill()}
      else{g.fillStyle='#7d7a8a';g.beginPath();g.arc(x,y-12,8.5,Math.PI,0);g.fill();g.beginPath();g.moveTo(x-2,y-20);g.lineTo(x,y-27);g.lineTo(x+2,y-20);g.fill()}
      const a=Math.atan2(ly,lx);g.save();g.translate(x+lx*12,y+ly*6);g.rotate(a+Math.sin(T*4)*.15);g.strokeStyle='#5a3b1e';g.lineWidth=3;g.beginPath();g.moveTo(-4,0);g.lineTo(14,0);g.stroke();g.fillStyle=el?'#f0d78a':'#b9b6c6';g.beginPath();g.moveTo(10,-1);g.quadraticCurveTo(18,-10,22,-2);g.lineTo(22,2);g.quadraticCurveTo(18,10,10,1);g.fill();g.restore();break}
    case'boss':drawBoss(g,e.bv??chp,x,y,T,lx,ly,e);break;
    case'mimic':{const op=.25+Math.abs(Math.sin(T*8))*.45;g.fillStyle='#7a4b25';rr(g,x-13,y-3,26,15,3);g.fill();g.fillStyle='#5a0f16';g.fillRect(x-11,y-3,22,5);g.save();g.translate(x,y-3);g.rotate(-op);g.fillStyle='#8e5a2c';rr(g,-13,-9,26,9,3);g.fill();g.fillStyle='#ffd23a';g.beginPath();g.arc(-5,-5,2.5,0,6.28);g.arc(5,-5,2.5,0,6.28);g.fill();g.restore();break}
  }
  if(big)g.restore();
  if(elite){const ky=y-e.r*(big?1.4:1)-20+Math.sin(T*4)*2;g.save();g.shadowColor='#f0c95a';g.shadowBlur=8;g.strokeStyle='#f0c95a';g.lineWidth=2.4;g.beginPath();g.arc(x-4,ky,3,0,6.28);g.moveTo(x-1,ky);g.lineTo(x+7,ky);g.lineTo(x+7,ky+3);g.moveTo(x+4,ky);g.lineTo(x+4,ky+2.5);g.stroke();g.restore()}
  if(flash){g.globalCompositeOperation='lighter';g.fillStyle='rgba(255,255,255,.45)';g.beginPath();g.arc(x,y-3,e.r+2,0,6.28);g.fill();g.globalCompositeOperation='source-over'}
  if(frz){g.fillStyle='rgba(140,200,255,.45)';g.beginPath();g.arc(x,y,e.r+3,0,6.28);g.fill();g.strokeStyle='rgba(230,245,255,.8)';g.lineWidth=1;for(let k=0;k<3;k++){const a=k*2.1+e.id;g.beginPath();g.moveTo(x+Math.cos(a)*4,y+Math.sin(a)*4);g.lineTo(x+Math.cos(a)*(e.r+3),y+Math.sin(a)*(e.r+3));g.stroke()}}
  const hp=e.hpP!=null?e.hpP/100:e.hp/e.mhp;if(hp<1&&e.type!=='boss'){const yb=y-e.r*(big?1.4:1)-12;g.fillStyle='#0a0910';g.fillRect(x-12,yb,24,4);g.fillStyle=elite?'#f0c95a':'#d24a3f';g.fillRect(x-12,yb,24*hp,4)}}
function drawBoss(g,v,x,y,T,lx,ly,e){const fy=Math.sin(T*2)*2;const yy=y+fy;const aura=(c,r)=>{const au=g.createRadialGradient(x,yy,4,x,yy,r);au.addColorStop(0,c);au.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=au;g.beginPath();g.arc(x,yy,r,0,6.28);g.fill()};
  if(!(v===5&&e&&((e.fl!=null?e.fl:(e.mistT>0?32:0))&32))&&drawBossPix(g,v,x,y,T,lx,ly,e))return;   // pixel art, sauf Reinald en brume
  const sword=(len,col,hilt)=>{const a=Math.atan2(ly,lx)+(e&&e.chg>0?0:Math.sin(T*3)*.2);g.save();g.translate(x+lx*14,yy+ly*8);g.rotate(a);g.fillStyle=hilt;g.fillRect(-6,-2,8,4);g.fillRect(1,-7,3,14);g.fillStyle=col;g.beginPath();g.moveTo(4,-3);g.lineTo(4+len,-1.5);g.lineTo(8+len,0);g.lineTo(4+len,1.5);g.lineTo(4,3);g.fill();g.restore()};
  if(v===0){ // Sinthara : armure, pierre encastrée qui brille
    aura('rgba(160,200,255,.28)',42);
    g.fillStyle='#1f3358';g.beginPath();g.moveTo(x-12,yy-10);g.lineTo(x+12,yy-10);g.lineTo(x+20,yy+22);g.lineTo(x-20,yy+22);g.closePath();g.fill();
    g.fillStyle='#c9cbe0';rr(g,x-12,yy-12,24,24,6);g.fill();g.fillStyle='#8d93a8';g.fillRect(x-12,yy+4,24,3);g.fillStyle='#e8e6f2';g.fillRect(x-10,yy-10,20,2);
    g.fillStyle='#c9cbe0';g.beginPath();g.arc(x-14,yy-8,6,0,6.28);g.arc(x+14,yy-8,6,0,6.28);g.fill();
    const st=.6+.4*Math.sin(T*4);g.save();g.shadowColor='#cfe2ff';g.shadowBlur=14*st;g.fillStyle='#cfe2ff';g.beginPath();g.moveTo(x,yy-8);g.lineTo(x+4,yy-3);g.lineTo(x,yy+2);g.lineTo(x-4,yy-3);g.closePath();g.fill();g.restore();
    g.fillStyle='#2a1a22';g.beginPath();g.arc(x,yy-22,10,0,6.28);g.fill();g.fillRect(x-10,yy-22,20,14);
    g.fillStyle='#e9cdb0';g.beginPath();g.arc(x+lx,yy-21,7,0,6.28);g.fill();g.fillStyle='#1a1424';g.fillRect(x-4+lx*2,yy-22+ly,2,2);g.fillRect(x+2+lx*2,yy-22+ly,2,2);
    g.fillStyle='#c9cbe0';g.beginPath();g.moveTo(x-9,yy-27);g.lineTo(x+9,yy-27);g.lineTo(x+6,yy-32);g.lineTo(x,yy-29);g.lineTo(x-6,yy-32);g.closePath();g.fill();
    sword(22,'#e8e6f2','#c9a23a');return}
  if(v===1){ // Abhorash : chevalier vampire, sang de dragon
    aura('rgba(220,40,40,.32)',46);
    g.fillStyle='#3a0d12';for(const sd of[-1,1]){g.beginPath();g.moveTo(x+sd*8,yy-12);g.quadraticCurveTo(x+sd*30,yy-30,x+sd*34,yy-6);g.lineTo(x+sd*26,yy-10);g.lineTo(x+sd*24,yy+2);g.lineTo(x+sd*16,yy-4);g.closePath();g.fill()}
    g.fillStyle='#5a0f16';g.beginPath();g.moveTo(x-12,yy-8);g.lineTo(x+12,yy-8);g.lineTo(x+18,yy+24);g.lineTo(x-18,yy+24);g.closePath();g.fill();
    g.fillStyle='#8e1a24';rr(g,x-13,yy-12,26,24,6);g.fill();g.fillStyle='#c9a23a';g.fillRect(x-13,yy+5,26,2.5);g.fillStyle='#b8323c';g.fillRect(x-11,yy-10,22,2);
    g.fillStyle='#8e1a24';g.beginPath();g.arc(x-15,yy-8,7,0,6.28);g.arc(x+15,yy-8,7,0,6.28);g.fill();g.fillStyle='#c9a23a';for(const sd of[-1,1]){g.beginPath();g.moveTo(x+sd*13,yy-13);g.lineTo(x+sd*20,yy-20);g.lineTo(x+sd*18,yy-11);g.fill()}
    g.fillStyle='#d9d2d8';g.beginPath();g.arc(x+lx,yy-21,8,0,6.28);g.fill();g.fillStyle='#8e1a24';g.beginPath();g.arc(x,yy-23,9,Math.PI,0);g.fill();g.fillRect(x-9,yy-24,3,9);g.fillRect(x+6,yy-24,3,9);
    g.save();g.shadowColor='#ff2020';g.shadowBlur=8;g.fillStyle='#ff3030';g.fillRect(x-4+lx*2,yy-21+ly,2.4,2);g.fillRect(x+1.6+lx*2,yy-21+ly,2.4,2);g.restore();g.fillStyle='#fff';g.fillRect(x-2,yy-16,1,2.4);g.fillRect(x+1,yy-16,1,2.4);
    sword(28,'#d8d0d8','#3a0d12');return}
  if(v===2){ // Chef de guerre orc
    aura('rgba(255,120,40,.22)',40);
    g.fillStyle='#3a2a1a';g.fillRect(x-10,yy+12,7,8);g.fillRect(x+3,yy+12,7,8);
    g.fillStyle='#5a3b1e';rr(g,x-16,yy-8,32,22,7);g.fill();g.fillStyle='#8a5a2b';g.fillRect(x-16,yy+4,32,3);for(let k=-12;k<=12;k+=8){g.fillStyle='#e8e1cc';g.beginPath();g.arc(x+k,yy+9,2.6,0,6.28);g.fill()}
    g.fillStyle='#5f8a3a';g.beginPath();g.arc(x-18,yy-2,6,0,6.28);g.arc(x+18,yy-2,6,0,6.28);g.fill();g.beginPath();g.arc(x+lx,yy-16,12,0,6.28);g.fill();
    g.fillStyle='#4a4a56';g.beginPath();g.arc(x,yy-19,12,Math.PI,0);g.fill();g.fillStyle='#e8e1cc';for(const sd of[-1,1]){g.beginPath();g.moveTo(x+sd*10,yy-22);g.quadraticCurveTo(x+sd*22,yy-26,x+sd*20,yy-38);g.quadraticCurveTo(x+sd*16,yy-28,x+sd*7,yy-25);g.closePath();g.fill()}
    g.fillStyle='#ff4a2a';g.fillRect(x-6+lx*2,yy-17+ly,3.5,3);g.fillRect(x+2.5+lx*2,yy-17+ly,3.5,3);g.fillStyle='#f4ecd6';g.beginPath();g.moveTo(x-6,yy-9);g.lineTo(x-5,yy-15);g.lineTo(x-3,yy-9);g.moveTo(x+6,yy-9);g.lineTo(x+5,yy-15);g.lineTo(x+3,yy-9);g.fill();
    for(const sd of[-1,1]){g.save();g.translate(x+sd*20,yy+2);g.rotate(sd*(.5+Math.sin(T*4)*.2));g.strokeStyle='#5a3b1e';g.lineWidth=3;g.beginPath();g.moveTo(0,6);g.lineTo(0,-16);g.stroke();g.fillStyle='#b9b6c6';g.beginPath();g.moveTo(0,-16);g.quadraticCurveTo(sd*12,-20,sd*10,-8);g.lineTo(0,-10);g.fill();g.restore()}return}
  if(v===3){ // Haut-Adepte d'Amarath
    aura('rgba(176,103,232,.35)',46);
    const rb=g.createLinearGradient(x,yy-20,x,yy+26);rb.addColorStop(0,'#4a2a6e');rb.addColorStop(1,'#1d1030');g.fillStyle=rb;g.beginPath();g.moveTo(x-12,yy-12);g.lineTo(x+12,yy-12);g.lineTo(x+22,yy+22);for(let k=0;k<6;k++)g.lineTo(x+22-(k+.5)*44/6,yy+(k%2?22:28)+Math.sin(T*5+k)*2);g.lineTo(x-22,yy+22);g.closePath();g.fill();
    g.strokeStyle='#c9a23a';g.lineWidth=1.5;g.beginPath();g.moveTo(x,yy-10);g.lineTo(x,yy+22);g.stroke();
    g.fillStyle='#2e1a45';g.beginPath();g.arc(x,yy-16,13,0,6.28);g.fill();g.beginPath();g.moveTo(x-11,yy-22);g.lineTo(x-lx*3,yy-36);g.lineTo(x+11,yy-22);g.fill();
    g.fillStyle='#0c0710';g.beginPath();g.ellipse(x+lx*2,yy-14+ly,8,7,0,0,6.28);g.fill();g.save();g.fillStyle='#d88cff';g.shadowColor='#b067e8';g.shadowBlur=8;g.beginPath();g.arc(x-3.5+lx*2.5,yy-15+ly,1.8,0,6.28);g.arc(x+3.5+lx*2.5,yy-15+ly,1.8,0,6.28);g.fill();g.restore();
    g.strokeStyle='#5a3b1e';g.lineWidth=3;g.beginPath();g.moveTo(x+18,yy+24);g.lineTo(x+20,yy-26);g.stroke();const og=g.createRadialGradient(x+20,yy-30,0,x+20,yy-30,10);og.addColorStop(0,'#fff');og.addColorStop(.4,'#d88cff');og.addColorStop(1,'rgba(176,103,232,0)');g.fillStyle=og;g.beginPath();g.arc(x+20,yy-30,10,0,6.28);g.fill();return}
  if(v===5){const mist=e&&((e.fl!=null?e.fl:(e.mistT>0?32:0))&32);
    if(mist){for(let k=0;k<9;k++){const a=k/9*6.28+T*2,r=10+Math.sin(T*5+k)*5;g.fillStyle='rgba(30,20,40,'+(.35+.2*Math.sin(T*3+k))+')';g.beginPath();g.arc(x+Math.cos(a)*r,yy+Math.sin(a)*r*.6,9,0,6.28);g.fill()}g.fillStyle='#ff3a3a';g.fillRect(x-4,yy-4,2.5,2);g.fillRect(x+2,yy-4,2.5,2);return}
    aura('rgba(20,10,30,.55)',40);
    g.strokeStyle='rgba(10,5,15,.55)';g.lineWidth=3;for(let k=0;k<5;k++){const a=k*1.3+T*1.5;g.beginPath();g.moveTo(x,yy+6);g.quadraticCurveTo(x+Math.cos(a)*18,yy+10,x+Math.cos(a)*26,yy+16+Math.sin(a)*4);g.stroke()}
    g.fillStyle='#16101c';g.beginPath();g.moveTo(x-10,yy-10);g.lineTo(x+10,yy-10);g.lineTo(x+16,yy+22);g.lineTo(x-16,yy+22);g.closePath();g.fill();
    g.fillStyle='#24262e';rr(g,x-11,yy-12,22,20,5);g.fill();g.fillStyle='#3a3d48';g.fillRect(x-9,yy-10,18,2);g.fillStyle='#4a4d58';g.fillRect(x-11,yy+3,22,2);
    g.strokeStyle='#d8dbe6';g.lineWidth=1;g.beginPath();g.moveTo(x-4,yy-12);g.lineTo(x,yy-6);g.lineTo(x+4,yy-12);g.stroke();g.fillStyle='#e8ebf4';g.beginPath();g.arc(x,yy-5.5,1.8,0,6.28);g.fill();
    g.fillStyle='#ece6ea';g.beginPath();g.arc(x+lx,yy-20,7.5,0,6.28);g.fill();g.fillStyle='#120c16';g.beginPath();g.arc(x,yy-23,8.5,Math.PI*1.02,Math.PI*1.98);g.fill();g.fillRect(x-8.5,yy-24,3,8);g.fillRect(x+5.5,yy-24,3,6);
    g.fillStyle='#1d3a2a';g.beginPath();g.moveTo(x-10,yy-22);g.quadraticCurveTo(x,yy-36,x+10,yy-22);g.lineTo(x+12,yy-12);g.lineTo(x-12,yy-12);g.closePath();g.globalAlpha=.85;g.fill();g.globalAlpha=1;
    g.save();g.shadowColor='#ff2020';g.shadowBlur=8;g.fillStyle='#ff3a3a';g.fillRect(x-3.6+lx*2,yy-21+ly,2.2,1.8);g.fillRect(x+1.4+lx*2,yy-21+ly,2.2,1.8);g.restore();
    const a=Math.atan2(ly,lx);g.save();g.translate(x+lx*12,yy+ly*6);g.rotate(a);g.fillStyle='#2a1d14';g.fillRect(-5,-1.5,7,3);g.fillStyle='#120c16';g.fillRect(1,-5,2.5,10);
    const sg=g.createLinearGradient(3,0,26,0);sg.addColorStop(0,'#2a1a3a');sg.addColorStop(1,'rgba(120,60,180,.2)');g.fillStyle=sg;g.beginPath();g.moveTo(3,-2.5);g.lineTo(24,-1);g.lineTo(28,0);g.lineTo(24,1);g.lineTo(3,2.5);g.fill();g.restore();return}
  // Amarath : elfe devenu vampire, maître des marionnettes
  aura('rgba(120,20,60,.4)',52);
  g.strokeStyle='rgba(200,170,255,.25)';g.lineWidth=.8;g.beginPath();for(let k=0;k<6;k++){const a=k/6*6.28+T*.4;g.moveTo(x+Math.cos(a)*10,yy-6);g.lineTo(x+Math.cos(a)*40,yy+Math.sin(a)*16+18)}g.stroke();
  g.fillStyle='#14080f';g.beginPath();g.moveTo(x-12,yy-10);g.lineTo(x+12,yy-10);g.lineTo(x+22,yy+24);for(let k=0;k<5;k++)g.lineTo(x+22-(k+.5)*44/5,yy+(k%2?24:30)+Math.sin(T*4+k)*2);g.lineTo(x-22,yy+24);g.closePath();g.fill();
  g.fillStyle='#5a0f22';g.beginPath();g.moveTo(x-5,yy-10);g.lineTo(x+5,yy-10);g.lineTo(x+7,yy+24);g.lineTo(x-7,yy+24);g.closePath();g.fill();g.fillStyle='#2a1420';rr(g,x-12,yy-14,24,10,4);g.fill();g.fillStyle='#c9a23a';g.fillRect(x-12,yy-6,24,1.6);
  g.fillStyle='#d9d4e2';for(const sd of[-1,1]){g.beginPath();g.moveTo(x+sd*6,yy-30);g.quadraticCurveTo(x+sd*14,yy-18,x+sd*11,yy-2);g.lineTo(x+sd*6,yy-10);g.closePath();g.fill()}
  g.fillStyle='#e9e2ea';g.beginPath();g.arc(x+lx,yy-21,8,0,6.28);g.fill();for(const sd of[-1,1]){g.beginPath();g.moveTo(x+sd*7,yy-22);g.lineTo(x+sd*15,yy-27);g.lineTo(x+sd*7.5,yy-18);g.fill()}
  g.fillStyle='#d9d4e2';g.beginPath();g.arc(x,yy-24,8.5,Math.PI*1.05,Math.PI*1.95);g.fill();
  g.save();g.shadowColor='#ff2050';g.shadowBlur=8;g.fillStyle='#ff3060';g.fillRect(x-4+lx*2,yy-22+ly,2.4,2);g.fillRect(x+1.6+lx*2,yy-22+ly,2.4,2);g.restore();g.fillStyle='#fff';g.fillRect(x-1.8,yy-16.5,1,2.2);g.fillRect(x+.8,yy-16.5,1,2.2);
  g.save();const hx=x-lx*4+(lx>0?-16:16),hy=yy-4;const og=g.createRadialGradient(hx,hy,0,hx,hy,9);og.addColorStop(0,'rgba(255,255,255,.9)');og.addColorStop(.4,'rgba(200,80,140,.8)');og.addColorStop(1,'rgba(120,20,60,0)');g.fillStyle=og;g.beginPath();g.arc(hx,hy,9,0,6.28);g.fill();g.restore()}
