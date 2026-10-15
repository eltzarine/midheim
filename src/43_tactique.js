/* ================= Ennemis stratégiques : rôles, entraide, moral, patrouilles (14/10) =================
   Règle commune : 1 action par ennemi et par tour ; une capacité spéciale REMPLACE son attaque (e.tbA = true).
   - Marionnette (slime), le mur : va se placer à côté d'un Adepte ou d'un Chef (6 cases au plus) et le protège ; jusqu'à son prochain tour,
     la moitié des dégâts que reçoit le protégé passe sur elle. Morte, elle laisse des os qu'un Adepte peut relever une fois
     (à 50 % de vie). Elle ne fuit jamais.
   - Rejeton (bat), le chasseur : vise un héros seul (aucun allié à TAC_ISO cases), sinon le plus blessé ; sa morsure lui rend
     50 % des dégâts ; sous 50 % de vie, il recule d'environ 4 cases après avoir frappé.
   - Adepte (archer), le soutien : relève des os (une fois par combat), sinon met un bouclier sur un allié sous 50 % de vie
     (20 % de ses PV max, 2 tours, recharge 3 tours), sinon il tire.
   - Orc, la brute : charge ; cri une fois par combat avec au moins 2 alliés proches (+25 % de dégâts aux alliés à 4 cases,
     2 tours) ; provocation : qui le frappe au corps à corps fait −25 % sur toute autre cible jusqu'à la fin du tour suivant.
   - Mimique, le piège : dort jusqu'au contact ; sa morsure agrippe le héros (plus de déplacement à son prochain tour,
     Foncer compris) ; frapper la Mimique le libère. Recharge 3 tours.
   - Chef (élite) : +1 vitesse aux alliés à TAC_AURA cases ; marque un héros au début du combat puis tous les 3 tours
     (tout le groupe le vise, +15 % de dégâts sur lui) ; une fois par combat, un allié rejoue juste après lui.
   - Encerclement : +15 % de dégâts sur un héros au contact de 2 ennemis ou plus.
   Moral : à la mort du Chef, ou quand le groupe a perdu les 2/3 de ses membres, ceux qui restent paniquent (−25 % de dégâts,
   2 tours) ; certains fuient (Rejeton sous 50 % de vie, Orc et Adepte une fois sur deux ; Marionnette et Mimique jamais).
   Un fuyard qui a fui 2 tours sans héros à 4 cases quitte le combat (pas d'XP).
   Patrouilles (monde) : 1 camp sur 4 fait une ronde (2 à 4 points, au pas lent) ; la nuit, des meutes de Rejetons rôdent
   en plus. La position sur la ronde se calcule à partir de l'heure du jeu : rien à simuler au loin, même ronde chez les deux.
   Une patrouille à PAT_REIN cases ou moins d'un combat accourt en renfort, annoncée avec le nombre de tours avant d'arriver. */
const TAC_GUARD=2,TAC_SH=.2,TAC_SH_T=6,TAC_SH_CD=9,TAC_CRY=1.25,TAC_CRY_R=4,TAC_CRY_T=6,TAC_PROV=.75,TAC_MARK=1.15,TAC_ENC=1.15,
  TAC_GRIP_CD=9,TAC_AURA=5,TAC_PAN=.75,TAC_PAN_T=6,TAC_BITE=.5,TAC_BACK=.5,TAC_ISO=3,TAC_MIMIC=1,PAT_SPD=28,PAT_REIN=15,PAT_GAP=1.1;
