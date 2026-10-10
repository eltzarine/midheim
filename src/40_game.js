/* ================= État global ================= */
let mode='menu';           // menu | solo | host | joining | guest
let hero=null,ST=null,selCls='guerrier',myName='Héros';
let G=null,L=null,myIdx=0,paused=false;
let room=null,peers=[],myPeer=null,hostPeer=null,hostGoneAt=0,lastStateObj=null,joinT=0;
const Gn={};
let parts=[],lastFx=-1,lastMsg=-1,saveT=0;
function newWorld(){return{zd:'',ep:0,time:0,m:null,lv:1,enemies:[],projs:[],drops:[],fx:[],fxId:0,msgs:[],msgId:0,opened:new Set(),wOpened:new Set(),crates:[],platesOn:[],gateOpen:false,key:0,stairsOpen:false,stairsT:0,zones:[],fires:[],xpTot:0,players:[],defT:0,dc:0,eid:1,dropId:1,flow:null,flowT:0,
  gain:{g:[0,0],pt:[0,0],gm:[0,0],sh:[0,0]},guestPeer:null,guestPres:null,coop:false,cool:{},emap:new Map(),q:0,fl:new Set(),night:0,dun:null,camps:[],campT:0,qT:0,reinOn:false,abhOn:false}}
function newLocal(){return{x:0,y:0,cdA:0,cd:[0,0,0,0],mp:ST.mmp,ult:0,aim:0,face:0,dashT:0,dvx:0,dvy:0,ivT:0,buffT:0,stealthT:0,swing:0,swingA:0,ac:0,sk:[0,0,0,0],pc:0,lu:0,bc:-1,it:0,ia:'',mv:[0,0],reg:'',wpT:0}}
function mkPlayer(name,cls,st){return{name,cls,st,hp:st.mhp,mhp:st.mhp,x:0,y:0,rx:0,ry:0,down:false,rev:0,drT:0,mv:[0,0],aim:0,iv:0,ivT:0,spCd:0,ac:null,sk:null,pc:null,lu:null,it:null,
  shield:0,shieldT:0,tauntT:0,criT:0,stealthT:0,stormT:0,stormCd:0,kelCd:0}}

/* ================= Zones ================= */
// la description d'une zone peut venir du réseau : on la valide avant de construire quoi que ce soit
function zoneFromDesc(zd){const a=String(zd||'').slice(0,120).split(':');const num=(v,lo,hi)=>clamp(Math.floor(+v)||0,lo,hi);
  if(a[0]==='d'&&Object.prototype.hasOwnProperty.call(DUNGEONS,a[1])){a[2]=num(a[2],0,DUNGEONS[a[1]].floors-1);a[3]=num(a[3],0,1e9);a[4]=num(a[4],1,99)}
  else if(a[0]==='h'&&/^(auberge|forge|marchand|maison)$/.test(a[1])&&/^[a-z0-9_]{1,40}$/.test(a[2]||'')){a[3]=num(a[3],0,1e5);a[4]=num(a[4],0,1e5)}
  else a[0]='w';
  if(a[0]==='w'){if(!WORLD)buildWorld();return WORLD}
  if(a[0]==='d'){const m=genDungeon2(a[1],+a[2],+a[3],+a[4]);m.kind='dun';m.did=a[1];m.idx=+a[2];m.lv=+a[4];m.mapCv=renderDun(m);{const s=m.start,tx=Math.floor(s.x/TS),ty=Math.floor(s.y/TS);const dy=m.t[(ty+1)*m.W+tx]===0?TS:0;m.leave={x:s.x,y:s.y+dy};m.inter=[{x:s.x,y:s.y+dy,r:26,kind:'door',act:'leave',label:'Quitter le donjon'}]}return m}
  if(a[0]==='h'){const m=buildHouse(a[1],a[2],{x:+a[3],y:+a[4]});m.mapCv=renderMap(m);return m}
  return WORLD}
function zoneName(m){if(!m)return'';if(m.kind==='world'){const r=regionAt(Math.floor(L.x/TS),Math.floor(L.y/TS));return r.nom}
  if(m.kind==='dun'){const s=DUNGEONS[m.did];return s.fl[m.idx]||s.nom}
  if(m.kind==='house'){const b=WORLD&&WORLD.builds.find(b=>b.hid===m.hid);return b?b.label:'Intérieur'}return''}

/* ================= Collisions ================= */
function tileAt(tx,ty){const m=G.m;if(tx<0||ty<0||tx>=m.W||ty>=m.H)return 1;return m.t[ty*m.W+tx]}
function crateAt(tx,ty){for(const c of G.crates)if(c.x===tx&&c.y===ty)return c;return null}
function solid(tx,ty){const m=G.m;if(tx<0||ty<0||tx>=m.W||ty>=m.H)return true;if(m.kind==='world')return m.sol[ty*m.W+tx]===1;const v=m.t[ty*m.W+tx];if(v===1||v===6||v===7)return true;if(v===2&&!G.gateOpen)return true;return!!crateAt(tx,ty)}
function shotBlock(tx,ty){const m=G.m;if(tx<0||ty<0||tx>=m.W||ty>=m.H)return true;if(m.kind==='world')return m.blk[ty*m.W+tx]===1;const v=m.t[ty*m.W+tx];return v===1||(v===2&&!G.gateOpen)||!!crateAt(tx,ty)}
function hits(x,y,r){const a=Math.floor((x-r)/TS),b=Math.floor((x+r)/TS),c=Math.floor((y-r)/TS),d=Math.floor((y+r)/TS);for(let ty=c;ty<=d;ty++)for(let tx=a;tx<=b;tx++)if(solid(tx,ty))return true;return false}
function moveBody(o,dx,dy,r){const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/6)),sx=dx/n,sy=dy/n;let bl=false;for(let i=0;i<n;i++){o.x+=sx;if(hits(o.x,o.y,r)){o.x-=sx;bl=true}o.y+=sy;if(hits(o.x,o.y,r)){o.y-=sy;bl=true}}return bl}
function los(x1,y1,x2,y2){const d=Math.hypot(x2-x1,y2-y1),n=Math.ceil(d/12);for(let i=1;i<n;i++)if(shotBlock(Math.floor((x1+(x2-x1)*i/n)/TS),Math.floor((y1+(y2-y1)*i/n)/TS)))return false;return true}
function freeNear(x,y,minD,maxD){for(let k=0;k<40;k++){const a=Math.random()*6.283,d=minD+Math.random()*(maxD-minD),nx=x+Math.cos(a)*d,ny=y+Math.sin(a)*d;if(!hits(nx,ny,11))return{x:nx,y:ny}}return{x,y}}

/* ================= Hôte : messages et effets ================= */
function fx(k,x,y,v,o){G.fx.push({id:G.fxId++,k,x,y,v:v||0,o:o==null?-1:o,t:G.time});if(G.fx.length>48)G.fx.splice(0,G.fx.length-48)}
function msg(text,key,cd){if(key){const c=G.cool[key]||0;if(G.time<c)return;G.cool[key]=G.time+(cd||4)}G.msgs.push([G.msgId++,text]);if(G.msgs.length>5)G.msgs.shift()}
function storyEvent(k){if(!STORY[k])return;queueStoryKey(k);fx(25,0,0,STORY_ORDER.indexOf(k))}
function setQ(n,k){if(n<=G.q)return;G.q=n;if(mode!=='guest'){hero.q=Math.max(hero.q,n);doSave(true)}if(k)storyEvent(k);msg('Nouvel objectif : '+OBJ[Math.min(n,6)].t)}
const partyLv=()=>Math.max(1,Math.round(G.players.reduce((a,p)=>a+(p.lvl||1),0)/Math.max(1,G.players.length)));

/* ================= Hôte : changer de zone ================= */
function hostEnter(zd,pos,opt){opt=opt||{};G.zd=zd;G.m=zoneFromDesc(zd);G.ep++;
  G.enemies=[];G.projs=[];G.drops=[];G.zones=[];G.fires=[];G.opened=G.m.kind==='world'?G.wOpened:new Set();G.gateOpen=false;G.key=0;G.stairsOpen=false;G.stairsT=0;G.defT=0;G.flow=null;G.reinOn=false;G.abhOn=false;
  G.crates=(G.m.crates||[]).map(c=>({x:c.x,y:c.y,ox:c.x,oy:c.y,rx:c.x,ry:c.y,pushT:0,stuckT:0}));G.platesOn=(G.m.plates||[]).map(()=>0);
  goalInit();if(G.m.kind==='dun'){G.lv=G.m.lv;for(const s of G.m.spawns)spawnEnemy(s.type,s.x,s.y,s.elite,false,s.bv,G.m.lv)}
  if(G.m.kind==='world'){G.camps.forEach(c=>{if(c.state==='live')c.state='idle'});if(G.night&&!G.fl.has('rein'))G.night=0}
  const p0=pos||G.m.start;
  G.players.forEach((p,i)=>{const q=i===0?p0:freeSpot(p0.x+36,p0.y);p.x=p.rx=q.x;p.y=p.ry=q.y;if(opt.heal||p.down){p.down=false;p.hp=p.mhp}p.rev=0});
  L.x=p0.x;L.y=p0.y;L.dashT=0}
