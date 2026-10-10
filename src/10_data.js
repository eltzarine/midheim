'use strict';
/* ================= Outils ================= */
const TS=32;
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ri=(R,a,b)=>a+Math.floor(R()*(b-a+1));
const enc=new TextEncoder();
const clean=s=>String(s||'').replace(/[\u0000-\u001f\u007f-\u009f­​-‏‪-‮⁠-⁯﻿]/g,'').slice(0,14);
const hash2=(x,y,s)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,2246822519);h=Math.imul(h^h>>>13,1274126177);h^=h>>>16;return(h>>>0)/4294967296};
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};

/* ================= Classes ================= */
const CLS_IDS=['guerrier','mage','voleur','soigneur'];
const CLS={
  guerrier:{nom:'Guerrier',col:'#e0644c',hp:150,hpL:16,mp:70,mpr:6,spd:150,dmg:16,crit:.05,arm:.18,atkCd:.42,atkMp:0,atk:'Épée',desc:'Tient la ligne de front. Charge, tourbillon et cri de guerre pour protéger son allié.'},
  mage:{nom:'Magicien',col:'#6f9cf0',hp:88,hpL:9,mp:130,mpr:9,spd:146,dmg:15,crit:.07,arm:0,atkCd:.5,atkMp:4,atk:'Boule de feu',desc:'Fragile mais dévastateur à distance. Givre, transfert et pluie de flammes.'},
  voleur:{nom:'Voleur',col:'#86cc70',hp:104,hpL:11,mp:80,mpr:8,spd:178,dmg:10,crit:.22,arm:.05,atkCd:.27,atkMp:0,atk:'Dagues',desc:'Rapide et critique. Seul à crocheter les coffres violets.'},
  soigneur:{nom:'Soigneur',col:'#f0d36a',hp:115,hpL:12,mp:120,mpr:8,spd:150,dmg:9,crit:.05,arm:.1,atkCd:.45,atkMp:0,atk:'Orbe sacré',desc:'Soigne, protège et relève son allié. Son ultime ressuscite.'},
};
/* ================= Compétences et arbre de talents =================
   Chaque classe a un arbre de 3 branches. Une branche : compétence (niv 1) → 2 bonus → compétence (niv 4),
   puis deux rameaux : 2 bonus → ultime (niv 7) et 2 bonus → compétence (niv 10). Un point par niveau, niveau 10 au plus.
   Au plus 3 compétences (dont 1 passive) et 1 ultime. t : a = active (bouton), p = passive, u = ultime */