const TAC_MOVE_SK=['charge','ombre','transfert','bond'];
/* ---------- règles pures (testées) ---------- */
/* qui fuit quand le groupe flanche : r = tirage entre 0 et 1 */
function tacFlees(type,ratio,r){if(type==='slime'||type==='mimic'||type==='boss')return false;if(type==='bat')return ratio<.5;if(type==='orc'||type==='archer')return r<.5;return false}
/* rôle d'un ennemi, envoyé à l'invité en un nombre : drapeaux sur 8 bits, puis tours restants (bouclier, cri, panique) */
function tacPack(o){const t=v=>clamp(v|0,0,15);return(o.guard?1:0)|(o.sh?2:0)|(o.cry?4:0)|(o.pan?8:0)|(o.flee?16:0)|(o.prot?32:0)|(o.pat?64:0)|(o.aura?128:0)|t(o.shT)<<8|t(o.cryT)<<12|t(o.panT)<<16}
function tacUnpack(v){v=Number.isFinite(+v)?+v|0:0;return{guard:!!(v&1),sh:!!(v&2),cry:!!(v&4),pan:!!(v&8),flee:!!(v&16),prot:!!(v&32),pat:!!(v&64),aura:!!(v&128),shT:v>>8&15,cryT:v>>12&15,panT:v>>16&15}}
/* ronde : boucle fermée de points [x,y] en pixels ; s = distance parcourue sur la boucle */
function patLen(R){let l=0;for(let i=0;i<R.length;i++){const a=R[i],b=R[(i+1)%R.length];l+=Math.hypot(b[0]-a[0],b[1]-a[1])}return l}
function patPos(R,s){const L0=patLen(R);if(!L0)return{x:R[0][0],y:R[0][1],a:0};s=((s%L0)+L0)%L0;
  for(let i=0;i<R.length;i++){const a=R[i],b=R[(i+1)%R.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(s<=l||i===R.length-1){const k=l?Math.min(1,s/l):0;return{x:a[0]+(b[0]-a[0])*k,y:a[1]+(b[1]-a[1])*k,a:Math.atan2(b[1]-a[1],b[0]-a[0])}}s-=l}
  return{x:R[0][0],y:R[0][1],a:0}}
/* renforts : tours avant d'arriver au contact (un ennemi n'avance que pendant son tour, TB_EN s) */
function reinTurns(d,spd){return Math.max(0,Math.ceil((d-2*TS)/Math.max(1,spd*TB_EN)))}

/* ---------- utilitaires ---------- */
const tacFind=id=>id==null||id<0?null:G.enemies.find(o=>o.id===id&&o.hp>0)||null;
function tacHeroOk(i){const c=G.cb,p=G.players[i];return!!(c&&p&&!p.down&&c.in[i])}
/* la Marionnette qui protège e (au combat, à 3 cases au plus) */
function tacGuardOf(e){if(!G.cb)return null;for(const o of G.enemies)if(o!==e&&o.hp>0&&o.guard===e.id&&Math.hypot(o.x-e.x,o.y-e.y)<3*TS)return o;return null}
/* à moins de TAC_AURA cases d'un Chef vivant */
function tacAura(e){if(e.elite||e.type==='boss')return false;for(const o of G.enemies)if(o!==e&&o.elite&&o.hp>0&&o.type!=='boss'&&Math.hypot(o.x-e.x,o.y-e.y)<TAC_AURA*TS)return true;return false}
/* nombre d'ennemis au contact du héros i */
function tacEnc(i){const p=G.players[i];if(!p||p.down)return 0;const w=i===myIdx&&typeof L!=='undefined'&&L&&L.x!=null?L:p;let n=0;
  for(const e of G.enemies)if(e.hp>0&&e.act&&!e.ret&&Math.hypot((e.rx??e.x)-w.x,(e.ry??e.y)-w.y)<(e.r||12)+1.1*TS)n++;return n}
function tacGripped(i){const c=G&&G.cb;return!!(c&&c.gr&&(c.gr>>i&1))}
function tacProvOn(i){const c=G&&G.cb;if(!c)return false;if(c.pvb!=null)return!!(c.pvb>>i&1);const v=c.pv&&c.pv[i];return!!(v&&c.r<=v.u&&tacFind(v.id))}
/* drapeaux de rôle d'un ennemi (côté hôte) */
function tacBits(e){const g=tacFind(e.guard);return tacPack({guard:!!g&&Math.hypot(g.x-e.x,g.y-e.y)<3*TS,sh:e.esh>0,cry:e.cryT>0,pan:e.panT>0,flee:!!e.flee,prot:!!tacGuardOf(e),pat:e.pat!=null&&!e.act,aura:!!G.cb&&tacAura(e),
  shT:e.eshT>0?tbTurns(e.eshT):0,cryT:e.cryT>0?tbTurns(e.cryT):0,panT:e.panT>0?tbTurns(e.panT):0})}
/* états de rôle, affichés sur la fiche de la cible et au-dessus de l'ennemi */
function tacStates(e){const b=tacUnpack(e.rb!=null?e.rb:tacBits(e)),r=[];
  if(b.flee)r.push(['Fuit','#ffe39a',1]);
  if(b.guard){const g=tacFind(e.gd!=null?e.gd:e.guard);r.push(['Protège '+(g?enemyName(g):'un allié'),'#e8e0c8',1])}
  if(b.prot)r.push(['Protégé par une Marionnette','#e8e0c8',1]);
  if(b.sh)r.push(['Bouclier','#f0c95a',b.shT||1]);if(b.cry)r.push(['Cri · +25 %','#ffc590',b.cryT||1]);if(b.pan)r.push(['Panique · −25 %','#d2dae8',b.panT||1]);
  return r}
function tacIntent(e){const b=tacUnpack(e.rb!=null?e.rb:tacBits(e));if(b.flee)return'cherche à s’enfuir';const p=b.pan?' (panique : −25 %)':'';
  if(e.elite)return'va marquer un héros et frapper'+p;
  return(({slime:'va protéger un allié ou frapper',bat:'va mordre le héros le plus isolé',archer:'va relever des os, protéger un allié ou tirer',orc:'va charger, frapper ou pousser un cri',mimic:'va mordre et agripper'})[e.type]||'va s’approcher et frapper')+p}

/* ---------- côté hôte ---------- */
function tacStart(c){c.mk=null;c.gr=0;c.grU=0;c.grBy=[-1,-1];c.pv=[null,null];c.rf=null;c.mor=0;c.ids=new Set();for(const e of tbFoes())c.ids.add(e.id)}
function tacEnd(){for(const e of G.enemies){e.flee=0;e.fleeN=0;e.panT=0;e.cryT=0;e.guard=0;e.esh=0;e.eshT=0;e.backT=0;e.criU=0;e.ordU=0;e.revU=0;e.rein=0}G.bones=[]}
/* début du tour d'un héros : agrippé, il ne se déplace pas pendant ce tour */
function tacHeroTurn(i){const c=G.cb;if(c.gr>>i&1)c.grU|=1<<i}
/* fin du tour de l'acteur t : un héros agrippé est libéré une fois son tour passé */
function tacTurnOver(t){const c=G.cb;if(!c||t==null||t>=0)return;const i=-t-1;if(c.grU>>i&1){c.gr&=~(1<<i);c.grU&=~(1<<i);c.grBy[i]=-1}}
function tacMarkPick(e){let b=-1,bd=1e9;G.players.forEach((p,i)=>{if(!tacHeroOk(i))return;const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<bd){bd=d;b=i}});return b}
/* protégé possible : un Adepte ou un Chef à 6 cases au plus (la Marionnette va se placer à ses côtés pendant son tour) */
function tacGuardPick(e){let a=null,lo=2;for(const o of tbFoes()){if(o===e||!(o.type==='archer'||o.elite)||o.type==='boss')continue;
  if(Math.hypot(o.x-e.x,o.y-e.y)>6*TS)continue;const g=tacGuardOf(o);if(g&&g!==e)continue;const r=o.hp/o.mhp;if(r<lo){lo=r;a=o}}return a}
