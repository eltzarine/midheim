/* ================= Combat au tour par tour =================
   On explore en temps réel. Un héros qui entre dans la zone de combat (à moins de TB_FIGHT cases d'un ennemi alerté),
   ou qui frappe un ennemi, passe au tour par tour, sur place, sans changer d'écran.
   Ordre des tours : à chaque manche, héros et ennemis au combat sont rangés du plus rapide au plus lent (initiative, tbIni)
   et jouent UN PAR UN, chacun son tour (G.cb.q, G.cb.k) : jamais deux à la fois, ni deux héros, ni un héros et un ennemi.
   - tour d'un héros : lui seul peut se déplacer (TB_MOVE cases, plus pour un héros rapide), dépenser ses TB_PA points
     d'action (attaque et compétence : 1 point, ultime : 2, relever l'allié : 1) et boire UNE potion, puis « Fin du tour » ;
   - tour d'un ennemi : lui seul avance et attaque une fois (projectiles compris), tout le reste est figé.
     Ce que chaque ennemi a fait est noté (G.cb.lg) et affiché dans le bandeau et au-dessus de lui.
   Le héros qui ouvre le combat en frappant joue le premier (embuscade).
   Toucher un ennemi le choisit pour cible ; l'attaque et les compétences partent vers lui.
   Chaque héros entre et sort du combat pour son compte : l'autre peut explorer en temps réel, puis rejoindre la bataille
   en entrant dans la zone ou en frappant. À plus de TB_LEAVE cases de tout ennemi à la fin d'un tour, on quitte le combat ;
   quand plus aucun héros n'y est, les ennemis rentrent chez eux.
   Les durées (recharges, mana, effets, brûlures, zones) avancent de TB_ROUND secondes à la fin de chaque tour.
   L'hôte décide de tout ; l'invité reçoit l'état (manche, ordre, à qui le tour, qui est au combat, points restants)
   et bride ses commandes. */
const TB_FIGHT=9,TB_LEAVE=12,TB_ROUND=3,TB_EN=1.6,TB_EN_MAX=4,TB_EN_AFTER=.5,TB_MOVE=5,TB_DMG=2.2,TB_ULT=12,TB_COOP_T=60,TB_PA=2,TB_DASH=2;
/* points d'action par tour selon la classe : les combattants au contact (guerrier, voleur) en ont 3, les lanceurs de sorts 2.
   Foncer coûte TB_DASH points et ajoute un déplacement complet (le déplacement du tour est doublé). */
const TB_PA_CLS={guerrier:3,voleur:3,mage:2,soigneur:2};
function tbPA(i){const p=G&&G.players[i];return p&&TB_PA_CLS[p.cls]||TB_PA}
const tbIn=i=>!!(G&&G.cb&&G.cb.in[i]),tbMe=()=>tbIn(myIdx);
/* tbHero : c'est mon tour ; tbFoe : c'est le tour d'un ennemi ; tbAlly : c'est le tour de mon allié */
const tbHero=()=>tbMe()&&G.cb.ph==='h'&&G.cb.who===myIdx,tbFoe=()=>tbMe()&&G.cb.ph==='e',tbAlly=()=>tbMe()&&G.cb.ph==='h'&&G.cb.who!==myIdx;
/* ---------- initiative : qui joue avant qui ----------
   Héros : sa vitesse de déplacement (classe, talents, équipement) / 12,5 → guerrier, mage et soigneur 12, voleur 14.
   Ennemis : d'après leur espèce, +1 pour un chef ; ralenti : −3. À égalité, les héros passent avant les ennemis. */
const TB_INI={slime:7,bat:13,archer:10,orc:9,mimic:11,boss:10};
function heroSpd(i){const p=G.players[i];if(!p)return 150;if(i===myIdx&&mode!=='guest'&&typeof ST!=='undefined'&&ST&&ST.spd)return ST.spd;return p.st&&p.st.spd||CLS[p.cls].spd}
function tbIni(tok){if(tok<0)return Math.round(heroSpd(-tok-1)/12.5);const e=G.enemies.find(o=>o.id===tok);if(!e)return 0;
  return(TB_INI[e.type]||8)+(e.elite?1:0)-(e.slowT>0?3:0)}
/* rang dans la manche : initiative décroissante, héros d'abord à égalité, puis par numéro */
function tbRank(a,b){return tbIni(b)-tbIni(a)||(b<0)-(a<0)||(a<0?b-a:a-b)}
/* jeton d'un acteur : un héros i vaut −(i+1), un ennemi vaut son numéro */
const tbTok=i=>-(i+1);
/* coût en points d'action : attaque et compétence 1, ultime 2 */
const tbCost=id=>id&&SK[id]&&SK[id].t==='u'?2:1;
/* ---------- noms et états des ennemis (affichés aux deux joueurs) ---------- */
function enemyName(e){if(e.type==='boss'){const c=(BOSSES[e.bv??0]||BOSSES[0]).court;return c.charAt(0).toUpperCase()+c.slice(1)}
  if(e.elite)return'Chef';return({slime:'Marionnette',bat:'Rejeton',archer:'Adepte',orc:G.m&&G.m.soldat?'Veilleur':'Orc',mimic:'Mimique'})[e.type]||'Ennemi'}
const tbTurns=s=>Math.max(1,Math.ceil(s/TB_ROUND-.01));
/* états d'un ennemi : [libellé, couleur, tours] ; chez l'invité, ils arrivent tout faits (e.st) */
function enemyStates(e){if(e.st)return e.st;const r=[];
  if(e.frz>0)r.push(['Étourdi','#9fd0ff',tbTurns(e.frz)]);if(e.burn>0)r.push(['Brûle','#ffb36a',tbTurns(e.burn)]);
  if(e.slowT>0)r.push(['Ralenti','#c9a2ff',tbTurns(e.slowT)]);if(e.markT>0)r.push(['Marqué','#ffe08a',tbTurns(e.markT)]);
  if(e.taunt>0)r.push(['Provoqué','#ff9a8a',tbTurns(e.taunt)]);if(e.blind>0)r.push(['Aveuglé','#c9c2e0',tbTurns(e.blind)]);return r}
function enemyStatePack(e){const t=s=>Math.min(15,s>0?tbTurns(s):0);return t(e.frz)|t(e.burn)<<4|t(e.slowT)<<8|t(e.markT)<<12|t(e.taunt)<<16|t(e.blind)<<20}
function enemyStateUnpack(v){v=v|0;const r=[],L2=[['Étourdi','#9fd0ff'],['Brûle','#ffb36a'],['Ralenti','#c9a2ff'],['Marqué','#ffe08a'],['Provoqué','#ff9a8a'],['Aveuglé','#c9c2e0']];
  L2.forEach((s,k)=>{const n=v>>(k*4)&15;if(n)r.push([s[0],s[1],n])});return r}
/* ce que l'ennemi fera à son prochain tour */
function enemyIntent(e){const st=enemyStates(e);if(st.some(s=>s[0]==='Étourdi'))return'passe son tour (étourdi)';if(st.some(s=>s[0]==='Aveuglé'))return'ne voit plus personne';
  if(e.type==='archer')return'va tirer';if(e.type==='boss')return'attaque spéciale possible';if(e.type==='orc')return'va charger ou frapper';return'va s’approcher et frapper'}
