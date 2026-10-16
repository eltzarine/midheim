/* ================= Prologue de 2999 : la Lanterne froide (chapitre 1) =================
   Les nouveaux héros commencent à l'auberge du bas-quartier de Tarkin. Chacun joue le frère ou la sœur de sa classe.
   La fratrie entre, s'assoit, commande la mélasse de Ragna ; la radio vante le Foyer, où la mère veut envoyer Elin.
   Bjorn part en courant chez la mère, les autres le suivent. Les héros joués restent à table, seuls avec l'addition,
   sauf si l'un d'eux joue Bjorn : alors tout le monde sort, et on reprend dehors, devant l'auberge.
   Chaque joueur joue la scène chez lui ; l'hôte note la fin dans « pr » (bit 1 = scène finie, la porte s'ouvre). */
const PRO_SIB={guerrier:'bjorn',voleur:'kari',mage:'sigrid',soigneur:'liv'};
const PRO_SIBS=['kari','bjorn','sigrid','liv'];
const PRO_CLS={kari:'voleur',bjorn:'guerrier',sigrid:'mage',liv:'soigneur'};
const PRO_NOM={kari:'Kári',bjorn:'Bjorn',sigrid:'Sigrid',liv:'Liv',ragna:'Ragna',arne:'Arne',halvard:'Halvard',radio:'La radio'};
// places autour de la grande table (en cases) : celle du héros joué reste libre
const PRO_SEAT={kari:[6.5,5.2],bjorn:[8.5,5.2],sigrid:[6.5,7.6],liv:[8.5,7.6]};
const PRO_W=15,PRO_H=11,PRO_DOOR=7;
// la valeur reçue de l'autre joueur est bornée : seul le bit du prologue passe
function proBits(v){v=Math.trunc(+v);return Number.isFinite(v)?v&1:0}
function proSibOf(cls){return PRO_SIB[cls]||'kari'}
/* dans les dialogues, le frère ou la sœur joué(e) porte le nom du joueur : « Du calme, Bjorn » devient « Du calme, Léo » */
function proJoues(){const j={};const ps=typeof G!=='undefined'&&G&&G.players||[];for(const p of ps){const s=PRO_SIB[p.cls],n=clean(p.name);if(s&&n&&!j[s])j[s]=n}return j}
function persoNoms(t){t=String(t==null?'':t);const j=proJoues();
  for(const s in j){const n=PRO_NOM[s];if(!n||j[s]===n)continue;t=t.replace(new RegExp('(^|[^\\p{L}])'+n+'(?![\\p{L}])','gu'),(m,a)=>a+j[s])}return t}
// quelqu'un joue Bjorn : tout le monde le suit dehors
function proBjornJoue(){return!!(G&&G.players.some(p=>p.cls==='guerrier'))}

/* libre : l'auberge de Tarkin une fois le prologue passé (on y revient) : même salle, porte ouverte, sans scène ;
   Ragna tient l'auberge (repos et boutique). */