const SK={
  // guerrier
  protecteur:{nom:'Protecteur',court:'Protect.',t:'p',desc:'+20 % d’armure quand ton allié est à moins de 5 cases (toujours en solo).'},
  cri:{nom:'Cri de guerre',court:'Cri',t:'a',cd:15,mp:30,desc:'Attire les ennemis proches sur toi. Le groupe gagne +25 % de dégâts et −25 % de dégâts subis pendant 6 s.'},
  bastion:{nom:'Bastion',court:'Bastion',t:'u',desc:'Un bouclier géant protège ton allié (toi seul en solo) : il absorbe 60 % de ses PV pendant 4 s.'},
  garde:{nom:'Garde',court:'Garde',t:'a',cd:14,mp:25,desc:'Pendant 6 s, tu encaisses 40 % des dégâts de ton allié. Seul, tu divises tes dégâts reçus par deux pendant 3 s.'},
  charge:{nom:'Charge du bouclier',court:'Charge',t:'a',cd:6,mp:15,desc:'Fonce droit devant, frappe et étourdit les ennemis traversés.'},
  fracas:{nom:'Fracas',court:'Fracas',t:'p',desc:'Double dégâts sur un ennemi gelé ou étourdi.'},
  seisme:{nom:'Frappe sismique',court:'Séisme',t:'u',desc:'Un coup qui fend le sol : énormes dégâts autour de toi et étourdissement de 1,5 s.'},
  tourbillon:{nom:'Tourbillon',court:'Tourbil.',t:'a',cd:7,mp:25,desc:'Frappe tout autour de toi et divise par deux les dégâts reçus pendant 2,5 s.'},
  bond:{nom:'Bond',court:'Bond',t:'a',cd:7,mp:20,desc:'Saute sur le point visé et étourdit 1 s les ennemis à l’atterrissage.'},
  soif:{nom:'Soif de sang',court:'Soif',t:'p',desc:'Chaque coup te soigne de 5 % des dégâts infligés.'},
  rage:{nom:'Rage',court:'Rage',t:'u',desc:'+50 % de dégâts et de vitesse d’attaque pendant 6 s.'},
  hache:{nom:'Hache volante',court:'Hache',t:'a',cd:6,mp:20,desc:'Lance une hache qui transperce les ennemis et revient vers toi.'},
  // magicien
  nova:{nom:'Nova de givre',court:'Givre',t:'a',cd:7,mp:35,desc:'Gèle les ennemis proches pendant 2,5 s et les blesse.'},
  froid:{nom:'Froid mordant',court:'Froid',t:'p',desc:'Tes coups ralentissent les ennemis pendant 1,5 s.'},
  hiver:{nom:'Grand hiver',court:'Hiver',t:'u',desc:'Gèle 4 s tous les ennemis d’une grande zone autour du point visé.'},
  transfert:{nom:'Transfert',court:'Transf.',t:'a',cd:5,mp:20,desc:'Te téléporte un peu plus loin. Le sol gèle là où tu étais.'},
  embras:{nom:'Embrasement',court:'Embras.',t:'p',desc:'Tes attaques enflamment les ennemis pendant 3 s.'},
  flammes:{nom:'Pluie de flammes',court:'Flammes',t:'a',cd:10,mp:40,desc:'Fait tomber le feu sur la zone visée pendant 3 s.'},
  meteore:{nom:'Météore',court:'Météore',t:'u',desc:'Un météore s’écrase sur la zone visée : gros dégâts et étourdissement.'},
  mur:{nom:'Mur de feu',court:'Mur',t:'a',cd:12,mp:35,desc:'Une ligne de flammes au point visé pendant 4 s.'},
  entrave:{nom:'Entrave',court:'Entrave',t:'a',cd:9,mp:25,desc:'Ralentit fortement les ennemis de la zone visée pendant 4 s.'},
  manab:{nom:'Bouclier de mana',court:'Mana',t:'p',desc:'20 % des dégâts reçus sont pris sur ta mana.'},
  tempete:{nom:'Tempête arcanique',court:'Tempête',t:'u',desc:'Pendant 4 s, des projectiles partent tout seuls vers les ennemis proches.'},
  miroir:{nom:'Image miroir',court:'Miroir',t:'a',cd:16,mp:30,desc:'Un double de toi attire les ennemis proches pendant 4 s.'},
  // voleur
  sangfroid:{nom:'Sang-froid',court:'Sang-fr.',t:'p',desc:'+10 % de coups critiques.'},
  dispar:{nom:'Disparition',court:'Dispar.',t:'a',cd:14,mp:25,desc:'Tu deviens transparent et invisible pendant 3 s : les ennemis te perdent de vue.'},
  assassin:{nom:'Assassinat',court:'Assassin',t:'u',desc:'Surgis derrière l’ennemi le plus proche de ton allié et porte-lui un énorme critique.'},
  ombre:{nom:'Pas de l’ombre',court:'Ombre',t:'a',cd:3,mp:15,desc:'Bond invulnérable. Le coup suivant fait un critique triple.'},
  eventail:{nom:'Éventail de lames',court:'Éventail',t:'a',cd:6,mp:20,desc:'Lance sept dagues en éventail.'},
  saignee:{nom:'Saignée',court:'Saignée',t:'p',desc:'Tes coups font saigner l’ennemi pendant 3 s.'},
  danse:{nom:'Danse des lames',court:'Danse',t:'u',desc:'Frappe jusqu’à six ennemis proches en un éclair, avec des critiques puissants.'},
  ricochet:{nom:'Ricochet',court:'Ricochet',t:'a',cd:6,mp:20,desc:'Une dague qui rebondit sur 4 ennemis proches.'},
  pommeau:{nom:'Coup de pommeau',court:'Pommeau',t:'a',cd:8,mp:15,desc:'Étourdit 2 s l’ennemi en face de toi.'},
  oppor:{nom:'Opportuniste',court:'Opport.',t:'p',desc:'+30 % de dégâts sur un ennemi étourdi, gelé ou immobilisé.'},
  embuscade:{nom:'Embuscade',court:'Embusc.',t:'u',desc:'Six pièges autour de toi : ils immobilisent et blessent les ennemis qui marchent dessus.'},
  piege:{nom:'Piège à loup',court:'Piège',t:'a',cd:10,mp:20,desc:'Pose un piège au point visé : il immobilise 3 s le premier ennemi qui marche dessus.'},
  // soigneur
  cercle:{nom:'Cercle de soin',court:'Soin',t:'a',cd:8,mp:35,desc:'Une zone qui soigne et relève plus vite pendant 4 s.'},
  aura:{nom:'Aura',court:'Aura',t:'p',desc:'Toi et ton allié proche regagnez 1,5 % de vos PV par seconde.'},
  aube:{nom:'Aube de Lathandre',court:'Aube',t:'u',desc:'Soigne tout le groupe, relève ton allié où qu’il soit et rend invulnérable 2 s.'},
  main:{nom:'Main tendue',court:'Main',t:'a',cd:18,mp:40,desc:'Relève ton allié où qu’il soit avec 40 % de ses PV, ou le soigne de 30 %. Seul, te soigne de 30 %.'},
  foi:{nom:'Foi',court:'Foi',t:'p',desc:'−10 % de dégâts subis pour toi et ton allié.'},
  bouclier:{nom:'Bouclier de lumière',court:'Bouclier',t:'a',cd:12,mp:30,desc:'Protège toi et ton allié : absorbe 25 % de vos PV pendant 6 s.'},
  banniere:{nom:'Bannière',court:'Bannière',t:'u',desc:'Pendant 8 s, toi et ton allié faites +30 % de dégâts et subissez −20 % de dégâts.'},
  benir:{nom:'Bénédiction',court:'Bénir',t:'a',cd:14,mp:30,desc:'Ton allié (toi seul en solo) fait +25 % de dégâts pendant 6 s.'},
  jugement:{nom:'Jugement',court:'Jugement',t:'a',cd:9,mp:35,desc:'La lumière frappe la zone visée : dégâts, étourdissement et soins pour les alliés dedans.'},
  chatiment:{nom:'Châtiment',court:'Châtim.',t:'p',desc:'Tes coups marquent l’ennemi : il subit +15 % de dégâts de toutes parts pendant 4 s.'},
  colere:{nom:'Colère divine',court:'Colère',t:'u',desc:'La lumière frappe les cinq ennemis les plus proches et les étourdit.'},
  marteau:{nom:'Marteau sacré',court:'Marteau',t:'a',cd:8,mp:20,desc:'Frappe l’ennemi visé : dégâts et étourdissement de 2 s.'},
};
/* branches : [nom, compétence niv 1, compétence niv 4, ultime, compétence niv 10, 6 bonus (2 avant niv 4, 2 avant l'ultime, 2 avant niv 10)] */
const TREE={
  guerrier:[['Rempart','protecteur','cri','bastion','garde',['vit','arm','arm','vit','vit','for']],
            ['Briseur','charge','fracas','seisme','tourbillon',['for','pre','for','for','pre','vit']],
            ['Fureur','bond','soif','rage','hache',['agi','cel','vit','agi','cel','for']]],
  mage:[['Givre','nova','froid','hiver','transfert',['esp','cel','esp','pui','cel','esp']],
        ['Braise','embras','flammes','meteore','mur',['pui','pre','pui','pui','pre','cel']],
        ['Arcane','entrave','manab','tempete','miroir',['cel','esp','agi','esp','cel','vit']]],
  voleur:[['Ombre','sangfroid','dispar','assassin','ombre',['agi','pre','agi','pre','agi','cel']],
          ['Lames','eventail','saignee','danse','ricochet',['for','cel','for','pre','cel','for']],
          ['Ruse','pommeau','oppor','embuscade','piege',['vit','agi','esp','agi','vit','esp']]],
  soigneur:[['Lumière','cercle','aura','aube','main',['esp','vit','esp','esp','cel','vit']],
            ['Serment','foi','bouclier','banniere','benir',['vit','arm','cel','arm','vit','cel']],
            ['Jugement','jugement','chatiment','colere','marteau',['for','pre','for','pui','for','pre']]],
};
const BONUS={for:['Force','+10 % de dégâts'],pui:['Puissance','+10 % de dégâts des sorts'],vit:['Vitalité','+12 % de PV'],arm:['Armure','+6 % d’armure'],
  cel:['Célérité','−8 % de temps de recharge'],esp:['Esprit','+20 % de mana et de régénération'],agi:['Agilité','+6 % de vitesse'],pre:['Précision','+6 % de critiques']};
