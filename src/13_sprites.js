/* ================= Sprites pixel art (pack « Ninja Adventure » de pixel-boy, licence CC0) =================
   Les images sont intégrées au build (tools/import_pack.py puis tools/build.py, marqueur PACK).
   Planches de personnages 64×112 : colonnes = bas, haut, gauche, droite ; lignes 0-3 marche, 4 attaque.
   Tant qu'une image n'est pas chargée, les fonctions renvoient false et l'ancien dessin vectoriel prend le relais. */
const PACK_SRC=@@PACK@@;
const SPR={im:{},_t:new Map(),_o:new Map(),
  load(){for(const k in PACK_SRC){const i=new Image();i.onload=()=>{i._ok=1;if(k[0]==='t'&&typeof WORLD!=='undefined'&&WORLD&&WORLD.chunks)WORLD.chunks.clear()};i.src=PACK_SRC[k];this.im[k]=i}},
  ok(k){const i=this.im[k];return !!(i&&i._ok)},
  /* recolore l'équipement (métal, tissu) vers une teinte de rareté ; garde peau, contour et yeux.
     headY : lignes du haut de chaque case laissées intactes (visage et cheveux du mage, du soigneur) */
  tint(k,hue,headY){if(hue==null)return this.im[k];const key=k+'|'+hue+'|'+(headY|0);let c=this._t.get(key);if(c)return c;
    const im=this.im[k];c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,c.width,c.height),p=d.data;
    for(let i=0;i<p.length;i+=4){if(p[i+3]<10)continue;const y=(i>>2)/c.width|0;if(headY&&(y%16)<headY)continue;
      const r=p[i]/255,gg=p[i+1]/255,b=p[i+2]/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),v=mx,s=mx?(mx-mn)/mx:0;
      let h=0;if(mx!==mn){h=mx===r?(gg-b)/(mx-mn)%6:mx===gg?(b-r)/(mx-mn)+2:(r-gg)/(mx-mn)+4;h=(h/6+1)%1}
      if(!headY&&(h<.12||h>.94)&&s>.15&&s<.8&&v>.5)continue;           // peau
      if(v<.22||(s<.12&&v>.9))continue;                                   // contour, blancs
      const ns=Math.min(1,Math.max(s,.35)*1.15),nv=Math.min(1,v*1.05),H=hue/60,f=H-Math.floor(H),P=nv*(1-ns),Q=nv*(1-ns*f),R=nv*(1-ns*(1-f));
      const o=[[nv,R,P],[Q,nv,P],[P,nv,R],[P,Q,nv],[R,P,nv],[nv,P,Q]][Math.floor(H)%6];p[i]=o[0]*255;p[i+1]=o[1]*255;p[i+2]=o[2]*255}
    g.putImageData(d,0,0);this._t.set(key,c);return c},
  /* contour plein d'une couleur autour des pixels opaques (rareté, élite) */
  outline(src,col,key){key=key+'|'+col;let c=this._o.get(key);if(c)return c;c=document.createElement('canvas');c.width=src.width;c.height=src.height;
    const g=c.getContext('2d');for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])g.drawImage(src,dx,dy);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,c.width,c.height);
    this._o.set(key,c);return c},
  /* dessine la case (col,row) avec les pieds en (x,y) */
  cell(g,src,col,row,x,y,sc){g.drawImage(src,col*16,row*16,16,16,Math.round(x-8*sc),Math.round(y-16*sc),16*sc,16*sc)},
  dir(ax,ay){return Math.abs(ax)>Math.abs(ay)*1.15?(ax<0?2:3):(ay<0?1:0)}};
SPR.load();
const PIX=2.25;   // agrandissement des personnages (16 px -> 36 px du monde)
const HERO_SPR={guerrier:['Knight','GladiatorBlue','KnightGold'],mage:['SorcererBlack','NinjaMageOrange','NinjaMageBlack'],
  voleur:['NinjaDark','NinjaGray','Hunter'],soigneur:['Monk2','Master','Monk']};
