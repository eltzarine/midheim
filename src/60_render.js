/* ================= Effets visuels ================= */
function addText(x,y,txt,col,life,size){parts.push({k:'txt',x,y,vy:-38,txt,col,life:life||.9,max:life||.9,size:size||13})}
function sparks(x,y,col,n){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=40+Math.random()*120;parts.push({k:'sp',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.4+Math.random()*.3,max:.7,col})}}
function ring(x,y,r,mr,life,col,w){parts.push({k:'ring',x,y,r,mr,life,max:life,col,w:w||3})}
function processFx(list){for(const f of list){if(f.id<=lastFx)continue;lastFx=f.id;const mine=f.o===myIdx;fxExtra(f,mine);
  switch(f.k){
    case 1:addText(f.x+(Math.random()*10-5),f.y,String(f.v),'#efe6cf');Snd.play('hit');break;
    case 2:addText(f.x,f.y,f.v+' !','#ffd04a',1.1,17);Snd.play('crit');break;
    case 3:addText(f.x,f.y,'+'+f.v,'#7fe07a');break;
    case 4:if(!mine)parts.push({k:'slash',x:f.x,y:f.y,a:f.v/100,life:SWD,max:SWD,o:f.o});break;
    case 5:ring(f.x,f.y,6,f.v,.35,'#ff9b3d');sparks(f.x,f.y,'#ffb347',10);Snd.play('boom');break;
    case 6:ring(f.x,f.y,10,f.v,.45,'#9fd0ff');sparks(f.x,f.y,'#cfe8ff',16);if(!mine)Snd.play('nova');break;
    case 8:if(mine){addText(f.x,f.y-8,'+'+f.v+' or','#f0c95a',.8,12);Snd.play('coin')}break;
    case 9:addText(f.x,f.y,'-'+f.v,'#ff6a5c',.9,14);if(mine){Snd.play('hurt');shake=6;L.ult=Math.min(100,L.ult+1.5)}break;
    case 10:ring(f.x,f.y,10,f.v,.3,'#ff7a5c');if(!mine)Snd.play('boom');break;
    case 11:ring(f.x,f.y,6,30,.3,'#86cc70');break;
    case 12:sparks(f.x,f.y,'#b9b0d0',Math.min(14,4+f.v/2));Snd.play('die');if(G&&G.m&&G.m.kind==='world'&&Math.hypot(f.x-L.x,f.y-L.y)<700)questEvent('kill',{reg:regionAt(Math.floor(f.x/TS),Math.floor(f.y/TS)).id});if(G&&Math.hypot(f.x-L.x,f.y-L.y)<360&&hero.lvl>=SKILLS[hero.cls][3].lvl)L.ult=Math.min(100,L.ult+4);break;
    case 13:ring(f.x,f.y,10,f.v,.5,'#9ff08a');if(!mine)Snd.play('heal');break;
    case 14:ring(f.x,f.y,4,26,.4,'#7fe07a');break;
    case 15:if(mine){addText(f.x,f.y-8,'+1 potion','#7fe07a',.9,12);Snd.play('pot')}break;
    case 16:sparks(f.x,f.y,'#f0c95a',18);Snd.play('key');break;
    case 17:sparks(f.x,f.y,'#7ff0e8',16);Snd.play('key');break;
    case 18:sparks(f.x,f.y,'#f0c95a',10);Snd.play('chest');if(G&&G.m&&G.m.kind==='world'&&Math.hypot(f.x-L.x,f.y-L.y)<700)questEvent('chest');break;
    case 42:if(Math.hypot(f.x-L.x,f.y-L.y)<1000)questEvent('camp');break;
    case 43:if(Math.hypot(f.x-L.x,f.y-L.y)<1000)questEvent('elite');break;
    case 44:questEvent('dun');break;
    case 19:Snd.play('hit');break;
    case 20:sparks(f.x,f.y,'#c9c2e0',20);Snd.play('gate');break;
    case 21:if(BUB[f.v])addBubble({who:'p',o:f.o,txt:BUB[f.v],life:3,max:3});break;
    case 22:if(BUB[f.v])addBubble({who:'e',o:f.o,x:f.x,y:f.y,txt:BUB[f.v],life:2.8,max:2.8});break;
    case 23:queueStoryKey('reinald2');break;
    case 24:if(mine){const v=Math.abs(f.v|0),rar=v%10,lv=Math.floor(v/10)%100,seed=Math.floor(v/1000);gotItem(genItem(seed,lv,rar,hero.cls))}sparks(f.x,f.y,(RAR[f.v%10]||RAR[0]).col,12);break;
    case 25:if(STORY_ORDER[f.v])queueStoryKey(STORY_ORDER[f.v]);break;
    case 27:if(mine){addText(f.x,f.y-8,'+'+f.v+' éclat'+(f.v>1?'s':''),'#9fe8ff',.9,12);Snd.play('coin')}break;
    case 28:{const a=f.v/100;for(let k=0;k<8;k++)parts.push({k:'sp',x:f.x-Math.cos(a)*k*20,y:f.y-Math.sin(a)*k*20,vx:0,vy:0,life:.35,max:.35,col:'#ffd2a0'});Snd.play('boom');break}
    case 29:ring(f.x,f.y,10,f.v,.6,'#ff9a5c',4);ring(f.x,f.y,10,f.v*.7,.45,'#ffd27a');Snd.play('gate');break;
    case 30:ring(f.x,f.y,10,f.v,.5,'#e0b45c',6);ring(f.x,f.y,10,f.v*.6,.35,'#fff2c0',4);sparks(f.x,f.y,'#c9a27c',24);shake=Math.max(shake,12);Snd.play('boom');break;
    case 31:ring(f.x,f.y,10,f.v,.5,'#ff7a3a');Snd.play('fire');break;
    case 32:ring(f.x,f.y,8,60,.6,'#c27bff',4);Snd.play('nova');break;
    case 33:for(let k=0;k<14;k++)parts.push({k:'smoke',x:f.x+(Math.random()-.5)*f.v*1.4,y:f.y+(Math.random()-.5)*f.v,vx:(Math.random()-.5)*20,vy:-10,life:3+Math.random(),max:4,r:18+Math.random()*16});break;
    case 34:{const ox=Math.floor(f.v/10000),oy=f.v%10000;parts.push({k:'line',x:ox,y:oy,x2:f.x,y2:f.y,life:.3,max:.3,col:'#c8ffc0'});sparks(f.x,f.y,'#c8ffc0',6);Snd.play('swing');break}
    case 35:ring(f.x,f.y,24,16,.5,'#ffe9a0',3);break;
    case 36:ring(f.x,f.y,f.v,10,.45,'#fff3c0',5);for(let k=0;k<5;k++)parts.push({k:'beam',x:f.x+(Math.random()-.5)*f.v,y:f.y+(Math.random()-.5)*f.v*.6,life:.5,max:.5});Snd.play('heal');break;
    case 37:ring(f.x,f.y,10,f.v,.8,'#fff3c0',6);ring(f.x,f.y,10,f.v*.6,.6,'#ffd27a',4);Snd.play('lvl');break;
    case 38:sparks(f.x,f.y,'#9fd0ff',8);break;
    case 39:addText(f.x,f.y,'absorbé','#ffe9a0',.7,11);break;
    case 40:{const tx=Math.floor(f.v/10000),ty=f.v%10000;parts.push({k:'bolt',x:f.x,y:f.y,x2:tx,y2:ty,life:.25,max:.25});Snd.play('crit');break}
    case 41:addText(f.x+(Math.random()*10-5),f.y,String(f.v),'#ff9b3d',.6,11);break;
  }}}