function buildLanterne(hid,exitTo,libre){const W=PRO_W,H=PRO_H,t=new Uint8Array(W*H).fill(1);for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)t[y*W+x]=0;
  t[(H-1)*W+PRO_DOOR]=6;   // porte fermée tant que la scène n'est pas finie
  const furn=[],solidAt=(x,y)=>{t[y*W+x]=6};
  // mur du fond
  furn.push({k:'hjem',x:2,y:0},{k:'cartes',x:4,y:0},{k:'lampe',x:7,y:0},{k:'radio',x:9,y:0},{k:'compteur',x:12,y:0});
  // comptoir de Ragna, dynamo, tonneaux
  furn.push({k:'comptoir',x:10,y:2},{k:'dynamo',x:13,y:2});for(const x of[10,11,12,13])solidAt(x,2);
  furn.push({k:'tonneau',x:13,y:5},{k:'tonneau',x:13,y:6});solidAt(13,5);solidAt(13,6);
  // poêle à tourbe et table d'Arne
  furn.push({k:'poele',x:1,y:2});solidAt(1,2);
  furn.push({k:'table',x:4,y:3},{k:'cartes2',x:4,y:3});solidAt(4,3);
  // grande table de la fratrie, sous la seule ampoule
  furn.push({k:'grandetable',x:6,y:6},{k:'ampoule',x:7,y:4});for(const x of[6,7,8])solidAt(x,6);
  furn.push({k:'porte',x:PRO_DOOR,y:H-1});
  const P=(x,y)=>({x:(x+.5)*TS,y:(y+.5)*TS});
  const m={kind:'house',hk:'lanterne',hid,W,H,t,pal:4,furn,rooms:[],chests:[],crates:[],plates:[],spikes:[],torches:[],props:[],stairs:null,boss:false,doorX:PRO_DOOR,
    start:P(7,8.4),exitTo,theme:4,dark:.6,
    lights:[{x:7.5,y:5.6,r:150,a:.95,fl:1},{x:1.5,y:2.8,r:96,a:.85,fl:2},{x:4.5,y:3.3,r:52,a:.6,fl:3},{x:11.5,y:2.2,r:64,a:.55,fl:0}],
    npcs:[{id:'ragna',who:'ragna',...P(11.5,1.3)},{id:'halvard',who:'halvard',...P(2.6,3.4)},{id:'arne',who:'arne',...P(5.3,3.2)}]};
  m.inter=[{...P(11.5,3.3),r:44,kind:'talk',act:'pro:ragna',label:'Parler à Ragna'},{...P(2.6,4.4),r:40,kind:'talk',act:'pro:halvard',label:'Parler à Halvard'},
    {...P(5.3,4.2),r:36,kind:'talk',act:'pro:arne',label:'Parler à Arne'},{...P(4.5,1.2),r:34,kind:'talk',act:'pro:cartes',label:'Lire les cartes'},
    {...P(2.5,1.2),r:30,kind:'talk',act:'pro:hjem',label:'Regarder l’affiche'},{...P(7.5,1.2),r:30,kind:'talk',act:'pro:lampe',label:'Examiner la lampe'},
    {...P(9.5,1.2),r:28,kind:'talk',act:'pro:radio',label:'Écouter la radio'},{...P(12.5,1.2),r:28,kind:'talk',act:'pro:compteur',label:'Regarder le compteur'},
    {x:(PRO_DOOR+.5)*TS,y:(H-1+.2)*TS,r:30,kind:'door',act:'exit',label:'Sortir'}];
  if(libre){m.libre=true;t[(H-1)*W+PRO_DOOR]=0;m.inter[0]={...P(11.5,3.3),r:44,kind:'talk',act:'shop:auberge',label:'Parler à Ragna',town:String(hid).split('_')[0]}}
  return m}

// lieu de la Lanterne : l'auberge de Tarkin, porte de sortie comprise
function proZone(){if(!WORLD)buildWorld();const b=WORLD.builds.find(b=>b.hid==='tarkin_auberge');const d=b?b.door:{x:PL.tarkin[0],y:PL.tarkin[1]};
  return'h:lanterne:tarkin_auberge:'+Math.round((d.x+.5)*TS)+':'+Math.round((d.y+.95)*TS)}
// hôte : entrer dans la Lanterne, chaque héros à la place de son frère ou de sa sœur
function proEnter(){hostEnter(proZone(),null,{heal:true});G.pr=0;G.proT0=G.time;G.proEndAt=0;G.proOut=0;proSeat()}
function proSeat(){const used=new Set();G.players.forEach((p,i)=>{const s=proSibOf(p.cls);let q={x:PRO_SEAT[s][0]*TS,y:PRO_SEAT[s][1]*TS};if(used.has(s))q=freeSpot(q.x,q.y+TS*1.2);used.add(s);
  p.x=p.rx=q.x;p.y=p.ry=q.y;if(i===myIdx){L.x=q.x;L.y=q.y}})}
// départ d'un nouveau héros : vrai si le prologue commence
function proStart(){if(window.__noStory||!hero||hero.q!==0||(hero.fl||[]).includes('pro_done')||hero.story.includes('prologue'))return false;proEnter();return true}

/* ---------- hôte : fin de la scène, sortie de tout le monde si quelqu'un joue Bjorn ---------- */
function proTick(){const m=G.m;if(!m||m.hk!=='lanterne'||m.libre)return;G.pr=proBits(G.pr);
  if(!(G.pr&1)){if(G.time-(G.proT0||0)>240){G.pr|=1;G.proEndAt=G.time}return}
  if(proBjornJoue()&&!G.proOut&&G.time-(G.proEndAt||0)>.8){G.proOut=1;hostEnter('w',m.exitTo)}}