/* ---------- journal du tour des ennemis ---------- */
const TB_LG=['','frappe','charge','tire sur','est étourdi et passe son tour','lance une salve','appelle des renforts','disparaît dans la brume'];
function tbLog(e,k,pi,d){const c=G.cb;if(!c||c.ph!=='e'||!e)return;let it=c.lg.find(x=>x.id===e.id&&x.k===k);if(!it){if(c.lg.length>=24)return;it={id:e.id,k,pi:pi==null?-1:pi,d:0,n:enemyName(e)};c.lg.push(it)}if(d)it.d+=Math.round(d)}
/* ---------- côté hôte ---------- */
function tbFoes(){return G.enemies.filter(e=>e.hp>0&&e.act&&!e.ret)}
function tbClose(p,r){const R=r*TS;for(const e of G.enemies)if(e.hp>0&&e.act&&!e.ret&&Math.hypot(p.x-e.x,p.y-e.y)<R)return true;return false}
/* ouverture : qui entre au combat (want), qui a frappé le premier (first, −1 si les ennemis ont repéré les héros) */
function tbStart(first,want){const c=G.cb={ph:'',who:-1,eid:-1,q:[],k:0,r:1,t:0,in:[!!want[0],!!want[1]],
    rd:[false,false],ap:[tbPA(0),tbPA(1)],po:[false,false],pre:[0,0],lg:[]};
  for(const e of G.enemies){e.kx=e.ky=0;e.tbA=false}
  c.q=tbQueue();
  // embuscade : le héros qui a frappé joue le premier (son coup compte déjà pour 1 point d'action)
  if(first>=0&&c.in[first]){const t=tbTok(first);c.q=[t].concat(c.q.filter(x=>x!==t));c.pre[first]=1}
  Log.ev('combat','début, '+tbFoes().length+' ennemi(s), ordre '+c.q.map(tbTokName).join(' > '));
  msg(first>=0?'Initiative ! '+G.players[first].name+' frappe le premier.':'Combat ! Chacun son tour, du plus rapide au plus lent.');
  tbBegin(0)}
/* ordre d'une manche : héros au combat et ennemis en alerte, du plus rapide au plus lent */
function tbQueue(){const c=G.cb,q=[];G.players.forEach((p,i)=>{if(c.in[i])q.push(tbTok(i))});for(const e of tbFoes())q.push(e.id);return q.sort(tbRank)}
function tbTokName(t){if(t<0){const p=G.players[-t-1];return p?p.name:'?'}const e=G.enemies.find(o=>o.id===t);return e?enemyName(e):'?'}
/* un héros rejoint un combat en cours : il prend sa place parmi ceux qui n'ont pas encore joué cette manche */
function tbJoin(i,by){const c=G.cb,p=G.players[i],t=tbTok(i);c.in[i]=true;c.pre[i]=by?1:0;
  if(c.q[c.k]!==t&&!c.q.slice(c.k+1).includes(t)){let j=c.k+1;while(j<c.q.length&&tbRank(c.q[j],t)<0)j++;c.q.splice(j,0,t)}
  if(c.in.filter(Boolean).length>1)msg(p.name+' entre dans le combat.')}
function tbEnd(win){Log.ev('combat','fin, tour '+G.cb.r,win?'victoire':'fuite');G.cb=null;
  for(const e of G.enemies){e.tbA=false;e.tbSkip=false;
    // fuite : les ennemis abandonnent et rentrent à leur poste
    if(!win&&e.hp>0&&e.act&&e.type!=='boss'&&!e.minion&&!e.wv&&e.hx!=null){e.act=false;e.ret=true;e.retT=0}}
  msg(win?'Victoire ! Le combat est terminé.':'Vous avez semé vos ennemis : ils rentrent chez eux.')}
/* l'acteur du jeton t peut-il jouer ? (héros au combat et debout, ennemi vivant et en alerte) */
function tbLive(t){if(t<0){const i=-t-1,p=G.players[i];return!!(p&&G.cb.in[i]&&!p.down)}const e=G.enemies.find(o=>o.id===t);return!!(e&&e.hp>0&&e.act&&!e.ret)}
/* donne la main au k-ième de la manche (en sautant qui ne peut pas jouer) ; après le dernier, la manche se termine */
function tbBegin(k){const c=G.cb;
  for(;;){while(k<c.q.length&&!tbLive(c.q[k]))k++;if(k<c.q.length)break;
    tbAreas();tbRoundEnd();
    if(!tbFoes().length){tbEnd(true);return}
    if(!c.in.some(Boolean)){tbEnd(false);return}
    c.q=tbQueue();c.lg=[];k=0}
  c.k=k;c.t=0;c.tA=-1;const t=c.q[k];
  if(t<0){const i=-t-1;c.ph='h';c.who=i;c.eid=-1;c.rd[i]=false;c.ap[i]=tbPA(i)-(c.pre[i]||0);c.pre[i]=0;c.po[i]=false;
    for(const e of G.enemies){e.mistT=0;e.tele=0;e.chg=0}return}
  const e=G.enemies.find(o=>o.id===t);c.ph='e';c.who=-1;c.eid=t;
  e.tbA=false;e.tbC=false;e.hitCd=0;e.tbSkip=false;if(e.type==='archer')e.cd=.25+Math.random()*.5;
  if(e.frz>0){if(e.type==='boss'&&e.frz<1)e.frz=0;else{e.tbSkip=true;fx(46,e.x,e.y-e.r-6,0);tbLog(e,4)}}}
const tbNext=()=>tbBegin(G.cb.k+1);
/* zones posées par les héros : le feu brûle et le cercle soigne une fois par manche, pour la durée d'une manche */
function tbAreas(){const S=TB_ROUND;
  for(const f of G.fires){const n=Math.max(1,Math.round(Math.min(f.t,S)/.5));for(const e of G.enemies)if(e.hp>0&&Math.hypot(e.x-f.x,e.y-f.y)<f.r+e.r)pDmg(f.pi,e,.6*n,{noEnch:true})}
  for(const z of G.zones){if(z.smoke||z.slow)continue;for(const p of G.players)if(!p.down&&Math.hypot(p.x-z.x,p.y-z.y)<z.r)healP(p,p.mhp*.09*Math.min(z.t,S),true)}}
/* fin d'une manche : toutes les durées avancent de TB_ROUND secondes (héros au combat et ennemis) */
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
  if(!G.cb){if(!want.some(Boolean))return;if(!tbFoes().length){G.tbBy=null;return}G.tbBy=null;tbStart(by,want);if(!G.cb)return}
  else{want.forEach((w,i)=>{if(w)tbJoin(i,i===by)});if(by>=0)G.tbBy=null}
  const c=G.cb;c.t+=dt;
  if(!tbFoes().length){tbEnd(true);return}
  if(!c.in.some(Boolean)){tbEnd(false);return}
  if(!tbLive(c.q[c.k])){tbNext();return}
  if(c.ph==='h'){const i=c.who,p=G.players[i];
    if(G.coop&&c.t>TB_COOP_T&&!c.rd[i]){c.rd[i]=true;msg('Temps écoulé : '+p.name+' passe son tour.')}
    // le tour du héros se termine quand il a fini et que ses coups ont touché (projectiles, météore, tempête)
    if(c.rd[i]&&!G.projs.some(q=>q.from==='p')&&!G.later.length&&!(p.stormT>0))tbNext();return}
  // tour d'un ennemi : il avance jusqu'à TB_EN s ; une fois son coup porté, il rend la main TB_EN_AFTER s plus tard.
  // Le tour se prolonge le temps que ses projectiles et sa charge arrivent.
  const e=G.enemies.find(o=>o.id===c.eid);
  if(c.tA<0&&e.tbA)c.tA=c.t;
  const busy=G.projs.some(q=>q.from==='e')||e.chg>0||e.tele>0,done=e.tbSkip?c.t>=.6:c.t>=TB_EN||c.tA>=0&&c.t>=c.tA+TB_EN_AFTER;
  if(done&&!busy||c.t>=TB_EN_MAX)tbNext()}
