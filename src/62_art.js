/* ================= Style « low-poly » : outils de dessin ombré ================= */
// Lumière venant du haut-gauche : faces claires à gauche/en haut, sombres à droite, ombres portées vers le bas-droite.
const _shc=new Map();
function shade(hex,k){const key=hex+k;let c=_shc.get(key);if(c)return c;const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;
  if(k>0){r+=(255-r)*k;g+=(255-g)*k;b+=(255-b)*k}else{r*=1+k;g*=1+k;b*=1+k}c='rgb('+(r|0)+','+(g|0)+','+(b|0)+')';if(_shc.size>4000)_shc.clear();_shc.set(key,c);return c}
function dshadow(g,x,y,rx,ry,a){g.fillStyle='rgba(40,20,10,'+(a||.28)+')';g.beginPath();g.ellipse(x+rx*.25,y,rx,ry,0,0,6.28);g.fill()}
function poly(g,pts,col){g.fillStyle=col;g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fill()}
// prisme vu de 3/4 : empreinte au sol (x,y,w,h), hauteur z
function prism(g,x,y,w,h,z,col,o){o=o||{};const top=o.top||shade(col,.18),front=o.front||col,side=o.side||shade(col,-.28);
  g.fillStyle=front;g.fillRect(x,y+h-z,w,z);g.fillStyle=top;g.fillRect(x,y-z,w,h);if(o.edge!==false){g.fillStyle=side;g.fillRect(x+w-Math.min(4,w*.18),y+h-z,Math.min(4,w*.18),z)}
  g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x,y-z,w,1.5)}
function cyl(g,x,y,r,z,col,lid){const ry=r*.42;g.fillStyle=shade(col,-.12);g.beginPath();g.ellipse(x,y,r,ry,0,0,Math.PI);g.fill();g.fillRect(x-r,y-z,r*2,z);
  const gr=g.createLinearGradient(x-r,0,x+r,0);gr.addColorStop(0,shade(col,.18));gr.addColorStop(.45,col);gr.addColorStop(1,shade(col,-.35));g.fillStyle=gr;g.fillRect(x-r,y-z,r*2,z);
  g.beginPath();g.ellipse(x,y,r,ry,0,0,Math.PI);g.fill();g.fillStyle=lid||shade(col,.25);g.beginPath();g.ellipse(x,y-z,r,ry,0,0,6.28);g.fill()}
// couronne d'arbre facettée (polygone irrégulier découpé en triangles éclairés différemment)
function facetBlob(g,x,y,r,col,seed,n){n=n||7;const pts=[];for(let i=0;i<n;i++){const a=i/n*6.283-1.4,rr2=r*(.78+hash2(seed,i,3)*.3);pts.push([x+Math.cos(a)*rr2,y+Math.sin(a)*rr2*.86])}
  const cx=x-r*.12,cy=y-r*.18;for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n];const mx=(p[0]+q[0])/2-x,my=(p[1]+q[1])/2-y;const lit=(-mx-my)/(r*1.4);
    g.fillStyle=shade(col,clamp(lit*.32,-.32,.26));g.beginPath();g.moveTo(cx,cy);g.lineTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.closePath();g.fill()}}
function cone(g,x,y,w,h,col,snow){poly(g,[x-w,y,x,y-h,x,y+w*.22],shade(col,.16));poly(g,[x,y-h,x+w,y,x,y+w*.22],shade(col,-.26));
  if(snow){poly(g,[x-w*.42,y-h*.58,x,y-h,x,y-h*.52],'#f4f8f8');poly(g,[x,y-h,x+w*.42,y-h*.58,x,y-h*.52],'#cfdbe0')}}

/* ================= Apparence des héros selon l'équipement ================= */
const ENCH_IDS=['lath','feu','talos','kel'];
function lookOf(eq){if(!eq)return 0;const w=eq.arme,a=eq.armure,tl=eq.talisman;
  return (w?w.b:0)+3*(a?a.b:0)+9*(w?Math.min(3,w.r):0)+36*(a?Math.min(3,a.r):0)+144*(tl?Math.min(3,tl.r)+1:0)+720*(w&&w.e?ENCH_IDS.indexOf(w.e)+1:0)+3600*Math.min(5,w?w.u|0:0)+21600*(a&&a.e?ENCH_IDS.indexOf(a.e)+1:0)}
