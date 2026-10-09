/* ================= Donjons : des lieux de l'histoire, plus des caves ================= */
// tuiles : 0 sol, 1 mur/décor plein, 2 grille, 3 sortie, 4 plaque, 5 piques, 6 objet solide, 7 lave (bloque la marche, pas les tirs)
const DSTYLE={
  rempart:{floor:'pave',wall:'rempart',dark:0},
  salle:{floor:'salle',wall:'salle',dark:.14},
  col:{floor:'roche',wall:'falaise',dark:0},
  nain:{floor:'nain',wall:'nain',dark:.1},
  bois:{floor:'herbe',wall:'foret',dark:0},
  tresor:{floor:'tresor',wall:'grotte',dark:.12},
  sentier:{floor:'neige',wall:'falaiseN',dark:0},
  sceaux:{floor:'sceau',wall:'sceau',dark:.26},
  prison:{floor:'prison',wall:'sceau',dark:.3}};
// objectifs par étage
const GOALS={
  levers:{type:'marks',mk:'levier',t:'Lève les trois herses du donjon',one:'Une herse se lève ({n}/{m}).',win:'Les herses sont levées : le donjon de Sinthara est ouvert !',hint:'Le donjon est fermé : lève les trois herses (leviers dorés).'},
  runes:{type:'marks',mk:'rune',t:'Rallume les pierres runiques de Virganth',one:'Une pierre runique se rallume ({n}/{m}).',win:'Les bois s’apaisent : l’antre de Virganth s’ouvre !',hint:'L’antre reste scellé : rallume les pierres runiques.'},
  seals:{type:'marks',mk:'sceau',t:'Pose les quatre pierres sur les sceaux',one:'Un sceau s’illumine ({n}/{m}).',win:'Les quatre sceaux brillent : l’escalier vers la prison s’ouvre !',hint:'L’escalier est scellé : active les quatre sceaux avec ton pendentif.'},
  waves:{type:'waves',mk:'cor',t:'Tiens les portes avec les nains',win:'Les orcs reculent ! Grinmir fait ouvrir les portes de Karaz Ankor.',hint:'Les portes restent closes tant que l’assaut n’est pas repoussé.'},
  key:{type:'key',t:'Prends la clé que garde',hint:'La porte est scellée : il faut la clé que porte '},
  boss:{type:'boss',t:'Bats',hint:'La sortie est scellée : bats '}};

function dunGrid(W,H,seed){const t=new Uint8Array(W*H).fill(1);const R=mulberry(seed>>>0);const occ=new Set();const K=(x,y)=>x+','+y;
  const d={W,H,t,R,objs:[],chests:[],spawns:[],torches:[],marks:[],spikes:[],path:new Uint8Array(W*H),feat:[],cid:0};
  d.inb=(x,y)=>x>0&&y>0&&x<W-1&&y<H-1;d.get=(x,y)=>(x<0||y<0||x>=W||y>=H)?1:t[y*W+x];d.set=(x,y,v)=>{if(d.inb(x,y))t[y*W+x]=v};
  d.rect=(x,y,w,h,v)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)d.set(xx,yy,v??0)};
  d.ell=(cx,cy,rx,ry,v,jit)=>{for(let y=Math.floor(cy-ry-1);y<=cy+ry+1;y++)for(let x=Math.floor(cx-rx-1);x<=cx+rx+1;x++){const k=((x-cx)/rx)**2+((y-cy)/ry)**2;if(k<=1+(jit?(hash2(x,y,seed&255)-.5)*jit:0))d.set(x,y,v??0)}};
  d.path=(pts,wd,mark)=>{for(let i=0;i<pts.length-1;i++){const[a,b]=pts[i],[c,e]=pts[i+1];const n=Math.ceil(Math.hypot(c-a,e-b)*2);for(let k=0;k<=n;k++){const x=a+(c-a)*k/n,y=b+(e-b)*k/n;const w2=wd/2+(R()-.5)*.8;
      for(let yy=Math.floor(y-w2);yy<=y+w2;yy++)for(let xx=Math.floor(x-w2);xx<=x+w2;xx++){if((xx-x)**2+(yy-y)**2<=w2*w2+.5){d.set(xx,yy,0);if(mark&&d.inb(xx,yy))d.path[yy*W+xx]=1}}}}};
  d.isFloor=(x,y)=>d.get(x,y)===0&&!occ.has(K(x,y));
  d.res=(x,y,r)=>{r=r||0;for(let yy=y-r;yy<=y+r;yy++)for(let xx=x-r;xx<=x+r;xx++)occ.add(K(xx,yy))};
  // objet décoratif ; solid = bloque (tuile 6) ; w,h en tuiles
  d.obj=(k,x,y,o)=>{o=o||{};const w=o.w||1,h=o.h||1;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(d.get(xx,yy)!==0||occ.has(K(xx,yy)))return null}
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(o.solid!==false)d.set(xx,yy,6);occ.add(K(xx,yy))}const ob=Object.assign({k,x,y,w,h,s:hash2(x,y,seed&511)},o);d.objs.push(ob);if(o.light)d.torches.push({x:x+(w-1)/2,y:y+h-1,lit:o.light});return ob};
  d.free=(x0,y0,x1,y1,m)=>{for(let k=0;k<80;k++){const x=ri(R,x0,x1),y=ri(R,y0,y1);if(d.isFloor(x,y)&&d.isFloor(x+1,y)&&d.isFloor(x-1,y)&&d.isFloor(x,y+1)&&d.isFloor(x,y-1)){if(m!==false)occ.add(K(x,y));return{x,y}}}return null};
  d.scatter=(k,n,x0,y0,x1,y1,o)=>{for(let i=0;i<n;i++){const p=d.free(x0,y0,x1,y1,false);if(p)d.obj(k,p.x,p.y,o)}};
  d.group=(types,cx,cy,n,rad)=>{for(let i=0;i<n;i++){const p=d.free(cx-rad,cy-rad,cx+rad,cy+rad);if(p)d.spawns.push({type:types[Math.floor(R()*types.length)],x:(p.x+.5)*TS,y:(p.y+.5)*TS})}};
  d.chest=(cx,cy,rad,lk)=>{const p=d.free(cx-rad,cy-rad,cx+rad,cy+rad);if(p)d.chests.push({id:d.cid++,x:p.x,y:p.y,locked:!!lk,vault:false})};
  d.mark=(x,y,o)=>{d.rect(x-1,y-1,3,3,0);d.res(x,y,1);d.marks.push(Object.assign({x,y},o||{}))};
  return d}
function pickMob(spec,R){const tot=spec.mobs.reduce((a,b)=>a+b[1],0);let v=R()*tot;for(const[k,w]of spec.mobs){if((v-=w)<0)return k}return spec.mobs[0][0]}