/* l'invité : des points d'action et une potion pendant SON tour, rien sinon */
function tbGate(i,kind,cost){const c=G.cb;if(!c||!c.in[i])return true;if(c.ph!=='h'||c.who!==i||c.rd[i])return false;
  if(kind==='po'){if(c.po[i])return false;c.po[i]=true;return true}cost=cost||1;if(c.ap[i]<cost)return false;c.ap[i]-=cost;return true}
/* relever l'allié au combat, pendant son tour : 1 point d'action */
function tbRevive(pi){const c=G.cb,p=G.players[pi];if(!c||!c.in[pi]||c.ph!=='h'||c.who!==pi||c.ap[pi]<1||!p||p.down)return;const q=G.players.find(o=>o!==p&&o.down&&Math.hypot(o.x-p.x,o.y-p.y)<70);if(!q)return;
  const qi=G.players.indexOf(q);c.ap[pi]--;q.down=false;q.rev=0;q.hp=q.mhp*(p.cls==='soigneur'?.6:.4);q.lowSaid=false;c.rd[qi]=false;msg(q.name+' est relevé !');sayP(qi,'rev');fx(14,q.x,q.y,0,qi)}
/* état envoyé à l'invité : [phase 1 héros / 2 ennemi, manche, drapeaux, secondes restantes à deux, journal des ennemis,
   ordre de la manche (jetons), rang de celui qui joue] */
function tbPack(){const c=G.cb;if(!c)return 0;const f=(a,b)=>(a[0]?b:0)|(a[1]?b*2:0);
  return[c.ph==='h'?1:2,c.r,f(c.rd,1)|f(c.po,4)|f(c.in,16)|clamp(c.ap[0],0,3)<<6|clamp(c.ap[1],0,3)<<8,G.coop&&c.ph==='h'?Math.max(0,Math.ceil(TB_COOP_T-c.t)):0,
    c.lg.slice(-8).map(x=>[x.id,x.k,x.pi,x.d]),c.q.slice(0,40),c.k]}
function tbUnpack(a){if(!Array.isArray(a)||!a.length)return null;const n=v=>Number.isFinite(+v)?+v:0,b=n(a[2])|0,f=k=>[!!(b&k),!!(b&k*2)];
  const lg=(Array.isArray(a[4])?a[4].slice(0,8):[]).map(x=>{x=Array.isArray(x)?x:[];const id=n(x[0]),e=G.emap&&G.emap.get(id);return{id,k:clamp(n(x[1])|0,0,TB_LG.length-1),pi:clamp(n(x[2])|0,-1,1),d:clamp(n(x[3])|0,0,1e6),n:e?enemyName(e):'Ennemi'}});
  const q=(Array.isArray(a[5])?a[5].slice(0,40):[]).map(v=>clamp(Math.trunc(n(v)),-2,1e9)),k=clamp(n(a[6])|0,0,Math.max(0,q.length-1)),t=q.length?q[k]:0,ph=n(a[0])===2?'e':'h';
  return{ph,r:clamp(n(a[1])|0,1,1e6),rd:f(1),po:f(4),in:f(16),ap:[b>>6&3,b>>8&3],tl:clamp(n(a[3]),0,999),t:0,lg,q,k,
    who:ph==='h'&&t<0?-t-1:-1,eid:ph==='e'&&t>=0?t:-1}}

/* ---------- côté joueur (hôte et invité) ---------- */
/* points d'action restants : ceux de l'hôte, moins ce que l'invité vient de dépenser et que l'hôte n'a pas encore vu */
function tbAP(){if(!tbMe())return 9;return Math.max(0,Math.min(G.cb.ap[myIdx],tbPA(myIdx)-(L.tbSpent||0)))}
function tbCanAct(cost){if(!tbMe())return true;return tbHero()&&!L.tbEnd&&tbAP()>=(cost||1)}
function tbCanPot(){if(!tbMe())return true;return tbHero()&&!G.cb.po[myIdx]&&!L.tbPot&&!L.tbEnd}
function tbUse(kind,cost){if(!tbMe())return;if(kind==='po'){L.tbPot=true;if(mode!=='guest')G.cb.po[myIdx]=true;return}
  cost=cost||1;tbCommit();L.pv=null;if(mode!=='guest')G.cb.ap[myIdx]=Math.max(0,G.cb.ap[myIdx]-cost);else L.tbSpent=(L.tbSpent||0)+cost}
function tbWhy(cost){return!tbMe()?'':!tbHero()?'Attends ton tour : '+tbTurnName()+' joue.':L.tbEnd?'Tu as fini ton tour.':(cost||1)>1&&tbAP()>0?'Il faut '+cost+' points d’action.':'Plus de points d’action ce tour. Déplace-toi ou touche « Fin du tour ».'}
function tbMoveMax(){return TB_MOVE*TS*clamp(ST.spd/150,.8,1.6)}
/* Foncer : TB_DASH points d'action pour un déplacement complet de plus, compté depuis l'endroit où l'on est */
function tbDash(){if(!tbMe())return;if(!tbCanAct(TB_DASH)){toast(tbWhy(TB_DASH),'tb');return}const me=myP();if(!me||me.down)return;L.pv=null;
  if(mode!=='guest')G.cb.ap[myIdx]=Math.max(0,G.cb.ap[myIdx]-TB_DASH);else{L.tbSpent=(L.tbSpent||0)+TB_DASH;L.dc=(L.dc||0)+1}
  if(L.tbReA)L.tbRem+=tbMoveMax();else tbAnchor(Math.max(0,L.tbBud-tbDist(L.x,L.y))+tbMoveMax());
  L.tbAutoT=0;Snd.play('gate');toast('Tu fonces : déplacement doublé.','tbdash')}
function endTurn(){if(!tbHero()||L.tbEnd)return;const me=myP();if(!me||me.down)return;L.tbEnd=true;L.pv=null;L.et=G.cb.r;if(mode!=='guest')G.cb.rd[myIdx]=true;Snd.play('key')}
/* plus de points d'action ni de déplacement : le tour se finit tout seul, 1,2 s après (le temps de voir le dernier coup).
   La potion ne retient pas le tour. */
const TB_AUTO=1.2;
function tbAutoEnd(dt){if(!tbHero()||L.tbEnd||L.tbReA||L.dashT>0||tbAP()>0||L.tbMv>=TS/2){L.tbAutoT=0;return}
  const me=myP();if(!me||me.down)return;L.tbAutoT=(L.tbAutoT||0)+dt;if(L.tbAutoT>=TB_AUTO){L.tbAutoT=0;endTurn();toast('Plus d’actions ni de déplacement : fin du tour.','tbauto')}}
/* nom de celui qui joue (« Gobelin », « César ») */
function tbTurnName(){const c=G.cb;if(!c)return'';if(c.ph==='e'){const e=G.enemies.find(o=>o.id===c.eid)||(G.emap&&G.emap.get(c.eid));return e?enemyName(e):'un ennemi'}
  const p=G.players[c.who];return p?p.name:'ton allié'}