function unLook(n){n=Math.max(0,n|0);return{wb:n%3,ab:Math.floor(n/3)%3,wr:Math.floor(n/9)%4,ar:Math.floor(n/36)%4,tr:Math.floor(n/144)%5-1,we:Math.floor(n/720)%5,wu:Math.floor(n/3600)%6,ae:Math.floor(n/21600)%5}}
const METAL=['#c9ccd6','#9cc4ff','#cfa6ff','#f0c95a'],CLOAK=['#6b5a48','#2f5e9e','#6b3a9e','#b8862a'],ENC_COL=[null,'#ffe9a0','#ff7a3a','#9fd0ff','#b98cff'];
function drawHero2(g,cls,x,y,aim,t,moving,o){o=o||{};const L2=unLook(o.lk);const face=Math.cos(aim)<0?-1:1;const wk=moving?Math.sin(t*11):0;const bob=moving?Math.abs(Math.sin(t*11))*1.8:Math.sin(t*2.2)*.6;
  const ca=Math.cos(aim),sa=Math.sin(aim),back=sa<-.4;const metal=METAL[L2.wr],am=METAL[L2.ar],ck=CLOAK[L2.ar];const skin='#f0c49a';
  g.save();g.translate(x,y);g.scale(1.12,1.12);
  dshadow(g,0,12,12,4.2,.32);
  if(o.down){g.rotate(Math.PI/2*face);g.globalAlpha*=.8}
  // aura de rareté (épique / légendaire) et enchantement d'armure
  if(L2.ar>=2||L2.ae){const c=L2.ae?ENC_COL[L2.ae]:METAL[L2.ar];g.globalAlpha*=.5;g.strokeStyle=c;g.lineWidth=1.2;g.beginPath();g.ellipse(0,12,13+Math.sin(t*3)*1.5,4.6,0,0,6.28);g.stroke();g.globalAlpha/=.5}
  // jambes et bottes
  const boot=cls==='mage'?'#2a2440':cls==='soigneur'?'#7a5a3a':'#3a2a1c';
  for(const s of[-1,1]){const lx=s*3.6+s*wk*2.6*(s>0?-1:1);g.fillStyle=cls==='guerrier'?shade(am,-.35):cls==='voleur'?'#4a3624':'#3a3048';g.fillRect(lx-2.2,4,4.4,7);g.fillStyle=boot;g.beginPath();g.ellipse(lx+face*.8,11,3.6,2.2,0,0,6.28);g.fill()}
  g.translate(0,-bob);
  // cape (couleur selon la rareté de l'armure)
  if(cls!=='voleur'||L2.ab===2){const sw=Math.sin(t*5)*1.2+wk;poly(g,[-7,-5,7,-5,9+sw,12,-9+sw,12],shade(ck,-.15));poly(g,[-7,-5,0,-5,-1+sw,12,-9+sw,12],ck)}
  else{g.strokeStyle='#b0392b';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(-face*3,-5);g.quadraticCurveTo(-face*10,-2+wk,-face*14,2+Math.sin(t*8)*2);g.stroke();g.lineCap='butt'}
  const hand={x:face*8.5,y:2.5};
  if(back)heroWeapon(g,cls,L2,hand,aim,face,t,metal);
  // torse selon classe et type d'armure
  heroBody(g,cls,L2,am,face,t);
  // talisman
  if(L2.tr>=0){const c=METAL[L2.tr];g.save();g.shadowColor=c;g.shadowBlur=L2.tr>=2?8:3;g.fillStyle=c;g.beginPath();g.moveTo(0,-1);g.lineTo(2,1.5);g.lineTo(0,4);g.lineTo(-2,1.5);g.closePath();g.fill();g.restore();g.strokeStyle='rgba(230,220,190,.7)';g.lineWidth=.7;g.beginPath();g.moveTo(-3,-4);g.lineTo(0,-1);g.lineTo(3,-4);g.stroke()}
  // bras et bouclier
  if(cls==='guerrier'&&L2.wb!==2){const sx=-face*9.5;const sc=L2.ar>=2?shade(am,-.1):'#7a5129';g.fillStyle=sc;g.beginPath();g.moveTo(sx-6,-3);g.lineTo(sx+6,-3);g.lineTo(sx+5,6);g.lineTo(sx,10);g.lineTo(sx-5,6);g.closePath();g.fill();
    g.fillStyle=shade(sc,.22);g.beginPath();g.moveTo(sx-6,-3);g.lineTo(sx,-3);g.lineTo(sx,10);g.lineTo(sx-5,6);g.closePath();g.fill();g.strokeStyle=am;g.lineWidth=1.3;g.beginPath();g.moveTo(sx-6,-3);g.lineTo(sx+6,-3);g.lineTo(sx+5,6);g.lineTo(sx,10);g.lineTo(sx-5,6);g.closePath();g.stroke();
    g.fillStyle=L2.ar>=1?'#e0b23a':'#cfcfd8';g.beginPath();g.arc(sx,2.5,1.8,0,6.28);g.fill()}
  g.fillStyle=skin;g.beginPath();g.arc(hand.x,hand.y,2.3,0,6.28);g.fill();
  heroHead(g,cls,L2,am,face,ca,sa,back,t);
  if(!back)heroWeapon(g,cls,L2,hand,aim,face,t,metal);
  g.restore()}