const HERO_HEAD={mage:11,soigneur:9};
const HERO_WPN={guerrier:['Sword','Axe','Hammer'],mage:['Stick',null,'Book'],voleur:['Sai','Ninjaku','Katana'],soigneur:['Club','MagicWand','Stick']};
const RAR_HUE=[null,215,280,42,172];
/* héros en pixel art ; false si les images ne sont pas encore prêtes */
function drawHeroPix(g,cls,x,y,aim,t,moving,o){const L2=unLook(o.lk);const name=(HERO_SPR[cls]||HERO_SPR.guerrier)[L2.ab]||'Knight';
  if(!SPR.ok('c_'+name))return false;
  const hue=RAR_HUE[L2.ar],sheet=SPR.tint('c_'+name,hue,HERO_HEAD[cls]||0);const sc=PIX;
  g.save();g.imageSmoothingEnabled=false;
  g.fillStyle='rgba(20,12,30,.35)';g.beginPath();g.ellipse(x,y+13,10,3.5,0,0,6.28);g.fill();
  if(o.down){g.translate(x,y+6);g.rotate(Math.PI/2);g.globalAlpha*=.8;SPR.cell(g,sheet,0,0,0,8,sc);g.restore();return true}
  const ax=Math.cos(aim),ay=Math.sin(aim),col=SPR.dir(ax,ay);
  const sw=typeof _hsw!=='undefined'&&_hsw;const row=sw?4:moving?Math.floor(t*8)%4:0;const fy=y+14-(moving||sw?0:Math.round(Math.sin(t*2.2)*.6));
  const wk=HERO_WPN[cls]||HERO_WPN.guerrier,wname=wk[L2.wb];
  const weapon=()=>{const wh=RAR_HUE[L2.wr];g.save();
    let a=aim+(sw?sw.off||0:0);const hx=x+Math.cos(a)*9,hy=y-2+Math.sin(a)*6;g.translate(hx,hy);
    if(wname===null){const pu=.6+.4*Math.sin(t*5);g.fillStyle='#141b1b';g.beginPath();g.arc(0,-2,5,0,6.28);g.fill();
      g.fillStyle=wh!=null?'hsl('+wh+',85%,62%)':'#71ddee';g.beginPath();g.arc(0,-2,3.8,0,6.28);g.fill();g.fillStyle='rgba(242,234,241,'+pu+')';g.fillRect(-2,-5,2,2);g.restore();return}
    const wi=SPR.ok('w_'+wname)?(L2.wr>=1?SPR.tint('w_'+wname,wh,0):SPR.im['w_'+wname]):null;if(!wi){g.restore();return}
    g.rotate(a+Math.PI/2);const ws=1.6;g.drawImage(wi,Math.round(-wi.width*ws/2),Math.round(-wi.height*ws+4),wi.width*ws,wi.height*ws);g.restore()};
  if(col===1)weapon();
  if(L2.ar>=1){const rc=RAR[L2.ar].col,ol=SPR.outline(sheet,rc,'c_'+name+'|'+hue+'|'+(HERO_HEAD[cls]||0));
    g.save();g.globalAlpha*=.55+.35*Math.sin(t*3);SPR.cell(g,ol,col,row,x,fy,sc);g.restore()}
  SPR.cell(g,sheet,col,row,x,fy,sc);
  if(col!==1)weapon();
  if(L2.ar>=3&&Math.random()<.12&&typeof parts!=='undefined'&&parts.length<500)parts.push({k:'sp',x:x+(Math.random()-.5)*20,y:y-8+(Math.random()-.5)*20,vx:0,vy:-18,life:.6,max:.6,col:RAR[L2.ar].col});
  g.restore();return true}
/* ennemis : type -> personnage du pack */
const ENEMY_SPR={slime:'Skeleton',bat:'Vampire',archer:'Tengu',orc:'GreenPig'};
function drawEnemyPix(g,e,x,y,T,lx,ly,elite){let name=ENEMY_SPR[e.type];if(e.type==='orc'&&G.m&&G.m.soldat)name='RobotGrey';
  if(!name||!SPR.ok('c_'+name))return false;const src=SPR.im['c_'+name];const col=SPR.dir(lx,ly);
  const atk=e.tele>0||(e.fl!=null&&(e.fl&2))||e.chg>0||(e.fl!=null&&(e.fl&16));const row=atk?4:Math.floor(T*6+(e.id|0))%4;
  const fy=y+e.r*.8+(e.type==='bat'?-6+Math.sin(T*6+(e.id|0))*2:0);g.save();g.imageSmoothingEnabled=false;
  if(elite){const ol=SPR.outline(src,'#f0c95a','c_'+name);SPR.cell(g,ol,col,row,x,fy,PIX)}
  SPR.cell(g,src,col,row,x,fy,PIX);g.restore();return true}