function freeSpot(x,y){if(!hits(x,y,11))return{x,y};for(let r=TS;r<6*TS;r+=TS/2)for(let a=0;a<6.28;a+=.6){const nx=x+Math.cos(a)*r,ny=y+Math.sin(a)*r;if(!hits(nx,ny,11))return{x:nx,y:ny}}return{x,y}}

/* ================= Ennemis ================= */
function spawnEnemy(type,x,y,elite,minion,bvo,lv){const D=EN[type];lv=lv||G.lv||1;const bv=bvo??0;const hm=(1+.3*(lv-1))*(G.coop?1.45:1)*(elite?2.6:1)*(type==='boss'?(1+.12*lv)*BOSSES[bv].hp:1);
  const e={id:G.eid++,type,lv,x,y,rx:x,ry:y,hx:x,hy:y,hp:D.hp*hm,mhp:D.hp*hm,r:D.r,spd:D.spd*(elite?1.1:1),dmg:D.dmg*(1+.15*(lv-1))*(elite?1.3:1),xp:Math.round(D.xp*(1+.12*(lv-1))*(elite?2.5:1)),
    act:!!minion,cd:1+Math.random()*1.5,frz:0,tele:0,chg:0,cvx:0,cvy:0,ccd:1.5,flash:0,elite:!!elite,minion:!!minion,kx:0,ky:0,wob:Math.random()*6,hitCd:0,t1:2,t2:3,t3:9,t4:7,burn:0,burnD:0,burnP:0};
  if(type==='boss'){e.bv=bv;if(bv===5){e.act=true;e.t4=4}}if(elite&&type!=='orc')e.r=Math.round(e.r*1.4);
  G.enemies.push(e);return e}
function buildFlow(){const m=G.m;const W=m.W;if(!G.flow||G.flow.length!==m.W*m.H)G.flow=new Int16Array(m.W*m.H);const F=G.flow;
  if(m.kind==='world'){if(G.flowCells)for(const i of G.flowCells)F[i]=32767;else F.fill(32767)}else F.fill(32767);
  const q=[];let h=0;const cells=[];
  for(const p of G.players){if(p.down)continue;const tx=Math.floor(p.x/TS),ty=Math.floor(p.y/TS),i=ty*W+tx;if(i>=0&&i<F.length&&F[i]!==0){F[i]=0;q.push(i);cells.push(i)}}
  while(h<q.length){const i=q[h++],x=i%W,y=(i/W)|0,v=F[i]+1;if(v>40)continue;
    for(const[nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(solid(nx,ny))continue;const j=ny*W+nx;if(F[j]>v){if(F[j]===32767)cells.push(j);F[j]=v;q.push(j)}}}
  G.flowCells=cells}
function flowDir(e,away){const m=G.m,F=G.flow;if(!F)return null;const tx=Math.floor(e.x/TS),ty=Math.floor(e.y/TS);const cur=F[ty*m.W+tx];let bx=0,by=0,bv=cur,ok=false;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=tx+dx,ny=ty+dy;if(solid(nx,ny))continue;if(dx&&dy&&(solid(tx+dx,ty)||solid(tx,ty+dy)))continue;const v=F[ny*m.W+nx];
    if(away?(v>bv&&v<32767):(v<bv)){bv=v;bx=nx;by=ny;ok=true}}
  if(!ok)return null;const vx=(bx+.5)*TS-e.x,vy=(by+.5)*TS-e.y,l=Math.hypot(vx,vy)||1;return{x:vx/l,y:vy/l}}

/* ================= Dégâts ================= */
function pInv(i){const p=G.players[i];if(!p)return true;if(i===0&&mode!=='guest')return L.ivT>0||p.ivT>0;return!!p.iv||p.ivT>0}
function hurt(p,dmg,src){const i=G.players.indexOf(p);if(p.down||i<0||pInv(i))return;const st=p.st||{};
  dmg*=Sky.mul()*(1-(st.arm||0))*(p.drT>0?.5:1)*(p.criT>0?.75:1)*(st.ae==='lath'?.88:1);dmg=Math.max(1,Math.round(dmg));
  if(p.shield>0){const a=Math.min(p.shield,dmg);p.shield-=a;dmg-=a;if(dmg<=0){fx(39,p.x,p.y-14,0,i);return}}
  if(src&&src.hp>0){if(st.ae==='feu'&&Math.hypot(src.x-p.x,src.y-p.y)<70)hitEnemy(src,dmg*.3,false);if(st.ae==='talos'&&Math.random()<.15){src.frz=Math.max(src.frz,1);fx(38,src.x,src.y,0)}}
  if(st.ae==='kel'&&p.hp-dmg<=0&&p.kelCd<=0){p.hp=1;p.ivT=2;p.kelCd=90;msg('Le voile de Kelemvor protège '+p.name+' !');fx(37,p.x,p.y,40,i);return}
  p.hp-=dmg;fx(9,p.x,p.y-14,dmg,i);if(p.hp>0&&p.hp<p.mhp*.3&&!p.lowSaid){p.lowSaid=true;sayP(i,'low')}
  if(p.hp<=0){p.hp=0;p.down=true;p.rev=0;p.shield=0;msg(pickL(MJ.down).replace('{n}',p.name)+(G.players.length>1?' Va le relever.':''))}}
function healP(p,v,show){if(p.down)return;const before=p.hp;p.hp=Math.min(p.mhp,p.hp+v);if(p.hp>p.mhp*.5)p.lowSaid=false;if(show&&p.hp-before>=1)fx(3,p.x,p.y-16,Math.round(p.hp-before))}
function hitEnemy(e,dmg,crit,kx,ky){if(e.hp<=0||e.mistT>0||e.ret)return;   // qui rentre à son poste esquive
  dmg/=Sky.mul();e.hp-=dmg;e.flash=.12;e.act=true;fx(crit?2:1,e.x,e.y-e.r,Math.round(dmg));if(e.type!=='boss'){e.kx+=kx||0;e.ky+=ky||0}if(e.hp<=0)killEnemy(e)}
function rollDmg(st,forced){let m=1,crit=false;if(forced){m=3;crit=true}else if(Math.random()<st.crit){m=2;crit=true}return{d:st.dmg*m*(.9+Math.random()*.2),crit}}
/* toute attaque d'un joueur passe ici : critiques, enchantements, vol de vie */
function pDmg(pi,e,mult,o){o=o||{};const p=G.players[pi];if(!p||e.hp<=0)return;const st=p.st;const r=rollDmg(st,o.forced);let d=r.d*mult*(p.criT>0?1.25:1);
  if(st.we==='kel'&&e.hp<e.mhp*.3)d*=1.3;hitEnemy(e,d,r.crit,o.kx,o.ky);
  if(!o.noEnch){if(st.we==='lath'&&Math.random()<.12)healP(p,p.mhp*.04,true);if(st.we==='feu'){e.burn=3;e.burnD=st.dmg*.35;e.burnP=pi}
    if(st.we==='talos'&&Math.random()<.15){let n=0;for(const o2 of G.enemies){if(o2===e||o2.hp<=0||n>=2)continue;if(Math.hypot(o2.x-e.x,o2.y-e.y)<140){n++;fx(40,e.x,e.y,Math.round(o2.x)*10000+Math.round(o2.y));hitEnemy(o2,d*.5,false)}}}}
  const vol=(st.vol||0)+(st.we==='kel'?.03:0);if(vol>0)healP(p,d*vol,false);
  if(r.crit&&Math.random()<.15)sayP(pi,'crit');return r}
