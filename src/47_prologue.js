/* ================= Prologue de 2999 : la Lanterne froide (chapitre 1) =================
   Les nouveaux héros commencent à l'auberge du bas-quartier de Tarkin. Chacun joue le frère ou la sœur de sa classe ;
   les autres restent à table. L'hôte décide des moments forts (Sœur Maren, puis Nils) et les envoie dans « pr » :
   bit 1 = Maren est passée, bit 2 = Nils est arrivé (la porte s'ouvre). Chaque joueur joue les scènes chez lui. */
const PRO_SIB={guerrier:'bjorn',voleur:'kari',mage:'sigrid',soigneur:'liv'};
const PRO_SIBS=['kari','bjorn','sigrid','liv'];
const PRO_NOM={kari:'Kári',bjorn:'Bjorn',sigrid:'Sigrid',liv:'Liv',ragna:'Ragna',maren:'Sœur Maren',arne:'Arne',halvard:'Halvard',nils:'Nils'};
const PRO_ROLE={kari:'Kári, l’aînée. Voleuse, plaque de métal sur le visage, bras droit mécanique.',bjorn:'Bjorn, le fondeur. Guerrier, gantelet à piston.',
  sigrid:'Sigrid, la bricoleuse. Magicienne : elle fait répondre les machines anciennes.',liv:'Liv, le dispensaire. Soigneur, le plus proche d’Elin.'};
// places autour de la grande table (en cases) : celle du héros joué reste libre
const PRO_SEAT={kari:[6.5,5.2],bjorn:[8.5,5.2],sigrid:[6.5,7.6],liv:[8.5,7.6]};
const PRO_W=15,PRO_H=11,PRO_DOOR=7;
const PRO_CLUES=['cartes','pierres','radio'];
// la valeur reçue de l'autre joueur est bornée : seuls les deux bits du prologue passent
function proBits(v){v=Math.trunc(+v);return Number.isFinite(v)?v&3:0}
function proSibOf(cls){return PRO_SIB[cls]||'kari'}

/* libre : l'auberge de Tarkin une fois le prologue passé (on y revient) : même salle, porte ouverte, sans scènes ;
   Ragna tient l'auberge (repos et boutique). */