/* un cran = 'branche.k' ; k : 0 compétence, 1-2 bonus, 3 compétence, 4-5 bonus, 6 ultime, 7-8 bonus, 9 compétence */
const NODE_PARENT=[-1,0,1,2,3,4,5,3,7,8];
function treeNode(cls,key){const m=/^([0-2])\.([0-9])$/.exec(key||'');if(!m)return null;const B=TREE[cls][+m[1]],k=+m[2];
  if(k===0||k===3||k===6||k===9){const id=B[{0:1,3:2,6:3,9:4}[k]];const s=SK[id];return{key,b:+m[1],k,id,kind:s.t==='u'?'u':'s',nom:s.nom,desc:s.desc,sk:s}}
  const bk=B[5][{1:0,2:1,4:2,5:3,7:4,8:5}[k]];return{key,b:+m[1],k,id:bk,kind:'b',nom:BONUS[bk][0],desc:BONUS[bk][1]}}
const LVL_MAX=10, POT_MAX=6, BAG_MAX=18, TREE_RESET=20;
const xpNeed=l=>50+l*40+l*l*6;
const treePts=h=>Math.max(0,h.lvl-h.tr.length);
/* compétences acquises : passive, ultime et actives. Bouton d'une active : celui de son palier
   (niv 1 → bouton 1, niv 4 → bouton 2, niv 10 → bouton 3), sinon le premier libre */