/* cible : l'ennemi touché à l'écran ; sans cible, le plus proche */
function tbTarget(){if(!L.tbT)return null;const e=G.enemies.find(e=>e.id===L.tbT&&e.hp>0);if(!e)L.tbT=0;return e||null}
function tbAimAt(){const t=tbTarget();if(t)return t;const n=nearestEnemy(330);return n?n.e:null}
function tbReach(e){const m={guerrier:58,voleur:48}[hero.cls];return m?m+e.r-6:300}
/* portée des compétences qui visent un ennemi (sinon : effet sur soi ou l'allié, toujours possible) */
const SK_RANGE={charge:190,tourbillon:90,seisme:165,cri:260,bond:220,hache:400,pommeau:60,nova:140,flammes:400,meteore:400,mur:400,entrave:400,hiver:400,
  eventail:280,danse:270,ricochet:300,assassin:360,piege:160,embuscade:80,jugement:400,colere:300,marteau:260,aube:200};
function inReach(id,e){if(!e)return false;const d=Math.hypot((e.rx??e.x)-L.x,(e.ry??e.y)-L.y);if(id==='atk')return d<=tbReach(e)&&los(L.x,L.y,e.rx??e.x,e.ry??e.y);const r=SK_RANGE[id];return r==null?null:d<=r+e.r}
function enemyAt(sx,sy){if(!G||!G.m)return null;const w=screenToWorld(sx,sy);let b=null,bd=1e9;for(const e of G.enemies){if(e.hp<=0)continue;const d=Math.hypot((e.rx??e.x)-w.x,(e.ry??e.y)-w.y);if(d<e.r+20&&d<bd){bd=d;b=e}}return b}
/* toucher un ennemi le choisit pour cible (sans frapper) ; toucher à nouveau la même cible la libère */
function tapEnemy(sx,sy,clear){if(!inGame()||paused||Scene.on)return false;const e=enemyAt(sx,sy);if(!e){if(clear&&L.pv){L.pv=null;return true}if(clear&&L.tbT){L.tbT=0;return true}return false}
  L.tbT=L.tbT===e.id?0:e.id;Snd.play('key');return true}
/* appelé à chaque image : entrée ou sortie du combat, nouvelle manche, à qui le tour */
function tbLocal(){const c=G.cb,inn=tbMe(),key=inn?c.r+':'+c.k+c.ph+(c.ph==='h'?c.who:c.eid):'';if(key===L.tbKey)return;const was=L.tbKey,wasE=L.tbPh==='e';L.tbKey=key;
  if(wasE&&L.tbEid!=null){L.tbLgId=L.tbEid;L.tbLgT=performance.now()}L.tbPh=inn?c.ph:'';L.tbEid=inn&&c.ph==='e'?c.eid:null;
  if(!inn){L.tbR=0;L.tbEnd=false;L.tbSpent=0;if(was){toast(c?'Tu quittes le combat.':'Fin du combat.');Snd.play('lvl')}return}
  if(L.tbR&&c.r>L.tbR)tickLocal(TB_ROUND*Math.min(3,c.r-L.tbR),true);L.tbR=c.r;
  if(tbHero()){tbAnchor(tbMoveMax());L.tbReA=false;L.tbAutoT=0;L.pv=null;L.tbSpent=0;L.tbPot=false;L.tbEnd=false;L.et=0;L.tbOx=L.x;L.tbOy=L.y;Snd.play('gate')}
  else{L.tbMv=0;L.tbF=null;L.pv=null;if(c.ph==='e'&&!wasE)Snd.play('boom');keys.clear();touch.jx=touch.jy=0;touch.atk=false;mouse.down=false}
  tbPulse()}
function tbPulse(){const b=$('#tbCol');if(!b)return;b.classList.remove('pulse');void b.offsetWidth;b.classList.add('pulse')}
/* Pendant le combat : à gauche la colonne de l'ordre des tours ; en bas, pendant SON tour seulement, la barre d'actions
   et la ligne « Actions · Déplacement · Potion ». Au tour d'un ennemi ou de l'allié, rien d'autre que la colonne.
   Les classes posées sur <body> (incb = au combat, tbmine, tgt, tgtbig) décident de ce qui s'affiche (voir le style du HUD). */
function tbHud(){const box=hq('#tbInfo'),col=hq('#tbCol'),be=hq('#bEnd'),c=G.cb,inn=tbMe(),me=myP(),bd=document.body;
  const mine=tbHero(),canEnd=mine&&me&&!me.down,on=mine&&!L.tbEnd&&!!me&&!me.down;
  bd.classList.toggle('incb',inn);bd.classList.toggle('tbmine',on);bd.classList.toggle('tgt',!inn&&!!tbTarget());
  setHid(be,!(canEnd&&!L.tbEnd));setHid(col,!inn);setHid(box,!on);
  tgtHud();
  if(!inn)return;
  const ap=tbAP(),pa=tbPA(myIdx),pot=!!(c.po[myIdx]||L.tbPot);
  setTxt(hq('#tbRd'),'Tour '+c.r);setTxt(hq('#tbAl'),tbAlly()&&c.tl?tbTurnName()+' · '+c.tl+' s':'');
  tbOrder(hq('#tbOrd'));
  setTxt(hq('#tbAct'),'Actions '+'●'.repeat(on?ap:0)+'○'.repeat(Math.max(0,pa-(on?ap:0))));hq('#tbAct').classList.toggle('off',!on||!ap);
  setTxt(hq('#tbPot'),'Potion '+(pot?'○':'●'));hq('#tbPot').classList.toggle('off',pot||!on);
  const mi=hq('#tbMv');setTxt(mi,on?'Déplacement '+(L.tbMv/TS).toFixed(1).replace('.',',')+' cases':'Déplacement —');mi.classList.toggle('off',!on||L.tbMv<2);
  be.classList.toggle('glow',mine&&!ap)}
/* colonne de l'ordre des tours : une vignette carrée par acteur (figure, nom, vie). Celui qui joue est bordé d'or (héros)
   ou de rouge (ennemi), qui a déjà joué est pâli, la cible a un liseré bleu. Toucher la vignette d'un ennemi le choisit pour cible,
   rester appuyé dessus ouvre sa fiche détaillée. La colonne défile ; elle n'est reconstruite que quand quelque chose change. */
function tbTokHp(t){if(t<0){const p=G.players[-t-1];return p?clamp(p.hp/p.mhp,0,1):0}const e=G.enemies.find(o=>o.id===t)||(G.emap&&G.emap.get(t));return e?clamp(e.hpP!=null?e.hpP/100:e.hp/e.mhp,0,1):0}
function tbOrder(ord){if(!ord)return;const c=G.cb,live=c.q.map((t,j)=>j>=c.k||t<0?true:G.enemies.some(e=>e.id===t&&e.hp>0)),
    key=c.r+'|'+c.k+'|'+c.q.join(',')+'|'+live.join('')+'|'+G.players.map(p=>p.down?1:0).join('')+'|'+(L.tbT||0)+'|'+c.q.map(t=>Math.round(tbTokHp(t)*10)).join('');
  if(ord.dataset.k===key)return;const moved=ord.dataset.c!==c.r+':'+c.k;ord.dataset.k=key;ord.dataset.c=c.r+':'+c.k;ord.textContent='';let curEl=null;
  c.q.forEach((t,j)=>{if(!live[j])return;const done=j<c.k,cur=j===c.k;let col,nm,cls;
    if(t<0){const i=-t-1,p=G.players[i];if(!p)return;col=CLS[p.cls].col;nm=i===myIdx?(cur?'À toi':'Toi'):p.name;cls='to h'+(i===myIdx?' me':'')+(p.down?' dn':'')}
    else{const e=G.enemies.find(o=>o.id===t)||(G.emap&&G.emap.get(t));if(!e)return;nm=enemyName(e);col=e.type==='boss'?'#f0c95a':e.elite?'#ff9a6a':'#e8823f';cls='to e'+(L.tbT===t?' tg':'')}
    const tk=el('button',cls+(done?' done':'')+(cur?' cur':''));tk.type='button';tk.style.setProperty('--c',col);
    const hp=el('span','thp'),hi=el('i');hi.style.width=Math.round(tbTokHp(t)*100)+'%';hp.append(hi);
    tk.append(el('span','tfig'),el('span','tnm',nm),hp);tk.setAttribute('aria-label',(cur?'Joue : ':done?'A joué : ':'')+nm);tk.setAttribute('role','listitem');
    if(t>=0)holdable(tk,()=>{L.tbT=L.tbT===t?0:t;Snd.play('key')},on=>{if(on)L.tbT=t;L.tgtBig=on});
    if(cur)curEl=tk;ord.append(tk)});
  if(curEl&&moved){const box=ord.parentNode;if(box&&box.scrollHeight>box.clientHeight)box.scrollTop=Math.max(0,curEl.offsetTop-box.clientHeight/3)}}