function tacRaise(e,b){e.revU=1;e.tbA=true;G.bones=(G.bones||[]).filter(x=>x!==b);
  const s=spawnEnemy('slime',b.x,b.y,false,false,undefined,b.lv);s.hp=s.mhp*.5;s.act=true;s.raised=1;s.xp=Math.round(s.xp*.5);if(b.camp!=null)s.camp=b.camp;if(b.hx!=null){s.hx=b.hx;s.hy=b.hy}
  fx(12,b.x,b.y,14);tbLog(e,9,-1,0,s.id)}
/* début du tour d'un ennemi : capacité de rôle (elle remplace l'attaque) ou rien (il avance et frappe comme avant) */
function tacTurn(e){const c=G.cb;if(!c)return;e.guard=0;if(e.type==='boss')return;
  if(e.flee){e.fleeN=(e.fleeN||0)+1;tbLog(e,15);return}
  if(e.elite){   // marque et ordre ne remplacent pas l'attaque du Chef
    if(!c.mk||c.r>=c.mk.u||!tacHeroOk(c.mk.pi)){const h=tacMarkPick(e);if(h>=0){c.mk={pi:h,by:e.id,u:c.r+3};tbLog(e,12,h);msg('Le Chef marque '+G.players[h].name+' : tout le groupe le vise.','mk',3)}}
    if(!e.ordU&&c.r>=2){let a=null,bd=1e9;for(const o of tbFoes())if(o!==e&&!o.elite&&o.type!=='boss'&&!o.flee){const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<bd){bd=d;a=o}}
      if(a){e.ordU=1;c.q.splice(c.k+1,0,a.id);tbLog(e,13,-1,0,a.id);msg('Le Chef donne un ordre : '+enemyName(a)+' rejoue.','ord',3)}}
    return}
  if(e.type==='slime'){const a=tacGuardPick(e);if(a){e.guard=a.id;e.tbA=true;e.gMv=Math.hypot(a.x-e.x,a.y-e.y)>TAC_GUARD*TS?TB_EN:0;tbLog(e,8,-1,0,a.id)}return}
  if(e.type==='archer'){if(!e.revU){const b=(G.bones||[]).find(b=>Math.hypot(b.x-e.x,b.y-e.y)<7*TS);if(b){tacRaise(e,b);return}}
    if(!(e.shCd>0)){let a=null,lo=.5;for(const o of tbFoes()){if(o===e||o.type==='boss'||o.esh>0||Math.hypot(o.x-e.x,o.y-e.y)>7*TS)continue;const r=o.hp/o.mhp;if(r<lo){lo=r;a=o}}
      if(a){a.esh=a.mhp*TAC_SH;a.eshT=TAC_SH_T;e.shCd=TAC_SH_CD;e.tbA=true;tbLog(e,10,-1,0,a.id)}}
    return}
  if(e.type==='orc'&&!e.criU){const al=tbFoes().filter(o=>o!==e&&o.type!=='boss'&&Math.hypot(o.x-e.x,o.y-e.y)<TAC_CRY_R*TS);
    if(al.length>=2&&!al.some(o=>o.cryT>0)){e.criU=1;   // un seul cri à la fois dans le groupe
      e.tbA=true;for(const o of al.concat([e]))o.cryT=TAC_CRY_T;tbLog(e,11)}}}