function buildLanterne(hid,exitTo,libre){const W=PRO_W,H=PRO_H,t=new Uint8Array(W*H).fill(1);for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)t[y*W+x]=0;
  t[(H-1)*W+PRO_DOOR]=6;   // porte fermée tant que Nils n'est pas venu
  const furn=[],solidAt=(x,y)=>{t[y*W+x]=6};
  // mur du fond
  furn.push({k:'hjem',x:2,y:0},{k:'cartes',x:4,y:0},{k:'lampe',x:7,y:0},{k:'radio',x:9,y:0},{k:'compteur',x:12,y:0});
  // comptoir de Ragna, tronc de Hjem, dynamo, tonneaux
  furn.push({k:'comptoir',x:10,y:2},{k:'tronc',x:10,y:2},{k:'dynamo',x:13,y:2});for(const x of[10,11,12,13])solidAt(x,2);
  furn.push({k:'tonneau',x:13,y:5},{k:'tonneau',x:13,y:6});solidAt(13,5);solidAt(13,6);
  // poêle à tourbe et table d'Arne
  furn.push({k:'poele',x:1,y:2});solidAt(1,2);
  furn.push({k:'table',x:4,y:3},{k:'cartes2',x:4,y:3});solidAt(4,3);
  // grande table de la fratrie, sous la seule ampoule
  furn.push({k:'grandetable',x:6,y:6},{k:'ampoule',x:7,y:4});for(const x of[6,7,8])solidAt(x,6);
  furn.push({k:'porte',x:PRO_DOOR,y:H-1});
  const P=(x,y)=>({x:(x+.5)*TS,y:(y+.5)*TS});
  const m={kind:'house',hk:'lanterne',hid,W,H,t,pal:4,furn,rooms:[],chests:[],crates:[],plates:[],spikes:[],torches:[],props:[],stairs:null,boss:false,doorX:PRO_DOOR,
    start:P(7,8.4),exitTo,theme:4,dark:.6,sibs:'',
    lights:[{x:7.5,y:5.6,r:150,a:.95,fl:1},{x:1.5,y:2.8,r:96,a:.85,fl:2},{x:4.5,y:3.3,r:52,a:.6,fl:3},{x:11.5,y:2.2,r:64,a:.55,fl:0}],
    npcs:[{id:'ragna',who:'ragna',...P(11.5,1.3)},{id:'halvard',who:'halvard',...P(2.6,3.4)},{id:'arne',who:'arne',...P(5.3,3.2)}]};
  m.inter=[{...P(11.5,3.3),r:44,kind:'talk',act:'pro:ragna',label:'Parler à Ragna'},{...P(2.6,4.4),r:40,kind:'talk',act:'pro:halvard',label:'Parler à Halvard'},
    {...P(5.3,4.2),r:36,kind:'talk',act:'pro:arne',label:'Parler à Arne'},{...P(4.5,1.2),r:34,kind:'talk',act:'pro:cartes',label:'Lire les cartes'},
    {...P(2.5,1.2),r:30,kind:'talk',act:'pro:hjem',label:'Regarder l’affiche'},{...P(7.5,1.2),r:30,kind:'talk',act:'pro:lampe',label:'Examiner la lampe'},
    {...P(9.5,1.2),r:28,kind:'talk',act:'pro:radio',label:'Écouter la radio'},{...P(12.5,1.2),r:28,kind:'talk',act:'pro:compteur',label:'Regarder le compteur'},
    {...P(10.4,3.3),r:26,kind:'talk',act:'pro:tronc',label:'Le tronc de Hjem'},
    {x:(PRO_DOOR+.5)*TS,y:(H-1+.2)*TS,r:30,kind:'door',act:'exit',label:'Sortir'}];
  if(libre){m.libre=true;t[(H-1)*W+PRO_DOOR]=0;m.inter[0]={...P(11.5,3.3),r:44,kind:'talk',act:'shop:auberge',label:'Parler à Ragna',town:String(hid).split('_')[0]}}
  m.base={npcs:m.npcs.slice(),inter:m.inter.slice()};
  return m}

// lieu de la Lanterne : l'auberge de Tarkin, porte de sortie comprise
function proZone(){if(!WORLD)buildWorld();const b=WORLD.builds.find(b=>b.hid==='tarkin_auberge');const d=b?b.door:{x:PL.tarkin[0],y:PL.tarkin[1]};
  return'h:lanterne:tarkin_auberge:'+Math.round((d.x+.5)*TS)+':'+Math.round((d.y+.95)*TS)}
// hôte : entrer dans la Lanterne, chaque héros à la place de son frère ou de sa sœur
function proEnter(){hostEnter(proZone(),null,{heal:true});G.pr=0;G.proT0=G.time;G.proMarenAt=0;proSeat()}
function proSeat(){const used=new Set();G.players.forEach((p,i)=>{const s=proSibOf(p.cls);let q={x:PRO_SEAT[s][0]*TS,y:PRO_SEAT[s][1]*TS};if(used.has(s))q=freeSpot(q.x,q.y+TS*1.2);used.add(s);
  p.x=p.rx=q.x;p.y=p.ry=q.y;if(i===myIdx){L.x=q.x;L.y=q.y}})}
// chacun reprend sa place à table quand Maren entre
function proSeatMe(){const s=PRO_SEAT[proMe()];L.x=s[0]*TS;L.y=s[1]*TS;if(mode!=='guest'){const p=G.players[myIdx];if(p){p.x=p.rx=L.x;p.y=p.ry=L.y}}}
// départ d'un nouveau héros : vrai si le prologue commence (sinon l'ancienne introduction joue)
function proStart(){if(window.__noStory||!hero||hero.q!==0||(hero.fl||[]).includes('pro_done')||hero.story.includes('prologue'))return false;proEnter();return true}