/* personnages de ville (PNJ nommés et villageois) */
const NPC_SPR={garde:'GladiatorBlue',grinmir:'Sultan',aubergiste:'Villager2',marchand:'Villager4',forgeron:'OldMan',abhorash:'DemonRed',buveur:'Villager5',barde:'Villager3',conteur:'OldMan3'};
const FOLK_SPR=['Villager','Villager2','Villager3','Villager4','Villager5','Woman','OldWoman','OldMan2','Child','Boy','Noble','Princess','Inspector'];
function drawNPCPix(g,who,x,y,T,col,row){const name=NPC_SPR[who];if(!name||!SPR.ok('c_'+name))return false;g.save();g.imageSmoothingEnabled=false;
  g.fillStyle='rgba(20,12,30,.3)';g.beginPath();g.ellipse(x,y+12,9,3.2,0,0,6.28);g.fill();
  SPR.cell(g,SPR.im['c_'+name],col||0,row||0,x,y+13-Math.round(Math.sin(T*2+x)*.5),PIX);g.restore();return true}
function drawFolkPix(g,f,p){const h=(f.id!=null?f.id:Math.abs(Math.round((f.look&&f.look[0]||'').split('').reduce((a,c)=>a*31+c.charCodeAt(0),7))));
  const name=FOLK_SPR[Math.abs(h|0)%FOLK_SPR.length];if(!SPR.ok('c_'+name))return false;g.save();g.imageSmoothingEnabled=false;
  g.fillStyle='rgba(20,12,30,.28)';g.beginPath();g.ellipse(p.x,p.y+11,8,3,0,0,6.28);g.fill();
  const moving=p.walk!=null;const col=p.dir<0?2:3;const row=moving?Math.floor(p.walk*8)%4:0;
  SPR.cell(g,SPR.im['c_'+name],col,row,p.x,p.y+12,PIX*.92);g.restore();return true}
/* ---- sol du monde en tuiles (TilesetFloor, 16 px affichés en 32) ---- */
const GROUND_T={2:[[0,12],[0,12],[0,12],[0,12],[0,12],[0,12],[1,12],[2,12],[3,12],[4,12],[2,11],[3,11]],
  4:[[11,12],[11,12],[11,12],[11,12],[11,12],[11,12],[12,12],[13,12],[14,12],[15,12]],
  11:[[11,12],[11,12],[11,12],[12,12],[13,12]],
  7:[[9,9],[9,9],[9,9],[9,9],[9,9],[9,9],[8,9],[0,11],[1,11]],
  3:[[0,5],[0,5],[0,5],[0,5],[0,5],[0,5],[1,5],[2,5],[3,5],[4,5]],
  9:[[1,1],[1,1],[1,1],[1,1],[1,1],[1,1],[0,4],[1,4]],
  6:[[0,19],[0,19],[0,19],[0,19],[0,19],[0,19],[1,19],[2,19],[3,19],[4,19]],
  10:'cobble'};
const GROUND_FX={11:'rgba(40,110,105,.28)',9:'rgba(255,240,200,.18)',3:'rgba(110,50,30,.14)'};
const _gpat={};
function groundTile(g,v,tx,ty,px,py){const L=GROUND_T[v];if(!L)return false;let src,cx,cy;
  if(L==='cobble'){src=SPR.im.t_InteriorFloor;const C=[[1,13],[1,13],[1,13],[1,13],[5,13],[6,14],[1,14]];[cx,cy]=C[Math.floor(hash2(tx,ty,77)*C.length)]}
  else{src=SPR.im.t_TilesetFloor;[cx,cy]=L[Math.floor(hash2(tx,ty,77)*L.length)]}
  g.drawImage(src,cx*16,cy*16,16,16,px,py,TS,TS);if(GROUND_FX[v]){g.fillStyle=GROUND_FX[v];g.fillRect(px,py,TS,TS)}return true}