function reinMist(e){const tp=G.players.filter(p=>!p.down)[0]||G.players[0];for(let k=0;k<30;k++){const a=Math.random()*6.28,d=(3+Math.random()*3)*TS,x=tp.x+Math.cos(a)*d,y=tp.y+Math.sin(a)*d;if(!hits(x,y,e.r*.75)&&los(tp.x,tp.y,x,y)){fx(12,e.x,e.y,30);e.x=e.rx=x;e.y=e.ry=y;break}}e.mistT=1.1;e.chg=0;e.tele=0}
function lootItem(x,y,lv,minR){const R=Math.random;let r=R()<.05?2:R()<.3?1:0;if(lv>=6&&R()<.012)r=3;r=Math.max(r,minR||0);addDrop(6,x,y,1+Math.floor(R()*99999),r,lv)}
function killEnemy(e){
  if(e.type==='boss'&&e.bv===5){if(!e.misted){e.misted=true;e.hp=e.mhp*.35;reinMist(e);sayE(e,'mist');msg('Reinald se change en brouillard… et se reforme !');return}
    e.hp=0;G.xpTot+=e.xp;fx(12,e.x,e.y,30);fx(23,e.x,e.y,0);for(let k=0;k<6;k++)addDrop(1,e.x,e.y,6+e.lv*3);addDrop(2,e.x,e.y);lootItem(e.x,e.y,e.lv,2);addDrop(7,e.x,e.y,4);
    msg(BOSSES[5].win);for(const o of G.enemies)if(o.minion&&o.hp>0)killEnemy(o);G.night=0;G.reinOn=false;G.fl.add('rein');if(mode!=='guest'&&!hero.fl.includes('rein'))hero.fl.push('rein');return}
  e.hp=0;G.xpTot+=e.xp;fx(12,e.x,e.y,e.r);const R=Math.random,lv=e.lv||1;
  if(e.type==='boss'){for(let k=0;k<10;k++)addDrop(1,e.x,e.y,8+lv*3);addDrop(5,e.x,e.y);addDrop(2,e.x,e.y);lootItem(e.x,e.y,lv,2);lootItem(e.x,e.y,lv,1);addDrop(7,e.x,e.y,5);
    for(const o of G.enemies)if(o.minion&&o.hp>0)killEnemy(o);
    if(G.m.kind==='dun'){G.stairsOpen=true;msg(BOSSES[e.bv??0].win+' Suis la flèche dorée.')}
    else{msg(BOSSES[e.bv??0].win);if(e.bv===1){G.abhOn=false;if(G.q===2)setQ(3,'stone1')}}return}
  if(e.elite){if(G.m.kind==='world')fx(43,e.x,e.y,0);for(let k=0;k<4;k++)addDrop(1,e.x,e.y,4+lv*2);lootItem(e.x,e.y,lv,1);addDrop(7,e.x,e.y,2);
    if(G.m.kind==='dun'&&G.m.goal&&G.m.goal.type==='key'&&!G.stairsOpen){addDrop(4,e.x,e.y);msg('La clé est tombée ! Ramasse-la pour ouvrir la sortie.')}return}
  if(R()<.35)addDrop(1,e.x,e.y,2+lv+Math.floor(R()*4));if(R()<.05)addDrop(2,e.x,e.y);else if(R()<.07)addDrop(3,e.x,e.y);
  if(R()<.07)lootItem(e.x,e.y,lv,0);if(R()<.03)addDrop(7,e.x,e.y,1)}
function addDrop(k,x,y,v,r,l){const a=Math.random()*6.28,s=60+Math.random()*90;G.drops.push({id:G.dropId++,k,x,y,v:v||0,r:r||0,l:l||1,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:0})}

/* ================= Attaques et compétences (exécutées par l'hôte) ================= */
function melee(i,a,range,half,mult,forced){const p=G.players[i];for(const e of G.enemies){if(e.hp<=0)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(d>range+e.r)continue;
  let da=Math.atan2(dy,dx)-a;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;if(Math.abs(da)>half&&d>e.r+8)continue;pDmg(i,e,mult,{forced,kx:dx/(d||1)*160,ky:dy/(d||1)*160})}}
function hostAttack(i,a,buffed){const p=G.players[i];if(!p||p.down)return;const c=p.cls;p.stealthT=0;
  if(c==='guerrier'){melee(i,a,58,1,1,false);fx(4,p.x,p.y,a*100,i)}
  else if(c==='voleur'){melee(i,a,48,.75,1,buffed);fx(4,p.x,p.y,a*100,i)}
  else if(c==='mage'){G.projs.push({x:p.x+Math.cos(a)*14,y:p.y+Math.sin(a)*14,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:7,from:'p',k:1,life:1.1,pi:i,splash:46})}
  else{G.projs.push({x:p.x+Math.cos(a)*14,y:p.y+Math.sin(a)*14,vx:Math.cos(a)*380,vy:Math.sin(a)*380,r:7,from:'p',k:2,life:1.1,pi:i,healed:false})}}
function segDist(px,py,ax,ay,bx,by){const vx=bx-ax,vy=by-ay,l=vx*vx+vy*vy||1;const t=clamp(((px-ax)*vx+(py-ay)*vy)/l,0,1);return Math.hypot(px-ax-vx*t,py-ay-vy*t)}
function hostSkill(i,id,a,tp){const p=G.players[i];if(!p||p.down)return;const ax=Math.cos(a),ay=Math.sin(a);tp=tp||{x:p.x+ax*170,y:p.y+ay*170};
  const around=(r,f)=>{for(const e of G.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<r+e.r)f(e,d)}};
  switch(id){
    case'charge':{const bx=p.x+ax*190,by=p.y+ay*190;for(const e of G.enemies){if(e.hp<=0)continue;if(segDist(e.x,e.y,p.x-ax*190,p.y-ay*190,bx,by)<e.r+26){pDmg(i,e,1.4,{kx:ax*300,ky:ay*300});e.frz=Math.max(e.frz,e.type==='boss'?.4:1.2)}}fx(28,p.x,p.y,Math.round(a*100),i);break}
    case'tourbillon':around(90,(e,d)=>pDmg(i,e,1.6,{kx:(e.x-p.x)/(d||1)*260,ky:(e.y-p.y)/(d||1)*260}));p.drT=2.5;fx(10,p.x,p.y,90,i);break;
    case'cri':p.tauntT=4;for(const q of G.players)if(!q.down&&Math.hypot(q.x-p.x,q.y-p.y)<320)q.criT=6;around(260,e=>{e.act=true;e.taunt=4;e.tauntP=i});fx(29,p.x,p.y,260,i);break;
    case'seisme':around(165,(e,d)=>{pDmg(i,e,3,{kx:(e.x-p.x)/(d||1)*320,ky:(e.y-p.y)/(d||1)*320});e.frz=Math.max(e.frz,e.type==='boss'?.6:1.5)});fx(30,p.x,p.y,165,i);break;
    case'nova':around(140,e=>{pDmg(i,e,1.2);e.frz=e.type==='boss'?.8:2.6});fx(6,p.x,p.y,140,i);break;
    case'transfert':around(80,e=>{e.frz=Math.max(e.frz,1.2)});fx(6,p.x,p.y,70,i);break;
    case'flammes':G.fires.push({x:tp.x,y:tp.y,r:90,t:3,tick:0,pi:i});fx(31,tp.x,tp.y,90,i);break;
    case'tempete':p.stormT=4;p.stormCd=0;fx(32,p.x,p.y,0,i);break;
    case'ombre':fx(11,p.x,p.y,0,i);break;
    case'eventail':for(let k=-3;k<=3;k++){const b=a+k*.17;G.projs.push({x:p.x+Math.cos(b)*12,y:p.y+Math.sin(b)*12,vx:Math.cos(b)*470,vy:Math.sin(b)*470,r:6,from:'p',k:5,life:.6,pi:i,mult:.8})}fx(11,p.x,p.y,0,i);break;
    case'fumee':p.stealthT=3;G.zones.push({x:p.x,y:p.y,r:105,t:4,tick:0,smoke:1});around(110,e=>{e.act=false;e.blind=2.5});fx(33,p.x,p.y,105,i);break;
    case'danse':{const T=G.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<270).sort((u,v)=>Math.hypot(u.x-p.x,u.y-p.y)-Math.hypot(v.x-p.x,v.y-p.y)).slice(0,6);
      for(const e of T){fx(34,e.x,e.y,Math.round(p.x)*10000+Math.round(p.y),i);pDmg(i,e,1.5,{forced:true})}p.ivT=1.2;break}
    case'cercle':G.zones.push({x:p.x,y:p.y,r:115,t:4,tick:0});fx(13,p.x,p.y,115,i);break;
    case'bouclier':G.players.forEach((q,j)=>{if(!q.down&&Math.hypot(q.x-p.x,q.y-p.y)<320){q.shield=Math.max(q.shield,q.mhp*.25);q.shieldT=6;fx(35,q.x,q.y,0,j)}});break;
    case'jugement':fx(36,tp.x,tp.y,100,i);for(const e of G.enemies){if(e.hp>0&&Math.hypot(e.x-tp.x,e.y-tp.y)<100+e.r){pDmg(i,e,2);e.frz=Math.max(e.frz,.6)}}G.players.forEach(q=>{if(Math.hypot(q.x-tp.x,q.y-tp.y)<110)healP(q,q.mhp*.15,true)});break;
    case'aube':G.players.forEach((q,j)=>{if(q.down){q.down=false;q.rev=0;q.hp=q.mhp*.6;msg(q.name+' est relevé par l’Aube de Lathandre !')}else healP(q,q.mhp,true);q.ivT=2;fx(14,q.x,q.y,0,j)});around(200,e=>pDmg(i,e,2));fx(37,p.x,p.y,220,i);break;
  }}
function usePotion(i){const p=G.players[i];if(!p||p.down)return;const amt=p.mhp*.4*(p.cls==='soigneur'?1.5:1)*(1+(p.st&&p.st.pb||0));healP(p,amt,true);fx(14,p.x,p.y,0,i)}
function explode(pr){for(const e of G.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-pr.x,e.y-pr.y);if(d<pr.splash+e.r&&!pr.hitIds.has(e.id)){if(!G.players[pr.pi])continue;pDmg(pr.pi,e,.6,{noEnch:true})}}fx(5,pr.x,pr.y,pr.splash)}

