/* ================= Construction du monde continu (à partir de la carte) ================= */
/* Codes de terrain : 0 mer, 1 rivière, 2 herbe, 3 terre sèche, 4 forêt, 5 montagne, 6 neige, 7 route, 8 pont, 9 plage, 10 pavé, 11 marais */
const T_SOLID=[1,1,0,0,0,1,0,0,0,0,0,0];
const T_BLOCK=[0,0,0,0,0,1,0,0,0,0,0,0];
/* objets : 1 pin, 2 chêne, 3 pin enneigé, 4 rocher, 5 saule, 6 pierre levée, 7 mur */
let WORLD=null;
function buildWorld(){
  const W=WD.w,H=WD.h,N=W*H,t=new Uint8Array(N);
  {const b=atob(WD.rle);let p=0;for(let i=0;i<b.length;i+=2){const v=b.charCodeAt(i),n=b.charCodeAt(i+1);t.fill(v,p,p+n);p+=n}}
  // Pont de Lathandre : un vrai tablier de pierre de 3 cases de large, d'une rive à l'autre
  const BR=(()=>{const[px,py]=PL.pont;const x0=px-2,x1=px+3,y0=py-1,y1=py+1,I=(x,y)=>y*W+x;
    for(let y=y0-3;y<=y1+3;y++)for(let x=x0-6;x<=x1+8;x++){if(t[I(x,y)]===8)t[I(x,y)]=x<x0?7:10}
    for(let y=y0;y<=y1;y++){for(let x=x0;x<=x1;x++)t[I(x,y)]=8;t[I(x0-1,y)]=7;t[I(x1+1,y)]=10;t[I(x1+2,y)]=10}
    for(let x=x0;x<=x1;x++){t[I(x,y0-1)]=0;t[I(x,y1+1)]=0;t[I(x,y1+2)]=0}
    return{x0,x1,y0,y1}})();
  const sol=new Uint8Array(N),blk=new Uint8Array(N),obj=new Uint8Array(N),clear=new Uint8Array(N),deco=new Uint8Array(N);
  for(let i=0;i<N;i++){sol[i]=T_SOLID[t[i]];blk[i]=T_BLOCK[t[i]]}
  const idx=(x,y)=>y*W+x,inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
  const clearDisk=(cx,cy,r)=>{for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if(inb(x,y)&&(x-cx)**2+(y-cy)**2<=r*r)clear[idx(x,y)]=1};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=t[idx(x,y)];if(v===7||v===8||v===10)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(inb(x+dx,y+dy))clear[idx(x+dx,y+dy)]=1}
  for(const k in TOWNS)clearDisk(PL[k][0],PL[k][1],13);
  for(const k of['start','pont','silverwoods','firsttear','montsoublies','karazankor','karaznema','karazakarak','karazkadrin'])clearDisk(PL[k][0],PL[k][1],6);
  const builds=[],inter=[],npcs=[],occ=new Uint8Array(N);
  const passT=v=>v!==0&&v!==1&&v!==5&&v!==8;
  function fits(x,y,w,h,noRoad){for(let yy=y-1;yy<=y+h;yy++)for(let xx=x-1;xx<=x+w;xx++){if(!inb(xx,yy))return false;const i=idx(xx,yy);if(occ[i])return false;
      const inside=xx>=x&&xx<x+w&&yy>=y&&yy<y+h;if(inside&&(!passT(t[i])||(noRoad&&t[i]===7)))return false}
    const dx=x+(w>>1),dy=y+h;if(!inb(dx,dy)||!passT(t[idx(dx,dy)]))return false;
    // parvis de la porte : 3 de large, libre sur 4 rangs (aucun toit ne le cache), praticable au milieu
    for(let ay=dy;ay<=dy+3;ay++)for(let ax=dx-1;ax<=dx+1;ax++){if(!inb(ax,ay)||occ[idx(ax,ay)])return false;if(ax===dx&&ay<=dy+2&&!passT(t[idx(ax,ay)]))return false}
    return true}
  function put(kind,x,y,w,h,label,act,extra){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const i=idx(xx,yy);occ[i]=1;sol[i]=1;blk[i]=1;obj[i]=0}
    const b=Object.assign({kind,x,y,w,h,label:label||'',act:act||null,door:{x:x+(w>>1),y:y+h}},extra||{});builds.push(b);
    for(let ay=b.door.y;ay<=b.door.y+2;ay++)for(let ax=b.door.x-1;ax<=b.door.x+1;ax++)if(inb(ax,ay)){occ[idx(ax,ay)]=1;clear[idx(ax,ay)]=1}
    if(act){inter.push({x:(b.door.x+.5)*TS,y:(b.door.y+.3)*TS,r:30,kind:act.startsWith('talk')||act.startsWith('closed')?'talk':'door',act,label,b});clear[idx(b.door.x,b.door.y)]=1}
    return b}
  function placeNear(cx,cy,kind,label,act,extra,pref){const[w,h]=BSIZE[kind]||[3,2];
    const cand=[];for(let dy=-13;dy<=13;dy++)for(let dx=-13;dx<=13;dx++){const d=dx*dx+dy*dy;if(d<4||d>170)continue;cand.push([d+(pref&&dy>0?60:0),dx,dy])}
    cand.sort((a,b)=>a[0]-b[0]);
    for(const[,dx,dy]of cand){const x=cx+dx-(w>>1),y=cy+dy-(h>>1);if(fits(x,y,w,h,true))return put(kind,x,y,w,h,label,act,extra)}
    for(const[,dx,dy]of cand){const x=cx+dx-(w>>1),y=cy+dy-(h>>1);if(fits(x,y,w,h,false))return put(kind,x,y,w,h,label,act,extra)}
    return null}
  // villes
  for(const k in TOWNS){const T=TOWNS[k],[cx,cy]=PL[k];const list=[...T.b].sort((a,b)=>(BSIZE[b[0]][0]*BSIZE[b[0]][1])-(BSIZE[a[0]][0]*BSIZE[a[0]][1]));
    for(const[kind,label,act]of list){const b=placeNear(cx,cy,kind,label,act,{town:k,roof:T.roof},kind==='keep'||kind==='palais');if(b&&act&&act.startsWith('house:')){const kind2=act.slice(6);b.hid=k+'_'+kind2;const na='house:'+kind2+':'+b.hid+':'+Math.round((b.door.x+.5)*TS)+':'+Math.round((b.door.y+.95)*TS);const it=inter.find(o=>o.b===b);b.act=na;if(it)it.act=na}}
    if(T.walls){const R=T.walls+2;for(let y=cy-R-1;y<=cy+R+1;y++)for(let x=cx-R-1;x<=cx+R+1;x++){if(!inb(x,y))continue;const d=Math.hypot(x-cx,y-cy);if(Math.abs(d-R)>.55)continue;const i=idx(x,y);
      if(t[i]===7||t[i]===8||occ[i]||!passT(t[i]))continue;let nearRoad=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(inb(x+dx,y+dy)&&t[idx(x+dx,y+dy)]===7)nearRoad=true;if(nearRoad)continue;
      obj[i]=7;sol[i]=1;blk[i]=1;occ[i]=1}}}
  // vie dans les villes : tonneaux, rondins, caisses, charrettes, lanternes, clôtures
  {const R=mulberry(99);const freeT=(x,y)=>inb(x,y)&&passT(t[idx(x,y)])&&t[idx(x,y)]!==7&&t[idx(x,y)]!==10&&!occ[idx(x,y)]&&!sol[idx(x,y)];
    const nearRoad=(x,y)=>{for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(inb(x+dx,y+dy)&&t[idx(x+dx,y+dy)]===7)return true;return false};
    const drop=(x,y,k)=>{const i=idx(x,y);obj[i]=k;sol[i]=1;blk[i]=0;occ[i]=1};
    for(const k of Object.keys(TOWNS).concat(['start','pont'])){const[cx,cy]=PL[k];let n=0,lamps=0;
      for(let a=0;a<500&&(n<12||lamps<5);a++){const x=cx+ri(R,-12,12),y=cy+ri(R,-11,11);if(!freeT(x,y))continue;const nb=builds.some(b=>x>=b.x-1&&x<=b.x+b.w&&y>=b.y-1&&y<=b.y+b.h+1&&!(x>=b.door.x-1&&x<=b.door.x+1&&y===b.door.y));
        if(nearRoad(x,y)&&lamps<5&&R()<.5){if(Math.abs(x-cx)+Math.abs(y-cy)>3){drop(x,y,10);lamps++}continue}
        if(n<12&&(nb||R()<.25)&&!nearRoad(x,y)){drop(x,y,[8,9,11,12,13,8,11][Math.floor(R()*7)]);n++}}}}
  // monuments de l'histoire
  const mon=(k,kind,label,act,w,h,ox,oy)=>{const[cx,cy]=PL[k];for(let r=0;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=cx+dx+(ox||0)-(w>>1),y=cy+dy+(oy||0)-h;if(fits(x,y,w,h,false))return put(kind,x,y,w,h,label,act)}return null};
  const kz=mon('karazankor','porte','Karaz Ankor','dun:karazankor',3,2);
  for(const k of['karaznema','karazakarak','karazkadrin'])mon(k,'porte',({karaznema:'Karaz Nema',karazakarak:'Karaz A’Karak',karazkadrin:'Karaz Kadrin'})[k],'talk:nains',3,2);
  const cave=mon('firsttear','grotte','L’antre de Virganth','dun:antre',3,2);
  const pg=mon('montsoublies','sceau','La plus profonde montagne','dun:prison',3,2);
  // l'arène d'Abhorash : un cercle de pierres levées dans les Silverwoods
  const[ax,ay]=PL.silverwoods;clearDisk(ax,ay,7);
  for(let k=0;k<10;k++){const a=k/10*6.283,x=Math.round(ax+Math.cos(a)*5),y=Math.round(ay+Math.sin(a)*4);if(inb(x,y)&&passT(t[idx(x,y)])&&k!==2){const i=idx(x,y);obj[i]=6;sol[i]=1;blk[i]=0;occ[i]=1}}
  const arena={x:(ax+.5)*TS,y:(ay+.5)*TS};
  inter.push({x:arena.x,y:arena.y,r:60,kind:'arena',act:'arena',label:'L’arène des Silverwoods'});
  // personnages
  const npc=(id,who,tx,ty,act,label)=>{for(let r=0;r<6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=tx+dx,y=ty+dy;if(inb(x,y)&&!sol[idx(x,y)]&&passT(t[idx(x,y)])){const n={id,who,x:(x+.5)*TS,y:(y+.5)*TS};npcs.push(n);inter.push({x:n.x,y:n.y,r:40,kind:'talk',act,label,npc:n});return n}}};
  npc('virganth','virganth',PL.start[0]+1,PL.start[1]-4,'talk:virganth','Virganth');
  npc('garde','garde',PL.pont[0]+5,PL.pont[1]+2,'talk:garde','Garde du Conseil');
  if(kz)npc('grinmir','grinmir',kz.door.x+3,kz.door.y,'talk:grinmir','Grinmir Thunderhammer');
  if(cave)npc('virganth2','virganth',cave.door.x-4,cave.door.y,'talk:virganth','Virganth');
  // végétation et rochers (déterministe)
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=idx(x,y);if(clear[i]||occ[i]||sol[i])continue;const v=t[i],h=hash2(x,y,7),h2=hash2(x,y,13);
    if(v===4){if(h<.36)obj[i]=h2<.75?1:2}
    else if(v===6){if(h<.34)obj[i]=3}
    else if(v===2){if(h<.022)obj[i]=2;else if(h<.03)obj[i]=1;else if(h<.09)deco[i]=1;else if(h<.13)deco[i]=2}
    else if(v===3){if(h<.012)obj[i]=4;else if(h<.04)deco[i]=3}
    else if(v===11){if(h<.12)obj[i]=5;else if(h<.3)deco[i]=4}
    else if(v===9){if(h<.02)deco[i]=5}
    if(obj[i]&&obj[i]!==6)sol[i]=1}
  // camps d'ennemis
  const camps=[];{const R=mulberry(777);const far=(x,y,r,pts)=>pts.every(p=>(p[0]-x)**2+(p[1]-y)**2>r*r);
    const towns=Object.keys(TOWNS).map(k=>PL[k]).concat([PL.start,PL.pont]);let wild=0;
    for(let n=0;n<6000&&camps.length<170;n++){const x=ri(R,2,W-3),y=ri(R,2,H-3),i=idx(x,y);const v=t[i];if(!passT(v)||v===7||v===10||sol[i]||clear[i])continue;
      if(!far(x,y,15,towns)||!far(x,y,20,[PL.start]))continue;if(!camps.every(c=>(c.x-x)**2+(c.y-y)**2>121))continue;
      const rg=regionAt(x,y);if(!rg.mobs.length)continue;if(rg.id==='wild'&&++wild>3)continue;
      const tot=rg.mobs.reduce((a,b)=>a+b[1],0),pick=()=>{let q=R()*tot;for(const[k,w]of rg.mobs){if((q-=w)<0)return k}return rg.mobs[0][0]};
      const n2=3+Math.floor(R()*3),mobs=[];for(let k=0;k<n2;k++)mobs.push(pick());
      camps.push({id:camps.length,x,y,lv:rg.lv,mobs,elite:R()<.14,reg:rg.id})}}
  // coffres dans la nature
  const chests=[];{const R=mulberry(4242);for(let n=0;n<3000&&chests.length<48;n++){const x=ri(R,2,W-3),y=ri(R,2,H-3),i=idx(x,y);const v=t[i];if(!passT(v)||v===7||v===10||sol[i]||occ[i])continue;
    if(!chests.every(c=>(c.x-x)**2+(c.y-y)**2>196))continue;if((x-PL.start[0])**2+(y-PL.start[1])**2<64)continue;chests.push({id:1000+chests.length,x,y,locked:R()<.3,vault:false})}}
  const st=PL.start;
  // route dégagée du camp de départ jusqu'au pont (aucun objet ne bloque le passage)
  for(let y=BR.y0;y<=BR.y1;y++)for(let x=Math.min(PL.start[0],BR.x0)-1;x<=BR.x1+3;x++){const i=idx(x,y);if(obj[i]){obj[i]=0;sol[i]=T_SOLID[t[i]];blk[i]=T_BLOCK[t[i]]}}
  // accessibilité garantie : toute porte (villes, donjons, monuments) est reliée à pied au départ ;
  // sinon on ouvre un col au plus court à travers montagnes, arbres et rochers (jamais la mer)
  {const free=i=>!sol[i];const reach=new Uint8Array(N);const fill=(sx,sy)=>{const q=[idx(sx,sy)];reach[q[0]]=1;
      while(q.length){const i=q.pop(),x=i%W,y=(i/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(!reach[j]&&free(j)){reach[j]=1;q.push(j)}}}};
    fill(st[0],st[1]);
    const open=i=>{if(t[i]===5||t[i]===1)t[i]=3;obj[i]=0;sol[i]=T_SOLID[t[i]];blk[i]=T_BLOCK[t[i]]};
    for(const b of builds){if(!b.act)continue;const d=idx(b.door.x,b.door.y);if(reach[d])continue;
      // plus court chemin (on évite la mer et les bâtiments ; montagne et forêt coûtent plus)
      const dist=new Float32Array(N).fill(1e9),prev=new Int32Array(N).fill(-1),q=[[0,d]];dist[d]=0;let hit=-1;
      while(q.length){q.sort((a,c)=>c[0]-a[0]);const[cd,i]=q.pop();if(cd>dist[i])continue;if(reach[i]){hit=i;break}const x=i%W,y=(i/W)|0;
        for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(t[j]===0||(occ[j]&&sol[j]))continue;
          const c=cd+(free(j)?1:t[j]===5?4:2);if(c<dist[j]){dist[j]=c;prev[j]=i;q.push([c,j])}}}
      if(hit<0)continue;for(let i=hit;i!==-1;i=prev[i])if(!free(i))open(i);fill(b.door.x,b.door.y)}}
  WORLD={kind:'world',bridge:BR,W,H,t,sol,blk,obj,deco,clear,builds,inter,npcs,camps,chests,arena,spikes:[],plates:[],crates:[],torches:[],props:[],rooms:[],stairs:null,boss:false,
    start:{x:(st[0]+.5)*TS,y:(st[1]+.5)*TS},chunks:new Map()};
  return WORLD}