function groundPat(g,v){if(_gpat[v])return _gpat[v];const c=document.createElement('canvas');c.width=c.height=TS*2;const cg=c.getContext('2d');cg.imageSmoothingEnabled=false;
  for(let j=0;j<2;j++)for(let i=0;i<2;i++)groundTile(cg,v,i+v*3,j,i*TS,j*TS);return _gpat[v]=g.createPattern(c,'repeat')}
function pixGround(g,x0,y0){if(!SPR.ok('t_TilesetFloor')||!SPR.ok('t_InteriorFloor'))return false;g.imageSmoothingEnabled=false;
  for(let ty=y0;ty<y0+CHK;ty++)for(let tx=x0;tx<x0+CHK;tx++){const v=wT(tx,ty),px=(tx-x0)*TS,py=(ty-y0)*TS;
    if(!groundTile(g,v,tx,ty,px,py)){const n=vnoise(tx/7,ty/7,4)-.5;g.fillStyle=shade(TBASE[v]||TBASE[2],isWater(v)?n*.12:n*.16);g.fillRect(px,py,TS+.5,TS+.5)}}
  // bords arrondis entre terrains, remplis avec la texture du terrain qui déborde
  const PRIO=[3,9,2,4,11,6,7];
  for(const pv of PRIO){if(!GROUND_T[pv])continue;const pat=groundPat(g,pv);for(let ty=y0-1;ty<=y0+CHK;ty++)for(let tx=x0-1;tx<=x0+CHK;tx++){const v=wT(tx,ty);if(v!==pv)continue;let diff=false;
      for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=wT(tx+dx,ty+dy);if(n!==v&&!isWater(n)&&n!==8&&n!==10&&n!==5)diff=true}if(!diff)continue;
      const px=(tx-x0)*TS,py=(ty-y0)*TS;g.fillStyle=pat;const r=v===7?17:19+hash2(tx,ty,31)*5;
      g.beginPath();g.arc(px+16+(hash2(tx,ty,32)-.5)*8,py+16+(hash2(tx,ty,33)-.5)*8,r,0,6.28);g.fill();
      if(GROUND_FX[v]){g.fillStyle=GROUND_FX[v];g.fill()}}}
  // bordure de pierre autour des pavés
  for(let ty=y0;ty<y0+CHK;ty++)for(let tx=x0;tx<x0+CHK;tx++){if(wT(tx,ty)!==10)continue;const px=(tx-x0)*TS,py=(ty-y0)*TS;g.fillStyle='#5f7160';
    const o=(dx,dy)=>{const n=wT(tx+dx,ty+dy);return n!==10&&n!==8&&!isWater(n)};if(o(0,-1))g.fillRect(px,py,TS,3);if(o(0,1))g.fillRect(px,py+TS-3,TS,3);if(o(-1,0))g.fillRect(px,py,3,TS);if(o(1,0))g.fillRect(px+TS-3,py,3,TS)}
  // médaillons de pierre (place de Tarkin)
  for(const m of WORLD.medals||[]){const px=(m.x-x0)*TS,py=(m.y-y0)*TS;if(px>-4*TS&&px<CHK*TS&&py>-4*TS&&py<CHK*TS)g.drawImage(SPR.im.t_InteriorFloor,15*16,6*16,64,64,px,py,4*TS,4*TS)}
  return true}
/* décor au sol : fleurs, buissons, brindilles, herbes hautes (TilesetNature) */
function pixDeco(g,dc,px,py,tx,ty){const N=SPR.im.t_TilesetNature;if(!SPR.ok('t_TilesetNature'))return false;const h=hash2(tx,ty,61);
  const C={1:[[0,11],[1,11],[3,11],[4,11]],2:[[0,10],[1,10],[2,10]],3:[[5,9],[4,9]],4:[[3,10],[4,10],[5,10]]}[dc];if(!C)return false;const[cx,cy]=C[Math.floor(h*C.length)];
  g.drawImage(N,cx*16,cy*16,16,16,px,py,TS,TS);return true}