function heroKit(h){const o={act:[],slots:['','',''],pa:null,ult:null};for(const key of h.tr){const n=treeNode(h.cls,key);if(!n||n.kind==='b')continue;
  if(n.kind==='u')o.ult=n.id;else if(n.sk.t==='p')o.pa=n.id;else{o.act.push(n.id);let j={0:0,3:1,9:2}[n.k];if(o.slots[j])j=o.slots.indexOf('');if(j>=0)o.slots[j]=n.id}}return o}
/* peut-on apprendre ce cran ? renvoie '' ou la raison */
function treeWhy(h,key){const n=treeNode(h.cls,key);if(!n)return'?';if(h.tr.includes(key))return'';const p=NODE_PARENT[n.k];
  if(p>=0&&!h.tr.includes(n.b+'.'+p))return'Apprends d’abord le cran relié au-dessus.';
  if(n.kind!=='b'){const kit=heroKit(h);
    if(n.kind==='u'&&kit.ult)return'Un seul ultime : tu en as déjà un.';
    if(n.kind==='s'&&kit.act.length+(kit.pa?1:0)>=3)return'Au plus 3 compétences (plus l’ultime).';
    if(n.kind==='s'&&n.sk.t==='p'&&kit.pa)return'Une seule compétence passive.'}
  if(treePts(h)<1)return h.lvl>=LVL_MAX?'Tous tes points sont dépensés.':'Plus de point : monte de niveau.';return''}

/* ================= Objets ================= */
const RAR=[{nom:'Commun',col:'#c9c4cf',m:1,aff:0},{nom:'Rare',col:'#62aaff',m:1.25,aff:1},{nom:'Épique',col:'#c27bff',m:1.55,aff:2},{nom:'Légendaire',col:'#f0b03a',m:1.9,aff:3},{nom:'Relique',col:'#3fe0c8',m:2.1,aff:3}];
const BASES={arme:{guerrier:['Épée','Hache','Marteau de guerre'],mage:['Bâton','Orbe','Grimoire'],voleur:['Dagues','Lames jumelles','Coutelas'],soigneur:['Masse','Sceptre','Bâton sacré']},
  armure:{guerrier:['Cotte de mailles','Armure de plates','Cuirasse'],mage:['Robe','Robe brodée','Manteau d’arcaniste'],voleur:['Armure de cuir','Cuir clouté','Pourpoint'],soigneur:['Tunique sacrée','Haubert béni','Aube de lin']},
  talisman:['Amulette','Anneau','Talisman','Broche']};
