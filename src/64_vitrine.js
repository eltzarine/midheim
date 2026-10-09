/* ================= Villes vivantes =================
   Dans toutes les villes : pavés taillés un par un, lumière chaude des lanternes, fenêtres et portes
   quand le jour baisse (voir 64_sky.js), villageois qui se promènent en journée (trajets tirés de
   l'heure du monde : les deux joueurs voient les mêmes passants), lucioles le soir. */
const VITRINE={r:15};
const Vitrine={dusk:0,folk:{},
  /* ville la plus proche d'une case (ou null) */
  townAt(tx,ty){for(const k in TOWNS){const c=PL[k];if(Math.abs(tx-c[0])<=VITRINE.r&&Math.abs(ty-c[1])<=VITRINE.r&&Math.hypot(tx-c[0],ty-c[1])<=VITRINE.r)return k}return null},
  near(tx,ty){return!!this.townAt(tx,ty)},
  tick(dt){this.dusk=Sky.dark},
  lit(b){return G.night||(b&&b.town&&Sky.lamps)}
};

/* ---- pavés : chaque pierre dessinée (dans le cache du sol, donc gratuit à l'affichage) ---- */
function vitrineCobbles(g,px,py,tx,ty){
  g.fillStyle='#8f8576';g.fillRect(px,py,TS,TS); // joints
  const rows=3,rh=TS/rows;
  for(let r=0;r<rows;r++){const off=((ty*3+r)%2)*5.5;let x=-off;let k=0;
    while(x<TS){const sw=9+hash2(tx*7+k,ty*5+r,41)*6,h=hash2(tx+k,ty*3+r,42);const x0=Math.max(0,x)+1,x1=Math.min(TS,x+sw)-1;if(x1-x0>2){
        const y0=py+r*rh+1,hh=rh-2,base=shade('#b9ab94',(h-.5)*.22+(vnoise(tx/3,ty/3,51)-.5)*.12);
        g.fillStyle=base;g.beginPath();const rr=2.6;g.moveTo(px+x0+rr,y0);g.lineTo(px+x1-rr,y0);g.quadraticCurveTo(px+x1,y0,px+x1,y0+rr);g.lineTo(px+x1,y0+hh-rr);g.quadraticCurveTo(px+x1,y0+hh,px+x1-rr,y0+hh);
        g.lineTo(px+x0+rr,y0+hh);g.quadraticCurveTo(px+x0,y0+hh,px+x0,y0+hh-rr);g.lineTo(px+x0,y0+rr);g.quadraticCurveTo(px+x0,y0,px+x0+rr,y0);g.fill();
        g.fillStyle='rgba(255,250,235,.22)';g.fillRect(px+x0+1.5,y0+1,x1-x0-3,1.2);           // arête usée, au soleil
        g.fillStyle='rgba(40,30,20,.18)';g.fillRect(px+x0+1,y0+hh-1.5,x1-x0-2,1.5);          // ombre du bas
        if(h>.86){g.strokeStyle='rgba(60,48,36,.45)';g.lineWidth=.8;g.beginPath();g.moveTo(px+x0+2,y0+2+h*3);g.lineTo(px+(x0+x1)/2,y0+hh/2);g.lineTo(px+x1-2,y0+hh-2);g.stroke()} // fissure
      }
      x+=sw;k++}}
  // mousse dans les joints, loin des passages
  const m=hash2(tx,ty,43);if(m<.28){g.fillStyle='rgba(96,128,58,.55)';for(let i=0;i<4;i++){g.fillRect(px+hash2(tx,ty,44+i)*TS,py+Math.floor(hash2(tx,ty,48+i)*rows)*rh-1,3+hash2(tx,ty,52+i)*4,2)}}
  // flaque (rare) : elle reflétera les lumières du soir
  if(hash2(tx,ty,45)<.04){g.fillStyle='rgba(60,70,78,.28)';g.beginPath();g.ellipse(px+15,py+18,10,4,0,0,6.28);g.ellipse(px+21,py+20,6,3,0,0,6.28);g.fill();g.fillStyle='rgba(220,230,235,.22)';g.fillRect(px+9,py+17,7,1)}
}