const LSIZE={everwatch0: [46, 38], everwatch1: [40, 42], karazankor0: [46, 52], karazankor1: [44, 42], antre0: [52, 48], antre1: [42, 40], prison0: [42, 58], prison1: [42, 42], prison2: [38, 40]};
const LAYOUTS={
  // ---------- La forteresse de l'Everwatch ----------
  everwatch0(d,spec){const W=d.W,H=d.H;
    d.rect(6,8,34,22);d.rect(20,29,6,8);d.rect(19,3,8,6);
    d.rect(6,18,9,1,1);d.set(10,18,0);d.set(11,18,0);d.rect(31,18,9,1,1);d.set(35,18,0);d.set(36,18,0);
    d.rect(4,22,3,5);d.rect(39,10,3,5);
    d.obj('caserne',8,9,{w:5,h:3});d.obj('caserne',32,22,{w:5,h:3});d.obj('fontaine',22,17,{w:2,h:2});
    d.obj('ecurie',8,24,{w:4,h:3});
    for(const[x,y]of[[16,10],[29,10],[16,26],[29,26]])d.obj('brasero',x,y,{light:1});
    d.mark(5,24,{});d.mark(40,12,{});d.mark(22,6,{});
    d.res(22,33,2);d.res(22,4,1);
    d.scatter('tonneaux',5,7,9,38,28);d.scatter('caisses',4,7,9,38,28);d.scatter('mannequin',3,17,20,28,28);d.scatter('ratelier',2,7,19,14,28);d.scatter('charrette',2,16,9,30,15);d.scatter('foin',3,7,9,38,28);
    const types=['orc','orc','archer'];for(const[x,y]of[[12,14],[33,13],[12,24],[33,27],[22,23],[22,11]])d.group(types,x,y,3,3);
    const p=d.free(18,9,27,13);if(p)d.spawns.push({type:spec.eliteType,elite:true,x:(p.x+.5)*TS,y:(p.y+.5)*TS});
    d.chest(10,13,2);d.chest(36,25,2,true);d.chest(5,25,1);
    return{style:'rempart',start:[22,34],exit:[22,4],goal:'levers',exitR:{x:6,y:8,w:34,h:22}}},
  everwatch1(d,spec){const W=d.W,H=d.H;
    d.rect(15,32,10,7);d.rect(18,26,4,6);d.rect(8,6,24,20);d.rect(18,2,4,4);d.rect(2,12,5,9);d.rect(33,12,5,9);d.rect(7,15,1,2);d.rect(32,15,1,2);
    d.feat.push({k:'tapis',x:18,y:7,w:4,h:31});
    for(const y of[9,13,17,21])for(const x of[12,27])d.obj('pilier',x,y);
    d.obj('trone',19,6,{w:2,h:1});for(const x of[9,30])for(const y of[8,24])d.obj('brasero',x,y,{light:1});d.obj('brasero',15,33,{light:1});d.obj('brasero',24,33,{light:1});
    d.scatter('ratelier',2,2,12,6,20);d.scatter('tonneaux',2,2,12,6,20);d.scatter('autel',1,33,12,37,20);d.scatter('bougies',2,33,12,37,20,{solid:false});
    for(let k=0;k<4;k++){const p=d.free(2,12,6,20,false);if(p){d.set(p.x,p.y,5);d.spikes.push({x:p.x,y:p.y,ph:k})}}
    d.res(19,35,2);d.res(20,4,1);d.chest(4,14,2,true);d.chest(35,18,2);d.chest(17,35,2);
    d.group(['orc','archer'],19,34,3,3);d.group(['orc','archer'],4,16,2,2);d.group(['archer','slime'],35,16,2,2);
    return{style:'salle',start:[20,37],exit:[20,3],goal:'boss',boss:[20,11],exitR:{x:8,y:6,w:24,h:20}}},
  // ---------- Karaz Ankor ----------
  karazankor0(d,spec){const W=d.W,H=d.H;
    d.path([[23,49],[15,40],[29,31],[18,21],[23,11]],7,true);d.ell(15,40,7,5,0,.4);d.ell(29,31,8,5,0,.4);d.ell(18,21,7,5,0,.4);d.rect(14,4,19,9);
    d.feat.push({k:'portenaine',x:16,y:0,w:15,h:4});
    for(const[cx,cy]of[[15,40],[29,31],[18,21]]){d.obj('tente',cx-4,cy-3,{w:2,h:2});d.obj('tente',cx+3,cy-2,{w:2,h:2});d.obj('feu',cx,cy,{light:1});d.scatter('pieux',3,cx-6,cy-4,cx+6,cy+4);d.scatter('etendard',1,cx-5,cy-3,cx+5,cy+3)}
    d.scatter('roc',10,2,2,W-3,H-3);d.obj('cor',23,8,{solid:false});d.obj('feu',16,6,{light:1});d.obj('feu',30,6,{light:1});
    d.res(23,48,2);d.res(23,4,1);
    d.group(['orc','orc','archer'],15,40,4,4);d.group(['orc','bat','archer'],29,31,4,4);d.group(['orc','orc','archer'],18,21,4,4);
    d.chest(12,38,3);d.chest(32,29,3,true);d.chest(15,19,3);
    d.waveFrom=[[15,40],[29,31],[18,21]];
    return{style:'col',start:[23,48],exit:[23,4],goal:'waves',wave:[23,8],exitR:{x:14,y:4,w:19,h:9}}},
  karazankor1(d,spec){const W=d.W,H=d.H;
    d.rect(19,32,6,8);d.rect(6,8,32,24);d.rect(19,3,6,5);
    for(const x0 of[11,31])for(let y=10;y<30;y++){if(y===19||y===20)continue;d.set(x0,y,7);d.set(x0+1,y,7)}
    for(const y of[12,18,24])for(const x of[16,27])d.obj('pilier_n',x,y);
    for(const y of[11,27])for(const x of[7,36])d.obj('statue',x,y);
    d.obj('trone_nain',21,8,{w:2,h:1});d.obj('forge_n',7,18,{w:2,h:1,light:1});d.obj('forge_n',35,18,{w:2,h:1,light:1});
    for(const x of[19,24])d.obj('brasero',x,33,{light:1});for(const y of[10,29])for(const x of[14,29])d.obj('brasero',x,y,{light:1});
    d.scatter('tonneaux',3,6,9,10,30);d.scatter('caisses',3,33,9,37,30);
    d.res(21,37,2);d.res(21,4,1);d.chest(8,22,2,true);d.chest(36,13,2);d.chest(8,13,2);
    d.group(['orc','archer'],21,34,3,2);d.group(['orc','bat'],8,24,3,3);d.group(['orc','archer'],35,24,3,3);
    return{style:'nain',start:[21,38],exit:[21,4],goal:'boss',boss:[21,14],exitR:{x:13,y:9,w:18,h:20}}},
  // ---------- L'antre de Virganth (bois de la Première Larme) ----------
  antre0(d,spec){const W=d.W,H=d.H;const G2={A:[26,42],B:[12,31],C:[40,31],D:[14,15],E:[38,14],F:[26,6]};
    for(const[k,[x,y]]of Object.entries(G2))d.ell(x,y,k==='F'?6:7,k==='F'?4:5,0,.5);
    for(const[a,b]of[['A','B'],['A','C'],['B','D'],['C','E'],['D','F'],['E','F'],['B','C']]){const[x1,y1]=G2[a],[x2,y2]=G2[b];d.path([[x1,y1],[(x1+x2)/2+(d.R()-.5)*6,(y1+y2)/2+(d.R()-.5)*4],[x2,y2]],3,true)}
    d.rect(24,2,5,3);
    for(const k of['B','C','D','E']){const[x,y]=G2[k];d.mark(x+(k<'D'?2:-2),y-1,{c:'#7ff0e8'})}
    for(const[k,[x,y]]of Object.entries(G2)){d.scatter('arbre',2,x-6,y-4,x+6,y+4);d.scatter('ruine',1,x-5,y-3,x+5,y+3);d.scatter('champi',3,x-6,y-4,x+6,y+4,{solid:false});d.scatter('fleurs',4,x-6,y-4,x+6,y+4,{solid:false})}
    d.objs.push({k:'grotte',x:24,y:1,w:5,h:2,s:.5});
    d.res(26,44,2);d.res(26,3,1);
    for(const k of['B','C','D','E','F']){const[x,y]=G2[k];d.group([pickMob(spec,d.R),pickMob(spec,d.R),'archer'],x,y,3,4)}
    d.chest(10,33,3);d.chest(42,29,3,true);d.chest(36,16,3);d.chest(16,13,3);
    return{style:'bois',start:[26,44],exit:[26,3],goal:'runes',exitR:{x:20,y:2,w:12,h:8}}},
  antre1(d,spec){const W=d.W,H=d.H;const R=d.R;
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(R()<.47)d.set(x,y,0);
    for(let it=0;it<4;it++){const n=d.t.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){let c=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(n[(y+dy)*W+x+dx]===1)c++;d.t[y*W+x]=c>=5?1:0}}
    d.ell(21,17,12,8,0,.3);d.path([[21,37],[18,30],[21,24]],4);d.rect(19,3,5,5);d.path([[21,6],[21,10]],4);
    // retire les poches isolées : ne garde que la zone reliée au départ
    {const seen=new Uint8Array(W*H),q=[[21,36]];seen[36*W+21]=1;while(q.length){const[x,y]=q.pop();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<1||ny<1||nx>=W-1||ny>=H-1)continue;const i=ny*W+nx;if(!seen[i]&&d.t[i]===0){seen[i]=1;q.push([nx,ny])}}}for(let i=0;i<W*H;i++)if(d.t[i]===0&&!seen[i])d.t[i]=1}
    d.scatter('or',7,9,10,33,25);d.scatter('cristal',10,2,2,W-3,H-3,{light:1});d.scatter('os',3,9,10,33,25);d.obj('tas_or',20,11,{w:3,h:1});
    d.res(21,35,2);d.res(21,4,1);d.chest(11,17,3);d.chest(31,17,3,true);d.chest(21,27,3);
    d.group(['bat','slime','archer'],21,29,3,3);d.group(['bat','archer'],12,20,2,3);d.group(['bat','archer'],30,20,2,3);
    return{style:'tresor',start:[21,36],exit:[21,4],goal:'boss',boss:[21,15],exitR:{x:11,y:11,w:20,h:12}}},
  // ---------- La prison d'Amarath (Monts Oubliés) ----------
  prison0(d,spec){const W=d.W,H=d.H;
    d.path([[8,54],[33,48],[10,40],[31,31],[9,22],[29,13],[21,5]],6,true);d.rect(18,2,7,5);
    d.scatter('sapin',22,2,2,W-3,H-3);d.scatter('roc',12,2,2,W-3,H-3);d.obj('stele',20,7,{w:1,h:1});
    for(const[x,y]of[[33,48],[10,40],[31,31],[9,22]])d.group([pickMob(spec,d.R),pickMob(spec,d.R)],x,y,3,3);
    const p=d.free(25,10,32,15);if(p)d.spawns.push({type:spec.eliteType,elite:true,x:(p.x+.5)*TS,y:(p.y+.5)*TS});
    d.res(8,53,2);d.res(21,3,1);d.chest(31,47,3);d.chest(11,39,3,true);d.chest(30,30,3);d.chest(10,21,3);
    return{style:'sentier',start:[8,54],exit:[21,3],goal:'key',exitR:{x:18,y:2,w:7,h:5}}},
  prison1(d,spec){const W=d.W,H=d.H;
    d.ell(21,20,16,15,0,.2);d.rect(19,34,5,6);
    for(let k=0;k<12;k++){const a=k/12*6.283+.26,x=Math.round(21+Math.cos(a)*12.5),y=Math.round(20+Math.sin(a)*11.5);d.obj('pilier_v',x,y)}
    [[21,10,0],[31,20,1],[21,30,2],[11,20,3]].forEach(([x,y,i])=>d.mark(x,y,{c:STONES[i][1],i}));
    d.feat.push({k:'cercle',x:21,y:20,r:4});d.res(21,20,2);
    for(let k=0;k<6;k++){const p=d.free(8,7,34,33,false);if(p&&Math.hypot(p.x-21,p.y-20)>5){d.set(p.x,p.y,5);d.spikes.push({x:p.x,y:p.y,ph:k})}}
    d.scatter('chaines',4,8,7,34,33,{solid:false});d.scatter('cristal',6,6,6,36,34,{light:1});
    d.res(21,37,2);d.chest(13,13,2);d.chest(29,27,2,true);
    d.group(['slime','archer','bat'],21,13,3,3);d.group(['slime','orc'],29,20,3,3);d.group(['bat','archer'],13,20,3,3);d.group(['slime','orc'],21,27,2,2);
    return{style:'sceaux',start:[21,38],exit:[21,20],goal:'seals',exitR:{x:8,y:7,w:26,h:26}}},
  prison2(d,spec){const W=d.W,H=d.H;
    d.ell(19,18,14,12,0,.25);d.rect(17,30,5,7);d.rect(17,3,5,4);
    for(let k=0;k<10;k++){const a=k/10*6.283,x=Math.round(19+Math.cos(a)*11),y=Math.round(18+Math.sin(a)*9.5);if(y>27)continue;d.obj(k%2?'cristal':'pilier_v',x,y,k%2?{light:1}:{})}
    d.feat.push({k:'cercle',x:19,y:14,r:3});d.scatter('chaines',5,7,8,31,27,{solid:false});
    d.res(19,34,2);d.res(19,4,1);d.chest(9,16,2);d.chest(29,16,2,true);
    d.group(['slime','archer'],19,30,2,2);
    return{style:'prison',start:[19,35],exit:[19,4],goal:'boss',boss:[19,14],exitR:{x:7,y:7,w:24,h:20}}}};