function heroBody(g,cls,L2,am,face,t){const ab=L2.ab;
  if(cls==='guerrier'){const tun=['#7d2a20','#3a3450','#8e2f3a'][ab];poly(g,[-8,-5,8,-5,9,9,-9,9],tun);
    if(ab===0){g.fillStyle=shade(am,-.1);g.fillRect(-7.5,-5,15,11);g.fillStyle='rgba(40,40,60,.35)';for(let r=0;r<4;r++)for(let c=0;c<5;c++)g.fillRect(-6.5+c*3+(r%2)*1.5,-4+r*2.6,1.2,1.2)}
    else{const pl=am;poly(g,[-7.5,-5,7.5,-5,6.5,5,0,7,-6.5,5],shade(pl,-.05));poly(g,[-7.5,-5,0,-5,0,7,-6.5,5],shade(pl,.2));g.fillStyle='rgba(255,255,255,.35)';g.fillRect(-5,-4,3,6)}
    const pw=ab===1?6.5:ab===2?4.5:3.5;for(const s of[-1,1]){g.fillStyle=shade(am,s<0?.15:-.2);g.beginPath();g.ellipse(s*8,-4,pw,pw*.62,0,0,6.28);g.fill()}
    g.fillStyle='#4a3020';g.fillRect(-8,4,16,2.6);g.fillStyle=L2.ar>=2?'#f0c95a':'#c9a23a';g.fillRect(-1.6,4,3.2,2.6)}
  else if(cls==='mage'){const rb=['#3d5fb4','#5a3a8e','#1f5a62'][ab];poly(g,[-6,-5,6,-5,10,11,-10,11],shade(rb,-.18));poly(g,[-6,-5,0,-5,0,11,-10,11],rb);
    g.strokeStyle=ab===1||L2.ar>=2?'#f0c95a':'#9fb6e8';g.lineWidth=1.1;g.beginPath();g.moveTo(-10,10);g.lineTo(10,10);g.moveTo(0,-5);g.lineTo(0,11);g.stroke();
    if(ab===2){poly(g,[-7,-6,-3,-9,-2,-3],shade(rb,.2));poly(g,[7,-6,3,-9,2,-3],shade(rb,-.25))}
    if(L2.ar>=1){g.fillStyle=METAL[L2.ar];for(const[a,b]of[[-5,3],[4,6],[-3,8],[6,1]])g.fillRect(a,b,1.4,1.4)}g.fillStyle='#e0c27a';g.fillRect(-6,1,12,1.4)}
  else if(cls==='voleur'){const lc=['#6b4a2a','#5a4430','#2f5e3a'][ab];poly(g,[-7.5,-5,7.5,-5,8,8,-8,8],shade(lc,-.15));poly(g,[-7.5,-5,0,-5,0,8,-8,8],lc);
    if(ab===1){g.fillStyle='#c9ccd6';for(let r=0;r<3;r++)for(let c=0;c<4;c++)g.fillRect(-5.5+c*3.6,-3+r*3.4,1.3,1.3)}
    g.fillStyle='#2a1d12';g.fillRect(-8,3,16,2.4);g.save();g.translate(0,0);g.rotate(-.6);g.fillRect(-9,-1,18,1.6);g.restore();g.fillStyle='#8a5a2b';g.fillRect(face*3-2,4,5,4.5)}
  else{const tu=['#f4efe2','#dfe3ea','#f6f2e8'][ab];if(ab===1){g.fillStyle=shade(am,-.1);g.fillRect(-7.5,-5,15,12)}
    poly(g,[-6.5,-5,6.5,-5,ab===2?10:8,ab===2?11:9,ab===2?-10:-8,ab===2?11:9],shade(tu,-.12));poly(g,[-6.5,-5,0,-5,0,11,ab===2?-10:-8,ab===2?11:9],tu);
    g.fillStyle=L2.ar>=2?'#f0c95a':'#e0b23a';g.fillRect(-1,-5,2,13);g.fillRect(-4,-1.5,8,2);if(ab===2){g.fillStyle='#3d6fb4';g.fillRect(-8,4,16,2)}}}
