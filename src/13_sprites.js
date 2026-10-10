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
/* halo chaud pré-calculé (évite de recréer un dégradé à chaque image) */
let _glow=null;
function drawGlow(g,x,y,r,a){if(!_glow){_glow=document.createElement('canvas');_glow.width=_glow.height=64;const q=_glow.getContext('2d'),gl=q.createRadialGradient(32,32,1,32,32,32);
    gl.addColorStop(0,'rgba(255,195,105,1)');gl.addColorStop(1,'rgba(255,195,105,0)');q.fillStyle=gl;q.fillRect(0,0,64,64)}
  g.save();g.globalCompositeOperation='lighter';g.globalAlpha=a;g.imageSmoothingEnabled=true;g.drawImage(_glow,x-r,y-r,r*2,r*2);g.restore()}
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
  10:'cobble',12:'planks',13:'field'};
const GROUND_FX={11:'rgba(40,110,105,.28)',9:'rgba(255,240,200,.18)',3:'rgba(110,50,30,.14)'};
const _gpat={};
function groundTile(g,v,tx,ty,px,py){const L=GROUND_T[v];if(!L)return false;let src,cx,cy;
  if(v===12){src=SPR.im.t_TilesetWater;const C=[[1,13],[1,13],[1,13],[5,13],[6,13]];[cx,cy]=C[Math.floor(hash2(tx,ty,77)*C.length)]}
  else if(v===13){src=SPR.im.t_Field;const row=Math.max(0,((WORLD.fieldv&&WORLD.fieldv[ty*WORLD.W+tx])||1)-1),F=(x,y)=>wT(x,y)===13;
    const ax=F(tx-1,ty)?(F(tx+1,ty)?1:2):0,ay=F(tx,ty-1)?(F(tx,ty+1)?1:2):0;cx=ax;cy=row*3+ay}
  else if(L==='cobble'){src=SPR.im.t_InteriorFloor;const C=[[1,13],[1,13],[1,13],[1,13],[5,13],[6,14],[1,14]];[cx,cy]=C[Math.floor(hash2(tx,ty,77)*C.length)]}
  else{src=SPR.im.t_TilesetFloor;[cx,cy]=L[Math.floor(hash2(tx,ty,77)*L.length)]}
  g.drawImage(src,cx*16,cy*16,16,16,px,py,TS,TS);if(GROUND_FX[v]){g.fillStyle=GROUND_FX[v];g.fillRect(px,py,TS,TS)}return true}
function groundPat(g,v){if(_gpat[v])return _gpat[v];const c=document.createElement('canvas');c.width=c.height=TS*2;const cg=c.getContext('2d');cg.imageSmoothingEnabled=false;
  for(let j=0;j<2;j++)for(let i=0;i<2;i++)groundTile(cg,v,i+v*3,j,i*TS,j*TS);return _gpat[v]=g.createPattern(c,'repeat')}