/* ---------- chaque joueur : la scène, la porte ---------- */
const Pro={ep:-1,was:0,hk:'',talk:{}};
function proLocal(){if(!G||!G.m){Pro.hk='';return}const m=G.m;
  // l'hôte a déjà emmené tout le monde dehors : la scène s'arrête ici
  if(m.hk!=='lanterne'&&Scene.on&&Scene.def&&Scene.def.pro)Scene.skip();
  if(Pro.hk==='lanterne'&&m.hk!=='lanterne'&&m.kind==='world'&&(Pro.was&1))proDone();
  Pro.hk=m.hk||m.kind;if(m.hk!=='lanterne')return;
  if(m.libre){Pro.was=0;Pro.ep=G.ep;m.t[(PRO_H-1)*m.W+PRO_DOOR]=0;return}
  const bits=proBits(G.pr);Pro.was=bits;
  m.t[(PRO_H-1)*m.W+PRO_DOOR]=bits&1?0:6;
  if(Pro.ep!==G.ep){Pro.ep=G.ep;Pro.talk={};Scene.play(proScene(),()=>{if(mode!=='guest'&&G&&G.m&&G.m.hk==='lanterne'&&!(G.pr&1)){G.pr|=1;G.proEndAt=G.time}})}}
// l'ancienne introduction (l'an 147) ne se joue plus : ses étapes sont seulement notées comme vues,
// pour que la suite de l'histoire ne la redemande pas
const PRO_OLD=['prologue','reinald0','ch0'];
function proSkipOld(){if(!hero)return;hero.story=hero.story||[];for(const k of PRO_OLD)if(!hero.story.includes(k))hero.story.push(k);doSave(true)}
// sortie de la Lanterne après la scène : le prologue est fait
function proDone(){Pro.was=0;if(!hero)return;hero.fl=hero.fl||[];if(!hero.fl.includes('pro_done'))hero.fl.push('pro_done');proSkipOld();
  toast('Prologue terminé. La scène chez la mère arrive bientôt.')}
function proObj(){return proBits(G.pr)&1?'Rattraper Bjorn chez la mère · rue des Chaudronniers':'La Lanterne froide'}
function proName(){if(!G||!G.m||G.m.hk!=='lanterne')return'';return'La Lanterne froide'}

