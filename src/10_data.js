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
/* 3 compétences + 1 ultime par classe */
const SKILLS={
  guerrier:[
    {id:'charge',nom:'Charge du bouclier',court:'Charge',lvl:1,cd:6,mp:15,desc:'Fonce droit devant, frappe et étourdit les ennemis traversés.'},
    {id:'tourbillon',nom:'Tourbillon',court:'Tourbil.',lvl:3,cd:7,mp:25,desc:'Frappe tout autour de toi et divise par deux les dégâts reçus pendant 2,5 s.'},
    {id:'cri',nom:'Cri de guerre',court:'Cri',lvl:5,cd:15,mp:30,desc:'Attire les ennemis proches sur toi. Le groupe gagne +25 % de dégâts et −25 % de dégâts subis pendant 6 s.'},
    {id:'seisme',nom:'Frappe sismique',court:'Séisme',lvl:7,ult:true,desc:'Ultime : un coup qui fend le sol. Énormes dégâts autour de toi et étourdissement de 1,5 s.'}],
  mage:[
    {id:'nova',nom:'Nova de givre',court:'Givre',lvl:1,cd:7,mp:35,desc:'Gèle les ennemis proches pendant 2,5 s et les blesse.'},
    {id:'transfert',nom:'Transfert',court:'Transf.',lvl:3,cd:5,mp:20,desc:'Te téléporte un peu plus loin. Le sol gèle là où tu étais.'},
    {id:'flammes',nom:'Pluie de flammes',court:'Flammes',lvl:5,cd:10,mp:40,desc:'Fait tomber le feu sur la zone visée pendant 3 s.'},
    {id:'tempete',nom:'Tempête arcanique',court:'Tempête',lvl:7,ult:true,desc:'Ultime : pendant 4 s, des projectiles partent tout seuls vers les ennemis proches.'}],
  voleur:[
    {id:'ombre',nom:'Pas de l’ombre',court:'Ombre',lvl:1,cd:3,mp:15,desc:'Bond invulnérable. Le coup suivant fait un critique triple.'},
    {id:'eventail',nom:'Éventail de lames',court:'Éventail',lvl:3,cd:6,mp:20,desc:'Lance sept dagues en éventail.'},
    {id:'fumee',nom:'Bombe fumigène',court:'Fumée',lvl:5,cd:14,mp:25,desc:'Un nuage ralentit les ennemis. Tu deviens invisible 3 s : ils t’oublient.'},
    {id:'danse',nom:'Danse des lames',court:'Danse',lvl:7,ult:true,desc:'Ultime : frappe jusqu’à six ennemis proches en un éclair, avec des critiques puissants.'}],
  soigneur:[
    {id:'cercle',nom:'Cercle de soin',court:'Soin',lvl:1,cd:8,mp:35,desc:'Une zone qui soigne et relève plus vite pendant 4 s.'},
    {id:'bouclier',nom:'Bouclier de lumière',court:'Bouclier',lvl:3,cd:12,mp:30,desc:'Protège toi et ton allié : absorbe 25 % de vos PV pendant 6 s.'},
    {id:'jugement',nom:'Jugement',court:'Jugement',lvl:5,cd:9,mp:35,desc:'La lumière frappe la zone visée : dégâts, étourdissement et soins pour les alliés dedans.'},
    {id:'aube',nom:'Aube de Lathandre',court:'Aube',lvl:7,ult:true,desc:'Ultime : soigne tout le groupe, relève ton allié où qu’il soit et rend invulnérable 2 s.'}],
};
const TALENTS=[['for','Force','+10 % de dégâts'],['vit','Vitalité','+12 % de points de vie'],['cel','Célérité','−7 % de temps de recharge'],['esp','Esprit','+20 % de mana et de régénération'],['agi','Agilité','+5 % de vitesse'],['pre','Précision','+5 % de coups critiques']];
const TAL_MAX=8, POT_MAX=6, BAG_MAX=18;
const xpNeed=l=>40+l*30;

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
function newHero(cls){return{cls,lvl:1,xp:0,pts:0,tal:{for:0,vit:0,cel:0,esp:0,agi:0,pre:0},gold:30,pot:3,sh:0,q:0,fl:[],wp:['start'],pos:null,story:[],sq:{},sqd:[],track:'main',bag:[],eq:{arme:starter(cls,'arme'),armure:starter(cls,'armure'),talisman:null},ts:0}}
function fixItem(it,cls){if(!it||typeof it!=='object'||!SLOTS.includes(it.s))return null;if(typeof it.rq==='string'&&RELICS[it.rq]){const r=makeRelic(it.rq,cls,it.l|0);if(r.s!==it.s)return null;r.u=clamp(it.u|0,0,5);return r}const o=genItem(it.id|0,it.l|0,it.r|0,cls,it.s);o.u=clamp(it.u|0,0,5);o.e=it.e&&enchOf(it.s,it.e)?it.e:null;if(typeof it.n==='string'&&it.n.length<60)o.n=it.n;return o}
function fixHero(h,cls){const n=newHero(cls);if(!h||typeof h!=='object')return n;const o=Object.assign(n,h);o.cls=cls;o.tal=Object.assign(newHero(cls).tal,h.tal||{});
  for(const k of['lvl','xp','pts','gold','pot','sh','q'])o[k]=clamp(Math.floor(+o[k]||0),0,1e7);o.lvl=clamp(o.lvl,1,99);o.pts=Math.min(o.pts,99);o.q=clamp(o.q,0,6);o.pot=Math.min(POT_MAX,o.pot);
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
function derive(h){const C=CLS[h.cls],L=h.lvl-1,t=h.tal,g=gearSum(h);return{
  mhp:Math.round((C.hp+C.hpL*L+g.hp)*(1+.12*t.vit)),mmp:Math.round(C.mp*(1+.2*t.esp)*(1+g.mp/100)),mpr:C.mpr*(1+.2*t.esp),
  dmg:C.dmg*(1+.08*L)*(1+.1*t.for)*(1+g.dmg/100),cdm:Math.max(.4,(1-.07*t.cel)*(1-g.cdr/100)),spd:C.spd*(1+.05*t.agi)*(1+g.spd/100),
  crit:Math.min(.75,C.crit+.05*t.pre+g.crit/100),arm:Math.min(.65,C.arm+g.arm/100),vol:g.vol/100,reg:g.reg,we:g.we,ae:g.ae,xpb:g.xpb,gb:g.gb,pb:g.pb}}

/* ================= Ennemis ================= */
/* rencontres dans le monde : camps espacés (CAMP_GAP cases), qui s'éveillent à CAMP_WAKE cases ;
   un ennemi qui s'éloigne de plus de LEASH cases de son poste (ou à plus de LEASH_P cases du héros) abandonne et y retourne */
const CAMP_GAP=18,CAMP_WAKE=14,LEASH=10,LEASH_P=12;
/* zone d'alerte : un ennemi attaque si un héros entre à moins de AGGRO cases ; il réveille en chaîne les ennemis
   dont la zone touche la sienne (distance < 2×AGGRO). Le cercle n'est dessiné qu'à moins de AGGRO_SHOW cases. */
const AGGRO=3,AGGRO_SHOW=4;
const ETYPES=['slime','bat','archer','orc','boss','mimic'];
const EN={slime:{hp:26,spd:55,dmg:8,xp:6,r:12},bat:{hp:14,spd:118,dmg:6,xp:6,r:9},archer:{hp:20,spd:72,dmg:9,xp:10,r:11},orc:{hp:70,spd:62,dmg:16,xp:20,r:15},boss:{hp:560,spd:55,dmg:14,xp:220,r:26},mimic:{hp:48,spd:88,dmg:12,xp:26,r:14}};
