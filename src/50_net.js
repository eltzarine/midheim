/* ================= Réseau ================= */
// Deux transports avec la même interface (presence / onPeers / onConnection) :
//  - dans claude.ai : le salon de la page ;
//  - sur le site public : Firebase Realtime Database, une « salle » par code de partie.
const FB_CONFIG={apiKey:'AIzaSyDQn6cqulpah1EoR_hz8x5IEskq0ZVO-Rs',authDomain:'midheim-1a4c1.firebaseapp.com',
  databaseURL:'https://midheim-1a4c1-default-rtdb.europe-west1.firebasedatabase.app',projectId:'midheim-1a4c1',appId:'1:573879321173:web:09b976a2437460ff478adc'};
const FB_SDK='https://www.gstatic.com/firebasejs/13.0.0/';
const FB_ROOM='MIDH'; // une seule salle : chaque partie lancée y est visible tant qu'il reste une place
let netKind=null,netOn=false,hostBg=false;
/* l'appli passe en arrière-plan ou revient : on le signale à l'autre joueur, et au retour on remet les compteurs à zéro
   (sinon, après une pause, l'hôte croit l'invité parti depuis longtemps et le renvoie) */
document.addEventListener('visibilitychange',()=>{const vis=document.visibilityState==='visible';
  if(mode==='host'||mode==='guest'||mode==='joining')pres({bg:vis?0:1});
  if(vis){if(G&&G.guestPeer)G.guestSeen=performance.now();if(hostGoneAt)hostGoneAt=performance.now();if(mode==='joining')joinT=performance.now()}});
/* fermeture de la page (et non simple pause) : on quitte vraiment la partie à deux, l'autre n'attend pas */
addEventListener('pagehide',e=>{if(e.persisted)return;if(mode==='guest'||mode==='joining')pres({r:'m',h:null,i:null,st:null,bg:0});else if(mode==='host')pres({r:'m',gp:null,g:null,bg:0})});
async function initNet(){
  if(window.claude&&window.claude.use){netKind='claude';try{room=await claude.use('room')}catch(e){room=null}if(!room){setNet(false);return}attachRoom(room);return}
  netKind='fb';setNet(false);
  try{attachRoom(await fbRoom(FB_ROOM))}catch(e){Log.err('net','salle Firebase injoignable',e);room=null;setNet(false)}}
function attachRoom(r){room=r;
  room.onPeers(ch=>{peers=ch.peers;const me=peers.find(p=>p.sameTab);if(me)myPeer=me.peer;logPeers();try{onPeersChange()}catch(e){Log.err('net','traitement des joueurs ('+mode+')',e)}},()=>{Log.warn('net','salle fermée');room=null;setNet(false);if(mode==='guest'||mode==='joining')endGuest('Connexion perdue avec l’autre joueur.')});
  room.onConnection(c=>setNet(c),()=>{});
  if(mode==='solo'&&G&&G.m)pres({r:'h',n:myName,c:hero.cls,l:hero.lvl,gp:null,h:null,i:null,st:null,g:null,wh:zoneName(G.m)});
  else pres({r:'m',n:myName,c:selCls,l:hero?hero.lvl:1,g:null,gp:null,h:null,i:null,st:null})}