function processMsgs(list){for(const m of list){if(m[0]<=lastMsg)continue;lastMsg=m[0];toast(String(m[1]).slice(0,140))}}
const toastCool={};
function toast(text,key){if(key){const n=performance.now();if(toastCool[key]&&n-toastCool[key]<2500)return;toastCool[key]=n}const box=$('#toasts');const d=el('div','toast',text);box.prepend(d);while(box.children.length>3)box.lastChild.remove();setTimeout(()=>d.remove(),4600)}
let bannerT=null;function showBanner(t,sub){const b=$('#banner');b.textContent=t;if(sub){b.append(el('small',null,sub))}b.classList.add('show');clearTimeout(bannerT);bannerT=setTimeout(()=>b.classList.remove('show'),2800)}
let loadT=null;function showLoading(t,sub){const b=$('#loadBox');$('#loadTitle').textContent=t||'Midheim';$('#loadSub').textContent=sub||'';b.hidden=false;b.style.opacity=1;clearTimeout(loadT);loadT=setTimeout(()=>{b.style.opacity=0;loadT=setTimeout(()=>{b.hidden=true},260)},650)}

/* ================= Caméra ================= */
const cv=$('#cv'),ctx=cv.getContext('2d');const lc=document.createElement('canvas'),lx=lc.getContext('2d');
let dpr=1,vw=0,vh=0,scale=1,camX=0,camY=0,shake=0;
function resize(){dpr=Math.min(2,window.devicePixelRatio||1);vw=cv.clientWidth||innerWidth;vh=cv.clientHeight||innerHeight;cv.width=Math.round(vw*dpr);cv.height=Math.round(vh*dpr);lc.width=Math.max(1,Math.round(vw*dpr/2));lc.height=Math.max(1,Math.round(vh*dpr/2));
  scale=clamp(Math.min(vw/(TS*11),vh/(TS*11)),.6,1.6)}
addEventListener('resize',resize);
function screenToWorld(sx,sy){return{x:(sx-vw/2)/scale+camX,y:(sy-vh*focusY())/scale+camY}}
function focusY(){return vh>vw?.55:.52}
function wpos(i){const p=G.players[i];if(i===myIdx)return{x:L.x,y:L.y};return{x:p.rx,y:p.ry}}

/* ================= Sol du monde, découpé en morceaux ================= */
const CHK=16,CPAD=28;
function wT(x,y){const m=WORLD;if(x<0||y<0||x>=m.W||y>=m.H)return 0;return m.t[y*m.W+x]}
function chunkOf(cx,cy){const k=cx+','+cy,M=WORLD.chunks;let c=M.get(k);if(c){M.delete(k);M.set(k,c);return c}c=renderChunk(cx,cy);M.set(k,c);if(M.size>42)M.delete(M.keys().next().value);return c}
function drawWorldGround(x0,y0,x1,y1){const c0=Math.max(0,Math.floor(x0/(CHK*TS))),c1=Math.min(Math.ceil(WORLD.W/CHK)-1,Math.floor(x1/(CHK*TS)));
  const r0=Math.max(0,Math.floor(y0/(CHK*TS))),r1=Math.min(Math.ceil(WORLD.H/CHK)-1,Math.floor((y1+CPAD)/(CHK*TS)));
  ctx.imageSmoothingEnabled=false;for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const c=chunkOf(cx,cy);ctx.drawImage(c,cx*CHK*TS,cy*CHK*TS-CPAD,c.width+1,c.height+1)}ctx.imageSmoothingEnabled=true}