function genDungeon2(did,idx,seed,lv){const spec=DUNGEONS[did],key=did+idx;const sz=LSIZE[key];const d=dunGrid(sz[0],sz[1],(seed*9301+idx*49297+lv)>>>0);const L2=LAYOUTS[key](d,spec);const{W,H,t}=d;
  const ex=L2.exit;t[ex[1]*W+ex[0]]=3;
  const boss=L2.goal==='boss',spawns=d.spawns;
  if(boss){const BV=BOSSES[spec.boss];spawns.push({type:'boss',bv:spec.boss,x:(L2.boss[0]+.5)*TS,y:(L2.boss[1]+.5)*TS});
    for(const gt of BV.guards){const p=d.free(L2.boss[0]-4,L2.boss[1]-2,L2.boss[0]+4,L2.boss[1]+3);if(p)spawns.push({type:gt,x:(p.x+.5)*TS,y:(p.y+.5)*TS})}}
  // les ennemis ne doivent jamais apparaître trop près du départ
  const sx=(L2.start[0]+.5)*TS,sy=(L2.start[1]+.5)*TS;const sp2=spawns.filter(s=>Math.hypot(s.x-sx,s.y-sy)>5*TS);
  const g=GOALS[L2.goal];const goal=Object.assign({id:L2.goal},g);if(L2.goal==='key')goal.who=spec.elite;if(L2.goal==='boss')goal.who=BOSSES[spec.boss].court;
  if(L2.goal==='waves'){goal.at={x:(L2.wave[0]+.5)*TS,y:(L2.wave[1]+.5)*TS};goal.from=(d.waveFrom||[]).map(([x,y])=>({x:(x+.5)*TS,y:(y+.5)*TS}))}
  const marks=d.marks.map(m=>({x:m.x,y:m.y,c:m.c||null,i:m.i??-1,k:g.mk||'levier'}));
  return{f:lv,W,H,t,rooms:[],props:[],rein:false,theme:0,style:L2.style,st:DSTYLE[L2.style],soldat:!!spec.soldat,objs:d.objs,feat:d.feat,path:d.path,
    start:{x:sx,y:sy},stairs:{x:(ex[0]+.5)*TS,y:(ex[1]+.5)*TS},exitR:L2.exitR,chests:d.chests,crates:[],plates:[],spikes:d.spikes,spawns:sp2,torches:d.torches,boss,vault:null,goal,marks}}