/* ---- arbres (TilesetNature, 2×2 cases) ---- */
const TREE_T={1:[[2,0]],3:[[8,0]],2:[[0,0],[16,0],[0,0]],5:[[18,0]]};
function drawTreePix(k,tx,ty,alpha){if(k===14||k===15||k===7){drawWallPix(k,tx,ty);return true}if((k===8||k===10||k===11||k===12)&&drawPropPix(k,tx,ty))return true;const L=TREE_T[k];if(!L||!SPR.ok('t_TilesetNature'))return false;const g=ctx,x=(tx+.5)*TS,y=(ty+1)*TS,h=hash2(tx,ty,9);
  const[cx,cy]=L[Math.floor(h*L.length)];g.save();g.imageSmoothingEnabled=false;if(alpha<1)g.globalAlpha=alpha;
  g.fillStyle='rgba(20,12,30,.3)';g.beginPath();g.ellipse(x+4,y-2,22,6,0,0,6.28);g.fill();
  const sw=Math.round(Math.sin(G.time*1.1+tx*.7+ty)*.6);g.drawImage(SPR.im.t_TilesetNature,cx*16,cy*16,32,32,x-32+sw,y-64,64,64);g.restore();return true}
/* ---- maisons de ville (TilesetHouse) : [colonne, ligne, largeur, hauteur] en cases de 16 px ---- */
// découpes vérifiées une à une : bâtiments entiers, rien de rogné
const HOUSE_T={auberge:[[12,0,4,3]],auberge_tarkin:[[25,7,4,5]],marchand:[[16,0,3,3]],forge:[[29,4,4,4]],temple:[[25,14,4,5]],statue:[[3,15,2,2]],
  maison:[[0,0,4,3],[4,0,4,3],[8,0,4,3],[0,7,3,3],[3,7,3,3]]};
function drawHousePix(b,T){const L=(b.town==='tarkin'&&HOUSE_T[b.kind+'_tarkin'])||HOUSE_T[b.kind];if(!L||!SPR.ok('t_TilesetHouse'))return false;const g=ctx,x=b.x*TS,y=b.y*TS,w=b.w*TS,h=b.h*TS;
  const[cx,cy,cw,chh]=L[Math.floor(hash2(b.x,b.y,3)*L.length)];const W=cw*32,H=chh*32,dx=x+w/2-W/2,dy=y+h-H+4;
  g.save();g.imageSmoothingEnabled=false;g.fillStyle='rgba(20,12,30,.32)';g.fillRect(dx+8,y+h-2,W-4,9);
  g.drawImage(SPR.im.t_TilesetHouse,cx*16,cy*16,cw*16,chh*16,dx,dy,W,H);
  if(typeof Vitrine!=='undefined'&&Vitrine.lit&&Vitrine.lit(b)){g.globalCompositeOperation='lighter';const gl=g.createRadialGradient(x+w/2,y+h-8,2,x+w/2,y+h-8,40);gl.addColorStop(0,'rgba(255,190,100,.35)');gl.addColorStop(1,'rgba(255,190,100,0)');g.fillStyle=gl;g.fillRect(x+w/2-40,y+h-48,80,60)}
  g.restore();
  if((b.kind==='forge'||(b.kind==='maison'&&hash2(b.x,b.y,5)<.5))&&Math.random()<(b.kind==='forge'?.09:.03)&&parts.length<500)
    parts.push({k:'smoke',x:dx+W*.72,y:dy+8,vx:5,vy:-16,life:2.6,max:2.6,r:b.kind==='forge'?7:5});
  return true}
