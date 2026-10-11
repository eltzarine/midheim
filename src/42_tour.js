/* ================= Combat au tour par tour =================
   On explore en temps réel. Dès qu'un ennemi alerté se trouve à moins de TB_FIGHT cases d'un héros, le combat passe
   au tour par tour, sur place, sans changer d'écran :
   - tour des héros : les deux joueurs jouent en même temps ; chacun peut se déplacer (TB_MOVE cases, plus pour un héros rapide),
     faire UNE action (attaque, compétence, ultime ou relever l'allié) et boire UNE potion, puis touche « Fin du tour » ;
   - tour des ennemis : chacun avance et attaque une fois (projectiles compris), les héros ne bougent pas.
   Les durées (recharges, mana, effets, brûlures, zones) avancent de TB_ROUND secondes à la fin de chaque tour.
   Qui a frappé en premier joue en premier ; un héros repéré laisse l'initiative aux ennemis.
   L'hôte décide de tout ; l'invité reçoit l'état (phase, tour, actions utilisées) et bride ses propres commandes. */
const TB_FIGHT=9,TB_LEAVE=12,TB_ROUND=3,TB_EN=1.6,TB_EN_MAX=4,TB_MOVE=5,TB_DMG=2.2,TB_ULT=12,TB_COOP_T=60;
const tbHero=()=>!!(G&&G.cb&&G.cb.ph==='h'),tbFoe=()=>!!(G&&G.cb&&G.cb.ph==='e');
/* ---------- côté hôte ---------- */
function tbFoes(){return G.enemies.filter(e=>e.hp>0&&e.act&&!e.ret)}
function tbNear(r){const pl=G.players.filter(p=>!p.down);return tbFoes().some(e=>pl.some(p=>Math.hypot(p.x-e.x,p.y-e.y)<r*TS))}
function tbNew(){return{ph:'h',r:1,t:0,rd:[false,false],ac:[false,false],po:[false,false]}}
function tbStart(){const by=G.tbBy&&G.time-G.tbBy.t<.6?G.tbBy.pi:-1;G.tbBy=null;G.cb=tbNew();
  for(const e of G.enemies){e.kx=e.ky=0;if(e.act)e.tbA=false}
  Log.ev('combat','début, '+tbFoes().length+' ennemi(s), '+(by>=0?'les héros':'les ennemis')+' commencent');
  if(by>=0){tbHeroPhase();G.cb.ac[by]=true;msg('Initiative ! Les héros frappent les premiers.')}
  else{msg('Vous êtes repérés ! Les ennemis jouent en premier.');tbEnemyPhase()}}
function tbEnd(win){Log.ev('combat','fin, tour '+G.cb.r,win?'victoire':'fuite');G.cb=null;for(const e of G.enemies){e.tbA=false;e.tbSkip=false}
  msg(win?'Victoire ! Le combat est terminé.':'Vous avez semé vos ennemis.')}
function tbHeroPhase(){const c=G.cb;c.ph='h';c.t=0;c.rd=G.players.map(p=>p.down);c.ac=[false,false];c.po=[false,false];
  for(const e of G.enemies){e.mistT=0;e.tele=0;e.chg=0}}
/* zones posées pendant le tour des héros : le feu brûle et le cercle soigne une fois, pour la durée d'un tour */
function tbAreas(){const S=TB_ROUND;
  for(const f of G.fires){const n=Math.max(1,Math.round(Math.min(f.t,S)/.5));for(const e of G.enemies)if(e.hp>0&&Math.hypot(e.x-f.x,e.y-f.y)<f.r+e.r)pDmg(f.pi,e,.6*n,{noEnch:true})}
  for(const z of G.zones){if(z.smoke||z.slow)continue;for(const p of G.players)if(!p.down&&Math.hypot(p.x-z.x,p.y-z.y)<z.r)healP(p,p.mhp*.09*Math.min(z.t,S),true)}}
function tbEnemyPhase(){const c=G.cb;tbAreas();c.ph='e';c.t=0;
  for(const e of G.enemies){if(e.hp<=0)continue;e.tbA=false;e.tbC=false;e.hitCd=0;e.tbSkip=false;
    if(e.type==='archer')e.cd=.25+Math.random()*.5;
    if(e.frz>0){if(e.type==='boss'&&e.frz<1)e.frz=0;else if(e.act){e.tbSkip=true;fx(46,e.x,e.y-e.r-6,3)}}}}