/* ================= Objets du monde : arbres, rochers, bâtiments, personnages ================= */
function drawBuildingBase(b,T){const g=ctx,x=b.x*TS,y=b.y*TS,w=b.w*TS,h=b.h*TS,roof=b.roof||'#7a3a2a';const dx=(b.door.x+.5)*TS;
  g.fillStyle='rgba(0,0,0,.28)';g.fillRect(x+6,y+h-4,w,10);
  if(b.kind==='porte'||b.kind==='sceau'||b.kind==='grotte'){
    if(b.kind==='grotte'){g.fillStyle='#5a5246';g.beginPath();g.moveTo(x-8,y+h);g.quadraticCurveTo(x-6,y-18,x+w/2,y-24);g.quadraticCurveTo(x+w+6,y-18,x+w+8,y+h);g.closePath();g.fill();
      g.fillStyle='#7a7064';g.beginPath();g.moveTo(x,y+h);g.quadraticCurveTo(x+4,y-10,x+w/2,y-16);g.lineTo(x+w/2,y+h);g.closePath();g.fill();
      g.fillStyle='#0c0a0a';g.beginPath();g.moveTo(dx-18,y+h);g.quadraticCurveTo(dx-16,y+h-40,dx,y+h-44);g.quadraticCurveTo(dx+16,y+h-40,dx+18,y+h);g.closePath();g.fill();
      g.fillStyle='rgba(240,201,90,'+(.25+.15*Math.sin(T*2))+')';g.beginPath();g.arc(dx,y+h-10,6,0,6.28);g.fill();return}
    const dark=b.kind==='sceau';g.fillStyle=dark?'#1c1820':'#6a645c';g.fillRect(x,y-10,w,h+10);g.fillStyle=dark?'#2a2430':'#8a8278';g.fillRect(x+4,y-6,w-8,h+4);
    g.fillStyle=dark?'#0a080c':'#3a3028';g.beginPath();g.moveTo(dx-20,y+h);g.lineTo(dx-20,y+18);g.quadraticCurveTo(dx,y-4,dx+20,y+18);g.lineTo(dx+20,y+h);g.closePath();g.fill();
    if(!dark){g.fillStyle='#b98544';g.fillRect(dx-20,y+h-30,40,3);g.strokeStyle='#e2b65e';g.lineWidth=1.5;g.beginPath();g.moveTo(dx,y+12);g.lineTo(dx,y+h-4);g.stroke();
      g.fillStyle='#e2b65e';for(const ox of[-30,30]){g.fillRect(dx+ox-3,y-2,6,6)}}
    else{const n=stonesQ(G.q);for(let k=0;k<4;k++){const sx=dx-27+k*18,sy=y+6;g.fillStyle=k<n?STONES[k][1]:'#3a3440';g.save();if(k<n){g.shadowColor=STONES[k][1];g.shadowBlur=10}g.translate(sx,sy);g.rotate(.785);g.fillRect(-4,-4,8,8);g.restore()}
      if(G.q>=5){g.fillStyle='rgba(200,80,140,'+(.25+.2*Math.sin(T*3))+')';g.fillRect(dx-18,y+20,36,h-20)}}
    return}
  if(b.kind==='puits'){g.fillStyle='#8a847a';g.beginPath();g.ellipse(x+16,y+22,14,9,0,0,6.28);g.fill();g.fillStyle='#1c3a44';g.beginPath();g.ellipse(x+16,y+20,9,5,0,0,6.28);g.fill();g.strokeStyle='#5a3e24';g.lineWidth=3;g.beginPath();g.moveTo(x+4,y+18);g.lineTo(x+4,y-6);g.lineTo(x+28,y-6);g.lineTo(x+28,y+18);g.stroke();return}
  const keep=b.kind==='keep',pal=b.kind==='palais';
  const wallC=keep||pal?'#8a847a':'#d8c9a6',beam='#5a3e24';
  g.fillStyle=wallC;g.fillRect(x,y,w,h);
  if(!keep&&!pal){g.fillStyle=beam;g.fillRect(x,y,w,3);g.fillRect(x,y+h-3,w,3);for(let k=0;k<=b.w;k++)g.fillRect(x+k*TS-(k===b.w?3:0),y,3,h);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.strokeStyle=beam;g.lineWidth=2.5;for(let k=0;k<b.w;k++){g.beginPath();g.moveTo(x+k*TS,y);g.lineTo(x+(k+1)*TS,y+h*.6);g.stroke()}g.restore()}
  else{g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;for(let r=0;r<b.h*3;r++){g.beginPath();g.moveTo(x,y+r*11);g.lineTo(x+w,y+r*11);g.stroke()}}
  // fenêtres
  g.fillStyle='#2a2418';for(let k=0;k<b.w;k++){if(Math.abs((x+k*TS+16)-dx)<20)continue;g.fillRect(x+k*TS+10,y+h*.35,12,10);g.fillStyle='rgba(255,220,140,'+(G.night?.8:.35)+')';g.fillRect(x+k*TS+11,y+h*.35+1,10,8);g.fillStyle='#2a2418'}
  // porte
  g.fillStyle='#3a2818';g.fillRect(dx-9,y+h-24,18,24);g.fillStyle='#6b4a2c';g.fillRect(dx-7,y+h-22,14,22);g.fillStyle='#e2b65e';g.fillRect(dx+3,y+h-12,2,2);
  // toit
  if(keep||pal){g.fillStyle=pal?'#2f4f8e':'#3a3450';g.fillRect(x-4,y-14,w+8,16);for(let k=0;k<b.w*2;k++)g.fillRect(x-4+k*16,y-22,10,8);
    const tw=keep?[x+8,x+w-24]:[x+12,x+w/2-8,x+w-28];for(const tx2 of tw){g.fillStyle='#7a746a';g.fillRect(tx2,y-50,16,40);g.fillStyle=pal?'#2f4f8e':'#3a3450';g.beginPath();g.moveTo(tx2-3,y-50);g.lineTo(tx2+8,y-70);g.lineTo(tx2+19,y-50);g.closePath();g.fill()}
    // bannière
    g.fillStyle=keep?'#1f3358':'#8e2f3a';g.fillRect(dx-10,y+4,20,26);g.fillStyle='#efe6cf';if(keep){g.beginPath();g.ellipse(dx,y+15,6,3.5,0,0,6.28);g.fill();g.fillStyle='#1f3358';g.beginPath();g.arc(dx,y+15,2,0,6.28);g.fill()}else{g.beginPath();g.arc(dx,y+15,4,0,6.28);g.fill()}}
  else{g.fillStyle=roof;g.beginPath();g.moveTo(x-8,y+4);g.lineTo(x+w/2,y-h*.75-6);g.lineTo(x+w+8,y+4);g.closePath();g.fill();g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.moveTo(x+w/2,y-h*.75-6);g.lineTo(x+w+8,y+4);g.lineTo(x+w/2,y+4);g.closePath();g.fill();
    g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;for(let r=1;r<5;r++){const yy=y+4-r*(h*.75+10)/5;g.beginPath();g.moveTo(x+w/2-(w/2+8)*(1-r/5),yy);g.lineTo(x+w/2+(w/2+8)*(1-r/5),yy);g.stroke()}
    if(b.kind==='forge'){g.fillStyle='#5a5246';g.fillRect(x+w-20,y-h*.6,10,24);if(Math.random()<.05)parts.push({k:'smoke',x:x+w-15,y:y-h*.6,vx:4,vy:-14,life:2.5,max:2.5,r:6})}}
  // enseigne
  if(b.act&&(b.kind==='auberge'||b.kind==='marchand'||b.kind==='forge')){const sx=dx+22,sy=y+h-30;g.strokeStyle='#3a2818';g.lineWidth=2;g.beginPath();g.moveTo(sx-6,sy-4);g.lineTo(sx+10,sy-4);g.stroke();g.fillStyle='#efe6cf';g.fillRect(sx-2,sy-2,16,14);g.strokeStyle='#5a3e24';g.strokeRect(sx-2,sy-2,16,14);
    g.fillStyle='#3a2818';if(b.kind==='forge'){g.fillRect(sx+1,sy+2,10,3);g.fillRect(sx+4,sy+5,4,4)}else if(b.kind==='marchand'){g.beginPath();g.arc(sx+6,sy+5,4,0,6.28);g.fill();g.fillStyle='#e2b65e';g.beginPath();g.arc(sx+6,sy+5,2.5,0,6.28);g.fill()}else{g.fillRect(sx+2,sy+6,10,4);g.fillRect(sx+2,sy+2,3,4)}}}