const ORIG=['de Tarkin','de Last Fire','d’Honor','d’Ironhaven','de Cibellos','de Karaz Ankor','de Vindheim','d’Oka','d’Eastwatch','des Silverwoods','de Karaz Nema','de Karaz Kadrin','des Pics Rouges','de Mir'];
const LEG_ORIG=['de Valandil','des Premiers Royaumes','du Chiontar'];
const AFF={dmg:{t:'+{v} % de dégâts',a:3,b:8},crit:{t:'+{v} % de critique',a:2,b:5},cdr:{t:'−{v} % de recharge',a:3,b:7},hp:{t:'+{v} PV',a:0,b:0},reg:{t:'+{v} PV par seconde',a:0,b:0},spd:{t:'+{v} % de vitesse',a:2,b:5},vol:{t:'+{v} % de vol de vie',a:1,b:3},mp:{t:'+{v} % de mana',a:8,b:16}};
const AFF_KEYS=Object.keys(AFF);
const SLOTS=['arme','armure','talisman'];
const SLOT_NOM={arme:'Arme',armure:'Armure',talisman:'Talisman'};
function affVal(k,lvl,R){const A=AFF[k];if(k==='hp')return Math.round(8+lvl*5+R()*lvl*3);if(k==='reg')return +(0.5+lvl*.25+R()*.5).toFixed(1);return ri(R,A.a,A.b)}
function genItem(seed,lvl,rar,cls,slot){const R=mulberry(seed*7919+lvl);slot=slot||SLOTS[Math.floor(R()*3)];lvl=Math.max(1,lvl|0);rar=clamp(rar|0,0,4);const m=RAR[rar].m;
  const list=slot==='talisman'?BASES.talisman:BASES[slot][cls];const b=Math.floor(R()*list.length);
  const it={id:seed,s:slot,c:cls,b,r:rar,l:lvl,u:0,e:null,a:[]};
  if(slot==='arme')it.p=Math.round((8+lvl*5)*m);
  else if(slot==='armure'){it.p=Math.round((14+lvl*10)*m);it.p2=+((1.5+lvl*.35)*m).toFixed(1)}
  else{const k=['crit','cdr','vol','reg','spd','mp'][Math.floor(R()*6)];const v=affVal(k,lvl,R);it.tk=k;it.p=k==='reg'?+(v*m).toFixed(1):Math.round(v*m+(k==='crit'||k==='cdr'?1:0))}
  const used=new Set([it.tk]);for(let i=0;i<RAR[rar].aff;i++){let k;let n=0;do{k=AFF_KEYS[Math.floor(R()*AFF_KEYS.length)];n++}while(used.has(k)&&n<20);used.add(k);it.a.push([k,affVal(k,lvl,R)])}
  const orig=rar>=3?LEG_ORIG[Math.floor(R()*LEG_ORIG.length)]:ORIG[Math.floor(R()*ORIG.length)];
  it.n=list[b]+' '+orig;return it}