/* cible imposée : le héros marqué par le Chef, sinon pour le Rejeton le héros seul ou le plus blessé */
function tacTarget(e,alive){const c=G.cb;if(!c||!alive.length)return null;
  if(c.mk&&c.r<c.mk.u){const p=G.players[c.mk.pi];if(p&&alive.includes(p))return p}
  if(e.type==='bat'){const iso=alive.filter(p=>!G.players.some(q=>q!==p&&!q.down&&Math.hypot(q.x-p.x,q.y-p.y)<TAC_ISO*TS));let b=null,lo=2;for(const p of iso.length?iso:alive){const r=p.hp/p.mhp;if(r<lo){lo=r;b=p}}return b}
  return null}
/* dégâts d'un ennemi sur le héros i : cri, panique, marque, encerclement */
function tacDmgMul(e,i){let m=1;if(e){if(e.cryT>0)m*=TAC_CRY;if(e.panT>0)m*=TAC_PAN}const c=G.cb;
  if(c&&i>=0){if(c.mk&&c.mk.pi===i&&c.r<c.mk.u)m*=TAC_MARK;if(tacEnc(i)>=2)m*=TAC_ENC}return m}
/* coup reçu par un ennemi : la moitié pour la Marionnette qui le protège, puis le bouclier de l'Adepte */
function tacAbsorb(e,d){if(!G.cb||d<=0)return d;const g=tacGuardOf(e);
  if(g){const part=d*.5;d-=part;g.hp-=part;g.flash=.12;fx(1,g.x,g.y-g.r,Math.round(part));if(g.hp<=0)killEnemy(g)}
  if(e.esh>0){const a=Math.min(e.esh,d);e.esh-=a;d-=a;if(e.esh<=0){e.esh=0;e.eshT=0}}return d}