function pixGround(g,x0,y0){if(!SPR.ok('t_TilesetFloor')||!SPR.ok('t_InteriorFloor')||!SPR.ok('t_TilesetWater')||!SPR.ok('t_Field'))return false;g.imageSmoothingEnabled=false;
  for(let ty=y0;ty<y0+CHK;ty++)for(let tx=x0;tx<x0+CHK;tx++){const v=wT(tx,ty),px=(tx-x0)*TS,py=(ty-y0)*TS;
    if(!groundTile(g,v,tx,ty,px,py)){const n=vnoise(tx/7,ty/7,4)-.5;g.fillStyle=shade(TBASE[v]||TBASE[2],isWater(v)?n*.12:n*.16);g.fillRect(px,py,TS+.5,TS+.5)}}
  // bords arrondis entre terrains, remplis avec la texture du terrain qui déborde
  const PRIO=[3,9,2,4,11,6,7];   // planches et champs : bords nets, pas de débordement
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
function drawTreePix(k,tx,ty,alpha){if(k>=16&&k<=20&&drawTownObj(k,tx,ty))return true;if(k===14||k===15||k===7){drawWallPix(k,tx,ty);return true}if((k===8||k===10||k===11||k===12)&&drawPropPix(k,tx,ty))return true;const L=TREE_T[k];if(!L||!SPR.ok('t_TilesetNature'))return false;const g=ctx,x=(tx+.5)*TS,y=(ty+1)*TS,h=hash2(tx,ty,9);
  const[cx,cy]=L[Math.floor(h*L.length)];g.save();g.imageSmoothingEnabled=false;if(alpha<1)g.globalAlpha=alpha;
  g.fillStyle='rgba(20,12,30,.3)';g.beginPath();g.ellipse(x+4,y-2,22,6,0,0,6.28);g.fill();
  const sw=Math.round(Math.sin(G.time*1.1+tx*.7+ty)*.6);g.drawImage(SPR.im.t_TilesetNature,cx*16,cy*16,32,32,x-32+sw,y-64,64,64);g.restore();return true}
/* ---- maisons de ville (TilesetHouse) : [colonne, ligne, largeur, hauteur] en cases de 16 px ---- */
// découpes vérifiées une à une : bâtiments entiers, rien de rogné
const HOUSE_T={auberge:[[12,0,4,3]],auberge_tarkin:[[25,7,4,5]],marchand:[[16,0,3,3]],forge:[[29,4,4,4]],temple:[[25,14,4,5]],statue:[[3,15,2,2]],
  maison:[[0,0,4,3],[4,0,4,3],[8,0,4,3],[0,7,3,3],[3,7,3,3]]};
const HOUSE_SPR={orange:[0,0,4,3],beige:[4,0,4,3],orange2:[8,0,4,3],rouge:[12,0,4,3],boutique:[16,0,3,3],bois:[25,14,4,5],chaume:[25,7,4,5],four:[29,4,4,4],
  hutte:[0,7,3,3],paille:[3,7,3,3],igloo:[0,11,3,3],statue:[3,15,2,2],torii:[0,5,3,2],tente:[4,0,3,3,'t_Camp'],tente2:[7,0,3,3,'t_Camp'],tente3:[10,0,3,3,'t_Camp']};
/* enseignes des maisons (16×16, palette du pack) : potence en fer et planche peinte, posées à droite de la porte */
const SIGN_PAL={'k':'#141b1b','i':'#4e484a','I':'#8d977f','W':'#7a4a2a','w':'#5a341e','h':'#a5704a','f':'#f4f1e6','y':'#f0c95a','Y':'#c9952e','o':'#965340','b':'#e0b48a','B':'#fce2ca','n':'#b8784a','c':'#f0c95a','C':'#c9952e','a':'#5f7160','A':'#8d977f','L':'#abc2bc','r':'#e3f1f5','t':'#e0b48a','s':'#ffe18d'};
const SIGN_PX={
  auberge:['kkkkkkkkkkkkkkk.','kIIIIIIIIIIIIIk.','kiiiiiiiiiiiiik.','kkkkkkkkkkkkkkk.','...k.......k....','...k.......k....','.kkkkkkkkkkkkk..','.khhhffffhhhhk..','.kWWffffffWWWk..','.kWWyyyyyykkWk..','.kWWyYyyyyWkWk..','.kWWyYyyyyWkWk..','.kWWyyyyyykkWk..','.kWWooooooWWWk..','.kwwwwwwwwwwwk..','.kkkkkkkkkkkkk..'],
  marchand:['kkkkkkkkkkkkkkk.','kIIIIIIIIIIIIIk.','kiiiiiiiiiiiiik.','kkkkkkkkkkkkkkk.','...k.......k....','...k.......k....','.kkkkkkkkkkkkk..','.khhhhkkhhhhhk..','.kWWWnkknWWWWk..','.kWWWWbbWWWWWk..','.kWWbbBbbbWWWk..','.kWbbBbbbbbcck..','.kWbbbbbbbcCck..','.kWWnnnnnnWcck..','.kwwwwwwwwwwwk..','.kkkkkkkkkkkkk..'],
  forge:['kkkkkkkkkkkkkkk.','kIIIIIIIIIIIIIk.','kiiiiiiiiiiiiik.','kkkkkkkkkkkkkkk.','...k.......k....','...k.......k....','.kkkkkkkkkkkkk..','.khhhhAAAhshhk..','.kWWWWArAWWsWk..','.kWWWWWtWsWWWk..','.kWWLLLLLLLWWk..','.kWAAAAAAAAAWk..','.kWWWWaaaWWWWk..','.kWWWaaaaaWWWk..','.kwwwwwwwwwwwk..','.kkkkkkkkkkkkk..']};
const _sign={};
function signCanvas(k){if(_sign[k])return _sign[k];const G2=SIGN_PX[k];if(!G2)return null;const c=document.createElement('canvas');c.width=c.height=16;const q=c.getContext('2d');
  G2.forEach((r,y)=>{for(let x=0;x<16;x++){const ch=r[x];if(ch==='.')continue;q.fillStyle=SIGN_PAL[ch];q.fillRect(x,y,1,1)}});return _sign[k]=c}
/* la maison au toit de chaume du pack n'a pas de porte : on lui greffe celle de la maison en bois */
let _chaume=null;
function chaumeCanvas(){if(_chaume)return _chaume;const T=SPR.im.t_TilesetHouse;const c=document.createElement('canvas');c.width=64;c.height=80;const q=c.getContext('2d');
  q.drawImage(T,25*16,7*16,64,80,0,0,64,80);q.drawImage(T,25*16+15,14*16+63,20,17,22,63,20,17);return _chaume=c}
function drawHousePix(b,T){if(b.kind==='deco'&&drawDecoPix(b,T))return true;const L=b.spr&&HOUSE_SPR[b.spr]?[HOUSE_SPR[b.spr]]:((b.town==='tarkin'&&HOUSE_T[b.kind+'_tarkin'])||HOUSE_T[b.kind]);if(!L||!SPR.ok('t_TilesetHouse'))return false;const g=ctx,x=b.x*TS,y=b.y*TS,w=b.w*TS,h=b.h*TS;
  const[cx,cy,cw,chh,sk]=L[Math.floor(hash2(b.x,b.y,3)*L.length)];const W=cw*32,H=chh*32,dx=x+w/2-W/2,dy=y+h-H+4;const SRC=SPR.im[sk||'t_TilesetHouse'];if(sk&&!SPR.ok(sk))return false;
  g.save();g.imageSmoothingEnabled=false;g.fillStyle='rgba(20,12,30,.32)';g.fillRect(dx+8,y+h-2,W-4,9);
  if(!sk&&cx===25&&cy===7&&cw===4&&chh===5)g.drawImage(chaumeCanvas(),0,0,64,80,dx,dy,W,H);else g.drawImage(SRC,cx*16,cy*16,cw*16,chh*16,dx,dy,W,H);
  {const kd=b.act&&b.act.startsWith('house:')?b.act.split(':')[1]:null,sg=kd&&signCanvas(kd);if(sg)g.drawImage(sg,0,0,16,16,dx+W/2+16,dy+H-34,32,32)}
  if(typeof Vitrine!=='undefined'&&Vitrine.lit&&Vitrine.lit(b))drawGlow(g,x+w/2,y+h-8,40,.35);
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
    if(on)drawGlow(g,x+16,y-11,30,.35);
    g.restore();return true}
  const L=PROP_T[k];if(!L||!SPR.ok('t_TilesetHouse'))return false;g.save();g.imageSmoothingEnabled=false;
  g.fillStyle='rgba(20,12,30,.3)';g.beginPath();g.ellipse(x+16,y+29,13,4,0,0,6.28);g.fill();
  L.forEach(([cx,cy],i)=>g.drawImage(SPR.im.t_TilesetHouse,cx*16,cy*16,16,16,x+(L.length>1?i*12-6:0)+2,y+2-(i%2)*4,28,28));g.restore();return true}