/* fin d'un tour complet : toutes les durées avancent de TB_ROUND secondes */
function tbRoundEnd(){const S=TB_ROUND,c=G.cb;
  for(const p of G.players)pStatus(p,S);
  for(const e of G.enemies){if(e.hp<=0)continue;e.taunt-=S;e.blind-=S;e.slowT-=S;e.markT-=S;e.frz=Math.max(0,e.frz-S);
    if(e.burn>0){const d=e.burnD*Math.min(e.burn,S);e.burn-=S;e.hp-=d;fx(41,e.x,e.y-e.r,Math.round(d));if(e.hp<=0)killEnemy(e)}}
  for(const z of G.zones)z.t-=S;G.zones=G.zones.filter(z=>z.t>0);
  for(const f of G.fires)f.t-=S;G.fires=G.fires.filter(f=>f.t>0);
  for(const t of G.traps)t.t-=S;G.traps=G.traps.filter(t=>t.t>0);
  for(const d of G.decoys)d.t-=S;G.decoys=G.decoys.filter(d=>d.t>0);
  G.enemies=G.enemies.filter(e=>e.hp>0);c.r++}
function tbUpdate(dt){
  if(!G.cb){if(G.players.some(p=>!p.down)&&tbNear(TB_FIGHT))tbStart();return}
  const c=G.cb;c.t+=dt;
  if(!tbFoes().length){tbEnd(true);return}
  if(c.ph==='h'){G.players.forEach((p,i)=>{if(p.down)c.rd[i]=true});
    if(G.coop&&c.t>TB_COOP_T&&!c.rd.every(Boolean)){c.rd=[true,true];msg('Temps écoulé : au tour des ennemis.')}
    // le tour des héros se termine quand chacun a fini et que ses coups ont touché (projectiles, météore)
    if(G.players.every((p,i)=>c.rd[i])&&!G.projs.some(q=>q.from==='p')&&!G.later.length&&!G.players.some(p=>p.stormT>0&&!p.down))tbEnemyPhase();return}
  // tour des ennemis : il dure TB_EN s, et se prolonge le temps que les projectiles et les charges arrivent
  const busy=G.projs.some(q=>q.from==='e')||G.enemies.some(e=>e.hp>0&&(e.chg>0||e.tele>0));
  if(c.t>=TB_EN&&(!busy||c.t>=TB_EN_MAX)){tbRoundEnd();
    if(!tbFoes().length){tbEnd(true);return}
    if(!tbNear(TB_LEAVE)){tbEnd(false);return}
    tbHeroPhase()}}
/* l'invité : une action et une potion par tour, rien pendant le tour des ennemis */
function tbGate(i,kind){const c=G.cb;if(!c)return true;if(c.ph!=='h')return false;const a=kind==='po'?c.po:c.ac;if(a[i])return false;a[i]=true;return true}
/* relever l'allié au combat : c'est l'action du tour */
function tbRevive(pi){const c=G.cb,p=G.players[pi];if(!c||c.ph!=='h'||c.ac[pi]||!p||p.down)return;const q=G.players.find(o=>o!==p&&o.down&&Math.hypot(o.x-p.x,o.y-p.y)<70);if(!q)return;
  c.ac[pi]=true;q.down=false;q.rev=0;q.hp=q.mhp*(p.cls==='soigneur'?.6:.4);q.lowSaid=false;c.rd[G.players.indexOf(q)]=false;msg(q.name+' est relevé !');sayP(G.players.indexOf(q),'rev');fx(14,q.x,q.y,0,G.players.indexOf(q))}
/* état envoyé à l'invité : [phase 1 héros / 2 ennemis, tour, drapeaux, secondes restantes à deux] */
function tbPack(){const c=G.cb;if(!c)return 0;const b=(c.rd[0]?1:0)|(c.rd[1]?2:0)|(c.ac[0]?4:0)|(c.ac[1]?8:0)|(c.po[0]?16:0)|(c.po[1]?32:0);
  return[c.ph==='h'?1:2,c.r,b,G.coop&&c.ph==='h'?Math.max(0,Math.ceil(TB_COOP_T-c.t)):0]}
function tbUnpack(a){if(!Array.isArray(a)||!a.length)return null;const n=v=>Number.isFinite(+v)?+v:0,b=n(a[2])|0;
  return{ph:n(a[0])===2?'e':'h',r:clamp(n(a[1])|0,1,1e6),rd:[!!(b&1),!!(b&2)],ac:[!!(b&4),!!(b&8)],po:[!!(b&16),!!(b&32)],tl:clamp(n(a[3]),0,999),t:0}}