/* ================= Hôte : boucle du monde ================= */
function applyGuestInput(){const gp=G.players[1];if(!gp||!G.guestPres)return;const pr=G.guestPres,inp=pr.i;
  if(pr.st)applyGuestStats(gp,pr.st);gp.lvl=clamp(pr.l|0,1,99);
  if(!inp||!Array.isArray(inp.p))return;if(inp.z!==G.ep)return; // positions d'une autre zone : ignorées
  const nx=+inp.p[0],ny=+inp.p[1];if(isFinite(nx)&&isFinite(ny)&&!gp.down&&G.m){gp.x=clamp(nx,0,G.m.W*TS);gp.y=clamp(ny,0,G.m.H*TS)}
  gp.mv=Array.isArray(inp.m)?[clamp(+inp.m[0]||0,-1,1),clamp(+inp.m[1]||0,-1,1)]:[0,0];gp.aim=+inp.a||0;gp.iv=inp.iv?1:0;
  const sk=Array.isArray(inp.sk)?inp.sk.map(v=>v|0):[0,0,0,0];
  if(gp.ac==null){gp.ac=inp.ac|0;gp.sk=sk.slice();gp.pc=inp.pc|0;gp.lu=inp.lu|0;gp.it=inp.it|0}
  let n=0;while(gp.ac<(inp.ac|0)&&n++<4){gp.ac++;hostAttack(1,gp.aim,gp.ac===(inp.bc|0))}gp.ac=Math.max(gp.ac,inp.ac|0);
  const tp=Array.isArray(inp.tp)?{x:+inp.tp[0]||gp.x,y:+inp.tp[1]||gp.y}:null;
  for(let s=0;s<4;s++){n=0;while(gp.sk[s]<(sk[s]|0)&&n++<2){gp.sk[s]++;const S=SKILLS[gp.cls][s];if(S&&gp.lvl>=S.lvl)hostSkill(1,S.id,gp.aim,tp)}gp.sk[s]=Math.max(gp.sk[s],sk[s]|0)}
  n=0;while(gp.pc<(inp.pc|0)&&n++<2){gp.pc++;usePotion(1)}gp.pc=Math.max(gp.pc,inp.pc|0);
  if(gp.lu<(inp.lu|0)){gp.lu=inp.lu|0;if(!gp.down)gp.hp=gp.mhp}
  if(gp.it<(inp.it|0)){gp.it=inp.it|0;if(typeof inp.ia==='string')hostRequest(inp.ia.slice(0,80),1)}}
function hostUpdate(dt){
  G.time+=dt;updateLocal(dt);
  const me=G.players[0];me.x=L.x;me.y=L.y;me.mv=L.mv;me.aim=L.aim;me.lvl=hero.lvl;me.lk=lookOf(hero.eq);
  applyGuestInput();
  for(const p of G.players){p.drT-=dt;p.spCd-=dt;p.ivT-=dt;p.tauntT-=dt;p.criT-=dt;p.stealthT-=dt;p.kelCd-=dt;if(p.shieldT>0){p.shieldT-=dt;if(p.shieldT<=0)p.shield=0}
    if(!p.down&&p.st&&p.st.reg>0)healP(p,p.st.reg*dt,false);
    const mvv=p.mv||[0,0];p.idleT=(Math.abs(mvv[0])+Math.abs(mvv[1])>.1||p.down)?0:(p.idleT||0)+dt;if(p.idleT>12){p.idleT=-20;sayP(G.players.indexOf(p),'idle')}
    if(p.stormT>0&&!p.down){p.stormT-=dt;p.stormCd-=dt;if(p.stormCd<=0){let b=null,bd=330;for(const e of G.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd){bd=d;b=e}}
      if(b){const a=Math.atan2(b.y-p.y,b.x-p.x);G.projs.push({x:p.x,y:p.y,vx:Math.cos(a)*460,vy:Math.sin(a)*460,r:7,from:'p',k:1,life:1,pi:G.players.indexOf(p),splash:36})}p.stormCd=.22}}}
  // relever
  for(const p of G.players){if(!p.down)continue;let rate=0;for(const q of G.players){if(q===p||q.down)continue;if(Math.hypot(q.x-p.x,q.y-p.y)<48)rate=Math.max(rate,q.cls==='soigneur'?3:1)}
    for(const z of G.zones)if(!z.smoke&&Math.hypot(z.x-p.x,z.y-p.y)<z.r)rate=Math.max(rate,1.5);
    if(rate>0){p.rev+=dt*rate/2.5;if(p.rev>=1){p.down=false;p.hp=p.mhp*.4;p.rev=0;p.lowSaid=false;msg(p.name+' est relevé !');sayP(G.players.indexOf(p),'rev');fx(14,p.x,p.y,0,G.players.indexOf(p))}}else p.rev=Math.max(0,p.rev-dt*.2)}
  if(G.m.kind==='dun'){for(const p of G.players){if(p.down)continue;const tx=Math.floor(p.x/TS),ty=Math.floor(p.y/TS);if(tileAt(tx,ty)===5&&spikeUp(tx,ty)&&p.spCd<=0){hurt(p,Math.max(6,p.mhp*.1));p.spCd=.8}}}
  G.flowT-=dt;if(G.flowT<=0){buildFlow();G.flowT=G.m.kind==='world'?.5:.35}
  updEnemies(dt);updProjs(dt);updDrops(dt);updChests();if(G.m.kind==='dun'){updCrates(dt);goalUpdate(dt)}
  for(const z of G.zones){z.t-=dt;z.tick-=dt;if(!z.smoke)for(const p of G.players){if(!p.down&&Math.hypot(p.x-z.x,p.y-z.y)<z.r){healP(p,p.mhp*.09*dt,false);if(z.tick<=0)fx(3,p.x,p.y-16,Math.round(p.mhp*.045))}}if(z.tick<=0)z.tick=.5}
  G.zones=G.zones.filter(z=>z.t>0);
  for(const f of G.fires){f.t-=dt;f.tick-=dt;if(f.tick<=0){f.tick=.5;for(const e of G.enemies)if(e.hp>0&&Math.hypot(e.x-f.x,e.y-f.y)<f.r+e.r)pDmg(f.pi,e,.6,{noEnch:true})}}
  G.fires=G.fires.filter(f=>f.t>0);
  const alive=G.players.filter(p=>!p.down);
  if(G.m.kind==='dun'){const sx=G.m.stairs.x,sy=G.m.stairs.y;
    if(G.stairsOpen){if(alive.length&&alive.every(p=>Math.hypot(p.x-sx,p.y-sy)<36)){G.stairsT+=dt;if(G.stairsT>.7)dunNext()}else{G.stairsT=0;if(alive.some(p=>Math.hypot(p.x-sx,p.y-sy)<36)&&G.players.length>1)msg('Attendez-vous : les deux héros doivent être sur la sortie.','stw',5)}}
    else if(alive.some(p=>Math.hypot(p.x-sx,p.y-sy)<40))msg(goalHint(),'sts',5)}
  if(G.m.kind==='house'){const dy=(G.m.H-1)*TS;if(alive.some(p=>p.y>dy-4))hostRequest('exit',0)}
  if(G.m.kind==='world'){G.campT-=dt;if(G.campT<=0){G.campT=.5;updCamps();checkQuest()}}
  if(G.players.length&&G.players.every(p=>p.down)){G.defT+=dt;if(G.defT>2.5){G.dc++;defeat()}}else G.defT=0;
  applyGains({xp:G.xpTot,g:G.gain.g,pt:G.gain.pt,gm:G.gain.gm,sh:G.gain.sh,dc:G.dc,ep:G.ep,q:G.q});
  processFx(G.fx);processMsgs(G.msgs)}
function spikeUp(tx,ty){const sp=G.m.spikes.find(s=>s.x===tx&&s.y===ty);if(!sp)return false;return((G.time+sp.ph*.8)%2.4)<.8}
function applyGuestStats(p,s){const n=v=>isFinite(+v)?+v:0;const mhp=clamp(Math.round(n(s.mhp)),1,99999);if(mhp!==p.mhp){p.hp=p.hp*mhp/(p.mhp||mhp);p.mhp=mhp}
  const okE=v=>['lath','feu','talos','kel'].includes(v)?v:null;p.lk=clamp(Math.floor(n(s.lk)),0,200000);
  p.st={dmg:clamp(n(s.dmg),1,50000),crit:clamp(n(s.crit),0,.9),arm:clamp(n(s.arm),0,.7),vol:clamp(n(s.vol),0,.2),reg:clamp(n(s.reg),0,500),we:okE(s.we),ae:okE(s.ae),pb:clamp(n(s.pb),0,.5)}}
function defeat(){if(G.m.kind==='world'){const wp=nearestWp(Math.floor(L.x/TS),Math.floor(L.y/TS));const p=worldFree(WAYPOINTS[wp].pt[0],WAYPOINTS[wp].pt[1]);hostEnter('w',p,{heal:true});msg('Défaite… Vous vous relevez à '+WAYPOINTS[wp].nom+'.')}
  else hostEnter(G.zd,null,{heal:true}),msg(pickL(MJ.defeat))}