// salle Firebase : rooms/<CODE>/peers/<id> = { j: présence en JSON, t: horodatage }
async function fbRoom(code){
  const A=await import(FB_SDK+'firebase-app.js'),D=await import(FB_SDK+'firebase-database.js');
  const app=A.getApps().length?A.getApp():A.initializeApp(FB_CONFIG),db=D.getDatabase(app);
  const id='p'+Math.random().toString(36).slice(2,10),base=D.ref(db,'rooms/'+code+'/peers'),mine=D.child(base,id);
  const map=new Map(),pcb=[],ccb=[];let me={},live=true;
  const parse=s=>{const v=s.val();if(!v||typeof v.j!=='string'||v.j.length>16000)return null;try{const o=JSON.parse(v.j);return o&&typeof o==='object'?o:null}catch(e){return null}};
  const emit=()=>{const list=[...map].map(([peer,presence])=>({peer,presence,sameTab:peer===id}));for(const f of pcb)f({peers:list})};
  const write=()=>live?D.set(mine,{j:JSON.stringify(me),t:D.serverTimestamp()}):Promise.resolve();
  D.onChildAdded(base,s=>{map.set(s.key,parse(s));emit()});D.onChildChanged(base,s=>{map.set(s.key,parse(s));emit()});D.onChildRemoved(base,s=>{map.delete(s.key);emit()});
  D.onValue(D.ref(db,'.info/connected'),s=>{const on=!!s.val();if(on){D.onDisconnect(mine).remove();if(Object.keys(me).length)write()}for(const f of ccb)f(on)});
  return{code,
    presence(o){for(const k in o){if(o[k]==null)delete me[k];else me[k]=o[k]}return write()},
    onPeers(f){pcb.push(f);emit()},onConnection(f){ccb.push(f)},
    close(){live=false;pcb.length=0;ccb.length=0;D.remove(mine).catch(()=>{});D.onDisconnect(mine).cancel()}}}
function pres(o){if(!room)return;room.presence(o).catch(e=>{if(!pres.err||performance.now()-pres.err>5000){pres.err=performance.now();Log.warn('net','envoi de présence refusé',e)}})}
/* résumé des joueurs présents, seulement quand il change */
function logPeers(){const sum=peers.map(p=>{const r=p.presence||{};return(p.sameTab?'moi':p.peer.slice(-4))+':'+(r.r||'?')+(r.n?'/'+anonName(r.n):'')+(r.h?'→'+String(r.h).slice(-4):'')+(r.gp?'⇐'+String(r.gp).slice(-4):'')+(r.g?'+état':'')}).join(' ');
  if(sum!==logPeers.last){logPeers.last=sum;Log.ev('salle',peers.length+' présent(s) · '+sum)}}
function setNet(on){if(netOn!==(!!on&&!!room))Log.ev('net',(!!on&&!!room)?'connecté':'non connecté',netKind||'');Log.schedule(2000);netOn=!!on&&!!room;const el=$('#net');el.classList.toggle('on',netOn);
  el.querySelector('span').textContent=room?(on?'Jeu à deux connecté':'Connexion…'):netKind==='fb'?'Jeu à deux hors ligne':'Jeu à deux indisponible ici';renderLobby()}
function onPeersChange(){if(mode==='menu')renderLobby();if(mode==='host'||mode==='solo')hostCheckGuest();if(mode==='joining'||mode==='guest')guestCheckHost()}
function renderLobby(){const box=$('#hosts');if(!box)return;box.textContent='';
  if(!room){box.append(el('p','muted',netKind==='fb'?'Pas de connexion internet : tu peux jouer seul.':'Pour jouer à deux, ouvrez tous les deux cette page depuis claude.ai, connectés à vos comptes. Ton frère doit être invité au partage de la page avec le niveau Contributeur.'));return}
  const hs=peers.filter(p=>!p.sameTab&&p.presence&&p.presence.r==='h');
  if(!hs.length){box.append(el('p','muted','Personne ne joue pour l’instant. Lance l’aventure : tant qu’il reste une place, un 2ᵉ joueur pourra te rejoindre.'));return}
  for(const h of hs){const pr=h.presence;const row=el('div','host');const d=el('div');const b=el('b',null,clean(pr.n)||'Héros');
    const c=CLS_IDS.includes(pr.c)?CLS[pr.c].nom:'Héros';const s=el('span','muted',c+' · niveau '+(pr.l|0)+(pr.wh?' · '+String(pr.wh).slice(0,40):''));s.style.fontSize='13px';d.append(b,s);
    const bt=el('button','btn coop');const full=!!pr.gp&&pr.gp!==myPeer;bt.textContent=full?'Complète':'Rejoindre';bt.disabled=full;bt.onclick=()=>Pwa.gate(()=>joinHost(h.peer,clean(pr.n)));row.append(d,bt);box.append(row)}}