/* ---------- hôte : quand Maren entre, quand Nils arrive ---------- */
function proTick(){const m=G.m;if(!m||m.hk!=='lanterne'||m.libre)return;G.pr=proBits(G.pr);
  if(!(G.pr&1)){const dx=(PRO_DOOR+.5)*TS,dy=(PRO_H-1)*TS;const nearDoor=G.players.some(p=>!p.down&&p.y>dy-1.6*TS&&Math.abs(p.x-dx)<3*TS);
    const clues=PRO_CLUES.filter(k=>(hero.fl||[]).includes('pi_'+k)).length;
    if(nearDoor||clues>=3||G.time-(G.proT0||0)>100){G.pr|=1;G.proMarenAt=G.time}}
  else if(!(G.pr&2)&&(G.proMarenDone||G.time-(G.proMarenAt||0)>50))G.pr|=2}

/* ---------- chaque joueur : scènes, porte, frères et sœurs à table ---------- */
const Pro={ep:-1,bits:0,hk:'',was:0,talk:{}};
function proLocal(){if(!G||!G.m){Pro.hk='';return}const m=G.m;
  if(Pro.hk==='lanterne'&&m.hk!=='lanterne'&&m.kind==='world'&&(Pro.was&2))proDone();
  Pro.hk=m.hk||m.kind;if(m.hk!=='lanterne')return;
  if(m.libre){Pro.was=0;Pro.ep=G.ep;m.t[(PRO_H-1)*m.W+PRO_DOOR]=0;return}
  const bits=proBits(G.pr);Pro.was=bits;
  m.t[(PRO_H-1)*m.W+PRO_DOOR]=bits&2?0:6;
  // les frères et sœurs que personne ne joue restent à table
  const key=G.players.map(p=>p.cls).join(',');if(m.sibs!==key){m.sibs=key;const mine=new Set(G.players.map(p=>proSibOf(p.cls)));
    m.npcs=m.base.npcs.slice();m.inter=m.base.inter.slice();
    for(const s of PRO_SIBS){if(mine.has(s))continue;const[x,y]=PRO_SEAT[s];m.npcs.push({id:s,who:s,x:x*TS,y:y*TS});m.inter.push({x:x*TS,y:(y<6?y-.9:y+.9)*TS,r:34,kind:'talk',act:'pro:'+s,label:'Parler à '+PRO_NOM[s]})}
    if(Pro.bits&2)proNils()}
  if(Pro.ep!==G.ep){Pro.ep=G.ep;Pro.bits=0;Pro.talk={};Scene.play(proArrive())}
  if((bits&1)&&!(Pro.bits&1)){Pro.bits|=1;Scene.play(proMaren(),()=>{if(mode!=='guest')G.proMarenDone=true})}
  if((bits&2)&&!(Pro.bits&2)){Pro.bits|=2;Scene.play(proNilsScene(),()=>proNils())}}
// Nils reste près de la porte une fois la nouvelle annoncée
function proNils(){const m=G.m;if(!m||m.hk!=='lanterne'||m.npcs.some(n=>n.id==='nils'))return;const x=5.6*TS,y=8.8*TS;m.npcs.push({id:'nils',who:'nils',x,y});m.inter.push({x,y:y+TS*.6,r:32,kind:'talk',act:'pro:nils',label:'Parler à Nils'})}
// sortie de la Lanterne après Nils : le prologue est fait. L'ancienne introduction (l'an 147) ne se joue plus :
// ses étapes sont seulement notées comme vues, pour que la suite de l'histoire ne la redemande pas.
function proDone(){Pro.was=0;if(!hero)return;hero.fl=hero.fl||[];if(!hero.fl.includes('pro_done'))hero.fl.push('pro_done');
  for(const k of PRO_OLD)if(!hero.story.includes(k))hero.story.push(k);doSave(true);
  toast('Prologue terminé. La scène chez la mère arrive bientôt.')}
const PRO_OLD=['prologue','reinald0','ch0'];
function proObj(){const b=proBits(G.pr);if(b&2)return'Rentrer chez la mère · rue des Chaudronniers';if(b&1)return'Sœur Maren est à votre table';
  const n=PRO_CLUES.filter(k=>(hero.fl||[]).includes('pi_'+k)).length;return'Écoute la salle · indices '+n+'/3'}