function nearestWp(tx,ty){let b='start',bd=1e9;for(const k of hero.wp){const w=WAYPOINTS[k];if(!w)continue;const d=(w.pt[0]-tx)**2+(w.pt[1]-ty)**2;if(d<bd){bd=d;b=k}}return b}
function dunNext(){const m=G.m,spec=DUNGEONS[m.did];if(m.idx<spec.floors-1){hostEnter('d:'+m.did+':'+(m.idx+1)+':'+((Math.random()*1e6)|0)+':'+m.lv,null);msg('Le Maître du Donjon : '+pickL(MJ.floor));return}
  const ret=G.dun&&G.dun.ret||WORLD.start;const did=m.did;hostEnter('w',ret);G.dun=null;fx(44,ret.x,ret.y,0);
  if(spec.done===G.q)setQ(G.q+1,({everwatch:'stone0',karazankor:'stone2',antre:'stone3',prison:'epilogue'})[did]);else msg(spec.nom+' : vous en ressortez plus riches.')}
/* demandes d'interaction (portes, arène, repos) : l'hôte décide */
function hostRequest(act,pi){const p=G.players[pi];if(!p||p.down)return;const m=G.m;
  if(act==='exit'){if(m.kind==='house')hostEnter('w',m.exitTo);return}
  if(act==='leave'){if(m.kind==='dun'){const ret=G.dun&&G.dun.ret||WORLD.start;hostEnter('w',ret);G.dun=null;msg('Vous quittez '+DUNGEONS[m.did].nom+'. Vous pourrez y revenir quand vous voulez.')}return}
  if(act==='rest'){G.players.forEach(q=>{if(q.down){q.down=false;q.rev=0}q.hp=q.mhp});msg('Vous vous reposez à l’auberge. Le groupe est en pleine forme.');return}
  const it=(m.inter||[]).find(o=>o.act===act&&Math.hypot(o.x-p.x,o.y-p.y)<o.r+50);if(!it)return;
  if(act.startsWith('dun:')){const id=act.slice(4),spec=DUNGEONS[id];if(G.q<spec.need){msg(lockText(id),'lk'+id,3);return}
    if(G.players.length>1&&!G.players.every(q=>!q.down&&Math.hypot(q.x-it.x,q.y-it.y)<160)){msg('Attendez-vous devant l’entrée : les deux héros doivent y être.','wait',4);return}
    const lv=Math.max(spec.lv,partyLv()+(G.q>=6?1:0));G.dun={id,ret:{x:it.x,y:it.y+TS*.9}};hostEnter('d:'+id+':0:'+((Math.random()*1e6)|0)+':'+lv,null,{heal:true});if(spec.story&&G.q===spec.need)storyEvent(spec.story);return}
  if(act.startsWith('house:')){hostEnter(act.replace('house:','h:'),null);return}
  if(act==='arena'){if(G.q>=3&&!G.abhOn)spawnAbhorash(Math.max(5,partyLv()+1));return}}
function lockText(id){return({karazankor:'Les portes de Karaz Ankor sont closes. Le Witangamot délibère.',antre:'L’entrée de l’antre est gardée par une force invisible. Pas encore.',prison:'Une porte noire à quatre emplacements. Il faut les quatre pierres.'})[id]||'Fermé.'}
function spawnAbhorash(lv){const a=WORLD.arena;const e=spawnEnemy('boss',a.x,a.y-TS,false,false,1,lv);e.act=true;G.abhOn=true;sayE(e);msg('Abhorash, le Dragon de Sang, accepte le défi.')}
function startReinald(){G.reinOn=true;G.night=1;storyEvent('reinald1');const p=G.players.find(q=>!q.down)||G.players[0];const s=freeNear(p.x,p.y,4*TS,6*TS);const e=spawnEnemy('boss',s.x,s.y,false,false,5,Math.max(4,partyLv()+1));sayE(e)}
function checkQuest(){const q=G.q,pl=G.players.filter(p=>!p.down);if(!pl.length)return;
  const near=(px,r)=>px&&pl.some(p=>Math.hypot(p.x-px.x,p.y-px.y)<r*TS);
  if(q===1&&near(placePx('lastfire'),9))setQ(2,'ch1');
  if(q===2&&!G.fl.has('rein')&&!G.reinOn){const lf=placePx('lastfire');const d=Math.hypot(pl[0].x-lf.x,pl[0].y-lf.y)/TS;if(d>14&&d<60)startReinald()}
  if(q===2&&!G.abhOn&&!G.reinOn&&near(WORLD.arena,8))spawnAbhorash(Math.max(4,partyLv()));
  if(q===3&&near(placePx('karazankor'),9))storyEvent('ch2');
  if(q===4&&near(placePx('antre'),9))storyEvent('ch3')}
/* camps : les ennemis apparaissent quand on s'approche, disparaissent quand on s'éloigne */
function updCamps(){const pl=G.players.filter(p=>!p.down);if(!pl.length)return;
  WORLD.camps.forEach((c,i)=>{const s=G.camps[i];const cx=(c.x+.5)*TS,cy=(c.y+.5)*TS;let dm=1e9;for(const p of G.players){const d=Math.hypot(p.x-cx,p.y-cy);if(d<dm)dm=d}
    if(s.state==='idle'&&dm<CAMP_WAKE*TS&&dm>7*TS){const lv=Math.max(c.lv,partyLv()-2);for(const t of c.mobs){const q=freeNear(cx,cy,0,2.5*TS);const e=spawnEnemy(t,q.x,q.y,false,false,undefined,lv);e.camp=i}
      if(c.elite){const q=freeNear(cx,cy,0,2*TS);const e=spawnEnemy(c.lv>=6?'orc':c.mobs[0],q.x,q.y,true,false,undefined,lv);e.camp=i}s.state='live'}
    else if(s.state==='live'){const al=G.enemies.some(e=>e.camp===i&&e.hp>0);if(!al){s.state='cleared';s.t=150;fx(42,cx,cy,i)}else if(dm>36*TS){G.enemies=G.enemies.filter(e=>e.camp!==i);s.state='idle'}}
    else if(s.state==='cleared'){s.t-=.5;if(s.t<=0&&dm>30*TS)s.state='idle'}})}

function updEnemies(dt){
  const alive=G.players.filter(p=>!p.down&&!(p.stealthT>0));
  for(const e of G.enemies){if(e.hp<=0)continue;e.flash-=dt;e.hitCd-=dt;e.taunt-=dt;e.blind-=dt;if(e.mistT>0){e.mistT-=dt;continue}
    if(e.burn>0){e.burn-=dt;e.hp-=e.burnD*dt;e.burnFx=(e.burnFx||0)-dt;if(e.burnFx<=0){e.burnFx=.5;fx(41,e.x,e.y-e.r,Math.round(e.burnD*.5))}if(e.hp<=0){killEnemy(e);continue}}
    if(e.ret){e.retT+=dt;const hx=e.hx-e.x,hy=e.hy-e.y,hd=Math.hypot(hx,hy);
      if(hd<TS*.6||e.retT>6){if(e.retT>6){e.x=e.hx;e.y=e.hy}e.ret=false;e.hp=e.mhp;e.burn=0;e.frz=0}
      else moveBody(e,hx/hd*e.spd*1.15*dt,hy/hd*e.spd*1.15*dt,e.r*.75);continue}
    let tp=null,td=1e9;if(e.taunt>0&&G.players[e.tauntP]&&!G.players[e.tauntP].down){tp=G.players[e.tauntP];td=Math.hypot(tp.x-e.x,tp.y-e.y)}
    else for(const p of alive){const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<td){td=d;tp=p}}
    if(!tp||e.blind>0)continue;
    if(!e.act){if(td<7*TS&&los(e.x,e.y,tp.x,tp.y)){e.act=true;if(e.type==='boss'||e.elite||Math.random()<.3)sayE(e);for(const o of G.enemies)if(!o.act&&!o.ret&&o.camp===e.camp&&Math.hypot(o.x-e.x,o.y-e.y)<4*TS)o.act=true}else continue}
    if(td>22*TS&&e.type!=='boss'){e.act=false;continue}
    if(e.act&&e.type!=='boss'&&!e.minion&&!e.wv&&e.hx!=null&&(Math.hypot(e.x-e.hx,e.y-e.hy)>LEASH*TS||td>LEASH_P*TS)){e.act=false;e.ret=true;e.retT=0}
    if(Math.abs(e.kx)+Math.abs(e.ky)>2){moveBody(e,e.kx*dt,e.ky*dt,e.r*.75);const k=Math.pow(.002,dt);e.kx*=k;e.ky*=k}
    if(e.frz>0){e.frz-=dt;continue}
    let vx=0,vy=0,sp=e.spd;const dx=tp.x-e.x,dy=tp.y-e.y;const see=td<10*TS&&los(e.x,e.y,tp.x,tp.y);
    for(const z of G.zones)if(z.smoke&&Math.hypot(z.x-e.x,z.y-e.y)<z.r)sp*=.4;
    const toward=()=>{if(td<1.6*TS&&see){vx=dx/td;vy=dy/td}else{const f=flowDir(e,false);if(f){vx=f.x;vy=f.y}else if(see){vx=dx/td;vy=dy/td}}};
    switch(e.type){
      case'mimic':toward();e.wob+=dt*9;sp*=.6+.6*Math.max(0,Math.sin(e.wob));break;
      case'slime':toward();e.wob+=dt*5;sp*=.7+.45*Math.max(0,Math.sin(e.wob));break;
      case'bat':toward();e.wob+=dt*7;vx+=Math.cos(e.wob*1.3)*.7;vy+=Math.sin(e.wob)*.7;break;
      case'archer':e.cd-=dt;e.wob+=dt*.7;if(td<3.5*TS){const f=flowDir(e,true);if(f){vx=f.x;vy=f.y}}else if(td>6.5*TS||!see)toward();else{const s=Math.sin(e.wob)>0?1:-1;vx=-dy/td*s*.6;vy=dx/td*s*.6}
        if(e.cd<=0&&see&&td<9*TS){shootE(e.x,e.y,Math.atan2(dy,dx),260,e.dmg,3);e.cd=(1.7+Math.random()*.6)*(e.lv>5?.85:1)}break;
      case'orc':e.ccd-=dt;
        if(e.chg>0){e.chg-=dt;vx=e.cvx;vy=e.cvy;sp=300}
        else if(e.tele>0){e.tele-=dt;sp=0;if(e.tele<=0){e.chg=.55;e.cvx=dx/td;e.cvy=dy/td}}
        else{toward();if(td<4.2*TS&&see&&e.ccd<=0){e.tele=.6;e.ccd=3.2}}break;
      case'boss':{bossAI(e,dt,tp,td,see);const B=BOSSES[e.bv??0];
        if(e.chg>0){e.chg-=dt;vx=e.cvx;vy=e.cvy;sp=330}
        else if(e.tele>0){e.tele-=dt;sp=0;if(e.tele<=0){e.chg=.6;e.cvx=dx/td;e.cvy=dy/td}}
        else{if(td>(B.charge?1.2:4)*TS)toward();if(B.charge){e.ccd-=dt;if(e.ccd<=0&&see&&td<7*TS){e.tele=.55;e.ccd=e.hp<e.mhp/2?2.4:3.4}}}
        break}}
    const len=Math.hypot(vx,vy);if(len>0){const bl=moveBody(e,vx/len*sp*dt,vy/len*sp*dt,e.r*.75);if(bl&&e.chg>0)e.chg=0}
    for(const p of alive){if(Math.hypot(p.x-e.x,p.y-e.y)<e.r+11&&e.hitCd<=0){hurt(p,e.dmg*(e.chg>0?1.6:1),e);e.hitCd=.8}}}
  const A=G.enemies.filter(e=>e.hp>0&&e.act);
  for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const a=A[i],b=A[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r;if(d>0&&d<m){const p=(m-d)/2/d;if(a.type!=='boss')moveBody(a,-dx*p,-dy*p,a.r*.75);if(b.type!=='boss')moveBody(b,dx*p,dy*p,b.r*.75)}}
  G.enemies=G.enemies.filter(e=>e.hp>0)}