/* ================= Objectifs (hôte) ================= */
function goalInit(){const m=G.m;G.gp=(m.marks||[]).map(()=>0);G.wave=0;G.waveT=0}
function goalUpdate(dt){const m=G.m;if(m.kind!=='dun'||!m.goal||G.stairsOpen)return;const gl=m.goal;
  if(gl.type==='marks'){let done=0;m.marks.forEach((mk,i)=>{const x=(mk.x+.5)*TS,y=(mk.y+.5)*TS;if(G.gp[i]>=1){done++;return}
      const on=G.players.some(p=>!p.down&&Math.hypot(p.x-x,p.y-y)<38);
      if(on){G.gp[i]=Math.min(1,G.gp[i]+dt/1.8);if(G.gp[i]>=1){done++;fx(37,x,y,70);Snd.play('key');msg(gl.one.replace('{n}',G.gp.filter(v=>v>=1).length).replace('{m}',m.marks.length));
        for(let k=0;k<2;k++){const q=freeNear(x,y,3*TS,5*TS);const e=spawnEnemy(pickMob(DUNGEONS[m.did],Math.random),q.x,q.y,false,false,undefined,m.lv);e.act=true}}}
      else G.gp[i]=Math.max(0,G.gp[i]-dt*.3)});
    if(done===m.marks.length&&m.marks.length){G.stairsOpen=true;msg(gl.win+' Suis la flèche dorée.')}}
  if(gl.type==='waves'){const at=gl.at;const alive=G.enemies.filter(e=>e.wv&&e.hp>0).length;
    if(G.wave===0){if(G.players.some(p=>!p.down&&Math.hypot(p.x-at.x,p.y-at.y)<7*TS)){G.wave=1;G.waveT=0;waveSpawn(1);msg('Grinmir : « Les voilà ! Tenez les portes ! » Vague 1/3.')}}
    else if(alive===0){G.waveT+=dt;if(G.waveT>2.5){if(G.wave>=3){G.stairsOpen=true;msg(gl.win+' Suis la flèche dorée.')}else{G.wave++;G.waveT=0;waveSpawn(G.wave);msg('Vague '+G.wave+'/3 ! Ils arrivent par le col.')}}}}}
function waveSpawn(n){const m=G.m,gl=m.goal;const cnt=3+n*2;const from=gl.from.length?gl.from:[m.start];
  for(let k=0;k<cnt;k++){const f=from[k%from.length];const q=freeNear(f.x,f.y,0,3*TS);const e=spawnEnemy(k===0&&n===3?'orc':(k%3===2?'archer':'orc'),q.x,q.y,k===0&&n===3,false,undefined,m.lv);e.act=true;e.wv=true}}
function goalText(){const m=G.m;const gl=m.goal;if(!gl)return'';if(G.stairsOpen)return'Sortie ouverte : suis la flèche dorée';
  if(gl.type==='marks'){const n=(G.gp||[]).filter(v=>v>=1).length;return gl.t+' : '+n+'/'+m.marks.length}
  if(gl.type==='waves')return gl.t+(G.wave?' : vague '+G.wave+'/3':' : va jusqu’au cor des nains');
  if(gl.type==='key')return gl.t+' '+gl.who;return'Bats '+gl.who+' pour ouvrir la sortie'}
function goalHint(){const gl=G.m.goal;if(!gl)return'';if(gl.type==='key')return gl.hint+gl.who+'.';if(gl.type==='boss')return gl.hint+gl.who+'.';return gl.hint}

/* ================= Rendu des donjons ================= */
function renderDun(m){const c=document.createElement('canvas');c.width=m.W*TS;c.height=m.H*TS;const g=c.getContext('2d');const S=m.st,R=mulberry(m.W*31+m.H);
  const T=(x,y)=>(x<0||y<0||x>=m.W||y>=m.H)?1:m.t[y*m.W+x];const wall=(x,y)=>{const v=T(x,y);return v===1};
  const FC={pave:'#d6b07a',salle:'#7a6c72',roche:'#c46e43',nain:'#9a8466',herbe:'#8aab4a',tresor:'#8a6a4a',neige:'#e6edf0',sceau:'#4a4258',prison:'#3a3046'}[S.floor];
  // sol
  for(let y=0;y<m.H;y++)for(let x=0;x<m.W;x++){if(wall(x,y))continue;const px=x*TS,py=y*TS,h=hash2(x,y,7),h2=hash2(x,y,8),n=vnoise(x/5,y/5,3)-.5;
    g.fillStyle=shade(FC,n*.14+(h-.5)*.05);g.fillRect(px,py,TS,TS);
    if(S.floor==='pave'||S.floor==='salle'||S.floor==='nain'||S.floor==='sceau'){const big=S.floor!=='pave';const off=big?0:(y%2)*16;g.strokeStyle=shade(FC,-.25);g.lineWidth=1;
      if(big){g.strokeRect(px+.5,py+.5,TS-1,TS-1);g.fillStyle='rgba(255,255,255,.07)';g.fillRect(px+2,py+2,TS-4,2)}else{for(const k of[0,16]){g.strokeRect(px+((k+off)%32)+.5,py+.5,16,15);g.strokeRect(px+((k+off+8)%32)+.5,py+16.5,16,15)}}
      if(S.floor==='nain'&&x%4===0&&y%4===0){g.strokeStyle='rgba(240,200,90,.45)';g.strokeRect(px+4.5,py+4.5,TS*4-9,TS*4-9)}
      if(h<.08){g.strokeStyle=shade(FC,-.35);g.beginPath();g.moveTo(px+4,py+6+h2*10);g.lineTo(px+14,py+12);g.lineTo(px+22,py+10+h2*8);g.stroke()}}
    else if(S.floor==='roche'){if(h<.4)pebble(g,px+4+h*22,py+6+h2*20,1.8+h*2,'#8a4a2c');if(vnoise(x/5,y/5,11)>.78){g.fillStyle='rgba(240,246,248,.55)';g.beginPath();g.ellipse(px+16+(h-.5)*8,py+16,12,7,0,0,6.28);g.fill()}
      if(m.path[y*m.W+x]&&h2<.5){g.fillStyle=shade(FC,-.12);g.fillRect(px,py+10,TS,3)}}
    else if(S.floor==='herbe'){if(m.path[y*m.W+x]){g.fillStyle=shade('#b08a5a',n*.1);g.fillRect(px,py,TS,TS);if(h<.4)pebble(g,px+h*24+4,py+h2*24+4,1.6,'#8a7a62')}
      else for(let k=0;k<3;k++){const gx=px+hash2(x,y,10+k)*28,gy=py+hash2(x,y,20+k)*28;poly(g,[gx,gy,gx+1.5,gy-5,gx+3,gy],shade(FC,k%2?-.2:.16))}}
    else if(S.floor==='tresor'){if(h<.3){g.fillStyle='#e8c050';for(let k=0;k<3;k++){g.beginPath();g.ellipse(px+hash2(x,y,30+k)*26+3,py+hash2(x,y,40+k)*26+3,2.2,1.4,0,0,6.28);g.fill()}}if(h2<.2)pebble(g,px+16,py+16,2.5,'#6a5040')}
    else if(S.floor==='neige'){g.fillStyle='rgba(150,180,210,.25)';if(h<.4){g.beginPath();g.ellipse(px+h*20+6,py+h2*20+6,7,2.5,0,0,6.28);g.fill()}if(m.path[y*m.W+x]&&h2<.25){g.fillStyle='rgba(120,140,160,.35)';g.fillRect(px+10,py+6,3,4);g.fillRect(px+18,py+16,3,4)}}
    else if(S.floor==='prison'){if(h<.12){g.strokeStyle='rgba(185,140,255,.35)';g.lineWidth=1.2;g.beginPath();g.moveTo(px+2,py+h2*30);g.lineTo(px+16,py+16);g.lineTo(px+30,py+h*200%30);g.stroke()}}}
  for(const f of m.feat){if(f.k==='tapis'){const x0=f.x*TS+3,y0=f.y*TS,w=f.w*TS-6,h=f.h*TS;g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x0+3,y0+3,w,h);g.fillStyle='#8e2f3a';g.fillRect(x0,y0,w,h);g.strokeStyle='#d6b04a';g.lineWidth=3;g.strokeRect(x0+5,y0,w-10,h);g.fillStyle='rgba(214,176,74,.35)';for(let y=y0+20;y<y0+h;y+=48){g.beginPath();g.moveTo(x0+w/2,y-10);g.lineTo(x0+w/2+12,y);g.lineTo(x0+w/2,y+10);g.lineTo(x0+w/2-12,y);g.closePath();g.fill()}}
    if(f.k==='cercle'){const cx=(f.x+.5)*TS,cy=(f.y+.5)*TS,r=f.r*TS;g.strokeStyle='rgba(185,140,255,.55)';g.lineWidth=3;g.beginPath();g.arc(cx,cy,r,0,6.28);g.stroke();g.lineWidth=1.5;g.beginPath();g.arc(cx,cy,r*.7,0,6.28);g.stroke();
      for(let k=0;k<8;k++){const a=k/8*6.283;g.beginPath();g.moveTo(cx+Math.cos(a)*r*.7,cy+Math.sin(a)*r*.7);g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);g.stroke()}}}
  // lave
  for(let y=0;y<m.H;y++)for(let x=0;x<m.W;x++){if(T(x,y)!==7)continue;const px=x*TS,py=y*TS;g.fillStyle='#ff7a2a';g.fillRect(px,py,TS,TS);g.fillStyle='#ffb347';g.fillRect(px+hash2(x,y,3)*20,py+hash2(x,y,4)*24,10,4);g.strokeStyle='#8a2a10';g.lineWidth=2;g.beginPath();g.moveTo(px,py+hash2(x,y,5)*30);g.lineTo(px+TS,py+hash2(x,y,6)*30);g.stroke();
    if(T(x-1,y)!==7){g.fillStyle='#4a3020';g.fillRect(px,py,4,TS)}if(T(x+1,y)!==7){g.fillStyle='#4a3020';g.fillRect(px+TS-4,py,4,TS)}}
  // ombres au pied des murs
  for(let y=0;y<m.H;y++)for(let x=0;x<m.W;x++){if(wall(x,y))continue;const px=x*TS,py=y*TS;if(wall(x,y-1)){const gr=g.createLinearGradient(0,py,0,py+14);gr.addColorStop(0,'rgba(30,15,10,.4)');gr.addColorStop(1,'rgba(30,15,10,0)');g.fillStyle=gr;g.fillRect(px,py,TS,14)}if(wall(x-1,y)){g.fillStyle='rgba(30,15,10,.18)';g.fillRect(px,py,6,TS)}}
  // murs (ou décor plein) selon le style
  const DEEP={rempart:'#8fa44c',salle:'#1c1820',nain:'#2a221c',grotte:'#33281e',sceau:'#14111b'}[S.wall];
  const near=(x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!wall(x+dx,y+dy))return true;return false};
  for(let y=0;y<m.H;y++)for(let x=0;x<m.W;x++){if(!wall(x,y))continue;if(DEEP&&!near(x,y)){const px=x*TS,py=y*TS,h=hash2(x,y,4);g.fillStyle=shade(DEEP,(vnoise(x/4,y/4,2)-.5)*.16);g.fillRect(px,py,TS,TS);
      if(S.wall==='rempart'){for(let k=0;k<3;k++){const gx=px+hash2(x,y,10+k)*28,gy=py+hash2(x,y,20+k)*28;poly(g,[gx,gy,gx+1.5,gy-5,gx+3,gy],shade(DEEP,k%2?-.2:.16))}if(h<.06)facetBlob(g,px+16,py+18,9,'#5a8a32',x*7+y,6)}
      else if(h<.05){g.fillStyle='rgba(255,255,255,.05)';g.fillRect(px+h*300%24,py+8,6,4)}continue}
    dunWall(g,S.wall,x,y,!wall(x,y+1)&&y<m.H-1,wall,R)}
  for(const f of m.feat)if(f.k==='portenaine'){const x0=f.x*TS,y0=f.y*TS,w=f.w*TS,h=f.h*TS,cx=x0+w/2;prism(g,x0,y0+h-6,w,6,h-6,'#7a6a58');g.fillStyle='#e0b45c';g.fillRect(x0,y0+10,w,4);
    g.fillStyle='#3a2a1c';g.beginPath();g.moveTo(cx-40,y0+h+2);g.lineTo(cx-40,y0+40);g.quadraticCurveTo(cx,y0+14,cx+40,y0+40);g.lineTo(cx+40,y0+h+2);g.closePath();g.fill();
    g.fillStyle='#6a4a2a';g.fillRect(cx-36,y0+44,34,h-42);g.fillRect(cx+2,y0+44,34,h-42);g.fillStyle='#e0b45c';for(const ox of[-30,-14,8,24])g.fillRect(cx+ox,y0+48,4,h-50);
    for(const sx of[x0+20,x0+w-44]){prism(g,sx,y0+h-8,24,8,h-10,'#9a8a74');g.fillStyle='#b8a890';g.beginPath();g.arc(sx+12,y0+26,9,0,6.28);g.fill();g.fillStyle='#8a7a64';g.beginPath();g.moveTo(sx+4,y0+30);g.quadraticCurveTo(sx+12,y0+56,sx+20,y0+30);g.fill()}}
  return c}