const PAUSE_WAIT=90000;
function hostCheckGuest(){
  if(G.guestPeer){const gp=peers.find(p=>p.peer===G.guestPeer);
    // invité en pause (appli en arrière-plan, écran verrouillé) : il peut disparaître un moment de la salle, on lui garde sa place
    if(!gp&&G.guestPres&&G.guestPres.bg&&performance.now()-(G.guestSeen||0)<PAUSE_WAIT)return;
    if(gp&&gp.presence&&!!gp.presence.bg!==!!(G.guestPres&&G.guestPres.bg)){const nm=clean(gp.presence.n)||'Ton allié';if(gp.presence.bg){Log.ev('à deux','invité en pause');toast(nm+' est en pause, on l’attend.')}else{Log.ev('à deux','invité de retour');toast(nm+' est de retour !')}}
    if(!gp||!gp.presence||gp.presence.r!=='g'||gp.presence.h!==myPeer){dropGuest()}else{if(G.guestPres!==gp.presence)G.guestSeen=performance.now();G.guestPres=gp.presence}}
  if(!G.guestPeer){const c=peers.find(p=>!p.sameTab&&p.presence&&p.presence.r==='g'&&p.presence.h===myPeer&&CLS_IDS.includes(p.presence.c)&&!(G.stale&&G.stale.peer===p.peer&&G.stale.pres===p.presence));if(c)acceptGuest(c)}}
function acceptGuest(c){const pr=c.presence;const st=pr.st||{};const p=mkPlayer(clean(pr.n)||'Joueur 2',pr.c,{dmg:10,crit:.05,arm:0});p.mhp=100;applyGuestStats(p,st);p.hp=p.mhp;p.lvl=clamp(pr.l|0,1,99);
  const me=G.players[0];const q=freeSpot(me.x+36,me.y);p.x=p.rx=q.x;p.y=p.ry=q.y;
  G.players[1]=p;for(const k in G.gain)G.gain[k][1]=0;G.guestPeer=c.peer;G.guestPres=pr;G.guestSeen=performance.now();G.coop=true;mode='host';paused=false;netT=0;
  pres({gp:c.peer});Log.ev('à deux','invité accepté',anonName(p.name),CLS[p.cls].nom,'niv '+p.lvl,'peer '+c.peer.slice(-4));msg(p.name+' ('+CLS[p.cls].nom+') rejoint l’aventure !');Snd.play('key')}
function dropGuest(){const p=G.players[1];Log.warn('à deux','invité retiré',p?anonName(p.name):'?');if(p)msg(p.name+' a quitté la partie.');G.players.length=1;G.guestPeer=null;G.guestPres=null;G.coop=false;if(mode==='host')mode='solo';netT=0;pres({gp:null,g:null})}
function joinHost(peer,name){hostBg=false;Log.ev('à deux','rejoindre la partie de',anonName(name),'peer '+String(peer).slice(-4),'moi '+String(myPeer).slice(-4));Snd.init();hostPeer=peer;mode='joining';joinT=performance.now();$('#joinTxt').textContent='On rejoint la partie de '+(name||'l’hôte')+'…';
  $('#menu').hidden=true;$('#game').hidden=false;$('#joining').hidden=false;
  pres({r:'g',h:peer,n:myName,c:selCls,l:hero.lvl,st:guestStats(),i:null,g:null,gp:null})}