/* le héros i frappe e : provocation de l'Orc (corps à corps), libération de la Mimique */
function tacProvoke(i,e){const c=G.cb;if(!c||!tbIn(i)||e.type!=='orc'||e.hp<=0)return;const v=c.pv[i];
  if(!v||v.id!==e.id||c.r>v.u)msg(G.players[i].name+' est provoqué par '+enemyName(e)+' : −25 % sur les autres cibles.','pv'+i,6);c.pv[i]={id:e.id,u:c.r+1}}
function tacProvMul(i,e){const c=G.cb;if(!c)return 1;const v=c.pv&&c.pv[i];return v&&c.r<=v.u&&v.id!==e.id&&tacFind(v.id)?TAC_PROV:1}
function tacHitBy(i,e){const c=G.cb;if(c&&c.grBy&&c.grBy[i]===e.id){c.gr&=~(1<<i);c.grU&=~(1<<i);c.grBy[i]=-1;msg(G.players[i].name+' se libère de la Mimique.','grl'+i,3)}}
/* morsure du Rejeton (soin, recul) et de la Mimique (agrippe) */
function tacBite(e,i,d){const c=G.cb,p=G.players[i];if(!c||!p)return;
  if(e.type==='bat'&&d>0){e.hp=Math.min(e.mhp,e.hp+d*TAC_BITE);fx(3,e.x,e.y-e.r,Math.round(d*TAC_BITE));if(e.hp<e.mhp*.5)e.backT=TAC_BACK}
  if(e.type==='mimic'&&!(e.grCd>0)&&!p.down){c.gr|=1<<i;c.grBy[i]=e.id;e.grCd=TAC_GRIP_CD;tbLog(e,14,i);msg(p.name+' est agrippé : pas de déplacement au prochain tour. Frappe la Mimique pour te libérer.','gr'+i,6)}}
/* la Marionnette rejoint son protégé (pendant son tour, sans frapper) */
function tacGuardMove(e,dt){const a=tacFind(e.guard);if(!a||!(e.gMv>0)){e.gMv=0;return}e.gMv-=dt;const dx=a.x-e.x,dy=a.y-e.y,d=Math.hypot(dx,dy);
  if(d<1.2*TS){e.gMv=0;return}const f=d<2*TS||los(e.x,e.y,a.x,a.y)?{x:dx/d,y:dy/d}:null;if(f)moveBody(e,f.x*e.spd*dt,f.y*e.spd*dt,e.r*.75);else e.gMv=0}
