/* ================= Animations d'attaque : l'arme balance vraiment, traînées, impacts, sorts ================= */
const SWD=.26;let _hsw=null;const SWG={};
const eio=x=>1-Math.pow(1-clamp(x,0,1),3);
// angle ajouté à la visée pendant le coup : armer, frapper, accompagner
function swingOff(cls,p){
  if(cls==='guerrier'){if(p<.22)return-1.45*eio(p/.22);if(p<.55)return-1.45+2.8*eio((p-.22)/.33);return 1.35*(1-eio((p-.55)/.45))}
  if(cls==='voleur'){if(p<.45){const q=p/.45;return q<.3?-.9*q/.3:-.9+1.5*eio((q-.3)/.7)}const q=(p-.45)/.55;return q<.3?.6+.4*q/.3:1-1.6*eio((q-.3)/.7)}
  return 0}
function swingProg(p,mine){if(mine)return L.swing>0?clamp(1-L.swing/SWD,0,1):null;const i=G.players.indexOf(p),s=SWG[i];if(!s)return null;const q=(performance.now()-s.at)/(SWD*1000);return q<1?q:null}
function swingAngle(p,mine){if(mine)return L.swingA;const s=SWG[G.players.indexOf(p)];return s?s.a:0}
function crescent(x,y,r,a0,a1,wmax,fill,edge,al){if(Math.abs(a1-a0)<.02)return;const N=16,g=ctx;g.save();g.globalAlpha=al;g.beginPath();
  for(let s=0;s<=N;s++){const th=a0+(a1-a0)*s/N;g.lineTo(x+Math.cos(th)*(r+2),y+Math.sin(th)*(r+2))}
  for(let s=N;s>=0;s--){const th=a0+(a1-a0)*s/N,w=2+wmax*Math.pow(s/N,1.4);g.lineTo(x+Math.cos(th)*(r+2-w),y+Math.sin(th)*(r+2-w))}
  g.closePath();g.fillStyle=fill;g.fill();g.strokeStyle=edge;g.lineWidth=2;g.beginPath();for(let s=Math.floor(N*.35);s<=N;s++){const th=a0+(a1-a0)*s/N;g.lineTo(x+Math.cos(th)*(r+2),y+Math.sin(th)*(r+2))}g.stroke();
  g.globalAlpha=al*.18;g.strokeStyle=fill;g.lineWidth=16;g.beginPath();g.arc(x,y,r-6,Math.min(a0,a1),Math.max(a0,a1));g.stroke();g.restore()}
// traînée du coup (même géométrie que la zone touchée : 58 px guerrier, 48 px voleur)
function drawSlash(x,y,a,t,cls,mine){const en=mine&&ST&&ST.we?ENC_COL[ENCH_IDS.indexOf(ST.we)+1]:null;
  if(cls==='guerrier'){if(t<.2)return;const r=58,start=a-1.45,end=a+1.35;const head=t<.55?a+swingOff(cls,t):end;const tail=t<.55?Math.max(start,head-1.9):start+(end-start)*eio((t-.55)/.42);
    const al=t<.55?1:Math.max(0,1-(t-.55)/.42);crescent(x,y,r,tail,head,16,en?en+'cc':'rgba(255,238,210,.8)','#fff',al);
    if(t<.55&&Math.random()<.5)parts.push({k:'sp',x:x+Math.cos(head)*r,y:y+Math.sin(head)*r,vx:Math.cos(head+1.57)*60,vy:Math.sin(head+1.57)*60,life:.18,max:.18,col:en||'#fff3d0'})}
  else if(cls==='voleur'){const r=46;const one=(q,s0,s1)=>{if(q<=0||q>=1)return;const head=s0+(s1-s0)*eio(q/.55),tail=s0+(s1-s0)*eio(Math.max(0,(q-.35)/.65));crescent(x,y,r,tail,head,9,en?en+'cc':'rgba(210,255,200,.85)','#f4fff0',1-Math.max(0,q-.6)/.4)};
    one((t-.05)/.42,a-.95,a+.65);one((t-.5)/.45,a+.95,a-.65)}}
// cercle runique au bout du bâton (mage, soigneur)
function drawCastRune(x,y,a,t,cls){const hx=x+Math.cos(a)*16,hy=y-3+Math.sin(a)*12,g=ctx,col=cls==='mage'?'#9fd0ff':'#ffe08a',r=4+10*eio(t/.5),al=1-t;
  g.save();g.translate(hx,hy);g.globalAlpha=al;g.strokeStyle=col;g.lineWidth=1.6;g.beginPath();g.arc(0,0,r,0,6.28);g.stroke();
  g.rotate(t*6);for(let k=0;k<6;k++){g.rotate(Math.PI/3);g.fillStyle=col;g.fillRect(r-1,-1,3,2)}
  const gr=g.createRadialGradient(0,0,0,0,0,r*1.4);gr.addColorStop(0,'rgba(255,255,255,'+(.9*al)+')');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,r*1.4,0,6.28);g.fill();g.restore()}