/* appui court / appui maintenu (350 ms) sur un élément de l'interface */
const HOLD_MS=350;
function holdable(n,tap,hold){let t=null,held=false;
  n.addEventListener('pointerdown',e=>{e.stopPropagation();held=false;clearTimeout(t);t=setTimeout(()=>{held=true;hold(true)},HOLD_MS)});
  const up=e=>{clearTimeout(t);if(held){held=false;hold(false)}else if(e&&e.type==='pointerup')tap()};
  n.addEventListener('pointerup',up);n.addEventListener('pointercancel',up);n.addEventListener('pointerleave',()=>{clearTimeout(t);if(held){held=false;hold(false)}})}
/* journal des ennemis, compact : actions identiques regroupées (« Adepte tire sur César : −10 ×4 »), 3 lignes au plus */
function tbLogLines(lg){const m=new Map();for(const x of lg){const t=G.players[x.pi],l=x.n+' '+TB_LG[x.k]+(t&&x.k<=3?' '+t.name:'')+(x.d?' : −'+x.d:'');m.set(l,(m.get(l)||0)+1)}
  const out=[...m].map(([l,n])=>n>1?l+' ×'+n:l);return out.length>3?out.slice(0,2).concat('+ '+(out.length-2)+' autres actions'):out}
/* fiche de la cible : petite (nom, vie, états, portée) ; tant qu'on reste appuyé dessus ou sur sa vignette, détaillée
   (prochain coup, effets en tours, dégâts estimés de l'attaque) et le reste de l'écran s'assombrit */
function tgtHud(){const t=tbTarget(),box=hq('#tgtBox'),big=!!(t&&L.tgtBig);setHid(box,!t);box.classList.toggle('big',big);setHid(hq('#tgtVeil'),!big);document.body.classList.toggle('tgtbig',big);if(!t)return;
  setTxt(hq('#tgtName'),enemyName(t)+' · Niv '+(t.lv||G.lv||1));const pct=t.hpP!=null?t.hpP/100:t.hp/t.mhp;setW(hq('#tgtHp'),pct);setTxt(hq('#tgtPv'),t.hpP!=null?t.hpP+' %':Math.ceil(t.hp)+' / '+Math.ceil(t.mhp));
  const st=enemyStates(t);setTxt(hq('#tgtSt'),st.length?st.map(s=>s[0]+' · '+s[2]+' tour'+(s[2]>1?'s':'')).join('   '):big?'Aucun effet':'');
  setTxt(hq('#tgtInt'),big?(tbMe()?'Prochain tour : '+enemyIntent(t):(t.act?'En alerte':'Au repos')):'');
  const out=!inReach('atk',t);setTxt(hq('#tgtRg'),out?'Trop loin':'À portée');hq('#tgtRg').classList.toggle('far',out);
  setTxt(hq('#tgtMore'),big?CLS[hero.cls].atk+' sur lui : ~'+Math.round(ST.dmg*(tbMe()?TB_DMG:1))+' dégâts'+(out?' (trop loin)':''):'')}
if(typeof addEventListener==='function')addEventListener('pointerup',()=>{if(typeof L!=='undefined'&&L&&L.tgtBig)L.tgtBig=false});

/* ---------- déplacement libre dans la zone du tour ----------
   Le tour donne un budget de déplacement compté depuis une place d'ancrage (le départ du tour) : on peut aller et revenir
   librement tant que la distance À PIED depuis l'ancre (obstacles contournés) reste dans le budget. Une action fixe la position :
   le budget restant repart de là (nouvelle ancre). La zone atteignable est calculée par cases (Dijkstra) et dessinée telle quelle. */
function tbAnchor(budget){L.tbAx=L.x;L.tbAy=L.y;L.tbBud=Math.max(0,budget);L.tbF=tbField(L.x,L.y,L.tbBud);L.tbMv=L.tbBud;L.tbPoly=tbPoly()}
/* contour de la zone : un cercle autour de l'ancre, creusé là où les obstacles allongent le chemin */
function tbPoly(){const pts=[],B=L.tbBud;if(B<4)return pts;for(let k=0;k<72;k++){const a=k/72*6.283,cx=Math.cos(a),cy=Math.sin(a);let r=0;
    for(let s=6;s<=B;s+=6){if(tbDist(L.tbAx+cx*s,L.tbAy+cy*s)>B)break;r=s}pts.push([L.tbAx+cx*r,L.tbAy+cy*r])}return pts}
function tbField(ax,ay,bud){const R=Math.ceil(bud/TS)+2,cx=Math.floor(ax/TS),cy=Math.floor(ay/TS),w=2*R+1,x0=cx-R,y0=cy-R,d=new Float32Array(w*w).fill(1e9),done=new Uint8Array(w*w);
  const at=(x,y)=>(y-y0)*w+(x-x0),inside=(x,y)=>x>=x0&&y>=y0&&x<x0+w&&y<y0+w;
  if(!solid(cx,cy))d[at(cx,cy)]=Math.hypot(ax-(cx+.5)*TS,ay-(cy+.5)*TS);
  for(;;){let b=-1,bv=1e9;for(let i=0;i<d.length;i++)if(!done[i]&&d[i]<bv){bv=d[i];b=i}if(b<0||bv>bud+TS)break;done[b]=1;const bx=x0+b%w,by=y0+((b/w)|0);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=bx+dx,ny=by+dy;if(!inside(nx,ny)||solid(nx,ny))continue;if(dx&&dy&&(solid(bx+dx,by)||solid(bx,by+dy)))continue;
      const v=bv+(dx&&dy?TS*1.414:TS),j=at(nx,ny);if(v<d[j])d[j]=v}}
  return{x0,y0,w,d}}
/* distance à pied depuis l'ancre jusqu'à un point */
function tbDist(x,y){const F=L.tbF;if(!F)return 0;const tx=Math.floor(x/TS),ty=Math.floor(y/TS);let m=1e9;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=tx+dx-F.x0,Y=ty+dy-F.y0;if(X<0||Y<0||X>=F.w||Y>=F.w)continue;const v=F.d[Y*F.w+X];if(v>=1e9)continue;
    const c=v+Math.hypot(x-(tx+dx+.5)*TS,y-(ty+dy+.5)*TS);if(c<m)m=c}
  if(los(L.tbAx,L.tbAy,x,y))m=Math.min(m,Math.hypot(x-L.tbAx,y-L.tbAy));return m}