/* fuite et recul pendant le tour de l'ennemi */
function tacFleeMove(e,dt){const f=flowDir(e,true);const sp=e.backT>0?260:e.spd*1.2;if(e.backT>0)e.backT-=dt;if(f)moveBody(e,f.x*sp*dt,f.y*sp*dt,e.r*.75)}
/* un ennemi meurt au combat : os de la Marionnette, Chef ou groupe décimé → moral */
function tacOnKill(e){const c=G.cb;if(!c)return;if(c.mk&&c.mk.by===e.id)c.mk=null;
  c.grBy.forEach((id,i)=>{if(id===e.id){c.gr&=~(1<<i);c.grU&=~(1<<i);c.grBy[i]=-1}});
  if(e.type==='slime'&&!e.raised&&!e.minion){G.bones=(G.bones||[]).slice(-7);G.bones.push({x:e.x,y:e.y,lv:e.lv,camp:e.camp,hx:e.hx,hy:e.hy})}
  if(c.mor||e.type==='boss'||e.minion)return;const left=tbFoes().filter(o=>o!==e&&o.hp>0);if(!left.length||left.some(o=>o.type==='boss'))return;
  const chief=!!e.elite,n0=c.ids?c.ids.size:0;if(!chief&&!(n0>=3&&left.length<=Math.floor(n0/3)))return;
  c.mor=1;msg(chief?'Le Chef est tombé : le groupe flanche !':'Le groupe flanche !');
  for(const o of left){if(o.minion||o.wv)continue;if(tacFlees(o.type,o.hp/o.mhp,Math.random())){o.flee=1;o.fleeN=0}else if(o.type!=='slime'&&o.type!=='mimic')o.panT=TAC_PAN_T}}
/* fin d'une manche : durées des rôles ; un fuyard qui a fui 2 tours sans héros à 4 cases quitte le combat */
function tacRoundEnd(S){const c=G.cb;for(const e of G.enemies){if(e.hp<=0)continue;
    if(e.eshT>0){e.eshT-=S;if(e.eshT<=0){e.eshT=0;e.esh=0}}e.cryT-=S;e.panT-=S;e.shCd-=S;e.grCd-=S;
    if(e.flee&&e.fleeN>=2&&!G.players.some((p,i)=>c.in[i]&&!p.down&&Math.hypot(p.x-e.x,p.y-e.y)<4*TS)){e.hp=0;fx(12,e.x,e.y,e.r);msg(enemyName(e)+' s’échappe.')}}}
/* à chaque image, au combat : groupe vu (moral), renforts des patrouilles */
function tacTick(){const c=G.cb;if(!c)return;if(!c.ids)tacStart(c);for(const e of tbFoes())c.ids.add(e.id);
  if(!G.m||G.m.kind!=='world'||typeof WORLD==='undefined'||!WORLD){c.rf=null;return}
  const H=G.players.filter((p,i)=>c.in[i]&&!p.down);if(!H.length)return;const dist=(x,y)=>Math.min(...H.map(p=>Math.hypot(p.x-x,p.y-y)));
  WORLD.camps.forEach((cp,i)=>{const s=G.camps[i];if(!s||s.state!=='live'||!s.pt)return;const M=G.enemies.filter(e=>e.pat===i&&e.hp>0);if(!M.length||M.some(e=>e.act))return;
    const lp=tacLead(cp);if(dist(lp.x,lp.y)>PAT_REIN*TS)return;for(const e of M){e.act=true;e.rein=1;e.tbA=false}msg('Une patrouille accourt en renfort !','rein',8)});
  let far=null;for(const e of G.enemies){if(!e.rein||e.hp<=0||!e.act)continue;const d=dist(e.x,e.y);if(d<2.5*TS){e.rein=0;continue}if(!far||d<far.d)far={d,x:e.x,y:e.y,spd:e.spd}}
  c.rf=far?{x:far.x,y:far.y,n:Math.max(1,reinTurns(far.d,far.spd))}:null}