/* ---------- la scène d'ouverture ---------- */
const proMe=()=>proSibOf(hero&&hero.cls);
const proL=(who,text)=>({line:{who,name:PRO_NOM[who]||who,text}});
function proScene(){const C=(x,y)=>[x*TS,y*TS],mv=(id,x,y,dur)=>({move:id,to:C(x,y),dur});
  // qui est joué, par qui : les héros joués gardent leur apparence
  const joue={};G.players.forEach((p,i)=>{const s=proSibOf(p.cls);if(!joue[s])joue[s]={cls:p.cls,lk:i===myIdx?lookOf(hero.eq):(p.lk|0),name:p.name}});
  const bj=proBjornJoue(),door=C(7.5,10.6);
  const actors=PRO_SIBS.map(s=>joue[s]?{id:s,k:'hero',cls:joue[s].cls,lk:joue[s].lk,name:joue[s].name,x:door[0],y:door[1],aim:-Math.PI/2}
    :{id:s,k:'npc',who:s,x:door[0],y:door[1],name:PRO_NOM[s]});
  actors.push({id:'ragna',k:'npc',who:'ragna',x:12*TS,y:1.8*TS,name:'Ragna'});
  const vise=(id,a)=>({call:S=>{const o=S.actors.find(o=>o.id===id);if(o)o.aim=a}});
  // ceux qui sortent derrière Bjorn : tous si quelqu'un joue Bjorn, sinon ceux que personne ne joue
  const part=['kari','sigrid','liv'].filter(s=>bj||!joue[s]);
  const sortie=[[],[],[]];
  if(part.includes('kari'))sortie[0].push(mv('kari',5.2,5.2,.45)),sortie[1].push(mv('kari',5.2,8.9,.6)),sortie[2].push(mv('kari',7.5,10.6,.45));
  if(part.includes('sigrid'))sortie[0].push(mv('sigrid',7.2,8.8,.45)),sortie[1].push(mv('sigrid',7.5,10.6,.6));
  if(part.includes('liv'))sortie[0].push(mv('liv',7.8,8.8,.45)),sortie[1].push(mv('liv',7.5,10.6,.6));
  const steps=[{title:['La Lanterne froide','Chapitre 1 · Tarkin, l’an 2999'],titleDur:4200},{cam:C(7.5,6.4),dur:1.6},
    // la fratrie entre, Sigrid en tête
    mv('sigrid',7.5,8.4,.9),{wait:.35},mv('kari',6.4,8.9,.9),{wait:.35},mv('bjorn',8.6,8.9,.9),{wait:.35},mv('liv',7.5,9.4,.8),{wait:.9},
    proL('sigrid','Aaaah, enfin un peu de chaleur ! J’ai bien fait de réparer ce foutu chauffage… en espérant que ça tienne.'),
    // tout le monde s'assoit
    mv('kari',5.2,8.9,.7),mv('bjorn',9.8,8.9,.7),mv('sigrid',6.5,7.6,.7),mv('liv',8.5,7.6,.7),{wait:.75},
    mv('kari',5.2,5.2,.9),mv('bjorn',9.8,5.2,.9),{wait:.95},mv('kari',6.5,5.2,.45),mv('bjorn',8.5,5.2,.45),{wait:.5},
    vise('kari',Math.PI/2),vise('bjorn',Math.PI/2),vise('sigrid',-Math.PI/2),vise('liv',-Math.PI/2),
    // Ragna quitte son comptoir
    mv('ragna',9.6,1.5,.6),{wait:.65},mv('ragna',9.7,6.5,1.1),{wait:1.15},
    proL('ragna','Ce sera quoi pour vous, messieurs dames, aujourd’hui ?'),
    proL('kari','Arrête de te payer notre tête et sers-nous ta mélasse, comme d’hab’.'),
    proL('ragna','Et quatre mélasses du chef ! Vous m’en direz des nouvelles ! Ahahah !'),
    mv('ragna',9.6,1.5,1.1),
    proL('bjorn','Quel idiot, cet aubergiste… Je vais me le faire, un jour !'),
    mv('ragna',12,1.8,.6),
    proL('liv','Du calme, Bjorn. C’est le seul endroit de la ville où il reste assez d’énergie pour se réchauffer un peu.'),
    proL('bjorn','Quel heureux hasard… Ça ne m’étonnerait pas qu’il fricote avec Riket, celui-là.'),
    {cam:C(8.5,3.2),dur:.9},{wait:.9},
    proL('radio','Rejoignez le Foyer : soins gratuits et aide aux plus démunis. Nous sommes là pour vous.'),
    {cam:C(6,4.4),dur:.9},{wait:.9},
    proL('arne','Mon fils les a rejoints, Dieu merci ! Il m’envoie une carte postale chaque mois. Il a l’air si heureux.'),
    {cam:C(7.5,6.4),dur:.9},{wait:.9},
    proL('sigrid','Mouais… On ne sait pas ce qu’ils leur font. Ce Foyer me glace le sang. Maman veut y envoyer Elin aujourd’hui, pour qu’ils la soignent.'),
    proL('bjorn','Quoi ?! Hors de question ! Ils ne toucheront pas un cheveu de notre petite sœur !'),
    // Bjorn part en courant chez la mère
    mv('bjorn',9.8,5.2,.3),{wait:.32},mv('bjorn',9.8,8.8,.5),{wait:.52},mv('bjorn',7.5,9.4,.35),{wait:.37},mv('bjorn',7.5,10.6,.3),{wait:.35},{del:'bjorn'},
    proL('kari','Aaaargh ! Il est si têtu, ce frangin ! Vite, on le suit !'),
    ...sortie[0],{wait:.5},...sortie[1],{wait:.65},...sortie[2],{wait:.5},{del:part},{wait:.4},
    // Ragna revient avec les plats
    mv('ragna',9.6,1.5,.6),{wait:.65},mv('ragna',9.7,6.5,1),{wait:1.05},
    proL('ragna','Eeeh, vous ne mangez pas ?! Mais qui va payer la mélasse ?!')];
  if(bj)steps.push({wait:.6});
  return{pro:true,cam:C(7.5,7.4),fadeIn:true,hideP:true,hideNpc:['ragna'],actors,steps}}

/* ---------- parler, lire, écouter ---------- */
function proClue(k,txt){hero.fl=hero.fl||[];if(hero.fl.includes('pi_'+k))return;hero.fl.push('pi_'+k);doSave(false);toast('Indice noté : '+txt)}
const PRO_SAY={
  ragna:['Ma mélasse, c’est la même qu’hier. Elle est meilleure.','La dynamo, c’est mon bras qui la fait tourner. Une heure quarante de lumière ce soir, pas une minute de plus.','Je vous connais depuis que vous tenez debout. Mangez.'],
  halvard:['Mon grand-père disait que les pierres chantaient. Maintenant, elles mangent.','Avant, la lumière ne coûtait rien. On l’avait pour rien, et on ne savait pas d’où elle venait. On ne le sait toujours pas.'],
  arne:['Mon Pål est dans une ferme à Vindheim. Il m’écrit chaque mois. Regarde, ses cartes sont toutes au mur.','Deux ans qu’il est parti avec le Foyer. Il mange à sa faim, là-bas. C’est écrit.']};