function dunWall(g,st,x,y,face,wall,R){const px=x*TS,py=y*TS,h=hash2(x,y,9),h2=hash2(x,y,12);
  if(st==='foret'){g.fillStyle='#2f5a28';g.fillRect(px,py,TS,TS);if(face){g.fillStyle='#4a3020';for(let k=0;k<3;k++)g.fillRect(px+5+k*10+h*3,py+16,4,16);g.fillStyle='rgba(20,30,10,.35)';g.fillRect(px,py+28,TS,4)}
    facetBlob(g,px+16+(h-.5)*8,py+(face?10:16),18+h*5,['#3f7a34','#4f8a3a','#36702e'][Math.floor(h*3)],x*7+y,7);if(h2<.12){g.fillStyle='#f2d65a';g.beginPath();g.arc(px+8+h*16,py+12,2,0,6.28);g.fill()}return}
  const P={rempart:['#8f877a','#a39b8c','#6e675d'],salle:['#3a3240','#5e5262','#2a2430'],falaise:['#a8613c','#c27a4c','#7a4228'],falaiseN:['#8f9aa6','#eef2f4','#6b7480'],nain:['#5a4a38','#9a7a48','#3a2e24'],grotte:['#4a3a2c','#7a6040','#33281e'],sceau:['#2a2433','#4a4058','#1a1622']}[st]||['#555','#777','#333'];
  if(!face){g.fillStyle=P[1];g.fillRect(px,py,TS,TS);
    if(st==='falaise'||st==='falaiseN'||st==='grotte'){poly(g,[px,py,px+TS,py,px+16+(h-.5)*10,py+16+(h2-.5)*10],shade(P[1],.06));poly(g,[px+TS,py,px+TS,py+TS,px+16+(h-.5)*10,py+16+(h2-.5)*10],shade(P[1],-.12));poly(g,[px,py+TS,px+TS,py+TS,px+16+(h-.5)*10,py+16+(h2-.5)*10],shade(P[1],-.04))
      if(st==='falaiseN'&&h<.4){g.fillStyle='#ffffff';g.beginPath();g.ellipse(px+16,py+14,12,7,0,0,6.28);g.fill()}}
    else if(st==='rempart'){g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;g.strokeRect(px+.5,py+.5,TS-1,TS-1)}
    else if(st==='nain'&&h<.15){g.strokeStyle='rgba(240,200,90,.45)';g.strokeRect(px+6.5,py+6.5,TS-13,TS-13)}
    else if(st==='sceau'&&h<.12){g.fillStyle='rgba(185,140,255,.45)';g.fillRect(px+14,py+8,3,14);g.fillRect(px+9,py+13,13,3)}
    // bord crénelé ou rebord quand un sol est au-dessus / à côté
    return}
  // face visible (sud)
  g.fillStyle=P[1];g.fillRect(px,py,TS,8);g.fillStyle=P[0];g.fillRect(px,py+8,TS,TS-8);
  if(st==='rempart'){for(let r=0;r<3;r++){const off=((r+x)%2)*8;for(let bx=-off;bx<TS;bx+=16){const x0=Math.max(px,px+bx),x1=Math.min(px+TS,px+bx+15);if(x1>x0){g.fillStyle=shade(P[0],(hash2(x*3+bx,y*5+r,4)-.5)*.16);g.fillRect(x0,py+9+r*8,x1-x0,7)}}}
    g.fillStyle=P[1];for(let k=0;k<2;k++)prism(g,px+3+k*16,py-2,10,4,6,P[1],{edge:false});if(h<.07){g.fillStyle='#1f3358';g.fillRect(px+9,py+9,14,20);g.fillStyle='#efe6cf';g.beginPath();g.ellipse(px+16,py+17,5,3,0,0,6.28);g.fill();g.fillStyle='#1f3358';g.beginPath();g.arc(px+16,py+17,1.6,0,6.28);g.fill()}}
  else if(st==='salle'){g.fillStyle=P[2];g.fillRect(px,py+8,3,TS-8);g.fillRect(px+TS-3,py+8,3,TS-8);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(px+6,py+12,TS-12,TS-16);if(h<.12){g.fillStyle='#8e2f3a';g.fillRect(px+9,py+9,14,22);g.fillStyle='#d6b04a';g.fillRect(px+9,py+9,14,2);g.beginPath();g.arc(px+16,py+19,3,0,6.28);g.fill()}}
  else if(st==='falaise'||st==='falaiseN'||st==='grotte'){for(let k=0;k<4;k++){const sx=px+k*8;poly(g,[sx,py+8,sx+8,py+8,sx+4+(hash2(x*4+k,y,3)-.5)*5,py+TS],shade(P[0],k%2?-.22:.08))}if(st==='falaiseN'){g.fillStyle='#ffffff';g.fillRect(px,py+4,TS,6)}
    if(st==='grotte'&&h<.2){g.save();g.shadowColor='#9fe8ff';g.shadowBlur=8;poly(g,[px+12,py+TS,px+16,py+12,px+20,py+TS],'#9fe8ff');g.restore()}}
  else if(st==='nain'){g.fillStyle='#e0b45c';g.fillRect(px,py+8,TS,2);g.fillRect(px,py+TS-4,TS,2);if(h<.3){g.strokeStyle='rgba(224,180,92,.6)';g.lineWidth=1.3;g.beginPath();g.moveTo(px+10,py+14);g.lineTo(px+16,py+24);g.lineTo(px+22,py+14);g.moveTo(px+16,py+12);g.lineTo(px+16,py+26);g.stroke()}}
  else if(st==='sceau'){if(h<.4){g.save();g.shadowColor='#b98cff';g.shadowBlur=6;g.strokeStyle='#b98cff';g.lineWidth=1.4;g.beginPath();g.arc(px+16,py+20,5,0,6.28);g.moveTo(px+16,py+13);g.lineTo(px+16,py+27);g.stroke();g.restore()}}
  g.fillStyle='rgba(0,0,0,.3)';g.fillRect(px,py+TS-3,TS,3)}