/* ---------- patrouilles ---------- */
/* ronde d'un camp : boucle de 2 à 4 points à 4-7 cases du camp, chaque segment sans obstacle (tirage fixe par camp) */
function tacRoute(cp){if(cp.route!==undefined)return cp.route;const W=WORLD,R=mulberry(5000+cp.id),cx=(cp.x+.5)*TS,cy=(cp.y+.5)*TS;
  const free=(x,y)=>{const tx=Math.floor(x/TS),ty=Math.floor(y/TS);return tx>0&&ty>0&&tx<W.W-1&&ty<W.H-1&&W.sol[ty*W.W+tx]!==1};
  const seg=(a,b)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(d/(TS/4));for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,y=a[1]+(b[1]-a[1])*k/n;
    for(const[ox,oy]of[[0,0],[10,0],[-10,0],[0,10],[0,-10]])if(!free(x+ox,y+oy))return false}return true};
  let out=null;for(let t=0;t<30&&!out;t++){const n=2+Math.floor(R()*3),o=R()*6.283,P=[];
    for(let k=0;k<n;k++){const a=o+k/n*6.283+(R()-.5)*.6,r=(4+R()*3)*TS;P.push([Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r)])}
    if(n===2)P.splice(1,0,[Math.round(cx),Math.round(cy)]);   // deux points : aller et retour en passant par le camp
    if(P.every((p,k)=>free(p[0],p[1])&&seg(p,P[(k+1)%P.length])))out=P}
  cp.route=out;return out}
/* 0 : camp fixe ; 1 : patrouille (1 camp sur 4) ; 2 : meute de Rejetons qui rôde la nuit (un autre camp sur 4) */
function tacPatKind(cp,i){if(cp.fixe||!tacRoute(cp))return 0;if(i%4===1)return 1;if(i%4===3&&typeof Sky!=='undefined'&&Sky.isNight())return 2;return 0}
function tacLead(cp){const R=tacRoute(cp);return patPos(R,G.time*PAT_SPD+cp.id*97)}
/* rang dans la file : le Chef devant, les combattants, les Marionnettes, l'Adepte derrière */
const tacRank=e=>e.elite?0:e.type==='archer'?3:e.type==='slime'?2:1;
function tacFormation(i){const M=G.enemies.filter(e=>e.pat===i&&e.hp>0).sort((a,b)=>tacRank(a)-tacRank(b)||a.id-b.id);M.forEach((e,k)=>{e.patK=k});tacPatrols()}
/* les membres d'une patrouille au repos suivent la ronde (leur poste avance avec elle) */
function tacPatrols(){if(!G.m||G.m.kind!=='world')return;for(const e of G.enemies){if(e.pat==null||e.hp<=0)continue;const cp=WORLD.camps[e.pat];const R=cp&&tacRoute(cp);if(!R)continue;
  const p=patPos(R,G.time*PAT_SPD+cp.id*97-(e.patK||0)*PAT_GAP*TS);e.hx=p.x;e.hy=p.y;if(e.act||e.ret)continue;e.x=p.x;e.y=p.y}}