function proTalk(k){const b=proBits(G.pr),me=proMe(),nar=(nom,t,o)=>Vig.say('narrateur',nom,t,Object.assign({near:{x:L.x,y:L.y}},o||{}));
  if(k==='ragna'&&(b&1)){showDialog('ragna','Ragna','Alors ? Qui paie la mélasse ? Quatre bols, ça fait quatre bols !');return}
  if(PRO_SAY[k]){const n=Pro.talk[k]|0;Pro.talk[k]=n+1;if(k==='halvard')proClue('pierres','« Les pierres mangent. »');showDialog(k,PRO_NOM[k],PRO_SAY[k][n%PRO_SAY[k].length]);return}
  if(k==='cartes'){proClue('cartes','les cartes des enfants ont toutes la même écriture.');
    const t='« Je vais bien, je mange à ma faim, ne t’inquiète pas. » Une autre carte, d’un autre enfant : « Je vais bien, je mange à ma faim, ne t’inquiète pas. »';
    nar('Le mur des nouvelles',t,{onDone:()=>showDialog(me,PRO_NOM[me],me==='sigrid'?'Même écriture sur toutes les cartes. Et les mêmes mots. Ce ne sont pas les enfants qui écrivent.':'Regarde l’écriture. C’est la même partout.')});return}
  if(k==='radio'){proClue('radio','la radio de Riket fait la réclame du Foyer.');nar('La radio de Riket','« Riket vous rappelle : extinction à vingt-deux heures. Rejoignez le Foyer : soins gratuits et aide aux plus démunis. »');return}
  if(k==='hjem'){nar('L’affiche du Foyer','« Chaque enfant mérite un foyer. » Une maison dessinée, un cœur rouge dedans. L’affiche est neuve. C’est la seule chose neuve de la salle.');return}
  if(k==='compteur'){nar('Le compteur à jetons','Un chiffre vert : 1:40. Ensuite, le noir.');return}
  if(k==='lampe'){if(me==='sigrid'){Pro.lampOn=G.time+1.2;showDialog('sigrid','Sigrid','L’éclat mort a frémi quand j’ai approché mon gant. Une seconde. Puis plus rien.')}
    else nar('La lampe d’avant','Une vieille lampe, d’avant les quotas. L’éclat de pierre, dedans, est gris et mort.');return}}