function shootE(x,y,a,spd,dmg,k){G.projs.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,r:k===4?7:5,dmg,from:'e',k,life:4})}
function bossAI(e,dt,tp,td,see){const rage=e.hp<e.mhp/2;if(rage&&!e.raged){e.raged=true;sayE(e,'rage')}e.t1-=dt;e.t2-=dt;e.t3-=dt;e.t4-=dt;
  const B=BOSSES[e.bv??0];if(B.regen)e.hp=Math.min(e.mhp,e.hp+e.mhp*B.regen*dt);
  if(e.bv===5&&!e.summoned){e.summoned=true;for(let k=0;k<5;k++){const q=freeNear(tp.x,tp.y,2*TS,4*TS);const m=spawnEnemy('slime',q.x,q.y,false,true,undefined,e.lv);m.act=true;fx(12,m.x,m.y,14)}msg('Cinq silhouettes sortent du sol !')}
  if(e.tele>0||e.chg>0)return;
  if(e.t1<=0&&B.ring){const n=B.ring+(rage?6:0),o=Math.random()*6.28;for(let i=0;i<n;i++)shootE(e.x,e.y,o+i/n*6.283,150,e.dmg*.8,4);e.t1=rage?2.4:3.4}
  if(e.t2<=0&&see&&B.triple){const a=Math.atan2(tp.y-e.y,tp.x-e.x);for(const k of[-.2,0,.2])shootE(e.x,e.y,a+k,240,e.dmg,4);e.t2=rage?1.1:1.8}
  if(e.t3<=0&&B.minions.length){if(G.enemies.filter(o=>o.minion&&o.hp>0).length<4){for(let k=0;k<2;k++){const q=freeNear(e.x,e.y,30,60);const m=spawnEnemy(B.minions[k%B.minions.length],q.x,q.y,false,true,undefined,e.lv);fx(12,m.x,m.y,14)}}e.t3=11}
  if(e.t4<=0&&!B.tp)e.t4=99;
  if(e.t4<=0&&(B.near||G.m.kind!=='dun')){reinMist(e);e.t4=rage?5:7.5;return}
  if(e.t4<=0){const r=G.m.exitR;for(let k=0;k<20;k++){const x=(ri(Math.random,r.x+1,r.x+r.w-2)+.5)*TS,y=(ri(Math.random,r.y+1,r.y+r.h-2)+.5)*TS;if(G.players.every(p=>Math.hypot(p.x-x,p.y-y)>3*TS)&&!hits(x,y,e.r*.75)){fx(12,e.x,e.y,30);e.x=e.rx=x;e.y=e.ry=y;fx(12,x,y,30);break}}e.t4=rage?6:8.5}}
function updProjs(dt){
  for(const p of G.projs){p.life-=dt;if(p.life<=0)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(shotBlock(Math.floor(p.x/TS),Math.floor(p.y/TS))){p.life=0;if(p.splash){p.hitIds=new Set();explode(p)}continue}
    if(p.from==='p'){const ow=G.players[p.pi];
      if(p.k===2&&!p.healed){for(const q of G.players){if(q!==ow&&!q.down&&Math.hypot(q.x-p.x,q.y-p.y)<16){healP(q,q.mhp*.06,true);p.healed=true}}}
      for(const e of G.enemies){if(e.hp<=0)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r){if(!ow){p.life=0;break}pDmg(p.pi,e,p.mult||1,{kx:p.vx*.25,ky:p.vy*.25});p.life=0;if(p.splash){p.hitIds=new Set([e.id]);explode(p)}break}}}
    else{for(let i=0;i<G.players.length;i++){const q=G.players[i];if(q.down||pInv(i))continue;if(Math.hypot(q.x-p.x,q.y-p.y)<11+p.r){hurt(q,p.dmg);p.life=0;break}}}}
  G.projs=G.projs.filter(p=>p.life>0)}
function updDrops(dt){
  for(const d of G.drops){d.t+=dt;if(d.vx||d.vy){moveBody(d,d.vx*dt,d.vy*dt,4);const k=Math.pow(.01,dt);d.vx*=k;d.vy*=k;if(Math.abs(d.vx)+Math.abs(d.vy)<4)d.vx=d.vy=0}
    if(d.t<.35)continue;let best=null,bd=1e9,bi=-1;G.players.forEach((p,i)=>{if(p.down)return;const dd=Math.hypot(p.x-d.x,p.y-d.y);if(dd<bd){bd=dd;best=p;bi=i}});
    if(!best)continue;if((d.k===1||d.k===4||d.k===5||d.k===6||d.k===7)&&bd<80){const s=260*dt;moveBody(d,(best.x-d.x)/bd*s,(best.y-d.y)/bd*s,3)}
    if(bd<22){d.dead=true;const i=bi;
      if(d.k===1){G.gain.g[i]+=d.v;fx(8,d.x,d.y,d.v,i)}
      else if(d.k===2){G.gain.pt[i]++;fx(15,d.x,d.y,1,i)}
      else if(d.k===3){healP(best,best.mhp*.2,true)}
      else if(d.k===4){G.key=2;G.stairsOpen=true;fx(16,d.x,d.y,0,i);sayP(i,'key');msg('Clé trouvée ! La sortie est ouverte : suis la flèche dorée.')}
      else if(d.k===5){G.gain.gm[i]++;fx(17,d.x,d.y,0,i);msg(best.name+' gagne une gemme : +1 point de talent')}
      else if(d.k===6){fx(24,d.x,d.y,d.v*1000+d.l*10+d.r,i)}
      else if(d.k===7){G.gain.sh[i]+=d.v||1;fx(27,d.x,d.y,d.v||1,i)}}}
  G.drops=G.drops.filter(d=>!d.dead)}