// projectiles : boule de feu, orbe sacré, dagues
function drawProj2(p){const g=ctx,a=Math.atan2(p.vy,p.vx),T=G.time;
  if(p.k===1){g.save();g.translate(p.x,p.y);g.rotate(a);const tl=g.createLinearGradient(-30,0,0,0);tl.addColorStop(0,'rgba(255,90,20,0)');tl.addColorStop(1,'rgba(255,150,40,.85)');g.fillStyle=tl;
      g.beginPath();g.moveTo(0,-7);g.quadraticCurveTo(-18,-5+Math.sin(T*40)*2,-32,0);g.quadraticCurveTo(-18,5+Math.cos(T*40)*2,0,7);g.closePath();g.fill();
      const gr=g.createRadialGradient(0,0,0,0,0,11);gr.addColorStop(0,'#fff');gr.addColorStop(.35,'#ffe08a');gr.addColorStop(.7,'#ff8a2b');gr.addColorStop(1,'rgba(255,80,20,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,11,0,6.28);g.fill();g.restore();
    if(parts.length<340&&Math.random()<.6)parts.push({k:'sp',x:p.x,y:p.y,vx:-p.vx*.12+(Math.random()-.5)*40,vy:-p.vy*.12+(Math.random()-.5)*40-20,life:.3,max:.3,col:Math.random()<.5?'#ffb347':'#ff6a2b'});return}
  if(p.k===2){g.save();g.translate(p.x,p.y);const gr=g.createRadialGradient(0,0,0,0,0,13);gr.addColorStop(0,'#fffbe8');gr.addColorStop(.4,'rgba(255,230,140,.85)');gr.addColorStop(1,'rgba(255,220,120,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,13,0,6.28);g.fill();
      g.rotate(T*5);g.fillStyle='#fff6d0';for(let k=0;k<4;k++){g.rotate(Math.PI/2);g.beginPath();g.moveTo(0,-3);g.lineTo(11,0);g.lineTo(0,3);g.closePath();g.fill()}g.restore();
    if(parts.length<340&&Math.random()<.5)parts.push({k:'sp',x:p.x+(Math.random()-.5)*8,y:p.y+(Math.random()-.5)*8,vx:-p.vx*.08,vy:-p.vy*.08-15,life:.35,max:.35,col:'#ffe9a0'});return}
  if(p.k===5){g.save();g.translate(p.x,p.y);g.rotate(p.ang!=null?p.ang:a);g.strokeStyle='rgba(220,255,210,.35)';g.lineWidth=3;g.beginPath();g.moveTo(-6,0);g.lineTo(-22,0);g.stroke();
    g.fillStyle='#dfe6ee';g.beginPath();g.moveTo(9,0);g.lineTo(-4,-2.8);g.lineTo(-4,2.8);g.closePath();g.fill();g.fillStyle='#3a2a1a';g.fillRect(-8,-1.5,4,3);g.restore();return}
  drawProj(p)}
// effets en plus, déclenchés par les événements du jeu
function fxExtra(f,mine){const P=(o)=>parts.length<360&&parts.push(o);
  switch(f.k){
    case 1:P({k:'imp',x:f.x,y:f.y+8,life:.2,max:.2,rot:Math.random()*6,big:0});break;
    case 2:P({k:'imp',x:f.x,y:f.y+8,life:.32,max:.32,rot:Math.random()*6,big:1});if(Math.hypot(f.x-L.x,f.y-L.y)<500)shake=Math.max(shake,4);break;
    case 4:SWG[f.o]={at:performance.now(),a:f.v/100};break;
    case 6:for(let k=0;k<16;k++){const a=k/16*6.28;P({k:'shard',x:f.x,y:f.y,vx:Math.cos(a)*f.v*2.4,vy:Math.sin(a)*f.v*2.4,a,life:.42,max:.42})}break;
    case 10:P({k:'spin',x:f.x,y:f.y,o:f.o,r:f.v,life:.5,max:.5});break;
    case 28:P({k:'streak',x:f.x,y:f.y,a:f.v/100,life:.45,max:.45});for(let k=0;k<10;k++)P({k:'sp',x:f.x-Math.cos(f.v/100)*k*18,y:f.y-Math.sin(f.v/100)*k*18+8,vx:(Math.random()-.5)*40,vy:-20-Math.random()*30,life:.5,max:.5,col:'#c9a27c'});break;
    case 30:P({k:'crack',x:f.x,y:f.y,r:f.v,seed:Math.floor(Math.random()*999),life:1.2,max:1.2});for(let k=0;k<18;k++){const a=Math.random()*6.28,d=Math.random()*f.v;P({k:'rock',x:f.x+Math.cos(a)*d,y:f.y+Math.sin(a)*d,vx:Math.cos(a)*40,vy:-90-Math.random()*90,life:.7,max:.7})}break;
    case 31:for(let k=0;k<20;k++){const a=Math.random()*6.28,d=Math.random()*f.v;P({k:'sp',x:f.x+Math.cos(a)*d,y:f.y+Math.sin(a)*d,vx:0,vy:-40-Math.random()*60,life:.8,max:.8,col:k%2?'#ffb347':'#ff6a2b'})}break;
  }}
const FX2={
  imp(q,al){const t=1-al,g=ctx,n=q.big?8:6,R=(q.big?20:13)*eio(t*1.6);g.save();g.translate(q.x,q.y);g.rotate(q.rot);g.globalAlpha=al;
    g.fillStyle=q.big?'#fff3a0':'#ffffff';g.beginPath();g.arc(0,0,Math.max(1,(q.big?9:6)*(1-t)),0,6.28);g.fill();
    g.strokeStyle=q.big?'#ffd04a':'#fff';g.lineWidth=q.big?3:2;g.beginPath();for(let k=0;k<n;k++){const a=k/n*6.28;g.moveTo(Math.cos(a)*R*.45,Math.sin(a)*R*.45);g.lineTo(Math.cos(a)*R,Math.sin(a)*R)}g.stroke();
    if(q.big){g.strokeStyle='rgba(255,208,74,'+al+')';g.lineWidth=2;g.beginPath();g.arc(0,0,R*1.2,0,6.28);g.stroke()}g.restore()},
  shard(q,al){const g=ctx;g.save();g.translate(q.x,q.y);g.rotate(q.a);g.globalAlpha=al;g.fillStyle='#dff2ff';g.beginPath();g.moveTo(9,0);g.lineTo(-4,-3);g.lineTo(-4,3);g.closePath();g.fill();g.strokeStyle='#7fbfff';g.lineWidth=1;g.stroke();g.restore()},
  spin(q,al){const w=G.players[q.o]?wpos(q.o):q,t=1-al,g=ctx;for(let k=0;k<3;k++){const a=t*14+k*2.09;crescent(w.x,w.y,q.r*.75,a-1.1,a,13,'rgba(255,200,170,.75)','#fff',al)}},
  streak(q,al){const g=ctx,L2=170,x0=q.x-Math.cos(q.a)*L2,y0=q.y-Math.sin(q.a)*L2;const gr=g.createLinearGradient(x0,y0,q.x,q.y);gr.addColorStop(0,'rgba(255,220,170,0)');gr.addColorStop(1,'rgba(255,230,190,'+(.75*al)+')');
    g.save();g.strokeStyle=gr;g.lineCap='round';g.lineWidth=26*al+4;g.beginPath();g.moveTo(x0,y0);g.lineTo(q.x,q.y);g.stroke();g.strokeStyle='rgba(255,255,255,'+al+')';g.lineWidth=3;g.beginPath();g.moveTo(x0,y0);g.lineTo(q.x,q.y);g.stroke();g.restore()},
  crack(q,al){const g=ctx;g.save();g.globalAlpha=Math.min(1,al*1.6);g.strokeStyle='#3a2414';g.lineWidth=3;g.lineCap='round';const R=mulberry(q.seed);
    for(let k=0;k<9;k++){let a=k/9*6.28+R()*.4,x=q.x,y=q.y;g.beginPath();g.moveTo(x,y);const st=5;for(let s=1;s<=st;s++){a+=(R()-.5)*.6;const d=q.r/st*(.8+R()*.4);x+=Math.cos(a)*d;y+=Math.sin(a)*d*.75;g.lineTo(x,y)}g.stroke()}
    g.strokeStyle='rgba(255,200,120,'+(al*.8)+')';g.lineWidth=1;g.stroke();g.restore()},
  rock(q,al){q.vy+=300*(1/60);ctx.globalAlpha=al;ctx.fillStyle='#8a6a4a';ctx.fillRect(q.x-2,q.y-2,4,4);ctx.globalAlpha=1}
};
