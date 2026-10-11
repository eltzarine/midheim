/* ================= Combat au tour par tour =================
   On explore en temps réel. Un héros qui entre dans la zone de combat (à moins de TB_FIGHT cases d'un ennemi alerté),
   ou qui frappe un ennemi, passe au tour par tour, sur place, sans changer d'écran :
   - tour des héros : les héros au combat jouent en même temps ; chacun peut se déplacer (TB_MOVE cases, plus pour un héros
     rapide), faire UNE action (attaque, compétence, ultime ou relever l'allié) et boire UNE potion, puis touche « Fin du tour ».
     À deux, on peut annuler sa fin de tour tant que l'autre joue, pour se replacer ;
   - tour des ennemis : chacun avance et attaque une fois (projectiles compris) ; les héros au combat ne bougent pas.
   Chaque héros entre et sort du combat pour son compte : l'autre peut explorer en temps réel, puis rejoindre la bataille
   en entrant dans la zone ou en frappant. À plus de TB_LEAVE cases de tout ennemi à la fin d'un tour, on quitte le combat ;
   quand plus aucun héros n'y est, les ennemis rentrent chez eux.
   Les durées (recharges, mana, effets, brûlures, zones) avancent de TB_ROUND secondes à la fin de chaque tour.
   Qui a frappé en premier joue en premier ; un héros repéré laisse l'initiative aux ennemis.
   L'hôte décide de tout ; l'invité reçoit l'état (phase, tour, qui est au combat, actions utilisées) et bride ses commandes. */
const TB_FIGHT=9,TB_LEAVE=12,TB_ROUND=3,TB_EN=1.6,TB_EN_MAX=4,TB_MOVE=5,TB_DMG=2.2,TB_ULT=12,TB_COOP_T=60;
const tbIn=i=>!!(G&&G.cb&&G.cb.in[i]),tbMe=()=>tbIn(myIdx);
const tbHero=()=>tbMe()&&G.cb.ph==='h',tbFoe=()=>tbMe()&&G.cb.ph==='e';
/* ---------- côté hôte ---------- */
function tbFoes(){return G.enemies.filter(e=>e.hp>0&&e.act&&!e.ret)}
function tbClose(p,r){return tbFoes().some(e=>Math.hypot(p.x-e.x,p.y-e.y)<r*TS)}
function tbStart(first){G.cb={ph:'h',r:1,t:0,in:[false,false],rd:[false,false],ac:[false,false],po:[false,false]};
  for(const e of G.enemies){e.kx=e.ky=0;e.tbA=false}
  Log.ev('combat','début, '+tbFoes().length+' ennemi(s), '+(first>=0?'les héros':'les ennemis')+' commencent');
  if(first>=0){msg('Initiative ! Les héros frappent les premiers.');tbHeroPhase()}
  else{msg('Vous êtes repérés ! Les ennemis jouent en premier.');tbEnemyPhase()}}
function tbJoin(i,by){const c=G.cb,p=G.players[i];c.in[i]=true;c.rd[i]=false;c.ac[i]=by;c.po[i]=false;
  if(c.r>1||G.players.length>1&&c.in.filter(Boolean).length>1)msg(p.name+' entre dans le combat.')}
function tbEnd(win){Log.ev('combat','fin, tour '+G.cb.r,win?'victoire':'fuite');G.cb=null;
  for(const e of G.enemies){e.tbA=false;e.tbSkip=false;
    // fuite : les ennemis abandonnent et rentrent à leur poste
    if(!win&&e.hp>0&&e.act&&e.type!=='boss'&&!e.minion&&!e.wv&&e.hx!=null){e.act=false;e.ret=true;e.retT=0}}
  msg(win?'Victoire ! Le combat est terminé.':'Vous avez semé vos ennemis : ils rentrent chez eux.')}
function tbHeroPhase(){const c=G.cb;c.ph='h';c.t=0;c.rd=G.players.map((p,i)=>p.down||!c.in[i]);c.ac=[false,false];c.po=[false,false];
  for(const e of G.enemies){e.mistT=0;e.tele=0;e.chg=0}}