/* ---------- affichage (hôte et invité) ---------- */
/* au sol : rondes des patrouilles proches, liens Marionnette → protégé, os relevables, cri de l'Orc */
function drawTacGround(T,vis){const w=wpos(myIdx);if(!w)return;ctx.save();
  if(G.m.kind==='world'){const seen=new Set();for(const e of G.enemies){if(e.pat==null||e.act||e.hp<=0||seen.has(e.pat))continue;seen.add(e.pat);const cp=WORLD.camps[e.pat],R=cp&&tacRoute(cp);if(!R)continue;
      const lp=tacLead(cp);if(Math.hypot(lp.x-w.x,lp.y-w.y)>14*TS)continue;
      ctx.strokeStyle='rgba(239,230,207,.5)';ctx.lineWidth=2;ctx.setLineDash([3,7]);ctx.lineDashOffset=-T*PAT_SPD;ctx.beginPath();R.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(239,230,207,.65)';for(const p of R){ctx.beginPath();ctx.arc(p[0],p[1],4,0,6.28);ctx.fill()}
      const g=patPos(R,G.time*PAT_SPD+cp.id*97+3*PAT_SPD);if(vis(g.x,g.y)){ctx.globalAlpha=.35;ctx.strokeStyle='#efe6cf';ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(g.x,g.y,11,0,6.28);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.85;
        ctx.font='700 10px "Alegreya Sans",system-ui,sans-serif';ctx.textAlign='center';ctx.fillStyle='#efe6cf';ctx.fillText('dans 3 s',g.x,g.y-18);ctx.globalAlpha=1}}}
  if(G.cb){for(const e of G.enemies){if(e.hp<=0)continue;const b=tacUnpack(e.rb!=null?e.rb:tacBits(e));const ex=e.rx??e.x,ey=e.ry??e.y;
      if(b.guard){const g=tacFind(e.gd!=null?e.gd:e.guard);if(g&&vis(ex,ey)){const gx=g.rx??g.x,gy=g.ry??g.y;ctx.strokeStyle='rgba(232,224,200,.9)';ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(gx,gy);ctx.stroke();ctx.setLineDash([]);
        const mx=(ex+gx)/2,my=(ey+gy)/2;ctx.fillStyle='#13252c';ctx.strokeStyle='#e8e0c8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(mx,my,9,0,6.28);ctx.fill();ctx.stroke();
        ctx.fillStyle='#e8e0c8';ctx.beginPath();ctx.moveTo(mx,my-6);ctx.lineTo(mx+5,my-3.5);ctx.lineTo(mx+5,my);ctx.quadraticCurveTo(mx+5,my+5,mx,my+6);ctx.quadraticCurveTo(mx-5,my+5,mx-5,my);ctx.lineTo(mx-5,my-3.5);ctx.closePath();ctx.fill()}}
      if(b.cry&&vis(ex,ey)){ctx.strokeStyle='rgba(255,155,61,.85)';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.lineDashOffset=-T*10;ctx.beginPath();ctx.ellipse(ex,ey+e.r*.6,e.r+10,(e.r+10)*.45,0,0,6.28);ctx.stroke();ctx.setLineDash([])}}
    for(const b of G.bones||[]){if(!vis(b.x,b.y))continue;ctx.fillStyle='#c9c3b0';ctx.strokeStyle='#3a3528';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(b.x,b.y+4,14,6,0,0,6.28);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#efe6cf';ctx.beginPath();ctx.moveTo(b.x-8,b.y+2);ctx.lineTo(b.x+7,b.y+6);ctx.moveTo(b.x-6,b.y+7);ctx.lineTo(b.x+8,b.y+1);ctx.stroke()}}
  ctx.restore()}
/* au-dessus : marque du Chef, héros agrippé ou encerclé, os relevables, renforts annoncés */
function drawTacOver(vis,hw,hh){const c=G.cb;if(!c)return;ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  G.players.forEach((p,i)=>{if(p.down||!c.in[i])return;const w=wpos(i);let y=w.y-74;const tags=[];
    if(c.mk&&c.mk.pi===i&&c.r<c.mk.u){tags.push(['Marqué par le Chef','#ffb3a8','rgba(74,20,20,.92)']);
      ctx.strokeStyle='#ff6a5a';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(w.x,w.y-56,8,0,6.28);ctx.stroke();ctx.fillStyle='#ff6a5a';ctx.beginPath();ctx.arc(w.x,w.y-56,2.5,0,6.28);ctx.fill()}
    if(tacGripped(i))tags.push(['Agrippé','#d2dae8','rgba(42,42,48,.92)']);
    if(tacEnc(i)>=2)tags.push(['Encerclé · +15 %','#ffb3a8','rgba(74,20,20,.92)']);
    for(const t of tags){pill(t[0],w.x,y,t[1],t[2]);y-=18}});
  for(const b of G.bones||[])if(vis(b.x,b.y))pill('Os · relevable',b.x,b.y+20,'#e8e0c8','rgba(42,38,32,.9)');
  if(c.rf&&c.rf.n>0){const t='Renforts dans '+c.rf.n+' tour'+(c.rf.n>1?'s':'');if(vis(c.rf.x,c.rf.y))pill(t,c.rf.x,c.rf.y-40,'#ffc590','rgba(74,42,16,.92)');else edgeArrow(c.rf.x,c.rf.y,'#ffc590',t,hw,hh)}
  ctx.restore()}