/* Points d'apparition sûrs dans le monde */
function worldFree(tx,ty){const m=WORLD;for(let r=0;r<12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=tx+dx,y=ty+dy;if(x<1||y<1||x>=m.W-1||y>=m.H-1)continue;const i=y*m.W+x;if(!m.sol[i])return{x:(x+.5)*TS,y:(y+.5)*TS}}return{x:(tx+.5)*TS,y:(ty+.5)*TS}}
function placePx(id){if(id==='everwatch'){const b=WORLD.builds.find(b=>b.act==='dun:everwatch');return b?{x:(b.door.x+.5)*TS,y:(b.door.y+.5)*TS}:null}
  if(id==='arena')return WORLD.arena;
  const map={karazankor:'dun:karazankor',antre:'dun:antre',prison:'dun:prison'};if(map[id]){const b=WORLD.builds.find(b=>b.act===map[id]);return b?{x:(b.door.x+.5)*TS,y:(b.door.y+.5)*TS}:null}
  if(PL[id])return{x:(PL[id][0]+.5)*TS,y:(PL[id][1]+.5)*TS};return null}

/* ================= Intérieurs : maisons (auberge, marchand, forge) ================= */
function buildHouse(kind,hid,exitTo){const W=11,H=9,t=new Uint8Array(W*H).fill(1);for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)t[y*W+x]=0;t[(H-1)*W+5]=0;
  const furn=[];const solidAt=(x,y)=>{t[y*W+x]=6};
  if(kind==='auberge'){for(const[x,y]of[[2,2],[2,4],[8,2]]){furn.push({k:'lit',x,y});solidAt(x,y)}furn.push({k:'feu',x:5,y:1});furn.push({k:'table',x:7,y:5});solidAt(7,5);furn.push({k:'comptoir',x:4,y:3});solidAt(4,3);solidAt(5,3);solidAt(6,3)}
  if(kind==='marchand'){furn.push({k:'etagere',x:2,y:1});furn.push({k:'etagere',x:7,y:1});furn.push({k:'comptoir',x:4,y:3});solidAt(4,3);solidAt(5,3);solidAt(6,3);furn.push({k:'tonneau',x:2,y:5});solidAt(2,5);furn.push({k:'tonneau',x:8,y:5});solidAt(8,5)}
  if(kind==='forge'){furn.push({k:'four',x:2,y:1});furn.push({k:'enclume',x:5,y:3});solidAt(5,3);furn.push({k:'armes',x:8,y:1});furn.push({k:'tonneau',x:8,y:5});solidAt(8,5)}
  const npcPos={auberge:[5,2],marchand:[5,2],forge:[6,2]}[kind];
  const who={auberge:'aubergiste',marchand:'marchand',forge:'forgeron'}[kind];
  const m={kind:'house',hk:kind,hid,W,H,t,pal:4,furn,rooms:[],chests:[],crates:[],plates:[],spikes:[],torches:[{x:2,y:0},{x:8,y:0}],props:[],stairs:null,boss:false,
    start:{x:5.5*TS,y:(H-2+.5)*TS},exitTo,npcs:[{id:'pnj',who,x:(npcPos[0]+.5)*TS,y:(npcPos[1]+.5)*TS}],theme:4};
  // clients de l'auberge : ils lancent une blague ou un conseil quand on passe à côté
  if(kind==='auberge')for(const[id,w,x,y]of[['c1','buveur',6,5],['c2','barde',8,6.2],['c3','conteur',2.6,6]])m.npcs.push({id,who:w,x:(x+.5)*TS,y:(y+.5)*TS,patron:1});
  const town=hid.split('_')[0];
  m.inter=[{x:m.npcs[0].x,y:m.npcs[0].y+TS*1.2,r:44,kind:'talk',act:'shop:'+kind,label:({auberge:'Parler à l’aubergiste',marchand:'Voir le marchand',forge:'Voir le forgeron'})[kind],town},
    {x:5.5*TS,y:(H-1+.2)*TS,r:30,kind:'door',act:'exit',label:'Sortir'}];
  return m}