/* zones posées pendant le tour des héros : le feu brûle et le cercle soigne une fois, pour la durée d'un tour */
function tbAreas(){const S=TB_ROUND;
  for(const f of G.fires){const n=Math.max(1,Math.round(Math.min(f.t,S)/.5));for(const e of G.enemies)if(e.hp>0&&Math.hypot(e.x-f.x,e.y-f.y)<f.r+e.r)pDmg(f.pi,e,.6*n,{noEnch:true})}
  for(const z of G.zones){if(z.smoke||z.slow)continue;for(const p of G.players)if(!p.down&&Math.hypot(p.x-z.x,p.y-z.y)<z.r)healP(p,p.mhp*.09*Math.min(z.t,S),true)}}
function tbEnemyPhase(){const c=G.cb;tbAreas();c.ph='e';c.t=0;
  for(const e of G.enemies){if(e.hp<=0)continue;e.tbA=false;e.tbC=false;e.hitCd=0;e.tbSkip=false;
    if(e.type==='archer')e.cd=.25+Math.random()*.5;
    if(e.frz>0){if(e.type==='boss'&&e.frz<1)e.frz=0;else if(e.act){e.tbSkip=true;fx(46,e.x,e.y-e.r-6,0)}}}}
/* fin d'un tour complet : toutes les durées avancent de TB_ROUND secondes (héros au combat et ennemis) */
function tbRoundEnd(){const S=TB_ROUND,c=G.cb;
  G.players.forEach((p,i)=>{if(c.in[i])pStatus(p,S)});
  for(const e of G.enemies){if(e.hp<=0)continue;e.taunt-=S;e.blind-=S;e.slowT-=S;e.markT-=S;e.frz=Math.max(0,e.frz-S);
    if(e.burn>0){const d=e.burnD*Math.min(e.burn,S);e.burn-=S;e.hp-=d;fx(41,e.x,e.y-e.r,Math.round(d));if(e.hp<=0)killEnemy(e)}}
  for(const z of G.zones)z.t-=S;G.zones=G.zones.filter(z=>z.t>0);
  for(const f of G.fires)f.t-=S;G.fires=G.fires.filter(f=>f.t>0);
  for(const t of G.traps)t.t-=S;G.traps=G.traps.filter(t=>t.t>0);
  for(const d of G.decoys)d.t-=S;G.decoys=G.decoys.filter(d=>d.t>0);
  G.enemies=G.enemies.filter(e=>e.hp>0);c.r++;
  // qui s'est éloigné quitte le combat (un héros à terre y reste : il faut venir le relever)
  G.players.forEach((p,i)=>{if(c.in[i]&&!p.down&&!tbClose(p,TB_LEAVE)){c.in[i]=false;msg(p.name+' quitte le combat.')}})}
function tbUpdate(dt){
  const by=G.tbBy&&G.time-G.tbBy.t<.6?G.tbBy.pi:-1;
  // qui entre dans la zone de combat, ou frappe un ennemi, passe au tour par tour
  const want=G.players.map((p,i)=>!p.down&&!tbIn(i)&&(i===by||tbClose(p,TB_FIGHT)));
  if(!G.cb){if(!want.some(Boolean))return;tbStart(by)}
  const c=G.cb;want.forEach((w,i)=>{if(w)tbJoin(i,i===by&&c.ph==='h')});if(by>=0)G.tbBy=null;
  c.t+=dt;
  if(!tbFoes().length){tbEnd(true);return}
  if(!c.in.some(Boolean)){tbEnd(false);return}
  if(c.ph==='h'){G.players.forEach((p,i)=>{if(p.down||!c.in[i])c.rd[i]=true});
    if(G.coop&&c.t>TB_COOP_T&&!c.rd.every(Boolean)){c.rd=[true,true];msg('Temps écoulé : au tour des ennemis.')}
    // le tour des héros se termine quand chacun a fini et que ses coups ont touché (projectiles, météore, tempête)
    if(G.players.every((p,i)=>c.rd[i])&&!G.projs.some(q=>q.from==='p')&&!G.later.length&&!G.players.some((p,i)=>c.in[i]&&p.stormT>0&&!p.down))tbEnemyPhase();return}
  // tour des ennemis : il dure TB_EN s, et se prolonge le temps que les projectiles et les charges arrivent
  const busy=G.projs.some(q=>q.from==='e')||G.enemies.some(e=>e.hp>0&&(e.chg>0||e.tele>0));
  if(c.t>=TB_EN&&(!busy||c.t>=TB_EN_MAX)){tbRoundEnd();
    if(!tbFoes().length){tbEnd(true);return}
    if(!c.in.some(Boolean)){tbEnd(false);return}
    tbHeroPhase()}}