function heroHead(g,cls,L2,am,face,ca,sa,back,t){const hx=0,hy=-11,lx=ca*1.6,ly=Math.max(-1,sa)*1.2;const skin='#f0c49a',ol='#1a1220';const ab=L2.ab;
  if(cls==='voleur'){const hd=['#2d4a2a','#3a2a1c','#24402a'][ab];g.fillStyle=shade(hd,-.12);g.beginPath();g.arc(hx,hy,8.5,0,6.28);g.fill();g.fillStyle=hd;g.beginPath();g.arc(hx-1.5,hy-1.5,7.5,Math.PI*.9,Math.PI*1.9);g.fill();
    g.fillStyle='#c9a07a';g.beginPath();g.ellipse(hx+lx,hy+1,5,4.5,0,0,6.28);g.fill();if(!back){g.fillStyle='#1d1d26';g.fillRect(hx-5+lx,hy-1,10,3);g.fillStyle='#fff';g.fillRect(hx-3+lx*1.4,hy,1.8,1.4);g.fillRect(hx+1.5+lx*1.4,hy,1.8,1.4)}
    g.fillStyle=L2.ar>=2?METAL[L2.ar]:'#b0392b';g.fillRect(-5,hy+5,10,2.6);return}
  g.fillStyle=skin;g.beginPath();g.arc(hx,hy,7.5,0,6.28);g.fill();g.fillStyle='rgba(120,60,30,.14)';g.beginPath();g.arc(hx+2,hy+1.5,6.5,-.6,1.9);g.fill();
  if(!back){g.fillStyle=ol;g.fillRect(hx-3.2+lx,hy-.5+ly,2,2.6);g.fillRect(hx+1.4+lx,hy-.5+ly,2,2.6);g.fillStyle='#fff';g.fillRect(hx-2.9+lx,hy-.2+ly,.8,.8);g.fillRect(hx+1.7+lx,hy-.2+ly,.8,.8)}
  if(cls==='guerrier'){
    if(ab===0){g.fillStyle=shade(am,-.08);g.beginPath();g.arc(hx,hy,8.6,Math.PI*.95,Math.PI*2.05);g.lineTo(hx+8.6,hy+5);g.lineTo(hx+5.5,hy+5);g.lineTo(hx+5.5,hy);g.lineTo(hx-5.5,hy);g.lineTo(hx-5.5,hy+5);g.lineTo(hx-8.6,hy+5);g.closePath();g.fill();g.fillStyle='rgba(40,40,60,.3)';for(let k=0;k<6;k++)g.fillRect(hx-6+k*2.4,hy-5+(k%2),1,1)}
    else if(ab===1){g.fillStyle=shade(am,.05);g.beginPath();g.arc(hx,hy-.5,8.6,Math.PI,0);g.lineTo(hx+8.6,hy+5);g.lineTo(hx-8.6,hy+5);g.closePath();g.fill();g.fillStyle=shade(am,-.3);g.fillRect(hx-8.6,hy,17.2,1.6);if(!back){g.fillStyle='#1a1220';g.fillRect(hx-6+lx,hy-.6,12,1.8)}
      const pc=L2.ar>=1?['#c0392b','#3d6fd8','#9b4dff','#ffcf4a'][L2.ar]:'#c0392b';g.fillStyle=pc;g.beginPath();g.moveTo(hx-1,hy-8);g.quadraticCurveTo(hx-face*12,hy-16+Math.sin(t*4),hx-face*14,hy-6);g.quadraticCurveTo(hx-face*6,hy-10,hx+1,hy-7);g.fill()}
    else{g.fillStyle=shade(am,0);g.beginPath();g.arc(hx,hy-1,8.2,Math.PI,0);g.fill();g.fillStyle=shade(am,-.3);g.fillRect(hx-8.2,hy-2,16.4,2);g.fillRect(hx-1+lx,hy-2,2,5);g.fillStyle='#efe6cf';
      for(const sd of[-1,1]){g.beginPath();g.moveTo(hx+sd*7,hy-4);g.quadraticCurveTo(hx+sd*13,hy-7,hx+sd*12,hy-15);g.quadraticCurveTo(hx+sd*10,hy-9,hx+sd*5,hy-6);g.closePath();g.fill()}}}
  else if(cls==='mage'){const rb=['#2b3f8f','#4a2a7a','#174a52'][ab];if(!back){g.fillStyle='#f4f1ea';g.beginPath();g.moveTo(hx-5,hy+2);g.lineTo(hx+5,hy+2);g.lineTo(hx+face,hy+11+Math.sin(t*3));g.closePath();g.fill()}
    g.fillStyle=shade(rb,-.15);g.beginPath();g.ellipse(hx,hy-5,12,3.6,0,0,6.28);g.fill();poly(g,[hx-7,hy-6,hx+7,hy-6,hx-face*7,hy-25],shade(rb,-.2));poly(g,[hx-7,hy-6,hx,hy-6,hx-face*7,hy-25],rb);
    g.fillStyle=ab===1||L2.ar>=2?'#f0c95a':'#e0c27a';g.fillRect(hx-7,hy-8,14,2);if(L2.ar>=2){g.save();g.shadowColor=METAL[L2.ar];g.shadowBlur=6;g.fillStyle=METAL[L2.ar];g.beginPath();g.arc(hx-face*4,hy-15,1.6,0,6.28);g.fill();g.restore()}}
  else{g.fillStyle='#e8c27a';g.beginPath();g.arc(hx,hy-2,8,Math.PI*1.05,Math.PI*1.95);g.fill();g.fillStyle=L2.ar>=1?METAL[Math.max(1,L2.ar)]:'#e0b23a';g.fillRect(hx-7,hy-5,14,1.6);g.beginPath();g.arc(hx,hy-5.5,1.8,0,6.28);g.fill();
    if(L2.ar>=2){g.strokeStyle='rgba(255,240,180,.75)';g.lineWidth=1.3;g.beginPath();g.ellipse(hx,hy-14+Math.sin(t*2),7,2.2,0,0,6.28);g.stroke()}}}