function drawNPC(g,who,x,y,T,scale){scale=scale||1;g.save();g.translate(x,y);g.scale(scale,scale);const bob=Math.sin(T*2+x)*.8;
  if(who==='virganth'){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(0,14,40,10,0,0,6.28);g.fill();
    g.fillStyle='#b8862a';g.beginPath();g.ellipse(6,0,30,16,0,0,6.28);g.fill();g.fillStyle='#e2b54a';g.beginPath();g.ellipse(6,-4,26,12,0,0,6.28);g.fill();
    g.fillStyle='#c9952e';g.beginPath();g.moveTo(-6,-10);g.quadraticCurveTo(-20,-40+bob,-42,-30);g.lineTo(-30,-14);g.closePath();g.fill();g.beginPath();g.moveTo(18,-8);g.quadraticCurveTo(40,-44+bob,60,-26);g.lineTo(40,-6);g.closePath();g.fill();
    g.fillStyle='#e2b54a';g.beginPath();g.ellipse(-26,-16+bob,12,9,-.3,0,6.28);g.fill();g.fillStyle='#f6d77a';g.beginPath();g.moveTo(-30,-22+bob);g.lineTo(-38,-36+bob);g.lineTo(-24,-24+bob);g.fill();
    g.fillStyle='#1a1206';g.beginPath();g.arc(-30,-18+bob,2,0,6.28);g.fill();g.fillStyle='#7ff0e8';g.fillRect(-31,-19+bob,1.2,2);
    g.strokeStyle='#b8862a';g.lineWidth=6;g.beginPath();g.moveTo(34,4);g.quadraticCurveTo(54,14,62,2);g.stroke();g.restore();return}
  const P={garde:['#1f3358','#c9cbe0','#e9cdb0'],grinmir:['#4a4a56','#b8541e','#e9c4a0'],aubergiste:['#7a4b25','#efe6cf','#e9c4a0'],marchand:['#2f5e3a','#e0b45c','#d8a880'],forgeron:['#3a3028','#5a3e24','#c99a70'],abhorash:['#5a0f16','#8e1a24','#d9d2d8']}[who]||['#555','#888','#e9c4a0'];
  const dw=who==='grinmir'||who==='forgeron';const s=dw?.9:1;
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(0,12,11,4,0,0,6.28);g.fill();
  g.fillStyle=P[0];g.beginPath();g.moveTo(-9,-2);g.lineTo(9,-2);g.lineTo(11,12);g.lineTo(-11,12);g.closePath();g.fill();
  if(who==='aubergiste'||who==='forgeron'){g.fillStyle=P[1];g.fillRect(-6,-1,12,12)}
  g.fillStyle=P[2];g.beginPath();g.arc(0,-10+bob,7*s+1,0,6.28);g.fill();g.fillStyle='#1a1220';g.fillRect(-3,-11+bob,2,2);g.fillRect(2,-11+bob,2,2);
  if(dw){g.fillStyle=who==='grinmir'?'#b8541e':'#5a4030';g.beginPath();g.moveTo(-7,-8+bob);g.quadraticCurveTo(0,12,7,-8+bob);g.closePath();g.fill()}
  if(who==='grinmir'){g.fillStyle='#9a9aa8';g.beginPath();g.arc(0,-13+bob,8,Math.PI,0);g.fill();g.fillStyle='#f0c95a';for(const ox of[-5,0,5]){g.beginPath();g.moveTo(ox-2,-20+bob);g.lineTo(ox,-25+bob);g.lineTo(ox+2,-20+bob);g.fill()}
    g.strokeStyle='#6b4a28';g.lineWidth=3;g.beginPath();g.moveTo(13,10);g.lineTo(13,-16);g.stroke();g.fillStyle='#8d93a8';g.fillRect(7,-22,12,8);g.fillStyle='#f0c95a';g.beginPath();g.arc(13,-18,2.5,0,6.28);g.fill()}
  if(who==='garde'){g.fillStyle='#c9cbe0';g.beginPath();g.arc(0,-12+bob,8,Math.PI,0);g.fill();g.strokeStyle='#6b4a28';g.lineWidth=2;g.beginPath();g.moveTo(12,12);g.lineTo(12,-24);g.stroke();g.fillStyle='#d6d2e4';g.beginPath();g.moveTo(10,-24);g.lineTo(12,-30);g.lineTo(14,-24);g.fill();
    g.fillStyle='#efe6cf';g.beginPath();g.ellipse(0,3,3.5,2,0,0,6.28);g.fill()}
  if(who==='marchand'){g.fillStyle=P[1];g.beginPath();g.ellipse(0,-15+bob,9,3,0,0,6.28);g.fill();g.fillRect(-5,-21+bob,10,6)}
  if(who==='abhorash'){g.fillStyle='#8e1a24';g.beginPath();g.arc(0,-12+bob,8,Math.PI,0);g.fill();g.fillStyle='#ff3030';g.fillRect(-3,-11+bob,2,1.5);g.fillRect(2,-11+bob,2,1.5)}
  g.restore()}
const NPC_NAMES={virganth:'Virganth',garde:'Garde du Conseil',grinmir:'Grinmir Thunderhammer',aubergiste:'Aubergiste',marchand:'Marchand',forgeron:'Forgeron',abhorash:'Abhorash'};
function drawFurn(f){const g=ctx,px=f.x*TS,py=f.y*TS;
  if(f.k==='lit'){g.fillStyle='#5a3e24';g.fillRect(px+2,py+2,28,28);g.fillStyle='#efe6cf';g.fillRect(px+4,py+4,24,8);g.fillStyle='#8e3a2a';g.fillRect(px+4,py+12,24,16)}
  else if(f.k==='feu'){g.fillStyle='#5a5246';g.fillRect(px-6,py+2,44,28);g.fillStyle='#1a1410';g.fillRect(px+2,py+12,28,18);const fl=Math.sin(G.time*12)*2;g.fillStyle='#e8661e';g.beginPath();g.moveTo(px+8,py+30);g.quadraticCurveTo(px+16,py+8+fl,px+24,py+30);g.fill();g.fillStyle='#ffc04a';g.beginPath();g.moveTo(px+12,py+30);g.quadraticCurveTo(px+16,py+16-fl,px+20,py+30);g.fill()}
  else if(f.k==='table'){g.fillStyle='#6b4a2c';g.fillRect(px+2,py+6,28,18);g.fillStyle='#8a6034';g.fillRect(px+2,py+6,28,4);g.fillStyle='#e0b45c';g.beginPath();g.arc(px+10,py+14,3,0,6.28);g.fill()}
  else if(f.k==='comptoir'){g.fillStyle='#5a3e24';g.fillRect(px,py+8,TS*3,20);g.fillStyle='#8a6034';g.fillRect(px,py+8,TS*3,5)}
  else if(f.k==='etagere'){g.fillStyle='#5a3e24';g.fillRect(px,py+4,TS*2,26);g.fillStyle='#8a6034';for(let r=0;r<3;r++)g.fillRect(px,py+8+r*8,TS*2,2);const cols=['#c8483c','#6fa8f0','#8fb357','#e0b45c'];for(let k=0;k<8;k++){g.fillStyle=cols[k%4];g.fillRect(px+4+k*7,py+10+(k%3)*8,4,5)}}
  else if(f.k==='tonneau'){g.fillStyle='#6e4422';rr(g,px+6,py+5,20,23,6);g.fill();g.fillStyle='#3a3a44';g.fillRect(px+6,py+9,20,2.5);g.fillRect(px+6,py+21,20,2.5)}
  else if(f.k==='four'){g.fillStyle='#5a5246';g.fillRect(px-4,py,40,30);g.fillStyle='#1a1410';g.fillRect(px+4,py+10,24,16);g.fillStyle='rgba(255,140,40,'+(.6+.3*Math.sin(G.time*8))+')';g.fillRect(px+6,py+14,20,10)}
  else if(f.k==='enclume'){g.fillStyle='#3a3a44';g.fillRect(px+6,py+12,20,8);g.fillRect(px+12,py+20,8,8);g.fillStyle='#5a5a66';g.fillRect(px+4,py+10,24,4)}
  else if(f.k==='armes'){g.strokeStyle='#d8d6e2';g.lineWidth=3;for(let k=0;k<3;k++){g.beginPath();g.moveTo(px+4+k*10,py+28);g.lineTo(px+4+k*10,py+4);g.stroke()}}}