/* l'invité : une action et une potion par tour, rien pendant le tour des ennemis */
function tbGate(i,kind){const c=G.cb;if(!c||!c.in[i])return true;if(c.ph!=='h'||c.rd[i])return false;const a=kind==='po'?c.po:c.ac;if(a[i])return false;a[i]=true;return true}
/* relever l'allié au combat : c'est l'action du tour */
function tbRevive(pi){const c=G.cb,p=G.players[pi];if(!c||!c.in[pi]||c.ph!=='h'||c.ac[pi]||!p||p.down)return;const q=G.players.find(o=>o!==p&&o.down&&Math.hypot(o.x-p.x,o.y-p.y)<70);if(!q)return;
  const qi=G.players.indexOf(q);c.ac[pi]=true;q.down=false;q.rev=0;q.hp=q.mhp*(p.cls==='soigneur'?.6:.4);q.lowSaid=false;c.rd[qi]=false;msg(q.name+' est relevé !');sayP(qi,'rev');fx(14,q.x,q.y,0,qi)}
/* état envoyé à l'invité : [phase 1 héros / 2 ennemis, tour, drapeaux, secondes restantes à deux] */
function tbPack(){const c=G.cb;if(!c)return 0;const f=(a,b)=>(a[0]?b:0)|(a[1]?b*2:0);
  return[c.ph==='h'?1:2,c.r,f(c.rd,1)|f(c.ac,4)|f(c.po,16)|f(c.in,64),G.coop&&c.ph==='h'?Math.max(0,Math.ceil(TB_COOP_T-c.t)):0]}
function tbUnpack(a){if(!Array.isArray(a)||!a.length)return null;const n=v=>Number.isFinite(+v)?+v:0,b=n(a[2])|0,f=k=>[!!(b&k),!!(b&k*2)];
  return{ph:n(a[0])===2?'e':'h',r:clamp(n(a[1])|0,1,1e6),rd:f(1),ac:f(4),po:f(16),in:f(64),tl:clamp(n(a[3]),0,999),t:0}}

/* ---------- côté joueur (hôte et invité) ---------- */
function tbCanAct(){if(!tbMe())return true;return G.cb.ph==='h'&&!G.cb.ac[myIdx]&&!L.tbAct&&!L.tbEnd}
function tbCanPot(){if(!tbMe())return true;return G.cb.ph==='h'&&!G.cb.po[myIdx]&&!L.tbPot&&!L.tbEnd}
function tbUse(kind){if(!tbMe())return;if(kind==='po'){L.tbPot=true;if(mode!=='guest')G.cb.po[myIdx]=true}else{L.tbAct=true;if(mode!=='guest')G.cb.ac[myIdx]=true}}
function tbWhy(){return!tbMe()?'':G.cb.ph!=='h'?'Attends : c’est le tour des ennemis.':L.tbEnd?'Tu as fini ton tour.':'Action déjà utilisée ce tour. Déplace-toi ou touche « Fin du tour ».'}
function tbMoveMax(){return TB_MOVE*TS*clamp(ST.spd/150,.8,1.6)}
function tbActed(){return!!(G.cb&&(G.cb.ac[myIdx]||L.tbAct))}
function endTurn(){if(!tbHero()||L.tbEnd)return;const me=myP();if(!me||me.down)return;L.tbEnd=true;L.tbGo=0;L.et=G.cb.r;if(mode!=='guest')G.cb.rd[myIdx]=true;Snd.play('key')}
/* à deux : tant que l'autre joue, on peut revenir sur sa fin de tour ; sans action faite, on repart de sa place de départ */
function tbOtherPlaying(){const c=G.cb,o=myIdx===0?1:0;return!!(c&&G.players[o]&&c.in[o]&&!c.rd[o]&&!G.players[o].down)}
function cancelEnd(){if(!tbHero()||!L.tbEnd||!tbOtherPlaying())return;L.tbEnd=false;L.et=0;if(mode!=='guest')G.cb.rd[myIdx]=false;
  if(!tbActed()){L.x=L.tbOx;L.y=L.tbOy;L.tbMv=tbMoveMax()}Snd.play('key')}