/* objets des donjons, dessinés dans l'ordre de profondeur */
function drawDObj(o,T,gg){const g=gg||ctx,x=o.x*TS,y=o.y*TS,w=o.w*TS,h=o.h*TS,cx=x+w/2,by=y+h,s=o.s||.5;
  switch(o.k){
    case'caserne':dshadow(g,cx+8,by,w*.55,8);prism(g,x,y+4,w,h-4,34,'#c9a674');g.fillStyle='rgba(90,60,30,.3)';for(let k=4;k<w;k+=7)g.fillRect(x+k,by-34,1.2,34);
      g.fillStyle=shade('#3f6a5a',.1);g.beginPath();g.moveTo(x-6,y-26);g.lineTo(cx,y-50);g.lineTo(cx,y-24);g.closePath();g.fill();g.fillStyle=shade('#3f6a5a',-.25);g.beginPath();g.moveTo(cx,y-50);g.lineTo(x+w+6,y-26);g.lineTo(cx,y-24);g.closePath();g.fill();
      g.fillStyle='#3a2818';g.fillRect(cx-9,by-22,18,22);g.fillStyle='#6a4a2a';g.fillRect(cx-7,by-20,14,20);break;
    case'ecurie':dshadow(g,cx+8,by,w*.55,7);prism(g,x,y+6,w,h-6,22,'#a8784a');g.fillStyle='#d8c06a';g.fillRect(x+6,by-14,w-12,10);poly(g,[x-4,y-14,x+w+4,y-14,x+w,y-24,x,y-24],'#8a5a30');break;
    case'fontaine':dshadow(g,cx+6,by,w*.6,8);cyl(g,cx,by-4,w*.48,12,'#a39b8c','#4f9cb8');g.fillStyle='rgba(220,245,255,.7)';g.beginPath();g.ellipse(cx,by-16,w*.36,5,0,0,6.28);g.fill();prism(g,cx-4,by-12,8,4,26,'#bdb4a4',{edge:false});
      g.fillStyle='rgba(200,235,255,.8)';for(let k=0;k<3;k++){const a=T*3+k*2;g.fillRect(cx-1+Math.sin(a)*6,by-36+((T*40+k*12)%22),2,3)}break;
    case'brasero':dshadow(g,cx+3,by-2,9,3);cyl(g,cx,by-4,8,8,'#4a4248','#2a1d14');g.fillStyle='#3a3238';g.fillRect(cx-1.5,by-6,3,6);{const fl=Math.sin(T*12+s*9)*2;g.fillStyle='#ff8a2b';g.beginPath();g.moveTo(cx-7,by-12);g.quadraticCurveTo(cx,by-30-fl,cx+7,by-12);g.fill();g.fillStyle='#ffd27a';g.beginPath();g.moveTo(cx-3,by-12);g.quadraticCurveTo(cx,by-22+fl,cx+3,by-12);g.fill()}break;
    case'tonneaux':dshadow(g,cx+4,by-2,13,4);cyl(g,cx-5,by-4,6,13,'#8a5a30','#5a3a20');cyl(g,cx+5,by-1,6,12,['#c8483c','#3a6a8e','#6b4a8e'][Math.floor(s*3)],'#2a2a30');break;
    case'caisses':dshadow(g,cx+4,by-2,13,4);prism(g,x+4,by-12,13,9,11,'#a87a44');prism(g,x+15,by-9,11,7,9,'#9a6c3a');g.strokeStyle='rgba(70,40,20,.5)';g.lineWidth=1;g.beginPath();g.moveTo(x+4,by-23);g.lineTo(x+17,by-12);g.stroke();break;
    case'mannequin':dshadow(g,cx+3,by-2,8,3);g.fillStyle='#6b4a28';g.fillRect(cx-1.5,by-26,3,24);g.fillRect(cx-9,by-20,18,3);g.fillStyle='#d8c06a';g.beginPath();g.ellipse(cx,by-16,6,9,0,0,6.28);g.fill();g.fillStyle='#c9a86a';g.beginPath();g.arc(cx,by-28,5,0,6.28);g.fill();g.strokeStyle='#c8483c';g.lineWidth=1.5;g.beginPath();g.arc(cx,by-16,3,0,6.28);g.stroke();break;
    case'ratelier':dshadow(g,cx+3,by-2,12,3);prism(g,x+3,by-6,26,3,16,'#6b4a28',{edge:false});g.strokeStyle='#d8d6e2';g.lineWidth=2;for(let k=0;k<4;k++){g.beginPath();g.moveTo(x+7+k*6,by-6);g.lineTo(x+7+k*6,by-26);g.stroke()}break;
    case'charrette':dshadow(g,cx+6,by-2,18,5);prism(g,x+2,by-14,28,10,8,'#8a5a30');g.fillStyle='#d8c06a';g.beginPath();g.ellipse(cx,by-24,10,4,0,0,6.28);g.fill();for(const wx of[x+6,x+26]){g.fillStyle='#4a3020';g.beginPath();g.arc(wx,by-4,5,0,6.28);g.fill();g.fillStyle='#8a6034';g.beginPath();g.arc(wx,by-4,1.8,0,6.28);g.fill()}break;
    case'foin':dshadow(g,cx+4,by-2,13,4);cyl(g,cx,by-4,11,10,'#d8b85a','#e8cc70');g.strokeStyle='rgba(140,100,40,.5)';g.lineWidth=1;g.beginPath();g.moveTo(cx-11,by-9);g.lineTo(cx+11,by-9);g.stroke();break;
    case'pilier':case'pilier_n':case'pilier_v':{const col=o.k==='pilier_n'?'#8a6a48':o.k==='pilier_v'?'#3e3550':'#8a8090';dshadow(g,cx+6,by-2,13,4);prism(g,x+3,by-8,26,6,6,shade(col,-.1));prism(g,x+7,by-6,18,4,46,col);prism(g,x+3,by-52,26,6,6,shade(col,.1));
      if(o.k==='pilier_n'){g.fillStyle='#e0b45c';g.fillRect(x+7,by-34,18,2);g.fillRect(x+7,by-24,18,2)}if(o.k==='pilier_v'){g.save();g.shadowColor='#b98cff';g.shadowBlur=8;g.fillStyle='rgba(185,140,255,'+(.5+.3*Math.sin(T*2+s*6))+')';g.fillRect(cx-1.5,by-44,3,30);g.restore()}break}
    case'trone':dshadow(g,cx+6,by,w*.5,6);prism(g,x+4,by-10,w-8,8,10,'#5a4a5a');prism(g,x+8,by-14,w-16,4,40,'#8e2f3a',{top:'#a8404a'});g.fillStyle='#d6b04a';g.fillRect(x+8,by-54,w-16,4);g.beginPath();g.arc(cx,by-60,6,0,6.28);g.fill();g.fillStyle='#1f3358';g.beginPath();g.ellipse(cx,by-60,4,2.4,0,0,6.28);g.fill();break;
    case'trone_nain':dshadow(g,cx+6,by,w*.5,6);prism(g,x,by-10,w,8,12,'#6a5a48');prism(g,x+6,by-14,w-12,4,44,'#8a6a3a');g.fillStyle='#e0b45c';g.fillRect(x+6,by-58,w-12,5);for(const ox of[-12,0,12]){poly(g,[cx+ox-4,by-58,cx+ox,by-68,cx+ox+4,by-58],'#f0c95a')}break;
    case'statue':dshadow(g,cx+6,by-2,12,4);prism(g,x+3,by-10,26,8,10,'#6a5a48');g.fillStyle='#9a8a74';g.beginPath();g.moveTo(cx-9,by-18);g.lineTo(cx+9,by-18);g.lineTo(cx+7,by-44);g.lineTo(cx-7,by-44);g.closePath();g.fill();g.fillStyle='#b8a890';g.beginPath();g.arc(cx,by-50,7,0,6.28);g.fill();
      g.fillStyle='#8a7a64';g.beginPath();g.moveTo(cx-6,by-48);g.quadraticCurveTo(cx,by-30,cx+6,by-48);g.fill();g.fillStyle='#7a6a54';g.fillRect(cx+8,by-52,4,34);g.fillRect(cx+5,by-56,10,7);break;
    case'forge_n':dshadow(g,cx+6,by,w*.5,6);prism(g,x,by-12,w,10,16,'#5a5246');g.fillStyle='rgba(255,140,40,'+(.7+.3*Math.sin(T*8+s*5))+')';g.fillRect(x+8,by-22,w-16,8);prism(g,x+w-18,by-14,12,4,30,'#6a625a',{edge:false});break;
    case'tente':dshadow(g,cx+8,by,w*.6,7);poly(g,[x-2,by,cx,y-28,cx,by],'#a8784a');poly(g,[cx,y-28,x+w+2,by,cx,by],'#7a5230');poly(g,[cx-6,by,cx,by-20,cx+6,by],'#2a1d12');g.strokeStyle='#4a3020';g.lineWidth=2;g.beginPath();g.moveTo(cx,y-28);g.lineTo(cx,y-36);g.stroke();break;
    case'pieux':dshadow(g,cx+4,by-2,11,3);for(const ox of[-8,0,8])poly(g,[cx+ox-3,by-2,cx+ox,by-24-((ox+8)%5),cx+ox+3,by-2],ox%2?'#7a5230':'#9a6a40');g.fillStyle='#5a3a20';g.fillRect(cx-12,by-12,24,2.5);break;
    case'feu':dshadow(g,cx+3,by-4,11,4);for(let k=0;k<6;k++){const a=k/6*6.28;g.fillStyle='#6a625a';g.beginPath();g.arc(cx+Math.cos(a)*9,by-8+Math.sin(a)*4,3,0,6.28);g.fill()}
      {const fl=Math.sin(T*12+s*7)*2;g.fillStyle='#ff6a1e';g.beginPath();g.moveTo(cx-7,by-8);g.quadraticCurveTo(cx-2,by-32-fl,cx+7,by-8);g.fill();g.fillStyle='#ffd27a';g.beginPath();g.moveTo(cx-3,by-8);g.quadraticCurveTo(cx,by-22+fl,cx+3,by-8);g.fill()}if(Math.random()<.04&&parts.length<300)parts.push({k:'smoke',x:cx,y:by-30,vx:3,vy:-16,life:2.4,max:2.4,r:7});break;
    case'etendard':dshadow(g,cx+3,by-2,6,2);g.fillStyle='#4a3020';g.fillRect(cx-1.5,by-46,3,46);g.fillStyle='#6a1e16';poly(g,[cx+1,by-44,cx+20+Math.sin(T*3)*2,by-40,cx+16,by-30,cx+20+Math.sin(T*3+1)*2,by-22,cx+1,by-24],'#7a2018');g.fillStyle='#e8d6b0';g.beginPath();g.arc(cx+10,by-34,3.5,0,6.28);g.fill();break;
    case'roc':dshadow(g,cx+4,by-2,14,5);{const c=DSTYLE&&G.m&&G.m.style==='sentier'?'#8f9aa6':'#a8714c';poly(g,[cx-13,by-2,cx-11,by-12,cx-3,by-19,cx+8,by-17,cx+13,by-8,cx+12,by-2],shade(c,-.15));poly(g,[cx-11,by-12,cx-3,by-19,cx+8,by-17,cx+2,by-10],shade(c,.2));poly(g,[cx+8,by-17,cx+13,by-8,cx+12,by-2,cx+2,by-10],shade(c,-.32))}break;
    case'arbre':dshadow(g,cx+8,by-2,18,6);g.fillStyle='#6a4428';poly(g,[cx-3,by-2,cx-2,by-18,cx+2,by-18,cx+3,by-2],'#6a4428');facetBlob(g,cx,by-30,16,['#5a8a32','#6b9a38','#4f7f2e'][Math.floor(s*3)],o.x*7+o.y,8);facetBlob(g,cx-8,by-24,9,'#4f7f2e',o.x+o.y*3,6);break;
    case'sapin':dshadow(g,cx+6,by-2,15,5);g.fillStyle='#5a3a22';g.fillRect(cx-2.5,by-12,5,10);for(let i=0;i<3;i++)cone(g,cx,by-10-i*12,15-i*3.5,21,'#3f6a46',true);break;
    case'ruine':dshadow(g,cx+6,by-2,12,4);prism(g,x+5,by-8,22,6,10,'#a8a294');prism(g,x+9,by-12,13,5,24,'#bdb6a6');poly(g,[x+9,by-36,x+22,by-36,x+18,by-42,x+12,by-39],'#bdb6a6');g.fillStyle='rgba(90,140,60,.6)';g.fillRect(x+9,by-20,5,8);break;
    case'champi':for(let k=0;k<3;k++){const mx=x+8+k*7,my=by-6+(k%2)*4;g.fillStyle='#efe6cf';g.fillRect(mx-1,my-5,2.4,5);g.fillStyle=k%2?'#c8483c':'#e8a04a';g.beginPath();g.ellipse(mx,my-6,4,2.6,0,Math.PI,0);g.fill();g.fillStyle='#fff';g.fillRect(mx-1.5,my-8,1.2,1.2)}break;
    case'fleurs':for(let k=0;k<4;k++){const fx=x+6+k*6,fy=by-8+(k%2)*5;g.fillStyle='#4f7a2a';g.fillRect(fx-.5,fy,1,4);g.save();g.shadowColor='#9fe8ff';g.shadowBlur=6;g.fillStyle=k%2?'#9fe8ff':'#c9a6ff';g.beginPath();g.arc(fx,fy,2,0,6.28);g.fill();g.restore()}break;
    case'grotte':{g.fillStyle='#6a5a48';g.beginPath();g.moveTo(x-6,by);g.quadraticCurveTo(x-2,y-30,cx,y-36);g.quadraticCurveTo(x+w+2,y-30,x+w+6,by);g.closePath();g.fill();g.fillStyle='#8a7a64';g.beginPath();g.moveTo(x,by);g.quadraticCurveTo(x+4,y-22,cx,y-28);g.lineTo(cx,by);g.closePath();g.fill();
      g.fillStyle=G.stairsOpen?'#2a1a08':'#0c0a0a';g.beginPath();g.moveTo(cx-24,by);g.quadraticCurveTo(cx-20,y-14,cx,y-20);g.quadraticCurveTo(cx+20,y-14,cx+24,by);g.closePath();g.fill();if(G.stairsOpen){g.fillStyle='rgba(240,201,90,'+(.3+.2*Math.sin(T*3))+')';g.beginPath();g.arc(cx,by-14,12,0,6.28);g.fill()}break}
    case'or':dshadow(g,cx+3,by-3,11,3);g.fillStyle='#c9952e';g.beginPath();g.ellipse(cx,by-6,11,6,0,Math.PI,0);g.fill();g.fillStyle='#f0c95a';for(let k=0;k<6;k++){g.beginPath();g.ellipse(cx-7+k*2.8,by-8-(k%3)*2.5,2.4,1.4,0,0,6.28);g.fill()}break;
    case'tas_or':dshadow(g,cx+8,by-2,w*.5,6);g.fillStyle='#b8862a';g.beginPath();g.ellipse(cx,by-6,w*.5,14,0,Math.PI,0);g.fill();g.fillStyle='#f0c95a';g.beginPath();g.ellipse(cx-4,by-10,w*.4,10,0,Math.PI,0);g.fill();
      g.fillStyle='#fff3c0';for(let k=0;k<10;k++){const a=k*1.7;g.fillRect(cx+Math.cos(a)*w*.3,by-12+Math.sin(a)*5,2,2)}prism(g,cx+10,by-14,10,6,8,'#8a3a2a');g.fillStyle='#c27bff';g.beginPath();g.arc(cx-12,by-18,3,0,6.28);g.fill();break;
    case'cristal':{const c=G.m&&G.m.style==='tresor'?'#9fe8ff':'#c27bff';dshadow(g,cx+3,by-3,10,3);g.save();g.shadowColor=c;g.shadowBlur=10+Math.sin(T*2+s*6)*4;poly(g,[cx-8,by-4,cx-5,by-22,cx-1,by-4],shade(c,.2));poly(g,[cx-2,by-4,cx+2,by-32,cx+6,by-4],c);poly(g,[cx+4,by-4,cx+8,by-16,cx+10,by-4],shade(c,-.25));g.restore();break}
    case'os':g.strokeStyle='#e8e0cc';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(cx-10,by-6);g.lineTo(cx+10,by-12);g.moveTo(cx-4,by-14);g.lineTo(cx+6,by-4);g.stroke();g.lineCap='butt';break;
    case'chaines':g.strokeStyle='rgba(150,140,170,.8)';g.lineWidth=1.6;for(let k=0;k<5;k++){g.beginPath();g.ellipse(x+10+k*3,by-20+k*3,2,3,.5,0,6.28);g.stroke()}g.fillStyle='#3a3440';g.fillRect(x+6,by-24,6,3);break;
    case'stele':dshadow(g,cx+4,by-2,9,3);poly(g,[cx-7,by-2,cx-6,by-34,cx+1,by-40,cx+1,by-2],'#a8b0b8');poly(g,[cx+1,by-40,cx+7,by-32,cx+8,by-2,cx+1,by-2],'#7a828a');g.fillStyle='rgba(185,140,255,.6)';g.fillRect(cx-3,by-26,3,12);break;
    case'autel':dshadow(g,cx+5,by-2,12,4);prism(g,x+4,by-12,24,9,12,'#dcd4c4');g.fillStyle='#e0b23a';g.fillRect(cx-1,by-34,2,12);g.fillRect(cx-5,by-30,10,2);break;
    case'bougies':for(let k=0;k<3;k++){const bx=x+8+k*7,b2=by-6-(k%2)*4;g.fillStyle='#efe6cf';g.fillRect(bx-1.5,b2-7,3,7);g.fillStyle='#ffd27a';g.beginPath();g.ellipse(bx,b2-9+Math.sin(T*10+k)*.6,1.6,2.6,0,0,6.28);g.fill()}break;
    case'cor':break;}}