/* ================= Rendu principal ================= */
function render(dt){
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=(G&&G.m&&G.m.st)?({rempart:'#8fa44c',salle:'#1c1820',col:'#9b5a36',nain:'#2a221c',bois:'#2f5a28',tresor:'#33281e',sentier:'#dfe6ea',sceaux:'#14111b',prison:'#14111b'}[G.m.style]||'#0b161b'):'#0b161b';ctx.fillRect(0,0,cv.width,cv.height);
  if(!G||!G.m)return;const m=G.m,isW=m.kind==='world';
  const k=1-Math.pow(.0005,dt);
  for(let i=0;i<G.players.length;i++){const p=G.players[i];if(i===myIdx)continue;if(Math.hypot(p.x-p.rx,p.y-p.ry)>120){p.rx=p.x;p.ry=p.y}else{p.rx+=(p.x-p.rx)*k;p.ry+=(p.y-p.ry)*k}}
  for(const e of G.enemies){if(e.rx==null){e.rx=e.x;e.ry=e.y}if(Math.hypot(e.x-e.rx,e.y-e.ry)>100){e.rx=e.x;e.ry=e.y}else{e.rx+=(e.x-e.rx)*k;e.ry+=(e.y-e.ry)*k}}
  for(const c of G.crates){c.rx+=(c.x-c.rx)*Math.min(1,dt*14);c.ry+=(c.y-c.ry)*Math.min(1,dt*14)}
  const fy=focusY();const hw=vw/2/scale,hh=vh/scale;camX=Scene.on?Scene.cam.x:L.x;camY=Scene.on?Scene.cam.y:L.y;
  shake=Math.max(0,shake-dt*30);const sh=shake?(Math.random()-.5)*shake:0;
  const S=scale*dpr;ctx.setTransform(S,0,0,S,cv.width/2-(camX+sh)*S,cv.height*fy-(camY+sh)*S);
  const x0=camX-hw-48,x1=camX+hw+48,y0=camY-hh*fy-64,y1=camY+hh*(1-fy)+48;
  const vis=(x,y)=>x>x0&&x<x1&&y>y0&&y<y1;const T=G.time;
  const boss=G.enemies.find(e=>e.type==='boss');G.bossPal=boss?boss.bv:0;
  if(isW){ctx.imageSmoothingEnabled=true;drawWorldGround(x0,y0,x1,y1);drawWater(x0,y0,x1,y1,T);drawLathBridge(T)}
  else{ctx.imageSmoothingEnabled=false;ctx.drawImage(m.mapCv,0,0)}
  if(m.kind==='dun'){const s=m.stairs;
    if(G.stairsOpen){const pu=.5+.5*Math.sin(T*4);ctx.fillStyle='rgba(242,163,58,'+(.18+.14*pu)+')';ctx.beginPath();ctx.arc(s.x,s.y,30+pu*4,0,6.28);ctx.fill();ctx.fillStyle='#120c04';ctx.beginPath();ctx.arc(s.x,s.y,17,0,6.28);ctx.fill();
      ctx.strokeStyle='#f2a33a';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.lineDashOffset=-T*20;ctx.beginPath();ctx.arc(s.x,s.y,20,0,6.28);ctx.stroke();ctx.setLineDash([])}
    else{ctx.fillStyle='#3a3350';ctx.fillRect(s.x-18,s.y-18,36,36);ctx.fillStyle='#120f18';ctx.fillRect(s.x-13,s.y-13,26,26);ctx.fillStyle='#8b84a6';for(let b=-11;b<=9;b+=6)ctx.fillRect(s.x+b,s.y-13,3,26)}
    m.plates.forEach((p,i)=>{ctx.fillStyle=G.platesOn[i]?'rgba(127,240,232,.55)':'rgba(127,240,232,'+(.12+.08*Math.sin(T*3))+')';ctx.fillRect(p.x*TS+6,p.y*TS+6,TS-12,TS-12)});
    for(const s2 of m.spikes){const px=s2.x*TS,py=s2.y*TS;if(!vis(px,py))continue;const up=((T+s2.ph*.8)%2.4)<.8,warn=((T+s2.ph*.8)%2.4)>2.05;
      ctx.fillStyle=up?'#d8d2e8':warn?'#7a6f92':'#3a3450';for(let a=0;a<3;a++)for(let b=0;b<3;b++){const cx=px+8+a*8,cy=py+8+b*8;if(up){ctx.beginPath();ctx.moveTo(cx-3,cy+3);ctx.lineTo(cx,cy-5);ctx.lineTo(cx+3,cy+3);ctx.fill()}else ctx.fillRect(cx-1,cy-1,2,2)}}
    if(m.vault&&!G.gateOpen){for(let ty2=m.vault.y-1;ty2<=m.vault.y+m.vault.h;ty2++)for(let tx2=m.vault.x-1;tx2<=m.vault.x+m.vault.w;tx2++){if(m.t[ty2*m.W+tx2]!==2)continue;const px=tx2*TS,py=ty2*TS;ctx.fillStyle='#4d4766';ctx.fillRect(px,py+2,TS,4);ctx.fillRect(px,py+TS-6,TS,4);ctx.fillStyle='#8b84a6';for(let b=3;b<TS;b+=7)ctx.fillRect(px+b,py,3,TS)}}}
  if(m.leave&&vis(m.leave.x,m.leave.y)){const lx2=m.leave.x,ly2=m.leave.y,pu=.5+.5*Math.sin(T*3);ctx.fillStyle='rgba(120,200,255,'+(.16+.1*pu)+')';ctx.beginPath();ctx.ellipse(lx2,ly2,24,12,0,0,6.28);ctx.fill();
    ctx.strokeStyle='rgba(160,220,255,.75)';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.lineDashOffset=T*10;ctx.beginPath();ctx.ellipse(lx2,ly2,24,12,0,0,6.28);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#cfe8ff';ctx.beginPath();ctx.moveTo(lx2-6,ly2-2);ctx.lineTo(lx2,ly2+6);ctx.lineTo(lx2+6,ly2-2);ctx.closePath();ctx.fill()}
  if(!isW&&!m.st)for(const t of m.torches){if(vis((t.x+.5)*TS,t.y*TS))drawTorch(t,T)}
  if(m.goal&&m.goal.type==='waves'){const a=m.goal.at;if(vis(a.x,a.y)){if(!G.wave){ctx.strokeStyle='rgba(240,201,90,'+(.35+.25*Math.sin(T*4))+')';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.lineDashOffset=-T*12;ctx.beginPath();ctx.arc(a.x,a.y,7*TS,0,6.28);ctx.stroke();ctx.setLineDash([])}
    dshadow(ctx,a.x+4,a.y+8,8,3);ctx.fillStyle='#4a3020';ctx.fillRect(a.x-1.5,a.y-44,3,52);poly(ctx,[a.x+1,a.y-42,a.x+22+Math.sin(T*3)*2,a.y-38,a.x+18,a.y-28,a.x+22+Math.sin(T*3+1)*2,a.y-20,a.x+1,a.y-22],'#1f3358');ctx.fillStyle='#e0b45c';ctx.fillRect(a.x+6,a.y-36,10,2);ctx.fillRect(a.x+10,a.y-38,2,12)}}
  if(m.kind==='house'){ctx.fillStyle='#2a1d12';ctx.fillRect(5*TS+4,(m.H-1)*TS,TS-8,TS);ctx.fillStyle='rgba(255,230,170,.18)';ctx.fillRect(5*TS+4,(m.H-1)*TS,TS-8,TS)}
  for(const z of G.zones){if(z.smoke){ctx.fillStyle='rgba(120,120,130,.22)';ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,6.28);ctx.fill();continue}
    ctx.fillStyle='rgba(127,224,122,.13)';ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,6.28);ctx.fill();ctx.strokeStyle='rgba(159,240,138,'+(.4+.3*Math.sin(T*6))+')';ctx.lineWidth=2;ctx.stroke()}
  for(const f of G.fires){ctx.fillStyle='rgba(255,110,40,.18)';ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,6.28);ctx.fill();for(let k2=0;k2<6;k2++){const a=T*3+k2,rr2=f.r*.7*((k2%3)/3+.2);const fx2=f.x+Math.cos(a)*rr2,fy2=f.y+Math.sin(a*1.3)*rr2*.6;ctx.fillStyle='#ff8a2b';ctx.beginPath();ctx.moveTo(fx2-4,fy2);ctx.quadraticCurveTo(fx2,fy2-14-Math.sin(T*9+k2)*4,fx2+4,fy2);ctx.fill()}}
  for(const d of G.drops){const b=Math.sin(T*5+d.id)*2;drawDrop2(d,d.x,d.y+b)}
  // tri en profondeur
  const Z=[];
  for(const c of m.chests){const op=G.opened.has(c.id);const py=(c.y+.5)*TS;if(vis((c.x+.5)*TS,py))Z.push([py+6,()=>drawChest(c,op)])}
  for(const c of G.crates)Z.push([(c.ry+.5)*TS+8,()=>drawCrate(c)]);
  for(const e of G.enemies){const ex=e.rx,ey=e.ry;if(vis(ex,ey))Z.push([ey+e.r*.5,()=>drawEnemy(e,ex,ey,T)])}
  const hideP=Scene.on&&Scene.def.hideP;if(!hideP)G.players.forEach((p,i)=>{const w=wpos(i);Z.push([w.y+6,()=>drawPlayer(p,w.x,w.y,i===myIdx,T)])});
  if(Scene.on)for(const a of Scene.actors)Z.push([a.y+6,()=>Scene.drawActor(a,Scene.time)]);
  if(isW){const a=Math.max(0,Math.floor(x0/TS)),b=Math.min(m.W-1,Math.floor(x1/TS)),c=Math.max(0,Math.floor(y0/TS)),d=Math.min(m.H-1,Math.floor((y1+80)/TS));
    for(let ty=c;ty<=d;ty++)for(let tx=a;tx<=b;tx++){const o=m.obj[ty*m.W+tx];if(!o)continue;const ox=(tx+.5)*TS,oy=(ty+1)*TS;let al=1;
      if(o!==4&&o!==7&&Math.abs(ox-L.x)<30&&L.y<oy-4&&L.y>oy-70)al=.45;Z.push([oy-4,()=>drawTreeObj(o,tx,ty,al)])}
    bridgeProps(Z,T);
    for(const bd of m.builds){if(bd.x*TS>x1+64||(bd.x+bd.w)*TS<x0-64||bd.y*TS>y1+64||(bd.y+bd.h)*TS<y0-90)continue;Z.push([(bd.y+bd.h)*TS-2,()=>drawBuilding(bd,T)])}
    for(const n of m.npcs){if(n.id==='virganth2'&&G.q<3)continue;if(Scene.on&&Scene.def.hideNpc&&Scene.def.hideNpc.includes(n.id))continue;if(vis(n.x,n.y))Z.push([n.y+6,()=>drawNPC(ctx,n.who,n.x,n.y,T)])}
    if(G.q>=3&&!G.abhOn){const a2=m.arena;if(vis(a2.x,a2.y))Z.push([a2.y+6,()=>drawNPC(ctx,'abhorash',a2.x,a2.y-8,T)])}}
  else{for(const n of m.npcs||[])Z.push([n.y+6,()=>drawNPC(ctx,n.who,n.x,n.y,T)]);for(const f of m.furn||[])Z.push([(f.y+1)*TS-2,()=>drawFurn(f)]);
    if(m.objs)for(const o of m.objs){const ox=(o.x+o.w/2)*TS,oy=(o.y+o.h)*TS;if(ox>x0-90&&ox<x1+90&&oy>y0-20&&oy<y1+110)Z.push([oy-2,()=>drawDObj(o,T)])}
    if(m.marks)m.marks.forEach((mk,i)=>{const mx=(mk.x+.5)*TS,my=(mk.y+.5)*TS;if(vis(mx,my))Z.push([my+10,()=>drawMark(mk,i,T)])})}
  Z.sort((a,b)=>a[0]-b[0]);for(const z of Z)z[1]();
  for(const p of G.projs){if(!vis(p.x,p.y))continue;drawProj2(p)}
  for(const q of parts){const al=clamp(q.life/q.max,0,1);
    if(q.k==='sp'){ctx.globalAlpha=al;ctx.fillStyle=q.col;ctx.fillRect(q.x-1.5,q.y-1.5,3,3)}
    else if(q.k==='ember'){ctx.globalAlpha=al;ctx.fillStyle='#ffb347';ctx.fillRect(q.x-1,q.y-1,2,2)}
    else if(q.k==='mote'){ctx.globalAlpha=Math.sin(Math.PI*q.life/q.max)*.35;ctx.fillStyle=isW?'#fffbe8':'#fff3d6';ctx.fillRect(q.x,q.y,1.6,1.6)}
    else if(q.k==='leaf'){ctx.globalAlpha=Math.min(1,al*2)*.8;ctx.fillStyle=q.col;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.life*3);ctx.fillRect(-2,-1,4,2);ctx.restore()}
    else if(q.k==='smoke'){ctx.globalAlpha=Math.sin(Math.PI*q.life/q.max)*.35;ctx.fillStyle='#8a8a90';ctx.beginPath();ctx.arc(q.x,q.y,q.r||10,0,6.28);ctx.fill()}
    else if(q.k==='ring'){const t2=1-al;ctx.globalAlpha=al;ctx.strokeStyle=q.col;ctx.lineWidth=q.w||3;ctx.beginPath();ctx.arc(q.x,q.y,Math.max(1,q.r+(q.mr-q.r)*t2),0,6.28);ctx.stroke()}
    else if(q.k==='line'){ctx.globalAlpha=al;ctx.strokeStyle=q.col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x2,q.y2);ctx.stroke()}
    else if(q.k==='bolt'){ctx.globalAlpha=al;ctx.strokeStyle='#cfe8ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(q.x,q.y);const n=5;for(let i=1;i<=n;i++){const t2=i/n;ctx.lineTo(q.x+(q.x2-q.x)*t2+(i<n?(Math.random()-.5)*14:0),q.y+(q.y2-q.y)*t2+(i<n?(Math.random()-.5)*14:0))}ctx.stroke()}
    else if(q.k==='beam'){ctx.globalAlpha=al;const gr=ctx.createLinearGradient(q.x,q.y-120,q.x,q.y);gr.addColorStop(0,'rgba(255,243,192,0)');gr.addColorStop(1,'rgba(255,243,192,.8)');ctx.fillStyle=gr;ctx.fillRect(q.x-5,q.y-120,10,120)}
    else if(q.k==='slash'&&G.players[q.o]){const w=wpos(q.o);drawSlash(w.x,w.y,q.a,1-al,G.players[q.o].cls)}
    else if(FX2[q.k])FX2[q.k](q,al)}
  ctx.globalAlpha=1;
  if(L.swing>0)drawSlash(L.x,L.y,L.swingA,1-L.swing/SWD,hero.cls,true);
  // lumière : intérieurs sombres, extérieur de nuit pendant l'embuscade
  const dark=isW?(G.night?.66:0):(m.kind==='house'?.22:(m.st?m.st.dark:.5));
  if(dark>0){lx.setTransform(1,0,0,1,0,0);lx.globalCompositeOperation='source-over';lx.fillStyle=isW?'rgba(8,14,34,'+dark+')':'rgba(6,5,10,'+dark+')';lx.fillRect(0,0,lc.width,lc.height);lx.globalCompositeOperation='destination-out';
    const ls=S/2,ox=lc.width/2-(camX+sh)*ls,oy=lc.height*fy-(camY+sh)*ls;
    const light=(x,y,r,a)=>{const sx=x*ls+ox,sy=y*ls+oy,rr2=r*ls;if(sx<-rr2||sy<-rr2||sx>lc.width+rr2||sy>lc.height+rr2)return;const g=lx.createRadialGradient(sx,sy,0,sx,sy,rr2);g.addColorStop(0,'rgba(0,0,0,'+a+')');g.addColorStop(.6,'rgba(0,0,0,'+a*.55+')');g.addColorStop(1,'rgba(0,0,0,0)');lx.fillStyle=g;lx.fillRect(sx-rr2,sy-rr2,rr2*2,rr2*2)};
    G.players.forEach((p,i)=>{const w=wpos(i);light(w.x,w.y,i===myIdx?320:260,1)});
    if(!isW)for(const t of m.torches)light((t.x+.5)*TS,t.y*TS+20,150+Math.sin(T*9+t.x)*8,.85);
    if(isW)for(const bd of m.builds)if(bd.kind!=='puits')light((bd.door.x+.5)*TS,bd.door.y*TS,90,.7);
    if(isW&&WORLD.bridge){const r=bridgeRect();for(const[x,y]of[[r.X0,r.Y0],[r.X1,r.Y0],[r.X0,r.Y1+6],[r.X1,r.Y1+6]])light(x,y-60,120,.8)}
    for(const p of G.projs)if(p.k===1||p.k===2)light(p.x,p.y,70,.8);
    for(const z of G.zones)if(!z.smoke)light(z.x,z.y,z.r,.5);for(const f of G.fires)light(f.x,f.y,f.r+40,.8);
    if(m.kind==='dun'&&G.stairsOpen)light(m.stairs.x,m.stairs.y,110,.8);
    lx.globalCompositeOperation='source-over';ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(lc,0,0,cv.width,cv.height);ctx.setTransform(S,0,0,S,cv.width/2-(camX+sh)*S,cv.height*fy-(camY+sh)*S)}
  else{ctx.setTransform(1,0,0,1,0,0);const gr=ctx.createRadialGradient(cv.width/2,cv.height*fy,Math.min(cv.width,cv.height)*.35,cv.width/2,cv.height*fy,Math.max(cv.width,cv.height)*.75);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(10,20,26,.35)');ctx.fillStyle=gr;ctx.fillRect(0,0,cv.width,cv.height);ctx.setTransform(S,0,0,S,cv.width/2-(camX+sh)*S,cv.height*fy-(camY+sh)*S)}
  // textes
  ctx.textAlign='center';ctx.textBaseline='middle';
  const label=(t,x,y,col,size)=>{ctx.font='700 '+(size||12)+'px "Alegreya Sans",system-ui,sans-serif';ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillText(t,x+1,y+1);ctx.fillStyle=col||'#efe6cf';ctx.fillText(t,x,y)};
  if(Scene.on)Scene.drawFx(Scene.time);
  if(!hideP)G.players.forEach((p,i)=>{const w=wpos(i);label(p.name,w.x,w.y-38,i===myIdx?'#ffe9c2':'#cfe8ff');
    ctx.fillStyle='#071014';ctx.fillRect(w.x-15,w.y+17,30,4);ctx.fillStyle=p.down?'#666':'#d24a3f';ctx.fillRect(w.x-15,w.y+17,30*clamp(p.hp/p.mhp,0,1),4);if(p.shield>0){ctx.fillStyle='#ffe9a0';ctx.fillRect(w.x-15,w.y+15,30*clamp((p.sh||p.shield)/p.mhp,0,1),2)}
    if(p.down)label(i===myIdx?(G.players.length>1?'Attends ton allié':'À terre'):'Viens me relever !',w.x,w.y-50,'#ffb3a8',11)});
  if(isW){for(const bd of m.builds){if(!bd.label)continue;const dx=(bd.door.x+.5)*TS,dy=bd.y*TS-(bd.kind==='keep'||bd.kind==='palais'?78:bd.h*TS*.75+16);if(Math.hypot(dx-L.x,dy-L.y)<300)label(bd.label,dx,dy,'#ffe6a8',12)}
    for(const n of m.npcs){if(n.id==='virganth2'&&G.q<3)continue;if(Scene.on&&Scene.def.hideNpc&&Scene.def.hideNpc.includes(n.id))continue;if(Math.hypot(n.x-L.x,n.y-L.y)<220)label(NPC_NAMES[n.who]||'',n.x,n.y-(n.who==='virganth'?62:34),'#cfe8ff',11)}
    for(const k2 in TOWNS){const p=PL[k2];const tx=(p[0]+.5)*TS,ty=(p[1]-11)*TS;if(Math.hypot(tx-L.x,ty-L.y)<520){ctx.font='400 22px "Uncial Antiqua",Georgia,serif';ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillText(TOWNS[k2].nom,tx+1.5,ty+1.5);ctx.fillStyle='#efe6cf';ctx.fillText(TOWNS[k2].nom,tx,ty)}}}
  else for(const n of m.npcs||[])label(NPC_NAMES[n.who]||'',n.x,n.y-34,'#cfe8ff',11);
  for(const q of parts){if(q.k!=='txt')continue;ctx.globalAlpha=clamp(q.life/q.max*1.5,0,1);ctx.font='700 '+Math.round(q.size*(1+Math.max(0,q.life/q.max-.72)*2.2))+'px "Alegreya Sans",system-ui,sans-serif';ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillText(q.txt,q.x+1,q.y+1);ctx.fillStyle=q.col;ctx.fillText(q.txt,q.x,q.y)}
  ctx.globalAlpha=1;
  for(const b of bubbles){let x,y;if(b.who==='p'){if(!G.players[b.o])continue;const w=wpos(b.o);x=w.x;y=w.y-46}else{const e=G.enemies.find(e=>e.id===b.o);if(e){b.x=e.rx??e.x;b.y=e.ry??e.y}x=b.x;y=b.y-(e?e.r:14)-14}
    const a=clamp(b.life/b.max*4,0,1)*clamp((b.max-b.life)*8,0,1);if(vis(x,y))drawBubble(x,y,b.txt,a)}
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(m.kind==='dun'){const s=m.stairs;if(vis(s.x,s.y))label(G.stairsOpen?'SORTIE ▲':'Sortie scellée',s.x,s.y-34,G.stairsOpen?'#ffd27a':'#c9c2e0');if(m.leave&&vis(m.leave.x,m.leave.y))label('Retour à Midheim',m.leave.x,m.leave.y+22,'#cfe8ff',11);
    if(G.stairsOpen&&!vis(s.x,s.y))edgeArrow(s.x,s.y,'#f2a33a','SORTIE',hw,hh);for(const d of G.drops)if(d.k===4&&!vis(d.x,d.y))edgeArrow(d.x,d.y,'#f0c95a','CLÉ',hw,hh);
    if(!G.stairsOpen&&m.marks&&m.marks.length){let b=null,bd=1e9;m.marks.forEach((mk,i)=>{if((G.gp[i]||0)>=1)return;const mx=(mk.x+.5)*TS,my=(mk.y+.5)*TS,dd=Math.hypot(mx-L.x,my-L.y);if(dd<bd){bd=dd;b={x:mx,y:my}}});if(b&&!vis(b.x,b.y))edgeArrow(b.x,b.y,'#f0c95a','OBJECTIF',hw,hh)}
    if(!G.stairsOpen&&m.goal&&m.goal.type==='waves'&&!G.wave&&!vis(m.goal.at.x,m.goal.at.y))edgeArrow(m.goal.at.x,m.goal.at.y,'#f0c95a','LES PORTES',hw,hh)}
  if(isW&&!Scene.on){const o=objTarget();if(o&&Math.hypot(o.x-L.x,o.y-L.y)>200)edgeArrow(o.x,o.y,'#f0c95a',Math.round(Math.hypot(o.x-L.x,o.y-L.y)/TS)+' m',hw,hh)}
  if(G.players.length>1){const oi=myIdx===0?1:0,w=wpos(oi);if(!vis(w.x,w.y)){const a=Math.atan2(w.y-L.y,w.x-L.x);const r=Math.min(hw,hh*.5)*.8;const ax=L.x+Math.cos(a)*r,ay=L.y+Math.sin(a)*r;ctx.save();ctx.translate(ax,ay);ctx.rotate(a);ctx.fillStyle=CLS[G.players[oi].cls].col;ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-6,-7);ctx.lineTo(-6,7);ctx.fill();ctx.restore()}}}