/* déplacement au combat : chaque axe n'avance que s'il reste dans la zone */
function tbMove(dx,dy){const ox=L.x;moveBody(L,dx,0,10);if(tbDist(L.x,L.y)>L.tbBud)L.x=ox;const oy=L.y;moveBody(L,0,dy,10);if(tbDist(L.x,L.y)>L.tbBud)L.y=oy;L.tbMv=Math.max(0,L.tbBud-tbDist(L.x,L.y))}
/* une action fixe la position : la nouvelle ancre est prise une fois le bond ou la charge terminés */
function tbCommit(){if(!tbMe())return;L.tbRem=Math.max(0,L.tbBud-tbDist(L.x,L.y));L.tbReA=true}
function tbReanchor(){if(L.tbReA&&L.dashT<=0){L.tbReA=false;tbAnchor(L.tbRem)}}
/* zone atteignable : cases à portée, avec leur bord */
function drawMoveZone(T){const P=L.tbPoly;if(!P||P.length<3)return;ctx.save();ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
  ctx.fillStyle='rgba(142,197,232,.12)';ctx.fill();ctx.strokeStyle='rgba(142,197,232,.9)';ctx.lineWidth=3;ctx.setLineDash([9,7]);ctx.lineDashOffset=-T*12;ctx.stroke();ctx.restore()}

/* ---------- aperçu d'une action : 1er appui = aperçu en boucle, 2e appui sur le même bouton = on agit ----------
   au combat pendant son tour, et hors combat quand un ennemi est sélectionné */
function pvOn(){if(!G||!G.m)return false;if(tbMe())return tbHero();return!!tbTarget()}
function tbPreview(k){if(!pvOn())return false;if(L.pv===k){L.pv=null;return false}L.pv=k;L.pvS=null;Snd.play('key');return true}
const SK_AREA={tourbillon:['me',90],seisme:['me',165],nova:['me',140],cri:['me',260],aube:['me',200],danse:['me',270],colere:['me',300],cercle:['me',115],bouclier:['me',320],banniere:['me',320],fumee:['me',105],embuscade:['me',70],
  flammes:['tg',90],jugement:['tg',100],hiver:['tg',200],meteore:['tg',150],entrave:['tg',120],mur:['tg',100],
  charge:['line',190],hache:['line',400],eventail:['line',280],bond:['tg',80],ricochet:['tg',60],marteau:['tg',40],assassin:['tg',40],pommeau:['tg',40],piege:['tg',30]};
/* L'aperçu rejoue l'action avec ses vrais effets (anneaux, éclats, projectiles, zones, feux, pièges, doubles), sans dégâts ni son :
   à chaque boucle la suite d'effets est préparée à partir des positions du moment (pvBuild), jouée jusqu'au dernier impact,
   puis vient 1 s de pause (PV_GAP) avant de recommencer. Les dégâts affichés sont une estimation (dégâts du héros × coefficient). */
const PV_GAP=1;
const pvX=e=>e.rx??e.x,pvY=e=>e.ry??e.y;
function pvFoes(){return G.enemies.filter(e=>e.hp>0)}
function pvNear(cx,cy,r){return pvFoes().filter(e=>Math.hypot(pvX(e)-cx,pvY(e)-cy)<r+e.r)}
function pvFx(k,x,y,v){const sp=Snd.play,sh=shake;Snd.play=()=>{};try{fxShow({k,x,y,v:v||0,o:-1},true)}finally{Snd.play=sp;shake=sh}}
function pvHit(e,mult,st){const x=pvX(e),y=pvY(e);parts.push({k:'imp',x,y:y+8,life:.25,max:.25,rot:Math.random()*6,big:mult>=2?1:0});
  if(mult)addText(x,y-(e.r||12),'−'+Math.round(ST.dmg*mult*(tbMe()?TB_DMG:1)),'#ffd27a',1,14);if(st)addText(x,y-(e.r||12)-16,st,'#9fd0ff',1,12)}