/* ---- décor bâti des villes : feu de camp, phare, tour de guet, moulins, bateaux, grue ---- */
function drawDecoPix(b,T){const g=ctx,x=b.x*TS,y=b.y*TS,w=b.w*TS,h=b.h*TS,cx=x+w/2,by=y+h,S=b.spr;g.save();g.imageSmoothingEnabled=false;
  const sh=(rx)=>{g.fillStyle='rgba(20,12,30,.3)';g.beginPath();g.ellipse(cx,by-3,rx,6,0,0,6.28);g.fill()};
  const glow=(gx,gy,r,a)=>drawGlow(g,gx,gy,r,a);
  if(S==='feu'){for(let i=0;i<10;i++){const a=i/10*6.28,px=cx+Math.cos(a)*26,py=by-14+Math.sin(a)*12;g.fillStyle=PK.S2;g.fillRect(px-7,py-5,14,10);g.strokeStyle=PK.K;g.strokeRect(px-6.5,py-4.5,13,9)}
    g.fillStyle=PK.R0;g.fillRect(cx-16,by-18,32,6);const f=Math.sin(T*9)*3,f2=Math.cos(T*7)*2;
    for(const[col,ww,hh]of[[PK.R1,20,46+f],[PK.R2,15,36+f2],[PK.LT,8,22+f]]){g.fillStyle=col;g.beginPath();g.moveTo(cx-ww,by-14);g.lineTo(cx+f2*.6,by-14-hh);g.lineTo(cx+ww,by-14);g.closePath();g.fill()}
    glow(cx,by-30,110,.32);if(Math.random()<.12&&parts.length<500)parts.push({k:'smoke',x:cx,y:by-60,vx:4,vy:-18,life:2.4,max:2.4,r:7});g.restore();return true}
  if(S==='phare'||S==='guet'){const hh=S==='phare'?96:120,tw=36,tx=cx-tw/2,top=by-hh;sh(24);pkBricks(g,tx,top+20,tx+tw,by,1);g.strokeStyle=PK.K;g.lineWidth=2;g.strokeRect(tx,top+20,tw,hh-20);
    for(let xx=tx-2;xx<tx+tw;xx+=9){g.fillStyle=PK.S2;g.fillRect(xx,top+12,6,8);g.strokeRect(xx,top+12,6,8)}
    for(let j=0;j<16;j++){const hw=Math.round(22*(j+1)/16);g.fillStyle=j%5===4?PK.R0:PK.R1;g.fillRect(cx-hw,top-6+j,hw*2,1)}
    const on=S==='phare'||G.night||Sky.lamps;g.fillStyle=on?PK.LT:PK.K;g.fillRect(cx-6,top+24,12,12);g.strokeRect(cx-6,top+24,12,12);
    for(let yy=top+48;yy<by-14;yy+=22){g.fillStyle=PK.K;g.fillRect(cx-2,yy,4,8)}
    if(on)glow(cx,top+30,S==='phare'?150:90,.4);
    if(SPR.ok('f_FlagBlue')){const fr=Math.floor(T*6)%4;g.fillStyle=PK.K;g.fillRect(cx-1,top-30,2,24);g.drawImage(SPR.im.f_FlagBlue,fr*16,0,16,16,cx+1,top-30,24,24)}
    g.restore();return true}
  if(S==='moulin'){if(!SPR.ok('a_Mill')){g.restore();return false}sh(26);const bw=40,bh=64,bx=cx-bw/2,top=by-bh;
    g.fillStyle='#eecf9b';g.beginPath();g.moveTo(bx,by);g.lineTo(bx+8,top+14);g.lineTo(bx+bw-8,top+14);g.lineTo(bx+bw,by);g.closePath();g.fill();g.strokeStyle=PK.K;g.lineWidth=2;g.stroke();
    g.fillStyle=PK.K;g.fillRect(cx-7,by-22,14,22);for(let j=0;j<16;j++){const hw=Math.round(20*(j+1)/16);g.fillStyle=j%5===4?PK.R0:PK.R1;g.fillRect(cx-hw,top-2+j,hw*2,1)}
    const fr=Math.floor(T*5)%4;g.drawImage(SPR.im.a_Mill,fr*64,0,64,64,cx-64,top-50,128,128);g.restore();return true}
  if(S==='moulinEau'){if(!SPR.ok('a_Watermill')){g.restore();return false}const fr=Math.floor(T*5)%3;g.drawImage(SPR.im.a_Watermill,fr*34,0,34,36,cx-34,by-72,68,72);g.restore();return true}
  if(S==='bateau'||S==='barque'){if(!SPR.ok('v_Boat')){g.restore();return false}const bob=Math.round(Math.sin(T*1.6+b.x)*2),fl=hash2(b.x,b.y,5)<.5;
    g.save();g.translate(cx,by-16+bob);if(fl)g.scale(-1,1);g.drawImage(SPR.im.v_Boat,-80,-32,160,64);
    if(S==='bateau'&&SPR.ok('v_Sail'))g.drawImage(SPR.im.v_Sail,-14,-110,60,86);g.restore();g.restore();return true}
  if(S==='grue'){if(!SPR.ok('v_Crane')){g.restore();return false}sh(20);g.drawImage(SPR.im.v_Crane,cx-33,by-72,66,72);g.restore();return true}
  g.restore();return false}