function proName(){if(!G||!G.m||G.m.hk!=='lanterne')return'';return'La Lanterne froide'}

/* ---------- mises en scène ---------- */
const proMe=()=>proSibOf(hero&&hero.cls);
const proL=(who,text)=>({line:{who,name:PRO_NOM[who]||'La narratrice',text}});
const PRO_HELLO={bjorn:'J’ai faim à manger la table.',liv:'Elin m’a demandé de lui rapporter un truc qui brille.',sigrid:'(un éclat de verre au creux de la main) Ça, ça brille. Pour Elin.',kari:'Asseyez-vous. Ragna, quatre soupes.'};
const PRO_REACT={kari:'(elle se lève) Quelque chose ne va pas.',liv:'(la cuillère tombe) « Ce qu’il fallait »…',sigrid:'Elle a regardé la place vide. Celle d’Elin.',bjorn:'(il pose sa cuillère) … Je n’ai plus faim.'};
function proArrive(){const c={x:7.5*TS,y:6.2*TS};const me=proMe();
  return{cam:[c.x,c.y+40],fadeIn:true,hideP:false,actors:[],steps:[{title:['La Lanterne froide','Chapitre 1 · Tarkin, l’an 2999'],titleDur:4500},{cam:[c.x,c.y],dur:2},
    proL('narrateur','Tarkin, l’an 2999. Ce soir, le bas-quartier passe au rationnement : les fenêtres s’éteignent une à une. Il ne reste qu’un endroit chauffé, la Lanterne froide.'),
    proL(me,PRO_HELLO[me]),proL('ragna','Soupe de navets. C’est la même qu’hier, elle est meilleure.'),
    proL('narrateur','Ce soir, tu es '+PRO_ROLE[me])]}}
function proMaren(){const d={x:(PRO_DOOR+.5)*TS,y:(PRO_H-1.2)*TS},stop={x:7.5*TS,y:9.1*TS},me=proMe();
  return{cam:[stop.x,stop.y-30],hideP:false,actors:[{id:'maren',k:'npc',who:'maren',x:d.x,y:d.y,name:'Sœur Maren'}],steps:[
    {call:proSeatMe},{move:'maren',to:[stop.x,stop.y],dur:1.8},{wait:1.9},
    proL('maren','Les enfants Haldorsen… vous êtes tous là ? Tenez, c’est du pain chaud.'),
    proL('bjorn','Merci, ma sœur.'),
    proL('maren','Saluez votre mère. Elle a fait ce qu’il fallait.'),
    proL('kari','… Ce qu’il fallait pour quoi ?'),
    proL('maren','Bonne soirée. Pensez au tronc.'),
    {move:'maren',to:[d.x,d.y+20],dur:1.8},{wait:1.4},{del:'maren'},
    proL(me,PRO_REACT[me])]}}
function proNilsScene(){const d={x:(PRO_DOOR+.5)*TS,y:(PRO_H-1.2)*TS},stop={x:6.6*TS,y:8.6*TS};
  return{cam:[stop.x,stop.y-30],hideP:false,actors:[{id:'nils',k:'npc',who:'nils',x:d.x,y:d.y,name:'Nils'}],hideNpc:['nils'],steps:[
    {move:'nils',to:[stop.x,stop.y],dur:.9},{wait:1},
    proL('nils','Votre mère vous cherche ! Elle pleure. Il y avait une dame en blanc chez vous ce matin. Elle est repartie avec une petite valise.'),
    proL('liv','La valise d’Elin.'),proL('kari','On y va. Maintenant.'),
    proL('ragna','Vous n’avez pas payé la soupe. Allez. Allez !'),
    {title:['Nouvel objectif','Rentrer chez la mère · rue des Chaudronniers'],titleDur:4000},{del:'nils'}]}}