/* Reliques : objets uniques gagnés en terminant une sous-quête (pouvoir fixe, jamais revendus automatiquement) */
const SP={xp:'+25 % d’expérience gagnée',or:'+30 % d’or ramassé',pot:'Les potions soignent 50 % de plus'};
const RELICS={
  pont:{s:'arme',b:0,suf:' des Veilleurs du Pont',e:'lath',lore:'Portée par les gardes qui tinrent le Pont de Lathandre quand tout semblait perdu.'},
  coffres:{s:'talisman',b:1,nom:'Anneau du Cartographe',tk:'crit',sp:'or',lore:'Il tinte doucement près des trésors des Premiers Royaumes.'},
  camps:{s:'armure',b:0,suf:' des Feux éteints',e:'lath',lore:'Taillée dans les tentes des camps dispersés, elle sent encore la fumée.'},
  forge:{s:'arme',b:1,suf:' du Maître de Tarkin',e:'feu',lore:'Le forgeron de Tarkin l’a trempée dans une braise qui ne s’éteint jamais.'},
  libres:{s:'armure',b:1,suf:' de la Paix des Royaumes',e:'talos',lore:'Cousue par les Samarii et les Modorn, enfin réconciliés.'},
  chefs:{s:'arme',b:2,suf:' du Tueur de chefs',e:'kel',lore:'Chaque chef abattu y a laissé une encoche.'},
  voyage:{s:'talisman',b:3,nom:'Broche du Voyageur',tk:'spd',sp:'xp',lore:'Virganth l’a offerte à ceux qui connaissent toutes les routes de Midheim.'},
  silver:{s:'talisman',b:0,nom:'Amulette d’argent des Silverwoods',tk:'reg',sp:'pot',lore:'Une larme de lune prise dans l’argent des grands arbres.'},
  pics:{s:'arme',b:0,suf:' de Grinmir',e:'talos',lore:'Forgée à Karaz Ankor. Grinmir Thunderhammer jure qu’elle gronde comme l’orage.'},
  larme:{s:'armure',b:2,suf:' de la Première Larme',e:'feu',lore:'Reprise aux adeptes d’Amarath. Elle brûle ceux qui osent frapper.'},
  oublies:{s:'armure',b:1,suf:' des Monts Oubliés',e:'kel',lore:'L’ermite des montagnes l’a bénie : la mort hésite devant elle.'},
  echos:{s:'talisman',b:2,nom:'Sceau de Virganth',tk:'cdr',sp:'xp',lore:'Un fragment du sceau qui retient Amarath. Il murmure encore.'},
  eastwatch:{s:'talisman',b:3,nom:'Lanterne d’Osric',tk:'reg',sp:'pot',lore:'La lanterne du capitaine Osric. Elle s’allume seule quand des voiles noires approchent.'}};
function makeRelic(qid,cls,lvl){const D=RELICS[qid];if(!D)return null;const seed=900000+Object.keys(RELICS).indexOf(qid)*97;const it=genItem(seed,lvl,4,cls,D.s);it.b=D.b;it.rq=qid;it.lore=D.lore;
  if(D.s==='talisman'){it.n=D.nom;it.tk=D.tk;it.sp=D.sp;const v=affVal(D.tk,Math.max(1,lvl|0),mulberry(seed));it.p=D.tk==='reg'?+(v*2.1).toFixed(1):Math.round(v*2.1+(D.tk==='crit'||D.tk==='cdr'?1:0));it.a=it.a.filter(a=>a[0]!==D.tk)}
  else{it.n=BASES[D.s][cls][D.b]+D.suf;it.e=D.e}return it}
function relicPower(it){if(!it||!it.rq)return'';const D=RELICS[it.rq];if(D.sp)return SP[D.sp];const e=enchOf(D.s,D.e);return e?e.nom+' : '+e.desc:''}
function starter(cls,slot,up){const it=genItem(slot==='arme'?11:12,1,0,cls,slot);it.n=BASES[slot][cls][0]+' de voyage';it.u=clamp(up|0,0,5);return it}
const upM=it=>1+.1*(it.u||0);
function itemLines(it){const L=[];const um=upM(it);
  if(it.s==='arme')L.push('+'+Math.round(it.p*um)+' % de dégâts');
  else if(it.s==='armure'){L.push('+'+Math.round(it.p*um)+' PV');L.push('+'+(+(it.p2*um).toFixed(1))+' % d’armure')}
  else L.push(AFF[it.tk].t.replace('{v}',it.tk==='reg'?(+(it.p*um).toFixed(1)):Math.round(it.p*um)));
  for(const[k,v]of it.a)L.push(AFF[k].t.replace('{v}',v));return L}
function itemTitle(it){return it.n+(it.u?' +'+it.u:'')}
const sellPrice=it=>Math.round((10+it.l*6)*RAR[it.r].m*(1+(it.u||0)*.3));
const buyPrice=it=>sellPrice(it)*4;
const upCost=it=>Math.round((30+it.l*12)*((it.u||0)+1)*(1+it.r*.3));
const salvage=it=>[1,2,4,8,12][it.r]+(it.u||0);
/* Enchantements : les dieux cités dans les documents de Midheim ; chacun se débloque avec une pierre */
const ENCH={
  arme:[{id:'lath',nom:'Bénédiction de Lathandre',q:0,desc:'12 % de chances, à chaque coup, de te soigner de 4 % de tes PV.'},
        {id:'feu',nom:'Flamme de la déesse du feu',q:3,desc:'Tes coups brûlent l’ennemi pendant 3 s.'},
        {id:'talos',nom:'Fureur de Talos',q:4,desc:'15 % de chances qu’un éclair frappe deux ennemis proches.'},
        {id:'kel',nom:'Marque de Kelemvor',q:5,desc:'+30 % de dégâts contre les ennemis à moins de 30 % de PV, et 3 % de vol de vie.'}],
  armure:[{id:'lath',nom:'Égide de Lathandre',q:0,desc:'−12 % de dégâts subis.'},
          {id:'feu',nom:'Peau de braise',q:3,desc:'Renvoie 30 % des dégâts reçus aux ennemis au contact.'},
          {id:'talos',nom:'Bouclier de Talos',q:4,desc:'15 % de chances d’étourdir l’ennemi qui te frappe.'},
          {id:'kel',nom:'Voile de Kelemvor',q:5,desc:'Une fois toutes les 90 s, tu survis à un coup mortel.'}]};