/* objets 16 palissade, 17 rondins, 18 haie, 19 meule de foin, 20 filet de pêche */
function drawTownObj(k,tx,ty){const g=ctx,x=tx*TS,y=ty*TS;g.save();g.imageSmoothingEnabled=false;
  if(k===16){const O=WORLD.obj,W=WORLD.W,isP=(a,b)=>O[b*W+a]===16,hz=isP(tx-1,ty)||isP(tx+1,ty);
    const c=stoneCv(hz?'palH':'palV',16,24,q=>{q.fillStyle=PK.K;if(hz){for(let i=0;i<4;i++){const px=i*4;q.fillStyle='#bd7959';q.fillRect(px,4,4,15);q.fillStyle='#d3865f';q.fillRect(px+1,4,1,13);q.fillRect(px,1,4,3);q.fillStyle=PK.K;q.fillRect(px,0,1,19)}
        q.fillStyle='#965340';q.fillRect(0,9,16,1);q.fillRect(0,15,16,1)}
      else{q.fillStyle='#bd7959';q.fillRect(6,1,5,23);q.fillStyle=PK.K;q.fillRect(5,1,1,23);q.fillRect(11,1,1,23);q.fillStyle='#965340';for(let yy=2;yy<24;yy+=4)q.fillRect(6,yy,5,1)}});
    g.drawImage(c,x,y-16,32,48);g.restore();return true}
  const C={17:['t_Camp',0,0,2,1],18:['t_TilesetNature',1,10,1,1],19:['t_Camp',4,3,1,1],20:['v_FishNetFull',0,0,2,2]}[k];if(!C||!SPR.ok(C[0])){g.restore();return false}
  const[src,cx,cy,cw,chh]=C;const im=SPR.im[src];const sw=k===20?im.width:cw*16,shh=k===20?im.height:chh*16;
  if(k!==20){g.fillStyle='rgba(20,12,30,.3)';g.beginPath();g.ellipse(x+sw,y+29,sw-2,4,0,0,6.28);g.fill()}
  g.drawImage(im,cx*16,cy*16,sw,shh,x,y+32-shh*2,sw*2,shh*2);g.restore();return true}