/* ---- forteresse (keep) et palais : dessinés dans la palette du pack, drapeaux animés ---- */
const _keep=new Map();
function keepCanvas(b){const key=b.kind+'|'+b.w+'|'+b.h+'|'+b.door.x+'|'+b.x;let c=_keep.get(key);if(c)return c;
  const pal=b.kind==='palais',W=b.w*16,Hh=b.h*16,O=34;c=document.createElement('canvas');c.width=W;c.height=Hh+O;const g=c.getContext('2d');
  const K='#141b1b',S1='#5f7160',S2='#8d977f',S3='#abc2bc',R0=pal?'#2c4380':'#965340',R1=pal?'#3f5fa8':'#d14b34',R2=pal?'#548789':'#e46d3a',LT='#ffe18d',MO='#56864c';
  const R=mulberry(b.x*31+b.y);
  const bricks=(x0,y0,x1,y1)=>{g.fillStyle=S1;g.fillRect(x0,y0,x1-x0,y1-y0);for(let row=0,y=y0;y<y1;y+=6,row++){const off=row%2?5:0;for(let x=x0-off;x<x1;x+=10){const a=Math.max(x0,x+1),bb=Math.min(x1,x+10);if(bb<=a)continue;
      g.fillStyle=S2;g.fillRect(a,y+1,bb-a,Math.min(5,y1-y-1));g.fillStyle=S3;g.fillRect(a,y+1,bb-a,1)}}
    for(let k=0;k<(x1-x0)/3;k++){g.fillStyle=MO;g.fillRect(x0+R()*(x1-x0),y1-1-R()*6,1,1)}
    g.strokeStyle=K;g.lineWidth=1;g.strokeRect(x0+.5,y0+.5,x1-x0-1,y1-y0-1)};
  const crenel=(x0,x1,y)=>{g.fillStyle=S2;g.fillRect(x0,y,x1-x0,4);for(let x=x0;x<x1-4;x+=8){g.fillStyle=S2;g.fillRect(x,y-5,5,5);g.fillStyle=S3;g.fillRect(x,y-5,5,1);g.strokeStyle=K;g.strokeRect(x+.5,y-5.5,4,5)}g.fillStyle=K;g.fillRect(x0,y+4,x1-x0,1)};
  const roof=(cx,top,w,h)=>{for(let j=0;j<h;j++){const hw=Math.round(w/2*(j+1)/h);for(let i=-hw;i<=hw;i++){g.fillStyle=j%4===3?R0:i<-hw/3?R2:i<hw/2?R1:R0;g.fillRect(cx+i,top+j,1,1)}g.fillStyle=K;g.fillRect(cx-hw-1,top+j,1,1);g.fillRect(cx+hw+1,top+j,1,1)}g.fillStyle=K;g.fillRect(cx-w/2-1,top+h,w+3,1)};
  const win=(x,y,lit)=>{g.fillStyle=lit?LT:K;g.fillRect(x,y,3,5)};
  const gx=Math.round(((b.door.x+.5)*TS-b.x*TS)/2),tw=Math.max(16,Math.round(W*.2));
  // donjon central derrière la muraille
  const dw=Math.round(W*.36);bricks(W/2-dw/2,O-10,W/2+dw/2,O+14);crenel(W/2-dw/2-2,W/2+dw/2+2,O-10);win(W/2-6,O-2,1);win(W/2+4,O-2,1);roof(W/2,O-30,dw+6,16);
  // muraille et portail
  bricks(tw-2,O+10,W-tw+2,O+Hh);crenel(tw-2,W-tw+2,O+10);
  g.fillStyle=K;g.fillRect(gx-9,O+Hh-22,18,22);g.beginPath();g.arc(gx,O+Hh-22,9,Math.PI,0);g.fill();
  g.fillStyle='#4e484a';for(let x=gx-7;x<gx+8;x+=4)g.fillRect(x,O+Hh-28,1,26);for(let y=O+Hh-24;y<O+Hh;y+=5)g.fillRect(gx-8,y,16,1);
  g.strokeStyle=S3;g.lineWidth=2;g.beginPath();g.arc(gx,O+Hh-22,11,Math.PI,0);g.stroke();g.fillStyle=S3;g.fillRect(gx-12,O+Hh-22,2,22);g.fillRect(gx+10,O+Hh-22,2,22);
  for(const bx of[gx-26,gx+20]){if(bx<tw||bx>W-tw-6)continue;g.fillStyle=pal?'#3f5fa8':'#d14b34';g.fillRect(bx,O+18,6,14);g.fillStyle=LT;g.fillRect(bx+2,O+22,2,2);g.fillStyle=K;g.strokeRect(bx+.5,O+18.5,5,13)}
  for(const tx of[gx-14,gx+13]){g.fillStyle='#965340';g.fillRect(tx,O+Hh-24,1,6)}
  // tours d'angle
  for(const x0 of[0,W-tw]){bricks(x0,O-4,x0+tw,O+Hh);crenel(x0-1,x0+tw+1,O-4);roof(x0+tw/2,O-26,tw+6,20);win(x0+tw/2-1,O+8,1);win(x0+tw/2-1,O+26,0)}
  c._flags=[[tw/2,O-26],[W-tw/2,O-26],[W/2,O-30]];c._O=O;c._torch=[[gx-14,O+Hh-26],[gx+13,O+Hh-26]];_keep.set(key,c);return c}