function heroWeapon(g,cls,L2,hand,aim,face,t,metal){g.save();g.translate(hand.x,hand.y);g.lineCap='round';const wb=L2.wb,en=ENC_COL[L2.we],glow=L2.wr>=2||L2.wu>=3;
  if(glow||en){g.shadowColor=en||metal;g.shadowBlur=6+L2.wu}
  if(cls==='guerrier'){g.rotate(aim+(_hsw?_hsw.off:0));if(_hsw&&_hsw.p>.2&&_hsw.p<.6)g.scale(1.12,1.12);g.fillStyle='#5a3b1e';g.fillRect(-3,-1.5,7,3);
    if(wb===0){g.fillStyle='#d6b04a';g.fillRect(3,-5,2.5,10);poly(g,[5.5,-2.4,23,-1.8,27,0,23,1.8,5.5,2.4],metal);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(6,-.9,16,.9)}
    else if(wb===1){g.fillStyle='#6b4a28';g.fillRect(3,-1.2,18,2.4);poly(g,[15,-1,22,-9,26,-6,24,1,26,7,22,9,15,1],metal);poly(g,[15,-1,22,-9,22,0],shade(metal,.25))}
    else{g.fillStyle='#6b4a28';g.fillRect(3,-1.3,19,2.6);g.fillStyle=metal;g.fillRect(19,-7,7,14);g.fillStyle=shade(metal,.3);g.fillRect(19,-7,3,14);g.fillStyle=shade(metal,-.35);g.fillRect(24,-7,2,14)}}
  else if(cls==='voleur'){g.rotate(aim+(_hsw?_hsw.off:0));if(_hsw)g.translate(Math.sin(_hsw.p*Math.PI*2)*4+2,0);const dag=(oy,len)=>{g.fillStyle='#3a2a1a';g.fillRect(-2,oy-1.2,5,2.4);g.fillStyle='#9a9aa8';g.fillRect(3,oy-3,1.5,6);poly(g,[4.5,oy-1.7,4.5+len,oy,4.5,oy+1.7],metal)};
    if(wb===0){dag(0,11);g.save();g.translate(-3,-5);g.rotate(.5);dag(0,9);g.restore()}
    else if(wb===1){g.fillStyle='#3a2a1a';g.fillRect(-2,-1.2,5,2.4);g.beginPath();g.moveTo(4,-2);g.quadraticCurveTo(12,-7,17,-1);g.quadraticCurveTo(12,-3,4,2);g.closePath();g.fillStyle=metal;g.fill();g.save();g.translate(-3,-5);g.rotate(.5);g.beginPath();g.moveTo(4,-2);g.quadraticCurveTo(11,-6,15,-1);g.quadraticCurveTo(11,-3,4,2);g.closePath();g.fill();g.restore()}
    else{g.fillStyle='#3a2a1a';g.fillRect(-2,-1.4,6,2.8);g.fillStyle='#d6b04a';g.fillRect(3,-4,2,8);g.beginPath();g.moveTo(5,-2.5);g.quadraticCurveTo(15,-4,22,1);g.lineTo(5,2.5);g.closePath();g.fillStyle=metal;g.fill()}}
  else if(cls==='mage'){
    if(wb===0){g.rotate(-Math.PI/2+face*.35+Math.sin(t*2)*.04);g.strokeStyle='#6b4a28';g.lineWidth=3;g.beginPath();g.moveTo(-8,0);g.lineTo(19,0);g.stroke();g.shadowBlur=0;
      const gr=g.createRadialGradient(22,0,0,22,0,8);gr.addColorStop(0,'#fff');gr.addColorStop(.4,en||metal);gr.addColorStop(1,'rgba(111,168,240,0)');g.fillStyle=gr;g.beginPath();g.arc(22,0,8,0,6.28);g.fill();g.strokeStyle='#c9a23a';g.lineWidth=1.5;g.beginPath();g.arc(19,0,3,-1.2,1.2);g.stroke()}
    else if(wb===1){const oy=-6+Math.sin(t*3)*2;const gr=g.createRadialGradient(face*2,oy,0,face*2,oy,7);gr.addColorStop(0,'#fff');gr.addColorStop(.5,en||metal);gr.addColorStop(1,'rgba(160,140,255,0)');g.fillStyle=gr;g.beginPath();g.arc(face*2,oy,7,0,6.28);g.fill();
      g.strokeStyle=metal;g.lineWidth=.8;g.beginPath();g.ellipse(face*2,oy,8,3,t,0,6.28);g.stroke()}
    else{const oy=-4+Math.sin(t*2.5)*1.5;g.translate(face*2,oy);g.rotate(face*.2);prism(g,-5,-3,10,6,2.5,'#6b2f2a',{edge:false});g.fillStyle='#f4efe2';g.fillRect(-4,-5,8,4);g.fillStyle=en||metal;g.fillRect(-.5,-5,1,4);g.globalAlpha=.6;g.fillStyle=en||metal;g.fillRect(-3,-9-Math.sin(t*6)*2,1.2,1.2);g.fillRect(2,-11-Math.cos(t*5)*2,1.2,1.2);g.globalAlpha=1}}
  else{if(wb===2){g.rotate(-Math.PI/2+face*.35);g.strokeStyle='#8a6a3a';g.lineWidth=3;g.beginPath();g.moveTo(-8,0);g.lineTo(18,0);g.stroke();g.strokeStyle=metal;g.lineWidth=1.6;g.beginPath();g.arc(22,0,5,0,6.28);g.stroke();g.fillStyle='#fff6d6';g.beginPath();g.arc(22,0,2,0,6.28);g.fill()}
    else{g.rotate(aim*.35-.6*face);g.strokeStyle='#6b4a28';g.lineWidth=2.6;g.beginPath();g.moveTo(-3,0);g.lineTo(13,0);g.stroke();
      if(wb===0){g.fillStyle=metal;g.beginPath();g.arc(15,0,4.5,0,6.28);g.fill();g.fillStyle=shade(metal,-.3);for(let k=0;k<6;k++){const a=k/6*6.28;g.fillRect(15+Math.cos(a)*5-1,Math.sin(a)*5-1,2,2)}}
      else{g.fillStyle=metal;g.beginPath();g.arc(15,0,3.6,0,6.28);g.fill();g.strokeStyle=metal;g.lineWidth=1.3;for(let k=0;k<8;k++){const a=k/8*6.28+t;g.beginPath();g.moveTo(15+Math.cos(a)*4.6,Math.sin(a)*4.6);g.lineTo(15+Math.cos(a)*7,Math.sin(a)*7);g.stroke()}}}}
  g.restore();
  if(en&&Math.random()<.25&&typeof parts!=='undefined'&&parts.length<400){/* étincelles d'enchantement, ajoutées par drawPlayer */}}