/* boss en pixel art 32×32, dans la palette et le contour (#141b1b) du pack ; une lettre = une couleur, « . » = vide */
const BOSS_PX=[
  {// Sinthara
   au:'rgba(160,200,255,.28)',p:{'H':'#2a1a22','h':'#4a2e3e','S':'#fce2ca','s':'#f2ad7d','r':'#e8a39a','w':'#e3f1f5','L':'#e8e6f2','m':'#b9bdd2','n':'#7d839a','A':'#c9cbe0','a':'#8d93a8','C':'#1f3358','c':'#2e4a78','G':'#cfe2ff','Y':'#c9a23a','y':'#f0c95a','D':'#3b3643','k':'#141b1b'},
   g:['................................','..............k..k..............','.............kLkkLk.............','........kkkk.kLmmLk.kkkk........','......kkHHHHkkLLLLkkHHHHkk......','.....kHHhhhHHLLmmLLHHhhhHHk.....','....kHHhHHHHHHLmmLHHHHHHhHHk....','....kHhHHHHHHHHHHHHHHHHHHhHk....','...kHHHHHSSSSSSSSSSSSSSHHHHHk...','...kHHHHSSSSSSSSSSSSSSSSHHHHk...','...kHHHSSSSSSSSSSSSSSSSSSHHHk...','...kHHHSSkkSSSSSSSSSSkkSSHHHk...','...kHHHSSkwSSSSSSSSSSwkSSHHHk...','...kHHHSrSSSSSSSSSSSSSSrSHHHk...','...kHHHHSSSSSSSSSSSSSSSSHHHHk...','...kHHHHHSSSSSSSSSSSSSSHHHHHk...','..kHHHHHHHHHssssssssHHHHHHHHHk..','..kHHHHkkaaAAAAAAAAAAaakkHHHHk..','.kLLLLHkCaAAAAAAAAAAAAakYyYkLLk.','kLLmmmLLCaAAAAAGGAAAAAakyYykmLLk','kLmmmmmLCaAAAAGGGGAAAAaCkLmkmmLk','knmmmmnLCaAAAAAGGAAAAAaCkLmkmmnk','.knnnnnCCaaAAAAAAAAAAaaCkLmknnk.','..kkCcCCYyYYYYYYYYYYYYyYkLmkkk..','..kCCcCAAAAaAAAAAAAAaAAAkLmkCk..','..kCCcAAAAAaAAAAAAAAaAAAkLmkCk..','.kCCcCaAAAAaAAAAAAAAaAAAkLmkCCk.','.kCCcCaaaaaaaaaaaaaaaaaakLmkCCk.','.kCCCkknnnnnkkkkkkkknnnnkLmkCCk.','.kCCk.knnnnnk......knnnnnkkkCCk.','..kk..kDDDDDk......kDDDDDkk.kk..','.......kkkkk........kkkkk.......']},
  {// Abhorash
   au:'rgba(220,40,40,.32)',p:{'R':'#8e1a24','r':'#b8323c','P':'#e3e0e6','e':'#ff3030','E':'#ffb0a0','w':'#ffffff','W':'#3a0d12','q':'#6e1c2a','d':'#5a0f16','Y':'#c9a23a','D':'#2a1418','Z':'#3a0d12','z':'#c9a23a','L':'#e3f1f5','m':'#9ba7aa','k':'#141b1b'},
   g:['................................','..........kkkkkkkkkkkk..........','k.......kkRRRRRRRRRRRRkk.......k','Wk....kkRRrrRRRRRRRRrrRRkk....kW','WWk..kRRrrRRRRRRRRRRRRrrRRk..kWW','WqWkkkRrRRRRRRRRRRRRRRRRrRkkkWqW','WqqWkkRRRRRRRRRRRRRRRRRRRRkkWqqW','WqqqWkRRRRRRRRRRRRRRRRRRRRkWqqqW','WqqqWkRRRPPPPPPPPPPPPPPRRRkWqqqW','WqqqWkRRRPPPPPPPPPPPPPPRRRkWqqqW','WqqqWkRRRPPeePPPPPPeePPRRRkWqqqW','WWqqWkRRRPPeEPPPPPPEePPRRRkWqqWW','WkWqWkRRRPPPPPPPPPPPPPPRRRkWqWkW','k.kWWkRRRPPPkwkPPkwkPPPRRRkWWk.k','...kWkRRRRPPPPPPPPPPPPRRRRkWk...','....kkRRRRRRRRRRRRRRRRRRRRkk....','..kkYYYRRRRRRRRRRRRRRRRRZZZYkk..','.kYYYRRRRRRRRRRRRRRRRRRRZzZYYYk.','.kYRRRRRRRrRRRRRRRRRRrRRZZZRRYk.','.kRRRRRRRrRRRRRRRRRRRRrkkkkkRRk.','.kRRRdRRRrRRRRRRRRRRRRrRLLmRRRk.','..kddddRRRRRRRRRRRRRRRRRLLmddk..','..kdddRRRRRRRRRRRRRRRRRRLLmddk..','..kdddYYYYYYYYYYYYYYYYYYLLmddk..','...kddddRRRRrRRRRRRrRRRRLLmdk...','...kdddRRRRRrRRRRRRrRRRRLLmdk...','...kddRRRRRRrRRRRRRrRRRRLLmdk...','..kdddrrrrrrrrrrrrrrrrrrLLmddk..','..kdddkkDDDDDkkkkkkDDDDDLLmddk..','..kddk.kDDDDDk....kDDDDDkLkddk..','...kk..kDDDDDk....kDDDDDkLkkk...','........kkkkk......kkkkk.k......']},
  {// chef de guerre orc
   au:'rgba(255,120,40,.22)',p:{'B':'#e8e1cc','b':'#b9ae90','M':'#4a4a56','m':'#7a7a8a','n':'#2e2e38','G':'#7aa84a','g':'#5f8a3a','R':'#ff4a2a','r':'#ffd0a0','T':'#f4ecd6','L':'#5a3b1e','l':'#8a5a2b','N':'#8a5a2b','O':'#e8e1cc','o':'#b9ae90','D':'#3a2a1a','W':'#8a5a2b','X':'#b9b6c6','k':'#141b1b'},
   g:['...k........................k...','..kBk......................kBk..','..kBBk....................kBBk..','..kbBBk...kkkkkkkkkkkk...kBBbk..','...kbBBkkkMMMMMMMMMMMMkkkBBbk...','....kbBBMMmmMMMMMMMMmmMMBBbk....','.....kBMMmMMMMMMMMMMMMmMMBk.....','.....kMMMMMMMMMMMMMMMMMMMMk.....','....kMMMMMMMMMMMMMMMMMMMMMMk....','....knnnnnnnnnnnnnnnnnnnnnnk....','....kGGGGGGGGGGGGGGGGGGGGGGk....','...kGGGGGRRGGGGGGGGGGRRGGGGGk...','...kGGgGGRrGGGGGGGGGGrRGGgGGk...','...kGGGGGGGGGGGGGGGGGGGGGGGGk...','...kGGGGGTGGGGGGGGGGGGTGGGGGk...','...kGgGGgTTggggggggggTTgGGgGk...','..kkkGggggTggggggggggTggggGkkk..','.kGGGkkLLLLLLLLLLLLLLLLLLkkGGGk.','kGGgGGLLlLLLLLLLLLLLLLLlLLGGgGGk','XXXggGLLLlLLLLLLLLLLLLlLLLGggXXX','XXXXWgLLLLLLLLLLLLLLLLLLLLgWXXXX','XXXgWLLLLLLLLLLLLLLLLLLLLLLWgXXX','XXggWLLLLLLLLLLLLLLLLLLLLLLWggXX','kkkLWNNNNNNNNNNNNNNNNNNNNNNWLkkk','..kLWNOoNNOoNNOooONNoONNoONWLk..','..kLWNooNNooNNooooNNooNNooNWLk..','...kLLLLLLLLLLLLLLLLLLLLLLLLk...','....kLLLLLLLLLLLLLLLLLLLLLLk....','.....kDDDDkkkDDDDDDkkkDDDDk.....','.....kDDDDk.kDDDDDDk.kDDDDk.....','....kDDDDDk.kDDDDDDk.kDDDDDk....','.....kkkkk...kkkkkk...kkkkk.....']},
  {// Haut-Adepte
   au:'rgba(176,103,232,.35)',p:{'V':'#4a2a6e','v':'#6b3f96','U':'#3b2160','u':'#5a3488','Q':'#2a1747','q':'#432870','Y':'#c9a23a','F':'#f0c8ff','f':'#d88cff','o':'#b067e8','O':'#d88cff','W':'#ffffff','T':'#5a3b1e','s':'#2e1a45','k':'#141b1b'},
   g:['...............kk.........koook.','..............kVVk.......koOOOok','.............kVVVVk......kOOWOOk','............kVVvvVVk.....koOOOok','...........kVVvVVvVVk.....koook.','..........kVVvVVVVvVVk.....kTk..','.........kVVvVVVVVVvVVk....kTk..','........kVVvVVVVVVVVvVVk...kTk..','.......kVVVVVVVVVVVVVVVVk..kTk..','......kVVVvVVVVVVVVVVvVVVk.kTk..','.....kVVVVVVVVVVVVVVVVVVVVkkTk..','.....kVVVVkkkkkkkkkkkkVVVVkkTk..','.....kVVVkkkkkkkkkkkkkkVVVkkTk..','.....kVVVkkkFfkkkkfFkkkVVVkkTk..','.....kVVVkkkffkkkkffkkkVVVkkTk..','.....kVVVVkkkkkkkkkkkkVVVVkkTk..','....kVVVVVVkkkkkkkkkkVVVVVVkTk..','...kUUVVVVVVVVVVVVVVVVVVVVUsTk..','..kUUuUUUUUUUUUYYUUUUUUUUUssTk..','..kUuUUUUUUUUUUYYUUUUUUUUUUsTk..','..kUuUUUUUUUUUUYYUUUUUUUUUUuTk..','..kUuUUUUUUUUUUYYUUUUUUUUUUuTk..','..kUUUUUUUUUUUUYYUUUUUUUUUUUTk..','.kQQQQQQQQQQQQQYYQQQQQQQQQQQTQk.','.kQQQqQQQQQQQQQYYQQQQQQQQQqQTQk.','.kQQqQQQQQQQQQQYYQQQQQQQQQQqTQk.','kQQQqQQQQQQQQQQYYQQQQQQQQQQqTQQk','kQQqQQQQQQQQQQQYYQQQQQQQQQQQTQQk','kQQqQQQQQQQQQQQYYQQQQQQQQQQQTQQk','QQQQQQQQQQQQQQQYYQQQQQQQQQQQTQQQ','QQkQQQkQQQQkQQQQQQQQkQQQQkQQTkQQ','kk.kkk.kkkk.kkkkkkkk.kkkk.kkk.kk']},
  {// Amarath
   au:'rgba(120,20,60,.4)',p:{'W':'#bfb4d4','w':'#ffffff','I':'#f4eef2','i':'#c9bfd2','P':'#f4eef2','e':'#ff3060','E':'#ffb0c8','x':'#e6e0f0','H':'#2a1420','h':'#4a2438','N':'#2a1420','Y':'#c9a23a','B':'#14080f','b':'#2e1626','C':'#5a0f22','c':'#7e1a34','o':'#c85090','O':'#f080b8','s':'#c8aaff','k':'#141b1b'},
   g:['................................','..........kkkkkkkkkkkk..........','........kkWWWWWWWWWWWWkk........','.......kWWWxxWWWWWWxxWWWk.......','......kWWxWWWWWWWWWWWWxWWk......','.....kWWxWWWWWWWWWWWWWWxWWk.....','..k..kWWWWWWWWWWWWWWWWWWWWk..k..','.kIkkkWWWWPPPPPPPPPPPPWWWWkkkIk.','.kIIikWWWPPPPPPPPPPPPPPWWWkiIIk.','..kIIiWWWPPPPPPPPPPPPPPWWWiIIk..','...kIIWWWPPeePPPPPPeePPWWWIIk...','....kIWWWPPeEPPPPPPEePPWWWIk....','.....kWWWPPPPPPPPPPPPPPWWWk.....','.....kWWWPPPPPPPPPPPPPPWWWk.....','.....kWWWWPPPkwkkwkPPPWWWWk.....','....kkWWWWWPPPPPPPPPPWWWWWkk....','...kHHWWWWWWHHHHHHHHWWWWWWHHk...','..kHhHWWWWWHHHHHHHHHHWWWWWHhHk..','.kHHhHWWWWHHHHHHHHHHHHWWWWHhHHk.','.kHhhHHWWWNNNNNNNNNNNNWWWHHhhHk.','.kBBBBBBWWYYYYYYYYYYYYWWBBBBBBk.','.kBBBBBBBWNNCCCCCCCCNNWBBBBBBBk.','.kBBbBBBBBBBCCcCCcCCBBBBBsBbBBk.','.kBBbBBBBBBBCCcCCcCCBBBBBsBbBBk.','.kBBbBBBBBBBCCCCCCCCBBBBkoOOkBk.','kBBbBBBBBBBBCCcCCcCCBBBBOWWOsBBk','kBBbBBBBBBBBCCcCCcCCBBBBOWWObsBk','BBBBBBBBBBBBCCCCCCCCBBBBkoOokBsB','BBBBBBBBBBBBCCCCCCCCBBBBBsBBBBBs','BBkBBBBkBBBBBBkBBkBBBBBBksBBBkBB','kk.kkkk.kkkkkk.kk.kkkkkk.kkkk.kk','................................']},
  {// Reinald
   au:'rgba(20,10,30,.55)',p:{'O':'#1d3a2a','o':'#2e5a3e','H':'#120c16','h':'#2a2034','P':'#e2d6d8','e':'#ff3a3a','E':'#ffb0a0','A':'#24262e','a':'#3a3d48','s':'#d8dbe6','G':'#e8ebf4','g':'#9ba7aa','B':'#4a4d58','D':'#16101c','x':'#2a1d14','X':'#120c16','v':'#2a1a3a','V':'#7a4cb0','k':'#141b1b'},
   g:['............kkkkkkkk............','..........kkOOOOOOOOkk..........','........kkOOOOOOOOOOOOkk........','.......kOOOoOOOOOOOOoOOOk.......','......kOOoOOOOOOOOOOOOoOOk......','.....kOOoOOOOOOOOOOOOOOoOOk.....','.....kOOOHHHHHHHHHHHHHHOOOk.....','....kOOOHHHhHHHHHHHHhHHHOOOk....','....kOOHHHHHHhHHHHhHHHHHHOOk....','....kOOHHPPHHPPPPPPHHPPHHOOk....','....kOOHPPPPPPPPPPPPPPPPHOOk....','....kOOHPPPeePPPPPPeePPPHOOk....','....kOOHPPPeEPPPPPPEePPPHOOk....','....kOOHPPPPPPPPPPPPPPPPHOOk....','....kOOHHPPPPPPPPPPPPPPHHOOk....','....kOOOHHPPPPPPPPPPPPHHOOOk....','...kOOOOOOAAAAAAAAAAAAOOOOOOk...','..kOOoOOAAAaAAsAAsAAaAAAOOoOOk..','..kOOoOAAAaAAAAssAAAAaAAAOoOOk..','..kOoOOAAaAAAAAAAAAAAAakxkOoOk..','..kOoOAAAaAAAAAGGAAAAAkXxXkoOk..','..kOOOAAAAAAAAGggGAAAAAkVvkOOk..','..kOoOAAAAAAAAAGGAAAAAAkVvkoOk..','..kOoOBBBBBBBBBBBBBBBBBkVvkoOk..','..kOOOAAAAAaAAAAAAAAaAAkVvkOOk..','..kOoOAAAAAaAAAAAAAAaAAkVvkoOk..','..kOOOAAAAAaAAAAAAAAaAAAkVkOOk..','..kOOOkDDDDDkkkkkkkkDDDDkkOOOk..','..kOOkkDDDDDk......kDDDDDkkOOk..','..kOk.kDDDDDk......kDDDDDk.kOk..','...k..kkkkkkk......kkkkkkk..k...','.......kkkkk........kkkkk.......']},
];
const _bossC=[];
function bossSheet(v){let c=_bossC[v];if(c)return c;const B=BOSS_PX[v];if(!B)return null;
  c=document.createElement('canvas');c.width=c.height=34;const q=c.getContext('2d');   // 1 px de marge pour le contour de rage
  B.g.forEach((r,y)=>{for(let x=0;x<32;x++){const ch=r[x];if(ch==='.')continue;q.fillStyle=B.p[ch];q.fillRect(x+1,y+1,1,1)}});
  _bossC[v]=c;return c}