function drawKeepPix(b,T){if(b.kind!=='keep'&&b.kind!=='palais')return false;if(!SPR.ok('f_FlagRed'))return false;const g=ctx,x=b.x*TS,y=b.y*TS,h=b.h*TS;
  const c=keepCanvas(b),dy=y+h-c.height*2;g.save();g.imageSmoothingEnabled=false;g.fillStyle='rgba(20,12,30,.32)';g.fillRect(x+6,y+h-4,c.width*2,10);
  g.drawImage(c,x,dy,c.width*2,c.height*2);
  const fr=Math.floor(T*6)%4,fl=SPR.im[b.kind==='palais'?'f_FlagBlue':'f_FlagRed'];
  for(const[fx,fy]of c._flags){g.fillStyle='#141b1b';g.fillRect(x+fx*2,dy+(fy-12)*2,2,24);g.drawImage(fl,fr*16,0,16,16,x+fx*2+2,dy+(fy-12)*2,32,32)}
  for(const[tx,ty]of c._torch){const fh=4+Math.floor((T*10+tx)%3)*2;g.fillStyle='#ff9554';g.fillRect(x+tx*2-1,dy+ty*2-fh,4,fh);g.fillStyle='#ffe18d';g.fillRect(x+tx*2,dy+ty*2-fh+2,2,fh-2)}
  g.restore();return true}
function drawBuildPix(b,T){return drawKeepPix(b,T)||drawHousePix(b,T)}
/* ---- pierre dessinée dans la palette du pack : remparts, tours de porte, lanternes ---- */
const PK={K:'#141b1b',S1:'#5f7160',S2:'#8d977f',S3:'#abc2bc',R0:'#965340',R1:'#d14b34',R2:'#e46d3a',LT:'#ffe18d',MO:'#56864c'};
function pkBricks(g,x0,y0,x1,y1,seed){g.fillStyle=PK.S1;g.fillRect(x0,y0,x1-x0,y1-y0);for(let row=0,y=y0;y<y1;y+=6,row++){const off=(row+seed)%2?5:0;
    for(let x=x0-off;x<x1;x+=10){const a=Math.max(x0,x+1),b=Math.min(x1,x+10);if(b<=a)continue;g.fillStyle=PK.S2;g.fillRect(a,y+1,b-a,Math.min(5,y1-y-1));g.fillStyle=PK.S3;g.fillRect(a,y+1,b-a,1)}}}