/* ---- villageois : boucles de promenade sur les pavés, position tirée de l'heure du monde ---- */
function vitrineFolk(town){if(Vitrine.folk[town])return Vitrine.folk[town];const m=WORLD,W=m.W,c=PL[town],R=mulberry(2026+c[0]*31+c[1]);
  const ok=(x,y)=>x>0&&y>0&&x<W&&y<m.H&&!m.sol[y*W+x]&&(m.t[y*W+x]===10||m.t[y*W+x]===7)&&Math.hypot(x-c[0],y-c[1])<=VITRINE.r;
  const spots=[];for(let y=c[1]-VITRINE.r;y<=c[1]+VITRINE.r;y++)for(let x=c[0]-VITRINE.r;x<=c[0]+VITRINE.r;x++)if(ok(x,y))spots.push([x,y]);
  const path=(a,b)=>{const prev=new Map(),q=[a],key=p=>p[0]+','+p[1];prev.set(key(a),null);
    while(q.length){const p=q.shift();if(p[0]===b[0]&&p[1]===b[1])break;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=[p[0]+dx,p[1]+dy];if(!ok(n[0],n[1])||prev.has(key(n)))continue;prev.set(key(n),p);q.push(n)}}
    if(!prev.has(key(b)))return null;const out=[];for(let p=b;p;p=prev.get(key(p)))out.unshift(p);return out};
  const LOOK=[['#7a3b2a','#e9c4a0','capuche'],['#2f5e6a','#d8a880','chapeau'],['#6b5a2a','#f0d0b0','panier'],['#4a3a6a','#c99a70','capuche'],['#8a6a3a','#e9cdb0','chapeau']];
  const folk=[];const n=TOWNS[town].b.length>=6?5:3;for(let i=0;i<n&&spots.length>4;i++){const pts=[];for(let k=0;k<4;k++)pts.push(spots[Math.floor(R()*spots.length)]);
    let loop=[];for(let k=0;k<pts.length;k++){const p=path(pts[k],pts[(k+1)%pts.length]);if(!p){loop=null;break}loop=loop.concat(k?p.slice(1):p)}
    if(loop&&loop.length>6)folk.push({loop,look:LOOK[i%LOOK.length],spd:.9+R()*.5,ph:R()*loop.length})}
  return Vitrine.folk[town]=folk}
function folkPos(f,t){const n=f.loop.length,u=((t*f.spd+f.ph)%n+n)%n,i=Math.floor(u),fr=u-i,a=f.loop[i],b=f.loop[(i+1)%n];
  return{x:(a[0]+(b[0]-a[0])*fr+.5)*TS,y:(a[1]+(b[1]-a[1])*fr+.5)*TS,dir:b[0]-a[0],walk:u}}
function drawFolk(g,f,p){if(drawFolkPix(g,f,p))return;const[cloth,skin,kind]=f.look,step=Math.sin(p.walk*Math.PI*2*2),x=p.x,y=p.y,fl=p.dir<0?-1:1;
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x,y+11,8,3,0,0,6.28);g.fill();
  g.fillStyle='#3a2a1e';g.fillRect(x-4+step*2,y+4,3,7);g.fillRect(x+1-step*2,y+4,3,7);            // jambes qui marchent
  g.fillStyle=cloth;g.beginPath();g.moveTo(x-7,y-4);g.lineTo(x+7,y-4);g.lineTo(x+8,y+7);g.lineTo(x-8,y+7);g.closePath();g.fill();
  g.fillStyle=shade(cloth,-.2);g.fillRect(x-7,y+1,14,2);                                            // ceinture
  g.fillStyle=skin;g.beginPath();g.arc(x,y-10,5.5,0,6.28);g.fill();g.fillStyle='#1a1220';g.fillRect(x-2+fl,y-11,1.5,1.5);g.fillRect(x+1.5+fl,y-11,1.5,1.5);
  if(kind==='capuche'){g.fillStyle=shade(cloth,-.1);g.beginPath();g.arc(x,y-11,6.5,Math.PI*1.05,-.05);g.lineTo(x+6,y-6);g.lineTo(x-6,y-6);g.fill()}
  else if(kind==='chapeau'){g.fillStyle='#5a4030';g.beginPath();g.ellipse(x,y-14,8,2.4,0,0,6.28);g.fill();g.fillRect(x-4,y-19,8,5)}
  else{g.fillStyle='#a07840';g.fillRect(x+5*fl-3,y-1,7,5);g.strokeStyle='#7a5530';g.lineWidth=1;g.beginPath();g.arc(x+5*fl+.5,y-1,3,Math.PI,0);g.stroke()}}