function guestStats(){return{lk:lookOf(hero.eq),mhp:ST.mhp,dmg:+ST.dmg.toFixed(2),crit:+ST.crit.toFixed(3),arm:+ST.arm.toFixed(3),vol:+ST.vol.toFixed(3),reg:+(+ST.reg).toFixed(1),we:ST.we,ae:ST.ae,pb:ST.pb||0}}
function guestCheckHost(){const h=peers.find(p=>p.peer===hostPeer);
  if(!h){if(mode==='guest'&&!hostGoneAt){hostGoneAt=performance.now();Log.warn('à deux','hôte absent de la salle')}if(mode==='joining')endGuest('La partie n’existe plus.');return}
  hostGoneAt=0;const pr=h.presence||{};if((mode==='guest'||mode==='joining')&&!!pr.bg!==hostBg){hostBg=!!pr.bg;Log.ev('à deux',hostBg?'hôte en pause':'hôte de retour');toast(hostBg?'L’hôte est en pause, on l’attend.':'L’hôte est de retour !')}
  if(mode==='joining'){if(pr.r!=='h'){endGuest('La partie n’existe plus.');return}
    if(pr.gp!==guestCheckHost.gp||!!pr.g!==guestCheckHost.g){guestCheckHost.gp=pr.gp;guestCheckHost.g=!!pr.g;Log.ev('à deux','attente hôte : place '+(pr.gp?(pr.gp===myPeer?'à moi':'prise'):'libre')+(pr.g?' · état reçu':' · pas d’état'))}
    if(pr.gp===myPeer&&pr.g)startGuest(pr);else if(pr.gp&&pr.gp!==myPeer)endGuest('La partie est déjà complète.');return}
  if(pr.r!=='h'||pr.gp!==myPeer){endGuest('L’hôte a fermé la partie.');return}
  if(pr.g&&pr.g!==lastStateObj){lastStateObj=pr.g;try{onState(pr.g)}catch(e){Log.err('à deux','état de l’hôte illisible (zone '+(pr.g&&pr.g.z)+')',e)}}}

/* ================= Invité : reconstruction ================= */
function startGuest(pr){hostBg=!!pr.bg;Log.ev('à deux','partie rejointe, zone',pr.g&&pr.g.z,'ep',pr.g&&pr.g.ep);bubbles=[];mode='guest';myIdx=1;G=newWorld();G.coop=true;L=newLocal();resetGains();parts=[];lastFx=-1;lastMsg=-1;G.ep=-1;
  $('#joining').hidden=true;lastStateObj=pr.g;try{onState(pr.g,true)}catch(e){Log.err('à deux','premier état illisible',e)}showGame();if(netKind==='fb')setNet(netOn)}