function pvRay(x,y,a,d){let s=0;while(s<d&&!hits(x+Math.cos(a)*(s+6),y+Math.sin(a)*(s+6),10))s+=6;return Math.min(s,d)}
function pvAlly(){const o=G.players.find((q,j)=>j!==myIdx&&!q.down);return o?{x:o.rx??o.x,y:o.ry??o.y}:{x:L.x,y:L.y}}
/* prépare une boucle d'aperçu : D = durée jusqu'au dernier impact, ev = effets datés, pos = place du héros fantôme */
function pvBuild(k,t){const x0=L.x,y0=L.y,a=t?Math.atan2(pvY(t)-y0,pvX(t)-x0):L.aim,ca=Math.cos(a),sa=Math.sin(a),d=t?Math.hypot(pvX(t)-x0,pvY(t)-y0):0;
  const tp=t?{x:pvX(t),y:pvY(t)}:{x:x0+ca*170,y:y0+sa*170};
  const S={D:.6,ev:[],zones:[],fires:[],traps:[],decoys:[],projs:[],a,pos:()=>({x:x0+ca*18,y:y0+sa*18,al:.5})},at=(tt,fn)=>S.ev.push([tt,fn]);
  const dash=(dist,dur)=>{const s=pvRay(x0,y0,a,dist);S.pos=u=>{const q=eio(u/dur);return{x:x0+ca*s*q,y:y0+sa*s*q,al:.5}};return s};
  const shot=(o)=>{S.projs.push(Object.assign({x:x0+ca*14,y:y0+sa*14,r:7,life:1,hit:new Set()},o))};
  if(k==='atk'){const melee={guerrier:1,voleur:1}[hero.cls];
    if(melee){const mv=t?clamp(d-t.r-22,0,60):18;S.pos=u=>{const q=eio(clamp(u/.35,0,1));return{x:x0+ca*mv*q,y:y0+sa*mv*q,al:.5}};S.slash={t0:.35,mv};S.D=.8;
      if(t&&inReach('atk',t))at(.55,()=>pvHit(t,hero.cls==='voleur'?.75:1))}
    else{const sp=hero.cls==='mage'?420:380;shot({vx:ca*sp,vy:sa*sp,k:hero.cls==='mage'?1:2,life:1.1,mult:1,splash:hero.cls==='mage'?46:0});S.D=Math.min(1.1,d/sp)+.35}
    return S}
  const i=k==='ult'?3:+String(k).slice(1),id=ST.ks[i];
  switch(id){
    case'charge':{const s=dash(190,.22);at(0,()=>pvFx(28,x0+ca*s,y0+sa*s,Math.round(a*100)));for(const e of pvFoes()){if(segDist(pvX(e),pvY(e),x0,y0,x0+ca*s,y0+sa*s)<e.r+26)at(.22*Math.min(1,Math.hypot(pvX(e)-x0,pvY(e)-y0)/(s||1)),()=>pvHit(e,1.4,'Étourdi'))}S.D=.6;break}
    case'tourbillon':at(0,()=>pvFx(10,x0,y0,90));for(const e of pvNear(x0,y0,90))at(.15,()=>pvHit(e,1.6));S.D=.6;break;
    case'cri':at(0,()=>pvFx(29,x0,y0,260));for(const e of pvNear(x0,y0,260))at(.25,()=>pvHit(e,0,'Provoqué'));S.D=.7;break;
    case'seisme':at(0,()=>pvFx(30,x0,y0,165));for(const e of pvNear(x0,y0,165))at(.2,()=>pvHit(e,3,'Étourdi'));S.D=.7;break;
    case'nova':at(0,()=>pvFx(6,x0,y0,140));for(const e of pvNear(x0,y0,140))at(.2,()=>pvHit(e,1.2,'Gelé'));S.D=.6;break;
    case'transfert':{const s=pvRay(x0,y0,a,180);S.pos=u=>u<.15?{x:x0,y:y0,al:.5}:{x:x0+ca*s,y:y0+sa*s,al:.5};at(0,()=>{parts.push({k:'ring',x:x0,y:y0,r:6,mr:60,life:.4,max:.4,col:'#9fd0ff'});pvFx(6,x0,y0,70)});
      at(.15,()=>parts.push({k:'ring',x:x0+ca*s,y:y0+sa*s,r:30,mr:4,life:.3,max:.3,col:'#cfe8ff'}));S.D=.5;break}
    case'flammes':at(0,()=>{pvFx(31,tp.x,tp.y,90);S.fires.push({x:tp.x,y:tp.y,r:90})});for(const e of pvNear(tp.x,tp.y,90))at(.3,()=>pvHit(e,.6,'Brûle'));S.D=.8;break;
    case'tempete':at(0,()=>pvFx(32,x0,y0,0));for(let n=0;n<7;n++)at(n*.22,()=>{let b=null,bd=330;for(const e of pvFoes()){const dd=Math.hypot(pvX(e)-x0,pvY(e)-y0);if(dd<bd){bd=dd;b=e}}
      if(b){const aa=Math.atan2(pvY(b)-y0,pvX(b)-x0);S.projs.push({x:x0,y:y0,vx:Math.cos(aa)*460,vy:Math.sin(aa)*460,r:7,k:1,life:1,mult:.6,splash:36,hit:new Set()})}});S.D=1.9;break;
    case'ombre':{dash(180,.18);at(0,()=>parts.push({k:'ring',x:x0,y:y0,r:6,mr:30,life:.3,max:.3,col:'#86cc70'}));S.D=.4;break}
    case'eventail':for(let n=-3;n<=3;n++){const b=a+n*.17;shot({x:x0+Math.cos(b)*12,y:y0+Math.sin(b)*12,vx:Math.cos(b)*470,vy:Math.sin(b)*470,r:6,k:5,life:.6,mult:.8})}at(0,()=>pvFx(11,x0,y0,0));S.D=.7;break;
    case'fumee':at(0,()=>{pvFx(33,x0,y0,105);S.zones.push({x:x0,y:y0,r:105,smoke:1})});for(const e of pvNear(x0,y0,110))at(.2,()=>pvHit(e,0,'Aveuglé'));S.D=.8;break;
    case'danse':pvFoes().filter(e=>Math.hypot(pvX(e)-x0,pvY(e)-y0)<270).sort((u,v)=>Math.hypot(pvX(u)-x0,pvY(u)-y0)-Math.hypot(pvX(v)-x0,pvY(v)-y0)).slice(0,6)
      .forEach((e,n)=>at(n*.12,()=>{pvFx(34,pvX(e),pvY(e),Math.round(x0)*10000+Math.round(y0));pvHit(e,1.5)}));S.D=Math.max(.5,S.ev.length*.12+.3);break;
    case'cercle':at(0,()=>{pvFx(13,x0,y0,115);S.zones.push({x:x0,y:y0,r:115})});S.D=.8;break;
    case'bouclier':at(0,()=>{for(const q of G.players)if(!q.down&&Math.hypot((q.rx??q.x)-x0,(q.ry??q.y)-y0)<320)pvFx(35,q.rx??q.x,q.ry??q.y,0)});S.D=.6;break;
    case'jugement':at(0,()=>pvFx(36,tp.x,tp.y,100));for(const e of pvNear(tp.x,tp.y,100))at(.25,()=>pvHit(e,2));S.D=.7;break;
    case'aube':at(0,()=>{pvFx(37,x0,y0,220);for(const q of G.players)pvFx(14,q.rx??q.x,q.ry??q.y,0)});for(const e of pvNear(x0,y0,200))at(.3,()=>pvHit(e,2));S.D=.9;break;
    case'bastion':{const q=pvAlly();at(0,()=>{pvFx(35,q.x,q.y,0);pvFx(45,q.x,q.y,604)});S.D=.6;break}
    case'garde':{const q=pvAlly();at(0,()=>{pvFx(35,q.x,q.y,0);pvFx(45,x0,y0,704)});S.D=.6;break}
    case'bond':{const dd=Math.min(220,Math.hypot(tp.x-x0,tp.y-y0)),s=pvRay(x0,y0,a,dd),lx=x0+ca*s,ly=y0+sa*s;
      S.pos=u=>{const q=clamp(u/.25,0,1);return{x:x0+(lx-x0)*q,y:y0+(ly-y0)*q-Math.sin(q*Math.PI)*28,al:.5}};
      at(.25,()=>pvFx(10,lx,ly,80));for(const e of pvNear(lx,ly,80))at(.3,()=>pvHit(e,1.2,'Étourdi'));S.D=.7;break}
    case'rage':at(0,()=>pvFx(45,x0,y0,606));S.D=.6;break;
    case'hache':shot({vx:ca*430,vy:sa*430,r:10,k:5,life:1,mult:1.3,pierce:true,boom:true});S.D=1.05;break;
    case'hiver':at(0,()=>pvFx(6,tp.x,tp.y,200));for(const e of pvNear(tp.x,tp.y,200))at(.25,()=>pvHit(e,1.5,'Gelé'));S.D=.7;break;
    case'meteore':at(0,()=>pvFx(45,tp.x,tp.y,1503));at(.7,()=>{pvFx(30,tp.x,tp.y,150);S.fires.push({x:tp.x,y:tp.y,r:70})});for(const e of pvNear(tp.x,tp.y,150))at(.75,()=>pvHit(e,4,'Étourdi'));S.D=1.2;break;
    case'mur':at(0,()=>{pvFx(31,tp.x,tp.y,90);for(let n=-2;n<=2;n++)S.fires.push({x:tp.x-sa*n*40,y:tp.y+ca*n*40,r:34})});S.D=.8;break;
    case'entrave':at(0,()=>{pvFx(45,tp.x,tp.y,1201);S.zones.push({x:tp.x,y:tp.y,r:120,slow:1})});for(const e of pvNear(tp.x,tp.y,120))at(.3,()=>pvHit(e,0,'Ralenti'));S.D=.8;break;
    case'miroir':at(0,()=>{pvFx(32,x0,y0,0);S.decoys.push({x:x0+ca*34,y:y0+sa*34,cls:hero.cls,lk:lookOf(hero.eq)})});S.D=.8;break;
    case'dispar':at(0,()=>pvFx(11,x0,y0,0));S.pos=()=>({x:x0+ca*18,y:y0+sa*18,al:.18});S.D=.8;break;
    case'assassin':{const q=pvAlly();let b=null,bd=1e9;for(const e of pvFoes()){if(Math.hypot(pvX(e)-x0,pvY(e)-y0)>360)continue;const dd=Math.hypot(pvX(e)-q.x,pvY(e)-q.y);if(dd<bd){bd=dd;b=e}}
      if(b){const a2=Math.atan2(pvY(b)-q.y,pvX(b)-q.x),nx=pvX(b)+Math.cos(a2)*26,ny=pvY(b)+Math.sin(a2)*26;S.pos=u=>u<.15?{x:x0,y:y0,al:.5}:{x:nx,y:ny,al:.5};
        at(.15,()=>{pvFx(34,pvX(b),pvY(b),Math.round(x0)*10000+Math.round(y0));pvHit(b,3,'Étourdi')})}S.D=.6;break}
    case'ricochet':{const hit=new Set();let px=x0,py=y0,cur=null,bd=1e9;for(const e of pvFoes()){const dd=Math.min(Math.hypot(pvX(e)-tp.x,pvY(e)-tp.y)*1.5,Math.hypot(pvX(e)-x0,pvY(e)-y0)+120);if(dd<bd&&Math.hypot(pvX(e)-x0,pvY(e)-y0)<300){bd=dd;cur=e}}
      for(let n=0;n<4&&cur;n++){hit.add(cur);const e=cur,ox=px,oy=py;at(n*.15,()=>{pvFx(34,pvX(e),pvY(e),Math.round(ox)*10000+Math.round(oy));pvHit(e,1.1)});px=pvX(cur);py=pvY(cur);let nx=null,nd=180;for(const o of pvFoes()){if(hit.has(o))continue;const dd=Math.hypot(pvX(o)-px,pvY(o)-py);if(dd<nd){nd=dd;nx=o}}cur=nx}
      S.D=Math.max(.5,S.ev.length*.15+.3);break}
    case'pommeau':{S.slash={t0:0,mv:18};if(t&&d<=60+t.r)at(.2,()=>{pvFx(38,pvX(t),pvY(t),0);pvHit(t,1.2,'Étourdi')});S.D=.6;break}
    case'embuscade':at(0,()=>{pvFx(45,x0,y0,700);for(let n=0;n<6;n++){const b=n*1.047,x=x0+Math.cos(b)*70,y=y0+Math.sin(b)*70;if(!hits(x,y,6))S.traps.push({x,y})}});S.D=.7;break;
    case'piege':{const dd=Math.min(140,Math.hypot(tp.x-x0,tp.y-y0)),x=x0+ca*dd,y=y0+sa*dd;at(0,()=>{pvFx(45,x,y,300);S.traps.push({x,y})});S.D=.7;break}
    case'main':{const q=pvAlly();at(0,()=>pvFx(14,q.x,q.y,0));S.D=.6;break}
    case'banniere':at(0,()=>{for(const q of G.players)if(!q.down&&Math.hypot((q.rx??q.x)-x0,(q.ry??q.y)-y0)<320)pvFx(45,q.rx??q.x,q.ry??q.y,404);pvFx(37,x0,y0,160)});S.D=.8;break;
    case'benir':{const q=pvAlly();at(0,()=>{pvFx(45,q.x,q.y,404);pvFx(14,q.x,q.y,0)});S.D=.6;break}
    case'colere':pvFoes().filter(e=>Math.hypot(pvX(e)-x0,pvY(e)-y0)<300).sort((u,v)=>Math.hypot(pvX(u)-x0,pvY(u)-y0)-Math.hypot(pvX(v)-x0,pvY(v)-y0)).slice(0,5)
      .forEach((e,n)=>at(n*.1,()=>{pvFx(36,pvX(e),pvY(e),40);pvHit(e,2.5)}));S.D=Math.max(.5,S.ev.length*.1+.4);break;
    case'marteau':{let b=null,bd=1e9;for(const e of pvFoes()){if(Math.hypot(pvX(e)-x0,pvY(e)-y0)>260)continue;const dd=Math.hypot(pvX(e)-tp.x,pvY(e)-tp.y);if(dd<bd){bd=dd;b=e}}
      if(b)at(0,()=>{pvFx(36,pvX(b),pvY(b),40);pvHit(b,1.6,'Étourdi')});S.D=.6;break}
    default:at(0,()=>pvFx(11,x0,y0,0));S.D=.6}
  S.ev.sort((x,y)=>x[0]-y[0]);return S}