/* ---------- décor dessiné (palette du pack, contour sombre) ---------- */
const PRO_FURN={
  hjem(g,x,y){g.fillStyle='#1a120d';g.fillRect(x+3,y+3,26,26);g.fillStyle='#efe3c8';g.fillRect(x+4,y+4,24,24);g.fillStyle='#f2b48a';g.fillRect(x+9,y+12,14,10);g.fillStyle='#7a3b22';g.fillRect(x+8,y+10,16,2);g.fillRect(x+10,y+8,12,2);g.fillRect(x+13,y+6,6,2);
    g.fillStyle='#c8463c';g.fillRect(x+13,y+15,2,2);g.fillRect(x+17,y+15,2,2);g.fillRect(x+13,y+17,6,2);g.fillRect(x+15,y+19,2,1);g.fillStyle='#7a3b22';g.fillRect(x+8,y+24,16,2)},
  cartes(g,x,y){g.fillStyle='#1a120d';g.fillRect(x+1,y+4,62,24);g.fillStyle='#2d2017';g.fillRect(x+2,y+5,60,22);const c=['#e8dcc2','#f0e6d0','#e2d4b8','#d8c9ab'];
    for(let i=0;i<12;i++){g.fillStyle=c[i%4];g.fillRect(x+4+(i%6)*10,y+7+Math.floor(i/6)*10+(i%3===1?1:0),8,7)}},
  lampe(g,x,y,T){g.fillStyle='#1a120d';g.fillRect(x+8,y+6,16,20);g.fillStyle='#3a3530';g.fillRect(x+9,y+7,14,18);g.fillStyle='#4b4560';g.fillRect(x+13,y+10,6,10);
    g.fillStyle=Pro.lampOn>T?'#cfe8ff':'#5d5873';g.fillRect(x+14,y+12,4,6)},
  compteur(g,x,y){g.fillStyle='#1a120d';g.fillRect(x+6,y+4,20,24);g.fillStyle='#5a5f57';g.fillRect(x+7,y+5,18,22);g.fillStyle='#121a12';g.fillRect(x+9,y+8,14,7);g.fillStyle='#9be37a';g.fillRect(x+10,y+10,2,3);g.fillRect(x+14,y+10,2,3);g.fillRect(x+17,y+10,4,3);
    g.fillStyle='#1a120d';g.fillRect(x+12,y+19,8,2)},
  radio(g,x,y,T){g.fillStyle='#1a120d';g.fillRect(x+4,y+12,24,16);g.fillStyle='#6b4a2e';g.fillRect(x+5,y+13,22,14);g.fillStyle='#2a1d13';g.fillRect(x+7,y+16,9,9);g.fillStyle='#c9a36a';g.fillRect(x+19,y+16,2,8);
    g.fillStyle=Math.sin(T*3)>0?'#ffb347':'#7a4a1a';g.fillRect(x+23,y+16,2,2);g.fillStyle='#1a120d';g.fillRect(x+15,y+6,1,6)},
  dynamo(g,x,y,T){g.fillStyle='#1a120d';g.fillRect(x+6,y+8,20,18);g.fillStyle='#8b8f86';g.fillRect(x+7,y+9,18,16);g.fillStyle='#5b5f57';g.fillRect(x+11,y+13,10,8);
    const a=T*2.4,cx=x+16,cy=y+17;g.fillStyle='#1a120d';g.fillRect(Math.round(cx+Math.cos(a)*9)-2,Math.round(cy+Math.sin(a)*9)-2,4,4)},
  poele(g,x,y,T){g.fillStyle='#1a120d';g.fillRect(x+1,y+2,30,28);g.fillStyle='#3b3a38';g.fillRect(x+2,y+3,28,26);g.fillStyle='#232220';g.fillRect(x+7,y+11,18,12);
    const f=Math.sin(T*9)>0;g.fillStyle='#e8661e';g.fillRect(x+9,y+16,14,6);g.fillStyle='#ffc04a';g.fillRect(x+12,y+(f?16:17),8,4);g.fillStyle='#5a5246';g.fillRect(x+12,y-6,8,9)},
  ampoule(g,x,y,T){g.fillStyle='#1a120d';g.fillRect(x+15,y-6,1,26);const on=Math.sin(T*23)>-.95;g.fillStyle='#1a120d';g.fillRect(x+12,y+19,8,8);g.fillStyle=on?'#ffe7a8':'#a08850';g.fillRect(x+13,y+20,6,6);if(on){g.fillStyle='#fff6d8';g.fillRect(x+14,y+21,2,2)}},
  cartes2(g,x,y){g.fillStyle='#efe3c8';g.fillRect(x+8,y+9,7,5);g.fillRect(x+17,y+11,7,5);g.fillStyle='#b9a888';g.fillRect(x+9,y+10,5,1);g.fillRect(x+18,y+12,5,1)},
  grandetable(g,x,y){g.fillStyle='#1a120d';g.fillRect(x+1,y+3,TS*3-2,24);g.fillStyle='#6b4a2c';g.fillRect(x+2,y+4,TS*3-4,22);g.fillStyle='#8a6034';g.fillRect(x+2,y+4,TS*3-4,4);
    g.fillStyle='#d8c9ab';for(const[a,b]of[[10,12],[30,16],[58,12],[78,16]]){g.fillRect(x+a,y+b,8,5)}g.fillStyle='#9b6a3a';g.fillRect(x+46,y+10,6,9)},
  porte(g,x,y){const open=G&&G.m&&G.m.t[(G.m.H-1)*G.m.W+PRO_DOOR]===0;g.fillStyle='#1a120d';g.fillRect(x+2,y,28,TS);g.fillStyle=open?'#2a1d12':'#5a3b22';g.fillRect(x+3,y,26,TS);
    if(!open){g.fillStyle='#3a2716';g.fillRect(x+15,y,2,TS);g.fillStyle='#c9a24a';g.fillRect(x+21,y+14,3,3)}else{g.fillStyle='rgba(255,230,170,.18)';g.fillRect(x+3,y,26,TS)}}};