function onState(s,first){
  if(!s||typeof s!=='object'||typeof s.z!=='string')return;
  // l'état vient de l'autre joueur : on borne la taille des listes et on force les nombres
  const A=(v,n)=>Array.isArray(v)?v.slice(0,n):[],N=v=>{v=+v;return isFinite(v)?v:0};
  s.p=A(s.p,2).map(a=>A(a,11).map(N));s.nm=A(s.nm,2);s.e=A(s.e,60).map(a=>A(a,7).map(N));s.j=A(s.j,60).map(a=>A(a,4).map(N));s.d=A(s.d,40).map(a=>A(a,5).map(N));
  s.zo=A(s.zo,20).map(a=>A(a,4).map(N));s.fi=A(s.fi,20).map(a=>A(a,3).map(N));s.cr=A(s.cr,40).map(a=>A(a,2).map(N));s.x=A(s.x,30).map(a=>A(a,6).map(N));s.m=A(s.m,5).map(a=>A(a,2));
  s.o=A(s.o,200);s.pl=A(s.pl,20);s.gp=A(s.gp,10).map(N);s.g=A(s.g,2).map(N);s.pt=A(s.pt,2).map(N);s.gm=A(s.gm,2).map(N);s.sh=A(s.sh,2).map(N);
  if(s.ep!==G.ep){Log.ev('à deux','changement de zone',s.z,'ep',s.ep);G.ep=s.ep;G.zd=s.z;G.m=zoneFromDesc(s.z);G.emap=new Map();G.opened=new Set();
    if(s.p&&s.p[1]){L.x=s.p[1][0];L.y=s.p[1][1]}else{L.x=G.m.start.x+36;L.y=G.m.start.y}L.dashT=0}
  G.time=(s.t||0)/10;G.q=s.q|0;G.night=s.n|0;G.lv=s.lv|0||1;
  const nm=s.nm||[];
  G.players=(s.p||[]).map((a,i)=>{const old=G.players[i]||{};return{name:clean(nm[i])||('Joueur '+(i+1)),cls:CLS_IDS[a[6]]||'guerrier',x:a[0],y:a[1],rx:old.rx!=null?old.rx:a[0],ry:old.ry!=null?old.ry:a[1],hp:a[2],mhp:a[3]||1,down:!!a[4],rev:(a[5]||0)/40,drT:a[7]&1?1:0,shield:a[7]&2?1:0,stealthT:a[7]&4?1:0,aim:(a[8]||0)/10,sh:a[9]||0,lk:a[10]|0}});
  const em=new Map();for(const a of s.e||[]){const o=G.emap.get(a[0])||{rx:a[2],ry:a[3]};o.id=a[0];o.type=ETYPES[a[1]]||'slime';if(!EN[o.type])o.type='slime';o.x=a[2];o.y=a[3];o.hpP=a[4];o.fl=a[5];o.bv=a[6]>=0?a[6]:undefined;o.hp=1;o.r=EN[o.type].r*((a[5]&8)&&o.type!=='orc'?1.4:1);o.elite=!!(a[5]&8);o.burn=a[5]&64?1:0;o.act=!!(a[5]&128);em.set(a[0],o)}
  G.emap=em;G.enemies=[...em.values()];
  G.projs=(s.j||[]).map(a=>({x:a[0],y:a[1],k:a[2],ang:(a[3]||0)/10}));
  G.drops=(s.d||[]).map(a=>({id:a[0],k:a[1],x:a[2],y:a[3],r:a[4]|0,t:1}));
  G.zones=(s.zo||[]).map(a=>({x:a[0],y:a[1],r:a[2],smoke:a[3]}));
  G.fires=(s.fi||[]).map(a=>({x:a[0],y:a[1],r:a[2]}));
  const oc=G.crates;G.crates=(s.cr||[]).map((a,i)=>({x:a[0],y:a[1],rx:oc[i]?oc[i].rx:a[0],ry:oc[i]?oc[i].ry:a[1]}));
  G.opened=new Set(s.o||[]);G.platesOn=s.pl||[];G.gateOpen=!!s.go;G.key=s.k|0;G.stairsOpen=!!s.so;G.gp=(s.gp||[]).map(v=>(v|0)/20);G.wave=s.wv|0;G.defT=s.df?1:0;G.abhOn=!!s.ab;
  processFx((s.x||[]).map(a=>({id:a[0],k:a[1],x:a[2],y:a[3],v:a[4],o:a[5]})));
  processMsgs(s.m.map(m=>[N(m[0]),String(m[1]==null?'':m[1]).slice(0,140)]));
  applyGains({xp:s.xp|0,g:s.g||[],pt:s.pt||[],gm:s.gm||[],sh:s.sh||[],dc:s.dc|0,ep:s.ep,q:s.q|0})}
function guestUpdate(dt){G.time+=dt;if(G.m)updateLocal(dt);
  if(hostGoneAt&&performance.now()-hostGoneAt>(hostBg?PAUSE_WAIT:3500))endGuest('L’hôte a quitté la partie.')}