/* ---------- côté joueur (hôte et invité) ---------- */
function tbCanAct(){if(!G.cb)return true;return G.cb.ph==='h'&&!G.cb.ac[myIdx]&&!L.tbAct&&!L.tbEnd}
function tbCanPot(){if(!G.cb)return true;return G.cb.ph==='h'&&!G.cb.po[myIdx]&&!L.tbPot&&!L.tbEnd}
function tbUse(kind){if(!G.cb)return;if(kind==='po'){L.tbPot=true;if(mode!=='guest')G.cb.po[myIdx]=true}else{L.tbAct=true;if(mode!=='guest')G.cb.ac[myIdx]=true}}
function tbWhy(){return!G.cb?'':G.cb.ph!=='h'?'Attends : c’est le tour des ennemis.':L.tbEnd?'Tu as fini ton tour.':'Action déjà utilisée ce tour. Déplace-toi ou touche « Fin du tour ».'}
function tbMoveMax(){return TB_MOVE*TS*clamp(ST.spd/150,.8,1.6)}
function endTurn(){if(!tbHero()||L.tbEnd)return;const me=myP();if(!me||me.down)return;L.tbEnd=true;L.et=G.cb.r;if(mode!=='guest')G.cb.rd[myIdx]=true;Snd.play('key')}
/* appelé à chaque image : nouveau tour, nouvelle phase, fin du combat */
function tbLocal(){const c=G.cb,key=c?c.r+c.ph:'';if(key===L.tbKey)return;const was=L.tbKey;L.tbKey=key;
  if(!c){L.tbR=0;if(was){tbFlash('Fin du combat');Snd.play('lvl')}return}
  if(L.tbR&&c.r>L.tbR)tickLocal(TB_ROUND*Math.min(3,c.r-L.tbR),true);L.tbR=c.r;
  if(c.ph==='h'){L.tbMv=tbMoveMax();L.tbAct=false;L.tbPot=false;L.tbEnd=false;L.tbOx=L.x;L.tbOy=L.y;const me=myP();
    tbFlash(me&&me.down?'Tour '+c.r+' · à terre':'Tour '+c.r+' · à toi de jouer !');Snd.play('gate')}
  else{L.tbMv=0;tbFlash(was?'Tour des ennemis':'Combat !');Snd.play('boom');keys.clear();touch.jx=touch.jy=0}}
let tbFlT=null;function tbFlash(t){const b=$('#tbFlash');if(!b)return;b.textContent=t;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');clearTimeout(tbFlT);tbFlT=setTimeout(()=>b.classList.remove('show'),1500)}
/* bandeau du tour : phase, action, potion, allié */
function tbHud(){const box=hq('#tbInfo'),be=hq('#bEnd');const c=G.cb;setHid(box,!c);const me=myP();
  setHid(be,!(c&&c.ph==='h'&&me&&!me.down&&!L.tbEnd));if(!c)return;
  const acted=!!(c.ac[myIdx]||L.tbAct),pot=!!(c.po[myIdx]||L.tbPot);
  let t='Tour '+c.r+' · '+(c.ph==='e'?'les ennemis jouent':me&&me.down?'à terre':L.tbEnd?'tu as fini':'à toi');
  setTxt(hq('#tbPh'),t);box.classList.toggle('foe',c.ph==='e');
  const ai=hq('#tbAct'),pi=hq('#tbPot'),mi=hq('#tbMv');ai.classList.toggle('off',acted||c.ph!=='h');pi.classList.toggle('off',pot||c.ph!=='h');
  setTxt(mi,c.ph==='h'&&!L.tbEnd?(L.tbMv/TS).toFixed(1)+' cases':'—');mi.classList.toggle('off',c.ph!=='h'||L.tbMv<2);
  const oi=myIdx===0?1:0,o=G.players[oi],al=hq('#tbAl');setHid(al,!o);
  if(o)setTxt(al,o.down?o.name+' : à terre':c.ph!=='h'?o.name:c.rd[oi]?o.name+' : prêt ✓':o.name+' réfléchit…'+(c.tl?' '+c.tl+' s':''));
  be.classList.toggle('glow',acted);
  // compétences : recharge en tours pendant le combat
  setTxt(hq('#bEnd'),acted&&L.tbMv<2?'Fin du tour ✓':'Fin du tour')}