function objTarget(){const qt=questTarget();if(qt)return qt;const o=OBJ[Math.min(G.q,6)];if(!o||!o.at||!WORLD)return null;return placePx(o.at)}
function edgeArrow(x,y,col,label,hw,hh){const a=Math.atan2(y-L.y,x-L.x);const r=Math.min(hw,hh*.5)*.72;const ax=L.x+Math.cos(a)*r,ay=L.y+Math.sin(a)*r;const pu=1+.12*Math.sin(G.time*6);
  ctx.save();ctx.translate(ax,ay);ctx.rotate(a);ctx.scale(pu,pu);ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.moveTo(17,1);ctx.lineTo(-7,-11);ctx.lineTo(-2,1);ctx.lineTo(-7,13);ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-8,-12);ctx.lineTo(-3,0);ctx.lineTo(-8,12);ctx.fill();ctx.restore();
  ctx.font='700 11px "Pixelify Sans",monospace';ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillText(label,ax-Math.cos(a)*24+1,ay-Math.sin(a)*24+1);ctx.fillStyle=col;ctx.fillText(label,ax-Math.cos(a)*24,ay-Math.sin(a)*24)}
function drawDrop2(d,x,y){if(d.k===6){const g=ctx,c=RAR[d.r|0].col;g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y+9,8,3,0,0,6.28);g.fill();
    g.save();g.shadowColor=c;g.shadowBlur=10+Math.sin(G.time*5)*4;g.fillStyle='#7a5129';rr(g,x-7,y-5,14,12,3);g.fill();g.restore();g.fillStyle='#5a3e24';g.fillRect(x-7,y-1,14,2);g.fillStyle=c;g.beginPath();g.moveTo(x,y-11);g.lineTo(x+4,y-6);g.lineTo(x,y-1);g.lineTo(x-4,y-6);g.closePath();g.fill();
    if(d.r>=2){g.strokeStyle=c;g.globalAlpha=.6;g.lineWidth=2;g.beginPath();g.moveTo(x,y-10);g.lineTo(x,y-40-Math.sin(G.time*3)*4);g.stroke();g.globalAlpha=1}return}
  if(d.k===7){const g=ctx;g.save();g.shadowColor='#9fe8ff';g.shadowBlur=8;g.fillStyle='#bff4ff';g.beginPath();g.moveTo(x,y-6);g.lineTo(x+4,y);g.lineTo(x,y+6);g.lineTo(x-4,y);g.closePath();g.fill();g.restore();return}
  drawDrop(d.k,x,y)}