const _stone=new Map();
function stoneCv(key,w,h,draw){let c=_stone.get(key);if(c)return c;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g);_stone.set(key,c);return c}
function isWallObj(tx,ty){const o=WORLD.obj[ty*WORLD.W+tx];return o===14||o===15||o===7}
function drawWallPix(k,tx,ty){const g=ctx,x=tx*TS,y=ty*TS;g.save();g.imageSmoothingEnabled=false;
  const hz=isWallObj(tx-1,ty)||isWallObj(tx+1,ty),below=isWallObj(tx,ty+1),above=isWallObj(tx,ty-1);
  if(k===15){const c=stoneCv('tour',20,44,g2=>{pkBricks(g2,2,16,18,44,1);g2.strokeStyle=PK.K;g2.strokeRect(2.5,16.5,15,27);
      for(let xx=1;xx<18;xx+=5){g2.fillStyle=PK.S2;g2.fillRect(xx,12,3,4);g2.fillStyle=PK.K;g2.fillRect(xx,11,3,1)}
      for(let j=0;j<11;j++){const hw=Math.round(9*(j+1)/11);for(let i=-hw;i<=hw;i++){g2.fillStyle=j%4===3?PK.R0:i<-hw/3?PK.R2:i<hw/2?PK.R1:PK.R0;g2.fillRect(10+i,1+j,1,1)}g2.fillStyle=PK.K;g2.fillRect(10-hw-1,1+j,1,1);g2.fillRect(10+hw+1,1+j,1,1)}
      g2.fillStyle=PK.LT;g2.fillRect(9,26,2,4);g2.fillStyle=PK.K;g2.fillRect(9,34,2,4)});
    g.fillStyle='rgba(20,12,30,.32)';g.beginPath();g.ellipse(x+16,y+30,18,5,0,0,6.28);g.fill();
    g.drawImage(c,x+16-20,y+32-88,40,88);
    if(SPR.ok('f_FlagRed')){const fr=Math.floor(G.time*6+tx)%4;g.fillStyle=PK.K;g.fillRect(x+15,y+32-100,2,14);g.drawImage(SPR.im.f_FlagRed,fr*16,0,16,16,x+17,y+32-100,24,24)}
    g.restore();return}
  if(hz){const c=stoneCv('murH',16,26,g2=>{pkBricks(g2,0,10,16,26,0);g2.fillStyle=PK.S2;g2.fillRect(0,6,16,4);g2.fillStyle=PK.K;g2.fillRect(0,10,16,1);g2.fillRect(0,25,16,1);
      for(const xx of[1,9]){g2.fillStyle=PK.S2;g2.fillRect(xx,1,6,5);g2.fillStyle=PK.S3;g2.fillRect(xx,1,6,1);g2.strokeStyle=PK.K;g2.strokeRect(xx+.5,.5,5,5)}
      for(let i=0;i<4;i++){g2.fillStyle=PK.MO;g2.fillRect((i*5+3)%16,23+(i%2),1,1)}});
    g.drawImage(c,x,y+32-52,32,52)}
  else{const c=stoneCv('murV'+(below?1:0),16,below?16:24,g2=>{const hh=below?16:24;pkBricks(g2,3,0,13,hh,0);g2.fillStyle=PK.S2;g2.fillRect(4,0,8,below?16:12);
      for(let yy=0;yy<(below?16:12);yy+=2){g2.fillStyle=(yy%4)?PK.S3:PK.S2;g2.fillRect(4,yy,8,1)}
      g2.fillStyle=PK.K;g2.fillRect(3,0,1,hh);g2.fillRect(12,0,1,hh);for(let yy=1;yy<(below?16:12);yy+=8){g2.fillStyle=PK.S2;g2.fillRect(1,yy,3,5);g2.fillRect(12,yy,3,5);g2.strokeStyle=PK.K;g2.strokeRect(.5,yy+.5,3,4);g2.strokeRect(12.5,yy+.5,3,4)}
      if(!below){g2.fillStyle=PK.K;g2.fillRect(3,12,10,1);g2.fillRect(3,23,10,1)}});
    g.drawImage(c,x,y-(above?0:8),32,c.height*2)}
  g.restore()}
/* petits objets de ville : tonneaux, caisses, lanternes, rondins, clôture */
const PROP_T={8:[[16,15,1,1],[17,15,1,1]],11:[[19,14,1,1],[20,15,1,1]],12:[[19,14,1,1],[19,15,1,1]]};
function drawPropPix(k,tx,ty){const g=ctx,x=tx*TS,y=ty*TS;
  if(k===10){g.save();g.imageSmoothingEnabled=false;const on=G.night||Sky.lamps;g.fillStyle='rgba(20,12,30,.3)';g.beginPath();g.ellipse(x+16,y+30,7,3,0,0,6.28);g.fill();
    g.fillStyle=PK.K;g.fillRect(x+14,y-6,4,36);g.fillRect(x+10,y-18,12,14);g.fillStyle=on?PK.LT:'#e8d9a0';g.fillRect(x+12,y-16,8,10);g.fillStyle=PK.K;g.fillRect(x+15,y-16,2,10);
    if(on){g.globalCompositeOperation='lighter';const gl=g.createRadialGradient(x+16,y-11,1,x+16,y-11,30);gl.addColorStop(0,'rgba(255,200,110,.35)');gl.addColorStop(1,'rgba(255,200,110,0)');g.fillStyle=gl;g.fillRect(x-14,y-41,60,60)}
    g.restore();return true}
  const L=PROP_T[k];if(!L||!SPR.ok('t_TilesetHouse'))return false;g.save();g.imageSmoothingEnabled=false;
  g.fillStyle='rgba(20,12,30,.3)';g.beginPath();g.ellipse(x+16,y+29,13,4,0,0,6.28);g.fill();
  L.forEach(([cx,cy],i)=>g.drawImage(SPR.im.t_TilesetHouse,cx*16,cy*16,16,16,x+(L.length>1?i*12-6:0)+2,y+2-(i%2)*4,28,28));g.restore();return true}