// marqueurs d'objectif (leviers, runes, sceaux) avec leur progression
function drawMark(mk,i,T,gg){const g=gg||ctx,x=(mk.x+.5)*TS,y=(mk.y+.5)*TS;const v=(G.gp&&G.gp[i])||0,done=v>=1;
  if(!done){g.strokeStyle='rgba(240,201,90,'+(.35+.25*Math.sin(T*4))+')';g.lineWidth=2;g.setLineDash([5,4]);g.lineDashOffset=-T*12;g.beginPath();g.arc(x,y,30,0,6.28);g.stroke();g.setLineDash([])}
  if(v>0&&!done){g.strokeStyle='#f0c95a';g.lineWidth=4;g.beginPath();g.arc(x,y,30,-1.57,-1.57+6.283*v);g.stroke()}
  dshadow(g,x+4,y+10,12,4);
  if(mk.k==='levier'){prism(g,x-10,y+2,20,8,10,'#5a5246');g.save();g.translate(x,y);g.rotate(done?.7:-.7);g.fillStyle='#6b4a28';g.fillRect(-1.5,-22,3,22);g.fillStyle='#e0b23a';g.beginPath();g.arc(0,-22,4,0,6.28);g.fill();g.restore();
    if(done){g.fillStyle='rgba(127,224,122,.8)';g.beginPath();g.arc(x+12,y-14,3,0,6.28);g.fill()}}
  else if(mk.k==='rune'){const c=mk.c||'#7ff0e8';poly(g,[x-9,y+8,x-7,y-24,x,y-30,x+7,y-24,x+9,y+8],done?'#b8b2a4':'#8a8478');poly(g,[x,y-30,x+7,y-24,x+9,y+8,x,y+8],done?'#8a8478':'#6a645a');
    g.save();if(done){g.shadowColor=c;g.shadowBlur=14}g.strokeStyle=done?c:'rgba(60,60,60,.7)';g.lineWidth=2;g.beginPath();g.moveTo(x-3,y-18);g.lineTo(x+3,y-10);g.lineTo(x-3,y-4);g.moveTo(x,y-22);g.lineTo(x,y);g.stroke();g.restore()}
  else if(mk.k==='sceau'){const c=mk.c||'#b98cff';cyl(g,x,y+6,12,10,'#3a3448','#4a4058');g.save();g.shadowColor=c;g.shadowBlur=done?16:4;g.fillStyle=done?c:shade(c,-.55);g.translate(x,y-8);g.rotate(.785);g.fillRect(-6,-6,12,12);g.restore();
    if(done){g.globalAlpha=.25+.15*Math.sin(T*3);const gr=g.createLinearGradient(x,y-90,x,y);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,c);g.fillStyle=gr;g.fillRect(x-6,y-90,12,90);g.globalAlpha=1}}}