/* projectiles de l'aperçu : ils avancent, touchent (éclat + dégâts estimés), reviennent pour la hache */
function pvProjs(S,dt){for(const p of S.projs){if(p.life<=0)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    if(p.boom&&!p.back&&p.life<.5){p.back=true;p.hit=new Set();p.vx=-p.vx;p.vy=-p.vy}
    if(shotBlock(Math.floor(p.x/TS),Math.floor(p.y/TS))){if(p.boom&&!p.back){p.back=true;p.hit=new Set();p.vx=-p.vx;p.vy=-p.vy;continue}p.life=0;if(p.splash)pvFx(5,p.x,p.y,p.splash);continue}
    for(const e of pvFoes()){if(p.hit.has(e))continue;if(Math.hypot(pvX(e)-p.x,pvY(e)-p.y)<e.r+p.r){p.hit.add(e);pvHit(e,p.mult||0);if(p.splash){pvFx(5,p.x,p.y,p.splash);for(const o of pvNear(p.x,p.y,p.splash))if(o!==e)pvHit(o,.6)}if(!p.pierce){p.life=0;break}}}}
  S.projs=S.projs.filter(p=>p.life>0)}
function drawPreview(T){if(!L.pv||!pvOn()){L.pv=null;L.pvS=null;return}const me=myP();if(!me||me.down)return;
  const t=tbAimAt();let S=L.pvS;
  if(!S||L.pvK!==L.pv||T-L.pvC0>=S.D+PV_GAP){if(L.pv!=='atk'&&!SK[ST.ks[L.pv==='ult'?3:+String(L.pv).slice(1)]]){L.pv=null;return}S=L.pvS=pvBuild(L.pv,t);L.pvK=L.pv;L.pvC0=T;L.pvLT=T;S.done=0}
  const u=T-L.pvC0,act=u<S.D,dt=clamp(T-(L.pvLT||T),0,.05);L.pvLT=T;
  while(S.done<S.ev.length&&S.ev[S.done][0]<=u){S.ev[S.done][1]();S.done++}
  pvProjs(S,dt);
  const fade=act?.8:.8*(1-clamp((u-S.D)/PV_GAP,0,1));
  ctx.save();ctx.globalAlpha=fade;drawGroundFx(S.zones,S.fires,S.traps,S.decoys,T,()=>true);ctx.restore();
  ctx.save();ctx.globalAlpha=fade;for(const p of S.projs)drawProj2(p);ctx.restore();
  const g=act?S.pos(u):{x:L.x+Math.cos(S.a)*18,y:L.y+Math.sin(S.a)*18,al:.28};
  ctx.save();ctx.globalAlpha=g.al;drawPlayer(me,g.x,g.y,true,T);ctx.restore();
  if(S.slash&&act&&u>=S.slash.t0&&u<S.slash.t0+.45){ctx.save();ctx.globalAlpha=.8;drawSlash(g.x,g.y,S.a,(u-S.slash.t0)/.45,hero.cls,true);ctx.restore()}
  let lab;if(L.pv==='atk'){const dm=Math.round(ST.dmg*(tbMe()?TB_DMG:1));lab=CLS[hero.cls].atk+(t?' → '+enemyName(t)+' · ~'+dm+' dégâts':'')}
  else{const id=ST.ks[L.pv==='ult'?3:+String(L.pv).slice(1)],A=SK_AREA[id];lab=SK[id].nom+(t&&A&&A[0]!=='me'?' → '+enemyName(t):'')}
  ctx.textAlign='center';ctx.textBaseline='middle';pill(lab,L.x,L.y-58,'#ffe9a0','rgba(90,26,20,.92)')}