/* ---------- parler, lire, écouter ---------- */
function proClue(k,txt){hero.fl=hero.fl||[];if(hero.fl.includes('pi_'+k))return;hero.fl.push('pi_'+k);doSave(false);toast('Indice noté : '+txt)}
const PRO_SAY={
  ragna:['Soupe de navets. C’est la même qu’hier, elle est meilleure.','La dynamo, c’est mon bras qui la fait tourner. Une heure quarante de lumière ce soir, pas une minute de plus.','Je vous connais depuis que vous tenez debout. Mangez.'],
  halvard:['Mon grand-père disait que les pierres chantaient. Maintenant, elles mangent.','Avant, la lumière ne coûtait rien. On l’avait pour rien, et on ne savait pas d’où elle venait. On ne le sait toujours pas.'],
  arne:['Mon Pål est dans une ferme à Vindheim. Il m’écrit chaque saison. Regarde, elles sont toutes au mur.','Deux ans qu’il est parti avec Hjem. Il mange à sa faim, là-bas. C’est écrit.'],
  kari:['Mange d’abord. On parlera après.','« Ce qu’il fallait »… Je n’aime pas ça.','On rentre. Maintenant.'],
  bjorn:['Tu vas finir ta soupe ? Non ? Je la prends.','Elle a dit quoi, sur maman ?','Je passe devant.'],
  sigrid:['Tu as vu leurs cartes ? Je te parie que c’est la même main qui les écrit.','Elle connaissait notre nom. Pourquoi elle connaît notre nom ?','Une petite valise… Elin a une petite valise.'],
  liv:['Elin voulait un truc qui brille. Je n’ai rien trouvé.','J’ai froid, tout d’un coup.','La valise d’Elin.'],
  nils:['Courez ! Rue des Chaudronniers !']};
function proTalk(k){const b=proBits(G.pr),me=proMe(),nar=(nom,t,o)=>Vig.say('narrateur',nom,t,Object.assign({near:{x:L.x,y:L.y}},o||{}));
  if(PRO_SIBS.includes(k)){const i=b&2?2:b&1?1:0;showDialog(k,PRO_NOM[k],PRO_SAY[k][i]);return}
  if(k==='ragna'){if(b&2){showDialog('ragna','Ragna','Filez. Vous paierez la soupe une autre fois.');return}if(b&1){showDialog('ragna','Ragna','Maren passe tous les soirs. Elle fait du bien au quartier… je crois.');return}}
  if(PRO_SAY[k]){const n=Pro.talk[k]|0;Pro.talk[k]=n+1;if(k==='halvard')proClue('pierres','« Les pierres mangent. »');showDialog(k,PRO_NOM[k],PRO_SAY[k][n%PRO_SAY[k].length]);return}
  if(k==='cartes'){proClue('cartes','les cartes des enfants ont toutes la même écriture.');
    const t='« Je vais bien, je mange à ma faim, ne t’inquiète pas. » Une autre carte, d’un autre enfant : « Je vais bien, je mange à ma faim, ne t’inquiète pas. »';
    if(me==='sigrid')nar('Le mur des nouvelles',t,{onDone:()=>showDialog('sigrid','Sigrid','Même écriture sur toutes les cartes. Et les mêmes mots. Ce ne sont pas les enfants qui écrivent.')});
    else nar('Le mur des nouvelles',t,{onDone:()=>showDialog('sigrid','Sigrid','Regarde l’écriture. C’est la même partout.')});return}
  if(k==='radio'){proClue('radio','la radio de Riket rappelle de « penser au tronc de Hjem ».');nar('La radio de Riket','« Riket vous rappelle : extinction à vingt-deux heures. L’énergie est un bien commun. Pensez au tronc de Hjem. »');return}
  if(k==='hjem'){nar('L’affiche de Hjem','« Chaque enfant mérite un foyer. » Une maison dessinée, un cœur rouge dedans. L’affiche est neuve. C’est la seule chose neuve de la salle.');return}
  if(k==='tronc'){nar('Le tronc de Hjem','Un tronc en laiton poli, sur le comptoir. Il tinte quand on le touche : il est plein.');return}
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
  tronc(g,x,y){g.fillStyle='#1a120d';g.fillRect(x+3,y+1,12,13);g.fillStyle='#c9a24a';g.fillRect(x+4,y+2,10,11);g.fillStyle='#e8c87a';g.fillRect(x+4,y+2,10,2);g.fillStyle='#1a120d';g.fillRect(x+6,y+5,6,1)},
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