const enchOf=(slot,id)=>(ENCH[slot]||[]).find(e=>e.id===id);
const enchCost=it=>({g:60+it.l*20,s:3+it.r*2});

/* ================= Héros et caractéristiques ================= */
/* v3 : arbre de talents et niveau 10 au plus ; les héros des versions précédentes repartent de zéro */
const HERO_V=3;
function newHero(cls){return{v:HERO_V,cls,lvl:1,xp:0,pts:0,tr:[],gold:30,pot:3,sh:0,q:0,fl:[],wp:['start'],pos:null,story:[],sq:{},sqd:[],track:'main',bag:[],eq:{arme:starter(cls,'arme'),armure:starter(cls,'armure'),talisman:null},ts:0}}
function fixItem(it,cls){if(!it||typeof it!=='object'||!SLOTS.includes(it.s))return null;if(typeof it.rq==='string'&&RELICS[it.rq]){const r=makeRelic(it.rq,cls,it.l|0);if(r.s!==it.s)return null;r.u=clamp(it.u|0,0,5);return r}const o=genItem(it.id|0,it.l|0,it.r|0,cls,it.s);o.u=clamp(it.u|0,0,5);o.e=it.e&&enchOf(it.s,it.e)?it.e:null;if(typeof it.n==='string'&&it.n.length<60)o.n=it.n;return o}
function fixHero(h,cls){const n=newHero(cls);if(!h||typeof h!=='object'||h.v!==HERO_V)return n;const o=Object.assign(n,h);o.cls=cls;o.v=HERO_V;delete o.tal;
  for(const k of['lvl','xp','pts','gold','pot','sh','q'])o[k]=clamp(Math.floor(+o[k]||0),0,1e7);o.lvl=clamp(o.lvl,1,LVL_MAX);o.pts=0;if(o.lvl>=LVL_MAX)o.xp=0;
  o.tr=[];if(Array.isArray(h.tr))for(const k of h.tr){if(typeof k!=='string'||o.tr.includes(k)||!treeNode(cls,k))continue;if(treeWhy(o,k))break;o.tr.push(k)}o.q=clamp(o.q,0,6);o.pot=Math.min(POT_MAX,o.pot);
  o.fl=Array.isArray(h.fl)?h.fl.filter(x=>typeof x==='string').slice(0,60):[];o.wp=Array.isArray(h.wp)?h.wp.filter(x=>typeof x==='string').slice(0,40):['start'];if(!o.wp.includes('start'))o.wp.push('start');
  o.story=Array.isArray(h.story)?h.story.filter(k=>typeof k==='string').slice(0,40):[];
  o.sq={};if(h.sq&&typeof h.sq==='object')for(const k in h.sq){if(/^[a-z]{2,12}$/.test(k))o.sq[k]=Math.max(0,Math.min(99,h.sq[k]|0))}
  o.sqd=Array.isArray(h.sqd)?h.sqd.filter(k=>typeof k==='string'&&/^[a-z]{2,12}$/.test(k)).slice(0,40):[];o.track=typeof h.track==='string'&&/^[a-z]{2,12}$/.test(h.track)?h.track:'main';
  o.pos=Array.isArray(h.pos)&&h.pos.length===2&&h.pos.every(Number.isFinite)?h.pos.map(v=>v|0):null;
  o.bag=Array.isArray(h.bag)?h.bag.map(it=>fixItem(it,cls)).filter(Boolean).slice(0,BAG_MAX):[];
  const eq=h.eq&&typeof h.eq==='object'?h.eq:null;o.eq={arme:null,armure:null,talisman:null};
  if(eq)for(const s of SLOTS){const it=fixItem(eq[s],cls);if(it&&it.s===s)o.eq[s]=it}
  // ancienne sauvegarde (forge par niveaux) : on donne l'équipement de départ amélioré
  if(!o.eq.arme)o.eq.arme=starter(cls,'arme',h.wpn);if(!o.eq.armure)o.eq.armure=starter(cls,'armure',h.arm);
  delete o.wpn;delete o.arm;delete o.best;delete o.cur;return o}