/* dessine un boss en pixel art, pieds sous (x,y) ; false si inconnu (l'ancien dessin prend le relais) */
function drawBossPix(g,v,x,y,T,lx,ly,e){const src=bossSheet(v);if(!src)return false;
  const B=BOSS_PX[v],sc=PIX,w=34*sc,fy=Math.round(Math.sin(T*2)*1.5);
  const hp=e&&(e.hpP!=null?e.hpP/100:(e.mhp?e.hp/e.mhp:1)),rage=hp!=null&&hp<.5;
  g.save();
  const au=g.createRadialGradient(x,y-6,4,x,y-6,50);au.addColorStop(0,B.au);au.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=au;g.beginPath();g.arc(x,y-6,50,0,6.28);g.fill();
  g.fillStyle='rgba(20,12,30,.38)';g.beginPath();g.ellipse(x,y+24,22,6,0,0,6.28);g.fill();
  g.imageSmoothingEnabled=false;g.translate(Math.round(x),Math.round(y+27+fy));if(lx<-.2)g.scale(-1,1);
  if(rage){const ol=SPR.outline(src,'#ff4a3a','boss'+v);g.globalAlpha=.55+.4*Math.sin(T*6);g.drawImage(ol,-w/2,-w,w,w);g.globalAlpha=1}
  g.drawImage(src,-w/2,-w,w,w);g.restore();return true}