/* ---- sources de lumière de la ville (lanternes, fenêtres, portes, braseros) ---- */
function vitrineLights(x0,y0,x1,y1){const m=WORLD,out=[],T=G.time;
  const a=Math.max(0,Math.floor(x0/TS)),b=Math.min(m.W-1,Math.floor(x1/TS)),c=Math.max(0,Math.floor(y0/TS)),d=Math.min(m.H-1,Math.floor(y1/TS));
  for(let ty=c;ty<=d;ty++)for(let tx=a;tx<=b;tx++){if(m.obj[ty*m.W+tx]!==10)continue;out.push([(tx+.5)*TS+6.5,(ty+1)*TS-34,150,1,tx*3+ty])}
  for(const bd of m.builds){if(!bd.town||bd.kind==='puits')continue;const bx=bd.x*TS,by=bd.y*TS,bw=bd.w*TS,bh=bd.h*TS;if(bx>x1+200||bx+bw<x0-200||by>y1+200||by+bh<y0-200)continue;
    out.push([(bd.door.x+.5)*TS,bd.door.y*TS-8,bd.kind==='forge'?130:95,.9,bd.x]);
    const dx=(bd.door.x+.5)*TS;for(let k=0;k<bd.w;k++){const cx=bx+k*TS+TS/2;if(Math.abs(cx-dx)<TS*.6)continue;out.push([cx,by+bh*.28,70,.7,bd.x+k*7])}}
  return out}
/* trous de lumière dans le voile du soir (appelé dans la passe d'obscurité) */
function vitrineHoles(light,x0,y0,x1,y1){if(!Sky.lamps)return;const T=G.time;
  for(const[x,y,r,a,s]of vitrineLights(x0,y0,x1,y1))light(x,y,r*.8*(1+.04*Math.sin(T*7+s)),a*.5*Math.min(1,Sky.dark*2))}
/* lueur chaude ajoutée par-dessus (lumière colorée, flaques qui brillent, lucioles) */
function vitrineGlow(x0,y0,x1,y1){if(!Sky.lamps)return;const k=Math.min(1,Sky.dark*1.8+(Sky.rain>.6?.3:0));if(k<.02)return;const g=ctx,T=G.time;g.save();g.globalCompositeOperation='lighter';
  for(const[x,y,r,a,s]of vitrineLights(x0,y0,x1,y1)){const fl=.85+.15*Math.sin(T*8+s)*Math.sin(T*3.1+s*2),rr=r*.75;
    const gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,'rgba(255,170,70,'+(.32*a*k*fl)+')');gr.addColorStop(.45,'rgba(255,120,40,'+(.12*a*k*fl)+')');gr.addColorStop(1,'rgba(255,100,30,0)');
    g.fillStyle=gr;g.fillRect(x-rr,y-rr,rr*2,rr*2)}
  g.restore();
  // lucioles autour des lanternes
  if(Sky.rain<.3&&Math.random()<k*.25){const ls=vitrineLights(x0,y0,x1,y1).filter(l=>l[2]>=150);if(ls.length){const l=ls[Math.floor(Math.random()*ls.length)];
    parts.push({k:'fly',x:l[0]+(Math.random()-.5)*60,y:l[1]+20+Math.random()*40,vx:(Math.random()-.5)*10,vy:-4-Math.random()*6,life:2.5+Math.random()*2,max:4})}}}
FX2.fly=(q,al)=>{const g=ctx;g.save();g.globalCompositeOperation='lighter';const b=Math.sin(Math.PI*q.life/q.max)*(.6+.4*Math.sin(q.life*9));
  g.fillStyle='rgba(255,230,140,'+(.7*b)+')';g.beginPath();g.arc(q.x,q.y,1.6,0,6.28);g.fill();g.fillStyle='rgba(255,210,120,'+(.15*b)+')';g.beginPath();g.arc(q.x,q.y,6,0,6.28);g.fill();g.restore();
  q.vx+=(Math.random()-.5)*2;q.vy+=(Math.random()-.5)*2};