function endGuest(text){if(mode!=='guest'&&mode!=='joining')return;if(endGuest.busy)return;endGuest.busy=1;try{endGuest2(text)}finally{endGuest.busy=0}}
function endGuest2(text){Log.warn('à deux','fin de la partie à deux ('+mode+')',text||'');doSave(true);pres({r:'m',h:null,i:null,st:null});hostPeer=null;hostGoneAt=0;toMenu();if(text)setTimeout(()=>toast(text),50)}
function serialize(){const r=Math.round;const near=(x,y)=>G.m.kind!=='world'||G.players.some(p=>Math.abs(p.x-x)<900&&Math.abs(p.y-y)<900);
  const s={z:G.zd,ep:G.ep,t:r(G.time*10),q:G.q,n:G.night,lv:G.lv,
    p:G.players.map(p=>[r(p.x),r(p.y),Math.ceil(p.hp),p.mhp,p.down?1:0,r(p.rev*40),CLS_IDS.indexOf(p.cls),(p.drT>0?1:0)|(p.shield>0?2:0)|(p.stealthT>0?4:0),Math.round((p.aim||0)*10),Math.round(p.shield||0),p.lk|0]),
    nm:G.players.map(p=>p.name),
    e:G.enemies.filter(e=>e.hp>0&&near(e.x,e.y)).slice(0,34).map(e=>[e.id,ETYPES.indexOf(e.type),r(e.x),r(e.y),Math.max(1,Math.ceil(e.hp/e.mhp*100)),(e.frz>0?1:0)|(e.tele>0?2:0)|(e.flash>0?4:0)|(e.elite?8:0)|(e.chg>0?16:0)|(e.mistT>0?32:0)|(e.burn>0?64:0)|(e.act?128:0),e.bv??-1]),
    j:G.projs.slice(0,34).map(p=>[r(p.x),r(p.y),p.k,r(Math.atan2(p.vy,p.vx)*10)]),
    d:G.drops.filter(d=>near(d.x,d.y)).slice(0,26).map(d=>[d.id,d.k,r(d.x),r(d.y),d.r]),
    x:G.fx.filter(f=>G.time-f.t<1.2).slice(-14).map(f=>[f.id,f.k,r(f.x),r(f.y),r(f.v),f.o]),
    m:G.msgs.slice(-3),o:[...G.opened].slice(-60),cr:G.crates.map(c=>[c.x,c.y]),pl:G.platesOn,go:G.gateOpen?1:0,k:G.key,gp:(G.gp||[]).map(v=>Math.round(v*20)),wv:G.wave|0,so:G.stairsOpen?1:0,ab:G.abhOn?1:0,
    zo:G.zones.map(z=>[r(z.x),r(z.y),z.r,z.smoke?1:0]),fi:G.fires.map(f=>[r(f.x),r(f.y),f.r]),xp:G.xpTot,g:G.gain.g,pt:G.gain.pt,gm:G.gain.gm,sh:G.gain.sh,dc:G.dc,df:G.defT>0?1:0};
  let n=0;while(enc.encode(JSON.stringify(s)).length>3400&&n++<24){if(s.j.length>4)s.j.length=Math.floor(s.j.length*.6);else if(s.x.length>4)s.x.splice(0,4);else if(s.o.length>10)s.o.splice(0,10);else if(s.d.length>8)s.d.length-=6;else if(s.e.length>12)s.e.length-=5;else break}
  return s}
let netT=0;
function netTick(dt){if(!room)return;netT-=dt;
  // invité muet depuis 8 s (téléphone éteint, réseau coupé) : on libère sa place
  if(mode==='host'&&G.guestPeer&&performance.now()-(G.guestSeen||0)>(G.guestPres&&G.guestPres.bg?PAUSE_WAIT:8000)){Log.warn('à deux','invité muet trop longtemps');G.stale={peer:G.guestPeer,pres:G.guestPres};dropGuest();return}
  if(mode==='host'&&netT<=0){netT=.066;pres({g:serialize(),l:hero.lvl,wh:zoneName(G.m)})}
  if(mode==='solo'&&netT<=0){netT=3;pres({l:hero.lvl,wh:zoneName(G.m)})}
  if(mode==='guest'&&netT<=0){netT=.05;const r=Math.round;const tp=L.tp||aimPoint();
    pres({st:guestStats(),l:hero.lvl,i:{z:G.ep,p:[r(L.x),r(L.y)],m:[+L.mv[0].toFixed(2),+L.mv[1].toFixed(2)],a:+L.aim.toFixed(2),ac:L.ac,sk:L.sk,pc:L.pc,lu:L.lu,bc:L.bc,it:L.it,ia:L.ia,tp:[r(tp.x),r(tp.y)],iv:L.ivT>0?1:0}})}}