function gearSum(h){const s={dmg:0,crit:0,cdr:0,hp:0,reg:0,spd:0,vol:0,mp:0,arm:0,we:null,ae:null,xpb:0,gb:0,pb:0};
  for(const k of SLOTS){const it=h.eq[k];if(!it)continue;const um=upM(it);
    if(it.s==='arme')s.dmg+=it.p*um;else if(it.s==='armure'){s.hp+=it.p*um;s.arm+=it.p2*um}else s[it.tk]+=it.p*um;
    for(const[a,v]of it.a)s[a]+=v;if(it.e){if(it.s==='arme')s.we=it.e;else if(it.s==='armure')s.ae=it.e}if(it.sp==='xp')s.xpb+=.25;else if(it.sp==='or')s.gb+=.3;else if(it.sp==='pot')s.pb+=.5}return s}
function treeBonus(h){const t={for:0,pui:0,vit:0,arm:0,cel:0,esp:0,agi:0,pre:0};for(const k of h.tr){const n=treeNode(h.cls,k);if(n&&n.kind==='b')t[n.id]++}return t}
function derive(h){const C=CLS[h.cls],L=h.lvl-1,t=treeBonus(h),g=gearSum(h),kit=heroKit(h),pa=kit.pa;return{pa,ks:[kit.slots[0],kit.slots[1],kit.slots[2],kit.ult||''],
  mhp:Math.round((C.hp+C.hpL*L+g.hp)*(1+.12*t.vit)),mmp:Math.round(C.mp*(1+.2*t.esp)*(1+g.mp/100)),mpr:C.mpr*(1+.2*t.esp),
  dmg:C.dmg*(1+.1*L)*(1+.1*(t.for+t.pui))*(1+g.dmg/100),cdm:Math.max(.4,(1-.08*t.cel)*(1-g.cdr/100)),spd:C.spd*(1+.06*t.agi)*(1+g.spd/100),
  crit:Math.min(.75,C.crit+.06*t.pre+(pa==='sangfroid'?.1:0)+g.crit/100),arm:Math.min(.65,C.arm+.06*t.arm+g.arm/100),vol:g.vol/100+(pa==='soif'?.05:0),reg:g.reg,we:g.we,ae:g.ae,xpb:g.xpb,gb:g.gb,pb:g.pb}}

/* ================= Ennemis ================= */
/* rencontres dans le monde : camps espacés (CAMP_GAP cases), qui s'éveillent à CAMP_WAKE cases ;
   un ennemi qui s'éloigne de plus de LEASH cases de son poste (ou à plus de LEASH_P cases du héros) abandonne et y retourne */
const CAMP_GAP=18,CAMP_WAKE=14,LEASH=10,LEASH_P=12;
/* zone d'alerte : un ennemi attaque si un héros entre à moins de AGGRO cases ; il réveille en chaîne les ennemis
   dont la zone touche la sienne (distance < 2×AGGRO). Le cercle n'est dessiné qu'à moins de AGGRO_SHOW cases. */
const AGGRO=3,AGGRO_SHOW=4;
const ETYPES=['slime','bat','archer','orc','boss','mimic'];
const EN={slime:{hp:26,spd:55,dmg:8,xp:6,r:12},bat:{hp:14,spd:118,dmg:6,xp:6,r:9},archer:{hp:20,spd:72,dmg:9,xp:10,r:11},orc:{hp:70,spd:62,dmg:16,xp:20,r:15},boss:{hp:560,spd:55,dmg:14,xp:220,r:26},mimic:{hp:48,spd:88,dmg:12,xp:26,r:14}};