function updChests(){
  for(const c of G.m.chests){if(G.opened.has(c.id))continue;const cx=(c.x+.5)*TS,cy=(c.y+.5)*TS;
    for(const p of G.players){if(p.down||Math.hypot(p.x-cx,p.y-cy)>26)continue;
      if(c.locked&&p.cls!=='voleur'){msg('Coffre verrouillé : seul le Voleur sait le crocheter.','lk'+c.id,6);sayP(G.players.indexOf(p),'lock');continue}
      G.opened.add(c.id);fx(18,cx,cy,0);if(c.locked)sayP(G.players.indexOf(p),'pick');else if(!c.vault&&Math.random()<.5)msg(pickL(MJ.loot),'loot',7);
      const lv=G.m.kind==='world'?regionAt(c.x,c.y).lv:G.lv;const gb=6+lv*3;
      if(c.vault){for(let k=0;k<6;k++)addDrop(1,cx,cy,gb);addDrop(5,cx,cy);addDrop(2,cx,cy);lootItem(cx,cy,lv,1)}
      else if(c.locked){for(let k=0;k<5;k++)addDrop(1,cx,cy,gb);addDrop(2,cx,cy);lootItem(cx,cy,lv,1);if(Math.random()<.3)addDrop(5,cx,cy)}
      else{for(let k=0;k<3;k++)addDrop(1,cx,cy,gb);if(Math.random()<.35)addDrop(2,cx,cy);if(Math.random()<.5)lootItem(cx,cy,lv,0)}
      break}}}
function updCrates(dt){
  for(const c of G.crates){let pushing=false;const cx=(c.x+.5)*TS,cy=(c.y+.5)*TS;
    for(const p of G.players){if(p.down)continue;const mv=p.mv||[0,0];const dx=cx-p.x,dy=cy-p.y;let dir=null;
      if(Math.abs(mv[0])>.55&&Math.abs(dy)<15&&Math.sign(dx)===Math.sign(mv[0])&&Math.abs(dx)<TS/2+14)dir=[Math.sign(mv[0]),0];
      else if(Math.abs(mv[1])>.55&&Math.abs(dx)<15&&Math.sign(dy)===Math.sign(mv[1])&&Math.abs(dy)<TS/2+14)dir=[0,Math.sign(mv[1])];
      if(dir){pushing=true;c.pushT+=dt;if(c.pushT>.18){const nx=c.x+dir[0],ny=c.y+dir[1],v=tileAt(nx,ny);
        const blocked=!(v===0||v===4||v===5)||crateAt(nx,ny)||G.m.chests.some(h=>h.x===nx&&h.y===ny)||G.players.some(q=>Math.floor(q.x/TS)===nx&&Math.floor(q.y/TS)===ny);
        if(!blocked){c.x=nx;c.y=ny;fx(19,(nx+.5)*TS,(ny+.5)*TS,0)}c.pushT=0}break}}
    if(!pushing)c.pushT=0;
    const onPlate=tileAt(c.x,c.y)===4;const bad=(x,y)=>{const v=tileAt(x,y);return v===1||v===2||v===3};
    const stuck=!onPlate&&!G.gateOpen&&(bad(c.x-1,c.y)||bad(c.x+1,c.y))&&(bad(c.x,c.y-1)||bad(c.x,c.y+1));
    if(stuck){c.stuckT+=dt;if(c.stuckT>2.5&&!G.players.some(q=>Math.hypot(q.x-(c.ox+.5)*TS,q.y-(c.oy+.5)*TS)<30)){fx(12,cx,cy,16);c.x=c.ox;c.y=c.oy;c.stuckT=0;msg('La caisse coincée revient à sa place.')}}else c.stuckT=0}
  if(!G.m.plates.length)return;
  G.platesOn=G.m.plates.map(pl=>(crateAt(pl.x,pl.y)||G.players.some(p=>!p.down&&Math.floor(p.x/TS)===pl.x&&Math.floor(p.y/TS)===pl.y))?1:0);
  if(!G.gateOpen){if(G.platesOn.every(v=>v)){G.gateOpen=true;const v=G.m.vault;fx(20,(v.mx+.5)*TS,(v.my+.5)*TS,0);msg('La grille de la salle au trésor s’ouvre !')}
    else if(G.platesOn.some(v=>v))msg('Une dalle est enfoncée… il en faut deux en même temps. Une caisse peut aider.','plt',8)}
}

/* ================= Gains appliqués au héros local ================= */
function resetGains(){for(const k of['xp','g','pt','gm','sh','dc','ep'])delete Gn[k]}
function applyGains(S){const i=myIdx;
  if(Gn.xp==null){Gn.xp=S.xp;Gn.g=S.g[i]||0;Gn.pt=S.pt[i]||0;Gn.gm=S.gm[i]||0;Gn.sh=(S.sh||[])[i]||0;Gn.dc=S.dc;Gn.ep=S.ep;onZoneEnter(true);return}
  if(S.xp>Gn.xp){giveXp(S.xp-Gn.xp);Gn.xp=S.xp}
  const g=S.g[i]||0;if(g>Gn.g){hero.gold+=Math.round((g-Gn.g)*(1+(ST&&ST.gb||0)));Gn.g=g}
  const pt=S.pt[i]||0;if(pt>Gn.pt){hero.pot=Math.min(POT_MAX,hero.pot+pt-Gn.pt);Gn.pt=pt}
  const gm=S.gm[i]||0;if(gm>Gn.gm){hero.pts+=gm-Gn.gm;Gn.gm=gm;doSave(true)}
  const sh=(S.sh||[])[i]||0;if(sh>Gn.sh){hero.sh+=sh-Gn.sh;Gn.sh=sh}
  if(S.q>hero.q){hero.q=S.q;doSave(true)}
  if(S.dc>Gn.dc){Gn.dc=S.dc;hero.xp=Math.floor(hero.xp*.8);toast('Tu perds un peu d’expérience.');doSave(true)}
  if(S.ep!==Gn.ep){Gn.ep=S.ep;onZoneEnter(false)}}
function giveXp(v){hero.xp+=Math.round(v*(1+(ST&&ST.xpb||0)));let up=false;while(hero.xp>=xpNeed(hero.lvl)){hero.xp-=xpNeed(hero.lvl);hero.lvl++;hero.pts++;up=true}
  if(up){refreshStats();L.lu++;if(mode!=='guest'){const p=G.players[0];if(!p.down)p.hp=p.mhp}L.mp=ST.mmp;parts.push({k:'ring',x:L.x,y:L.y,r:10,mr:90,life:.7,max:.7,col:'#f0c95a'});
    addText(L.x,L.y-34,'Niveau '+hero.lvl+' !','#f0c95a',1.6,16);{const id=pickB(hero.cls,'lvl');if(mode==='guest')addBubble({who:'p',o:myIdx,txt:BUB[id],life:3,max:3});else sayP(0,'lvl')}Snd.play('lvl');
    const nw=SKILLS[hero.cls].find(s=>s.lvl===hero.lvl);toast('Niveau '+hero.lvl+' !'+(nw?' Nouvelle compétence : '+nw.nom+'.':'')+' Un point de talent à dépenser.');buildSkillUI();doSave(true)}}
function refreshStats(){ST=derive(hero);if(G&&mode!=='guest'&&G.players[0]){const p=G.players[0];p.hp=p.hp*ST.mhp/p.mhp;p.mhp=ST.mhp;p.st=ST}if(L)L.mp=Math.min(L.mp,ST.mmp)}
function onZoneEnter(first){const m=G.m;if(!m)return;G.seen=null;bubbles=[];
  if(m.kind==='world'){L.reg='';if(!first)Snd.play('stairs')}else{showBanner(zoneName(m),m.kind==='dun'?DUNGEONS[m.did].nom:'');if(!first)Snd.play('stairs')}
  if(!first)showLoading(zoneName(m),m.kind==='dun'?DUNGEONS[m.did].nom:m.kind==='house'?'':'Midheim');
  if(mode==='guest'){const p=G.players[1];if(p){L.x=p.x;L.y=p.y}}
  savePos();doSave(true);maybeDunScene()}
function savePos(){if(!G||!G.m)return;let px=null;if(G.m.kind==='world')px={x:L.x,y:L.y};else if(G.m.kind==='house')px=G.m.exitTo;else if(G.dun)px=G.dun.ret;
  if(px)hero.pos=[Math.floor(px.x/TS),Math.floor(px.y/TS)]}
function doSave(force){const now=performance.now();if(!force&&now-saveT<15000)return;saveT=now;if(hero){if(G&&G.m)savePos();Store.save(hero)}}

/* ================= Contrôle local ================= */
const keys=new Set();const mouse={x:0,y:0,t:-1e9,down:false};let skQ=[false,false,false,false],potQ=false,actQ=false;
const touch={on:false,jx:0,jy:0,atk:false,aimOn:false,aimAng:0,aimLen:0,relAim:false,aimSlot:null};
function myP(){return G.players[myIdx]}
function nearestEnemy(r){let best=null,bd=r;for(const e of G.enemies){if(e.hp<=0)continue;const ex=e.rx!=null?e.rx:e.x,ey=e.ry!=null?e.ry:e.y,d=Math.hypot(ex-L.x,ey-L.y);if(d<bd){bd=d;best={x:ex,y:ey,e}}}return best}
function aimPoint(){if(touch.aimOn){const d=clamp((touch.aimLen||60)*3.2,90,320);return{x:L.x+Math.cos(L.aim)*d,y:L.y+Math.sin(L.aim)*d}}const n=nearestEnemy(300);if(n)return{x:n.x,y:n.y};return{x:L.x+Math.cos(L.aim)*170,y:L.y+Math.sin(L.aim)*170}}
function trySkill(slot){const S=SKILLS[hero.cls][slot];const me=myP();if(!S||!me||me.down)return;
  if(hero.lvl<S.lvl){toast(S.nom+' : se débloque au niveau '+S.lvl+'.','lk'+slot);return}
  if(S.ult){if(L.ult<100){toast('L’ultime se charge en combattant.','ult');return}L.ult=0}
  else{if(L.cd[slot]>0)return;if(L.mp<S.mp){toast('Pas assez de mana.','mana');return}L.mp-=S.mp;L.cd[slot]=S.cd*ST.cdm}
  L.sk[slot]++;const tp=aimPoint();L.tp=tp;localSkill(S.id);if(mode!=='guest')hostSkill(0,S.id,L.aim,tp)}