/* ================= Mini-carte (la vraie carte de Midheim) ================= */
let mapImgEl=null;
function drawMini(){const c=$('#mini');if(!G||!G.m)return;const g=c.getContext('2d');const W=c.width,H=c.height;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);
  if(G.m.kind==='world'){mapImgEl=mapImgEl||$('#mapImg');c.classList.remove('sq');if(!mapImgEl.complete)return;const iw=mapImgEl.naturalWidth,ih=mapImgEl.naturalHeight;const kx=iw/WORLD.W,ky=ih/WORLD.H;
    const span=46;const cx=L.x/TS*kx,cy=L.y/TS*ky;const sw=span*kx;g.save();g.beginPath();g.arc(W/2,H/2,W/2,0,6.28);g.clip();
    g.drawImage(mapImgEl,cx-sw/2,cy-sw/2,sw,sw,0,0,W,H);
    const toM=(x,y)=>({x:W/2+(x/TS*kx-cx)/sw*W,y:H/2+(y/TS*ky-cy)/sw*H});
    const o=objTarget();if(o){let p=toM(o.x,o.y);const d=Math.hypot(p.x-W/2,p.y-H/2);if(d>W/2-8){p={x:W/2+(p.x-W/2)/d*(W/2-8),y:H/2+(p.y-H/2)/d*(H/2-8)}}g.strokeStyle='#f0c95a';g.lineWidth=3;g.beginPath();g.arc(p.x,p.y,5,0,6.28);g.stroke()}
    G.players.forEach((p,i)=>{const w=wpos(i);const q=toM(w.x,w.y);g.fillStyle=CLS[p.cls].col;g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.arc(q.x,q.y,i===myIdx?4.5:3.5,0,6.28);g.fill();g.stroke()});
    g.restore()}
  else{c.classList.add('sq');updSeen();const m=G.m;const k=Math.min(W/m.W,H/m.H);g.setTransform(k,0,0,k,(W-m.W*k)/2,(H-m.H*k)/2);g.fillStyle='rgba(10,16,20,.6)';g.fillRect(0,0,m.W,m.H);const S2=G.seen;
    for(let y=0;y<m.H;y++)for(let x=0;x<m.W;x++){if(!S2[y*m.W+x])continue;const v=m.t[y*m.W+x];if(v===1)continue;g.fillStyle=v===2?(G.gateOpen?'#4a6670':'#a5b6c2'):v===4?'#5fd8cf':v===7?'#ff7a2a':v===6?'#6a7a80':'#4a6670';g.fillRect(x,y,1.02,1.02)}
    if(m.stairs){g.fillStyle=G.stairsOpen?'#f2a33a':'#8b84a6';g.beginPath();g.arc(m.stairs.x/TS,m.stairs.y/TS,1.4,0,6.28);g.fill()}
    if(m.marks)m.marks.forEach((mk,i)=>{g.fillStyle=(G.gp[i]||0)>=1?'#7fe07a':'#f0c95a';g.beginPath();g.arc(mk.x+.5,mk.y+.5,1.3,0,6.28);g.fill()});if(m.goal&&m.goal.type==='waves'){g.fillStyle='#f0c95a';g.beginPath();g.arc(m.goal.at.x/TS,m.goal.at.y/TS,1.3,0,6.28);g.fill()}
    G.players.forEach((p,i)=>{const w=wpos(i);g.fillStyle=CLS[p.cls].col;g.beginPath();g.arc(w.x/TS,w.y/TS,1.5,0,6.28);g.fill()})}}
function updSeen(){const m=G.m;if(!G.seen||G.seen.length!==m.W*m.H)G.seen=new Uint8Array(m.W*m.H);const S2=G.seen,R=6;
  for(let i=0;i<G.players.length;i++){const w=wpos(i);const cx=Math.floor(w.x/TS),cy=Math.floor(w.y/TS);for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){if(dx*dx+dy*dy>R*R)continue;const x=cx+dx,y=cy+dy;if(x>=0&&y>=0&&x<m.W&&y<m.H)S2[y*m.W+x]=1}}}