/* cible touchée à l'écran : on s'en approche (avec le déplacement du tour) puis on la frappe */
function tbTarget(){if(!L.tbT)return null;const e=G.enemies.find(e=>e.id===L.tbT&&e.hp>0);if(!e)L.tbT=0;return e||null}
function tbReach(e){const m={guerrier:58,voleur:48}[hero.cls];return m?m+e.r-6:300}
function enemyAt(sx,sy){if(!G||!G.m)return null;const w=screenToWorld(sx,sy);let b=null,bd=1e9;for(const e of G.enemies){if(e.hp<=0)continue;const d=Math.hypot((e.rx??e.x)-w.x,(e.ry??e.y)-w.y);if(d<e.r+20&&d<bd){bd=d;b=e}}return b}
function tapEnemy(sx,sy){if(!inGame()||paused||Scene.on)return false;const e=enemyAt(sx,sy);if(!e)return false;const me=myP();if(!me||me.down)return true;
  L.tbT=e.id;if(tbFoe()){toast(tbWhy(),'tb');return true}if(!tbCanAct()){toast(tbWhy(),'tb');return true}L.tbGo=e.id;L.tbGoT=0;return true}
/* appelé à chaque image : entrée ou sortie du combat, nouveau tour, nouvelle phase */
function tbLocal(){const c=G.cb,inn=tbMe(),key=inn?c.r+c.ph:'';if(key===L.tbKey)return;const was=L.tbKey;L.tbKey=key;
  if(!inn){L.tbR=0;L.tbEnd=false;L.tbGo=0;if(was){tbFlash(c?'Tu quittes le combat':'Fin du combat');Snd.play('lvl')}return}
  if(L.tbR&&c.r>L.tbR)tickLocal(TB_ROUND*Math.min(3,c.r-L.tbR),true);L.tbR=c.r;
  if(c.ph==='h'){L.tbMv=tbMoveMax();L.tbAct=false;L.tbPot=false;L.tbEnd=false;L.et=0;L.tbOx=L.x;L.tbOy=L.y;const me=myP();
    tbFlash(me&&me.down?'Tour '+c.r+' · à terre':'Tour '+c.r+' · à toi de jouer !');Snd.play('gate')}
  else{L.tbMv=0;L.tbGo=0;tbFlash(was?'Tour des ennemis':'Combat !');Snd.play('boom');keys.clear();touch.jx=touch.jy=0;touch.atk=false;mouse.down=false}}
let tbFlT=null;function tbFlash(t){const b=$('#tbFlash');if(!b)return;b.textContent=t;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');clearTimeout(tbFlT);tbFlT=setTimeout(()=>b.classList.remove('show'),1500)}
/* bandeau du tour : phase, action, potion, déplacement, allié */
function tbHud(){const box=hq('#tbInfo'),be=hq('#bEnd'),c=G.cb,inn=tbMe(),me=myP();setHid(box,!inn);
  const canEnd=inn&&c.ph==='h'&&me&&!me.down,undo=canEnd&&L.tbEnd&&tbOtherPlaying();
  setHid(be,!(canEnd&&(!L.tbEnd||undo)));if(!inn)return;
  const acted=tbActed(),pot=!!(c.po[myIdx]||L.tbPot),hp=c.ph==='h';
  setTxt(hq('#tbPh'),'Tour '+c.r+' · '+(!hp?'les ennemis jouent':me&&me.down?'à terre':L.tbEnd?'tu as fini':'à toi'));box.classList.toggle('foe',!hp);
  hq('#tbAct').classList.toggle('off',acted||!hp||L.tbEnd);hq('#tbPot').classList.toggle('off',pot||!hp||L.tbEnd);
  const mi=hq('#tbMv');setTxt(mi,hp&&!L.tbEnd?'Déplacement '+(L.tbMv/TS).toFixed(1).replace('.',',')+' cases':'Déplacement —');mi.classList.toggle('off',!hp||L.tbEnd||L.tbMv<2);
  const oi=myIdx===0?1:0,o=G.players[oi],al=hq('#tbAl');setHid(al,!o);
  if(o)setTxt(al,!c.in[oi]?o.name+' : hors combat':o.down?o.name+' : à terre':!hp?'':c.rd[oi]?o.name+' : prêt ✓':o.name+' joue…'+(c.tl?' '+c.tl+' s':''));
  setTxt(be,undo?'Annuler la fin du tour':'Fin du tour');be.classList.toggle('glow',acted&&!undo);be.classList.toggle('undo',!!undo)}