// remplace le rendu des joueurs : l'équipement se voit sur le personnage
function drawPlayer(p,x,y,mine,T){const lk=mine?lookOf(hero.eq):(p.lk|0);
  if(p.down){drawHero2(ctx,p.cls,x,y,0,T,false,{down:true,lk});if(p.rev>0){ctx.strokeStyle='#7fe07a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,20,-1.57,-1.57+6.283*p.rev);ctx.stroke()}return}
  const a=mine?L.aim:(p.aim!=null?p.aim:0);
  let moving;if(mine)moving=Math.abs(L.mv[0])+Math.abs(L.mv[1])>.1;else{moving=Math.hypot(x-(p._px??x),y-(p._py??y))>.3;p._px=x;p._py=y}
  if((mine&&(L.ivT>0||L.stealthT>0))||(!mine&&p.stealthT>0))ctx.globalAlpha=.45;
  if(p.drT>0){ctx.strokeStyle='rgba(255,122,92,'+(.5+.3*Math.sin(T*10))+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,19,0,6.28);ctx.stroke()}
  const sp=swingProg(p,mine);_hsw=sp!=null?{p:sp,off:swingOff(p.cls,sp)}:null;const aa=sp!=null&&(p.cls==='guerrier'||p.cls==='voleur')?swingAngle(p,mine):a;
  drawHero2(ctx,p.cls,x,y,aa,T,moving,{lk});_hsw=null;ctx.globalAlpha=1;if(sp!=null&&(p.cls==='mage'||p.cls==='soigneur'))drawCastRune(x,y,a,sp,p.cls);
  const we=unLook(lk).we;if(we&&Math.random()<.18&&parts.length<500){const c=ENC_COL[we];parts.push({k:'sp',x:x+Math.cos(a)*18+(Math.random()-.5)*8,y:y+Math.sin(a)*14-6,vx:(Math.random()-.5)*20,vy:-30,life:.5,max:.5,col:c})}
  if(mine){ctx.strokeStyle='rgba(255,233,194,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x+Math.cos(a)*42,y+Math.sin(a)*42,3,0,6.28);ctx.stroke()}}
function drawPlayerTo(g,p,x,y){g.save();g.translate(x,y);g.scale(1.3,1.3);drawHero2(g,p.cls,0,2,.35,0,false,{lk:p.lk||0});g.restore()}

/* ================= Icônes des compétences (pour les touches) ================= */
const ICON_PATHS={
  atk_guerrier:'M14 4 L20 4 L20 10 L9 21 L3 15 Z M6 13 L11 18 M2 18 L6 22',atk_mage:'M12 3 C16 8 18 11 18 14 A6 6 0 0 1 6 14 C6 10 10 9 12 3 Z',atk_voleur:'M5 19 L17 7 L20 4 L19 8 L7 20 Z M14 18 L18 14',atk_soigneur:'M12 4 A8 8 0 1 1 11.9 4 Z M12 8 V16 M8 12 H16',
  charge:'M3 12 H15 M11 7 L17 12 L11 17 M17 6 H21 V18 H17',tourbillon:'M12 12 m-7 0 a7 7 0 1 0 7 -7 M12 5 L15 3 M12 5 L15 7',cri:'M4 9 H8 L14 4 V20 L8 15 H4 Z M17 8 Q20 12 17 16 M19 5 Q24 12 19 19',seisme:'M2 18 L7 13 L10 16 L14 9 L17 13 L22 7 M12 2 V6 M6 4 L8 7 M18 4 L16 7',
  nova:'M12 2 V22 M2 12 H22 M5 5 L19 19 M19 5 L5 19',transfert:'M5 12 a7 7 0 1 1 14 0 M12 3 V8 M9 18 L12 21 L15 18 M12 21 V14',flammes:'M12 3 C15 8 18 10 18 15 A6 6 0 0 1 6 15 C6 11 9 10 9 7 C11 9 12 6 12 3 Z',tempete:'M7 3 L13 11 H9 L15 21 M3 8 Q12 4 21 8 M3 16 Q12 20 21 16',
  ombre:'M6 18 C6 10 10 6 18 4 C14 8 13 12 15 16 C11 15 8 16 6 18 Z',eventail:'M12 20 L4 8 M12 20 L8 5 M12 20 L12 4 M12 20 L16 5 M12 20 L20 8',fumee:'M6 16 a4 4 0 0 1 2 -7 a5 5 0 0 1 9 1 a4 4 0 0 1 1 8 H7 Z',danse:'M4 4 L20 20 M20 4 L4 20 M12 2 V6 M12 18 V22',
  cercle:'M12 4 A8 8 0 1 1 11.9 4 Z M12 9 V15 M9 12 H15',bouclier:'M12 3 L20 6 V12 C20 17 16 20 12 22 C8 20 4 17 4 12 V6 Z',jugement:'M12 2 L14 9 L21 9 L15 13 L17 21 L12 16 L7 21 L9 13 L3 9 L10 9 Z',aube:'M3 17 H21 M6 17 a6 6 0 0 1 12 0 M12 4 V7 M5 8 L7 10 M19 8 L17 10',
  potion:'M9 2 H15 V4 H14 V8 C17 9 19 12 19 15 A7 7 0 0 1 5 15 C5 12 7 9 10 8 V4 H9 Z'};
function iconSvg(key,col){const d=ICON_PATHS[key]||ICON_PATHS.nova;const fill=/Z/.test(d)?col:'none';
  return '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path d="'+d+'" fill="'+fill+'" fill-opacity=".9" stroke="'+col+'" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>'}