function localSkill(id){const ml=Math.hypot(L.mv[0],L.mv[1]);const a=ml>.2&&!touch.aimOn?L.face:L.aim;
  switch(id){
    case'charge':L.dashT=.22;L.dvx=Math.cos(L.aim)*850;L.dvy=Math.sin(L.aim)*850;L.ivT=.3;Snd.play('dash');break;
    case'ombre':L.dashT=.18;L.dvx=Math.cos(a)*1000;L.dvy=Math.sin(a)*1000;L.ivT=.4;L.buffT=2;Snd.play('dash');parts.push({k:'ring',x:L.x,y:L.y,r:6,mr:30,life:.3,max:.3,col:'#86cc70'});break;
    case'transfert':{const ox=L.x,oy=L.y;for(let k=0;k<12;k++)moveBody(L,Math.cos(a)*15,Math.sin(a)*15,10);parts.push({k:'ring',x:ox,y:oy,r:6,mr:60,life:.4,max:.4,col:'#9fd0ff'});parts.push({k:'ring',x:L.x,y:L.y,r:30,mr:4,life:.3,max:.3,col:'#cfe8ff'});Snd.play('nova');break}
    case'fumee':L.stealthT=3;Snd.play('dash');break;
    case'danse':L.ivT=1.2;Snd.play('crit');break;
    case'tourbillon':case'seisme':Snd.play('boom');shake=id==='seisme'?10:0;break;
    case'nova':case'tempete':Snd.play('nova');break;
    case'cercle':case'bouclier':case'aube':Snd.play('heal');break;
    default:Snd.play('fire')}}
function updateLocal(dt){
  const me=myP();const C=CLS[hero.cls];
  L.cdA-=dt;for(let s=0;s<4;s++)L.cd[s]-=dt;L.mp=Math.min(ST.mmp,L.mp+ST.mpr*dt);L.buffT-=dt;L.ivT-=dt;L.swing-=dt;L.stealthT-=dt;
  if(hero.lvl>=SKILLS[hero.cls][3].lvl)L.ult=Math.min(100,L.ult+dt*1.1);
  let mx=0,my=0;
  if(keys.has('KeyA')||keys.has('ArrowLeft'))mx-=1;if(keys.has('KeyD')||keys.has('ArrowRight'))mx+=1;if(keys.has('KeyW')||keys.has('ArrowUp'))my-=1;if(keys.has('KeyS')||keys.has('ArrowDown'))my+=1;
  if(touch.jx||touch.jy){mx=touch.jx;my=touch.jy}
  let ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;ml=1}
  const down=!me||me.down;if(down){mx=my=0}
  L.mv=[mx,my];if(ml>.2)L.face=Math.atan2(my,mx);
  if(L.dashT>0){L.dashT-=dt;moveBody(L,L.dvx*dt,L.dvy*dt,10)}else if(ml>0)moveBody(L,mx*ST.spd*dt,my*ST.spd*dt,10);
  const useMouse=!touch.on&&performance.now()-mouse.t<2500;
  if(touch.aimOn)L.aim=touch.aimAng;
  else if(useMouse){const w=screenToWorld(mouse.x,mouse.y);L.aim=Math.atan2(w.y-L.y,w.x-L.x)}
  else{const n=nearestEnemy(330);L.aim=n?Math.atan2(n.y-L.y,n.x-L.x):L.face}
  // découverte des lieux et région
  L.wpT-=dt;if(L.wpT<=0&&G.m&&G.m.kind==='world'){L.wpT=.5;const tx=Math.floor(L.x/TS),ty=Math.floor(L.y/TS);
    for(const k in WAYPOINTS){if(hero.wp.includes(k))continue;const w=WAYPOINTS[k];if((w.pt[0]-tx)**2+(w.pt[1]-ty)**2<64){hero.wp.push(k);toast('Lieu découvert : '+w.nom+'. Voyage rapide possible depuis la carte.');questEvent('wp');doSave(true)}}
    const rg=townAt(tx,ty)||regionAt(tx,ty);const key=rg.id||rg.nom;if(key!==L.reg){L.reg=key;showBanner(rg.nom,rg.lv?'Niveau conseillé '+rg.lv:'')}}
  if(down){skQ=[false,false,false,false];potQ=false;actQ=false;return}
  const atk=mouse.down||keys.has('KeyJ')||touch.atk;
  if(atk&&L.cdA<=0&&!(C.atkMp&&L.mp<C.atkMp)){L.mp-=C.atkMp;L.cdA=C.atkCd*ST.cdm;L.ac++;L.stealthT=0;const buffed=hero.cls==='voleur'&&L.buffT>0;if(buffed){L.buffT=0;L.bc=L.ac}
    L.swing=SWD;L.swingA=L.aim;Snd.play(hero.cls==='mage'||hero.cls==='soigneur'?'fire':'swing');if(mode!=='guest')hostAttack(0,L.aim,buffed)}
  for(let s=0;s<4;s++)if(skQ[s]){skQ[s]=false;trySkill(s)}
  if(touch.relAim){touch.relAim=false;touch.aimOn=false}
  if(potQ){potQ=false;if(hero.pot>0&&me&&me.hp<me.mhp){hero.pot--;L.pc++;Snd.play('pot');if(mode!=='guest')usePotion(0)}else if(hero.pot<=0)toast('Plus de potion. Achète-en chez un marchand.','pot')}
  if(actQ){actQ=false;const it=findInteract();if(it)doInteract(it)}}
function townAt(tx,ty){for(const k in TOWNS){const p=PL[k];if((p[0]-tx)**2+(p[1]-ty)**2<100)return{id:'t_'+k,nom:TOWNS[k].nom,lv:0}}return null}
function findInteract(){const m=G.m;if(!m||!m.inter)return null;let best=null,bd=1e9;for(const it of m.inter){const d=Math.hypot(it.x-L.x,it.y-L.y);if(d<it.r&&d<bd){bd=d;best=it}}return best}
function interactLabel(it){if(!it)return'';const a=it.act;
  if(a.startsWith('dun:')){const s=DUNGEONS[a.slice(4)];return(G.q<s.need?'Examiner : ':'Entrer : ')+s.nom}
  if(a.startsWith('house:'))return'Entrer : '+it.label;if(a==='exit')return'Sortir';if(a==='leave')return'Quitter le donjon';if(a.startsWith('shop:'))return it.label;
  if(a==='arena')return G.q>=3?'Défier Abhorash':'Examiner les pierres';if(a.startsWith('talk:')||a.startsWith('closed:'))return'Parler : '+it.label;return it.label}
function doInteract(it){const a=it.act;
  if(a.startsWith('talk:')){talkTo(a.slice(5));return}
  if(a.startsWith('closed:')){showDialog('garde',it.label,a.slice(7));return}
  if(a.startsWith('shop:')){openTrade(a.slice(5),it.town);return}
  if(a==='arena'&&G.q<2){showDialog('narrateur','Les Silverwoods','Un cercle de pierres levées. L’herbe y est piétinée, comme après un duel.');return}
  if(a.startsWith('dun:')&&G.q<DUNGEONS[a.slice(4)].need){showDialog(a==='dun:prison'?'amarath':'narrateur',DUNGEONS[a.slice(4)].nom,lockText(a.slice(4)));return}
  requestAct(a)}
function requestAct(a){if(mode==='guest'){L.it++;L.ia=a}else hostRequest(a,0)}
function talkTo(k){const q=G.q;
  if(k==='virganth'){const d=q===0?DIALOG.virganth0:DIALOG.virganth1;showDialog('virganth',d[0],d[1]);return}
  if(k==='grinmir'){if(q===3){queueStoryKey('ch2');if(!hero.story.includes('ch2'))return}const d=q>3?DIALOG.grinmir1:DIALOG.grinmir0;showDialog('grinmir',d[0],d[1]);return}
  if(k==='garde'){showDialog('garde',DIALOG.garde[0],DIALOG.garde[1]);return}
  if(k==='nains'){showDialog('grinmir',DIALOG.nains[0],DIALOG.nains[1]);return}
  if(k==='abhorash'){showDialog('abhorash',DIALOG.abhorash[0],DIALOG.abhorash[1]);return}}
