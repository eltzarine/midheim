/* ================= Journal de quêtes : histoire + sous-quêtes ================= */
// Chaque héros garde sa progression (hero.sq) ; les événements viennent des effets envoyés par l'hôte, donc ça marche à deux.
const SQ=[
  {id:'pont',nom:'Les veilleurs du Pont',from:'Le garde du Conseil',desc:'Des créatures rôdent autour de Tarkin et du Pont de Lathandre. Le Conseil demande de l’aide pour sécuriser la route.',type:'kill',reg:'tarkin',n:8,rw:{g:60,xp:80,rel:1},need:0},
  {id:'coffres',nom:'Trésors des Premiers Royaumes',from:'Un vieux cartographe de Tarkin',desc:'Des coffres des Premiers Royaumes sont cachés partout dans Midheim. Trouves-en cinq.',type:'chest',n:5,rw:{g:120,rel:1},need:0},
  {id:'camps',nom:'Feux de camp ennemis',from:'Le Conseil',desc:'Des bandes armées campent dans la nature. Disperse trois camps.',type:'camp',n:3,rw:{g:100,xp:160,sh:4,rel:1},need:0},
  {id:'forge',nom:'Le savoir du forgeron',from:'Le forgeron de Tarkin',desc:'Fais améliorer une arme ou une armure jusqu’à +2 dans une forge.',type:'upgrade',n:2,rw:{sh:6,xp:60,rel:1},need:0},
  {id:'libres',nom:'La paix des Royaumes Libres',from:'Les Modorn de Last Fire',desc:'Samarii et Modorn s’accusent des attaques sur les routes. Chasse les pillards des Royaumes Libres.',type:'kill',reg:'free',n:12,rw:{g:90,xp:140,sh:3,rel:1},need:1},
  {id:'chefs',nom:'La chasse aux chefs',from:'Les Modorn de Last Fire',desc:'Certains camps sont menés par un chef plus fort. Abats-en deux.',type:'elite',n:2,rw:{g:140,rel:1},need:1},
  {id:'voyage',nom:'La route de Midheim',from:'Virganth',desc:'Découvre huit lieux de Midheim pour pouvoir y voyager grâce au pendentif.',type:'wp',n:8,rw:{g:150,xp:200,rel:1},need:1},
  {id:'silver',nom:'Les ombres des Silverwoods',from:'Une chasseuse de Last Fire',desc:'Les rejetons pullulent dans les Silverwoods, là où erre Abhorash.',type:'kill',reg:'silver',n:12,rw:{g:120,xp:200,rel:1},need:2},
  {id:'pics',nom:'Les orcs des Pics Rouges',from:'Grinmir Thunderhammer',desc:'Les orcs qui assiègent Karaz Ankor pillent les Pics Rouges. Grinmir paiera chaque bande dispersée.',type:'kill',reg:'pics',n:15,rw:{g:200,xp:300,sh:6,rel:1},need:3},
  {id:'larme',nom:'Les adeptes de la Première Larme',from:'Virganth',desc:'Les adeptes d’Amarath cherchent l’antre de Virganth. Repousse-les hors des bois.',type:'kill',reg:'firsttear',n:15,rw:{g:220,xp:340,rel:1},need:4},
  {id:'oublies',nom:'Le silence des Monts Oubliés',from:'Une ermite des montagnes',desc:'Les marionnettes d’Amarath descendent des Monts Oubliés. Arrête-les avant qu’elles n’atteignent les villages.',type:'kill',reg:'oublies',n:15,rw:{g:260,xp:420,rel:1},need:5},
  {id:'echos',nom:'Les échos de la prison',from:'Virganth',desc:'Le sceau tient, mais les lieux de l’histoire sont plus dangereux. Termine deux donjons.',type:'dun',n:2,rw:{g:300,rel:1},need:6}];
const SQ_BY=Object.fromEntries(SQ.map(q=>[q.id,q]));
function sqActive(q){return hero.q>=q.need&&!(hero.sqd||[]).includes(q.id)}
function sqProg(id){return(hero.sq&&hero.sq[id])|0}
function questEvent(type,o){if(!hero||!G)return;o=o||{};hero.sq=hero.sq||{};let changed=false;
  for(const q of SQ){if(!sqActive(q)||q.type!==type)continue;if(q.reg&&o.reg!==q.reg)continue;
    const v=type==='upgrade'?Math.max(sqProg(q.id),o.v|0):type==='wp'?(hero.wp||[]).length:sqProg(q.id)+1;
    if(v===sqProg(q.id))continue;hero.sq[q.id]=Math.min(q.n,v);changed=true;
    if(hero.sq[q.id]>=q.n)questDone(q);else if(hero.track===q.id||q.n<=5)toast(q.nom+' : '+hero.sq[q.id]+'/'+q.n,'sq'+q.id)}
  if(changed)doSave(false)}
function questDone(q){hero.sqd=hero.sqd||[];if(hero.sqd.includes(q.id))return;hero.sqd.push(q.id);const r=q.rw;
  if(r.g)hero.gold+=r.g;if(r.sh)hero.sh+=r.sh;if(r.xp)giveXp(r.xp);let it=null;if(r.rel){it=makeRelic(q.id,hero.cls,hero.lvl+1);if(it)gotItem(it,true)}else if(r.item!=null)gotItem(genItem(1+Math.floor(Math.random()*99999),hero.lvl,r.item,hero.cls));
  if(hero.track===q.id)hero.track='main';doSave(true);QDone.push(q,it)}
function rwText(r){const o=[];if(r.g)o.push(r.g+' or');if(r.xp)o.push(r.xp+' XP');if(r.sh)o.push(r.sh+' éclats');if(r.item!=null)o.push('objet '+RAR[r.item].nom.toLowerCase());return o}
function relicName(qid){const D=RELICS[qid];return D?(D.nom||BASES[D.s][hero.cls][D.b]+D.suf):''}
// cible sur la carte pour la quête suivie
function questTarget(){const id=hero&&hero.track;if(!id||id==='main'||!WORLD||!G||!G.m||G.m.kind!=='world')return null;const q=SQ_BY[id];if(!q||!sqActive(q))return null;
  const tx=L.x/TS,ty=L.y/TS,near=(list)=>{let b=null,bd=1e9;for(const p of list){const d=(p.x-tx)**2+(p.y-ty)**2;if(d<bd){bd=d;b=p}}return b?{x:(b.x+.5)*TS,y:(b.y+.5)*TS}:null};
  if(q.type==='kill'){const rg=REGIONS.find(r=>r.id===q.reg);const inR=regionAt(Math.floor(tx),Math.floor(ty)).id===q.reg;
    if(inR){const c=near(WORLD.camps.filter((c,i)=>c.reg===q.reg&&(!G.camps[i]||G.camps[i].state!=='cleared')));if(c)return c}return{x:(rg.pt[0]+.5)*TS,y:(rg.pt[1]+.5)*TS}}
  if(q.type==='chest')return near(WORLD.chests.filter(c=>!G.wOpened.has(c.id)));
  if(q.type==='camp')return near(WORLD.camps.filter((c,i)=>!G.camps[i]||G.camps[i].state!=='cleared'));
  if(q.type==='elite')return near(WORLD.camps.filter((c,i)=>c.elite&&(!G.camps[i]||G.camps[i].state!=='cleared')));
  if(q.type==='upgrade')return near(WORLD.builds.filter(b=>b.kind==='forge').map(b=>({x:b.door.x,y:b.door.y})));
  if(q.type==='wp')return near(Object.keys(WAYPOINTS).filter(k=>!hero.wp.includes(k)).map(k=>({x:WAYPOINTS[k].pt[0],y:WAYPOINTS[k].pt[1]})));
  if(q.type==='dun')return near(WORLD.builds.filter(b=>b.act&&b.act.startsWith('dun:')).map(b=>({x:b.door.x,y:b.door.y})));return null}
function trackedText(){const id=hero.track;if(id&&id!=='main'){const q=SQ_BY[id];if(q&&sqActive(q))return[q.nom,q.desc.split('.')[0]+' : '+sqProg(q.id)+'/'+q.n]}return null}

/* ----- fenêtre du journal ----- */
function openQuests(){renderQuests();$('#questBox').hidden=false;if(mode==='solo')paused=true}
function closeQuests(){$('#questBox').hidden=true;if(mode==='solo')paused=!$('#pause').hidden||!$('#talents').hidden||!$('#storyBox').hidden||!$('#bagBox').hidden}
function renderQuests(){const box=$('#questList');box.textContent='';hero.track=hero.track||'main';
  const card=(id,title,from,desc,prog,n,rw,done)=>{const b=el('button','qcard'+(hero.track===id?' on':'')+(done?' done':''));b.setAttribute('aria-pressed',hero.track===id);
    const h=el('div','qh');h.append(el('b',null,title),el('span','qtag',done?'Terminée':hero.track===id?'Suivie':'Suivre'));b.append(h);if(from)b.append(el('small','qfrom',from));b.append(el('p',null,desc));
    if(n){const bar=el('div','qbar');const f=el('i');f.style.width=Math.round(prog/n*100)+'%';bar.append(f);const row=el('div','qrow');row.append(bar,el('span',null,prog+'/'+n));b.append(row)}
    if(rw){const r=el('div','qrw');r.append(el('span','qlab','Butins possibles'));if(rw.rel&&RELICS[id]){const c=el('span','chip relic','✦ '+relicName(id));c.style.color=RAR[4].col;r.append(c)}for(const t of rwText(rw)){const c=el('span','chip',t);if(/^objet/.test(t))c.style.color=RAR[rw.item].col;r.append(c)}b.append(r)}
    else if(done&&RELICS[id]){const r=el('div','qrw');const c=el('span','chip relic','✦ '+relicName(id)+' obtenue');c.style.color=RAR[4].col;r.append(c);b.append(r)}
    if(!done)b.onclick=()=>{hero.track=id;doSave(false);renderQuests();toast('Quête suivie : '+title+'. La flèche dorée t’y guide.')};return b};
  box.append(el('h3','qsec','Histoire'));
  const o=OBJ[Math.min(hero.q,6)];box.append(card('main','Les quatre pierres','Virganth, l’Éternel',o.t,stonesQ(hero.q),4,hero.q<6?{g:0,rel:1}:null,false));
  const act=SQ.filter(sqActive),done=SQ.filter(q=>(hero.sqd||[]).includes(q.id)),later=SQ.filter(q=>hero.q<q.need&&!(hero.sqd||[]).includes(q.id));
  box.append(el('h3','qsec','Sous-quêtes ('+act.length+')'));for(const q of act)box.append(card(q.id,q.nom,q.from,q.desc,sqProg(q.id),q.n,q.rw,false));
  if(later.length){const p=el('p','muted',later.length+' autre'+(later.length>1?'s':'')+' sous-quête'+(later.length>1?'s':'')+' se débloquer'+(later.length>1?'ont':'a')+' en avançant dans l’histoire.');box.append(p)}
  if(done.length){box.append(el('h3','qsec','Terminées'));for(const q of done)box.append(card(q.id,q.nom,q.from,q.desc,q.n,q.n,null,true))}}

/* ----- Animation de fin de quête : mise en avant des gains ----- */
const QDone={q:[],on:false,t:0,it:null,
  push(q,it){this.q.push([q,it]);if(typeof parts!=='undefined'&&L){parts.push({k:'ring',x:L.x,y:L.y,r:10,mr:120,life:.9,max:.9,col:RAR[4].col});sparks(L.x,L.y-10,RAR[4].col,30)}},
  tick(dt){if(this.on){this.t+=dt;if(mode==='solo')paused=true;else if(this.t>12)this.close();return}
    if(this.q.length&&!Scene.on&&$('#storyBox').hidden&&$('#bagBox').hidden)this.show(...this.q.shift())},
  show(q,it){this.on=true;this.t=0;this.it=it;const r=q.rw,box=$('#qdone');
    $('#qdName').textContent=q.nom;$('#qdFrom').textContent=q.from;
    const rel=$('#qdRelic');rel.hidden=!it;
    if(it){const c=$('#qdIcon');drawItemIcon(c,it);$('#qdRar').textContent=RAR[it.r].nom+' · '+SLOT_NOM[it.s];$('#qdItem').textContent=itemTitle(it);
      const ul=$('#qdLines');ul.textContent='';const pw=relicPower(it);if(pw)ul.append(el('li','pw','✦ '+pw));for(const l of itemLines(it).slice(0,3))ul.append(el('li',null,l));
      $('#qdLore').textContent=it.lore||''}
    const gl=$('#qdGains');gl.textContent='';const gains=[];if(r.g)gains.push(['or',r.g,'Or']);if(r.xp)gains.push(['xp',r.xp,'XP']);if(r.sh)gains.push(['sh',r.sh,'Éclats']);
    gains.forEach(([k,v,lab],i)=>{const d=el('div','qg '+k);const b=el('b',null,'+0');d.append(b,el('small',null,lab));d.style.animationDelay=(1.5+i*.15)+'s';gl.append(d);
      setTimeout(()=>{const t0=performance.now();const f=()=>{const p=Math.min(1,(performance.now()-t0)/700);b.textContent='+'+Math.round(v*(1-(1-p)**3));if(p<1)requestAnimationFrame(f);else Snd.play('coin')};f()},1500+i*150)});
    $('#qdEquip').hidden=!it;
    box.classList.remove('go');box.hidden=false;void box.offsetWidth;box.classList.add('go');
    const cf=$('#qdConf');cf.textContent='';for(let i=0;i<36;i++){const s=el('i');s.style.left=(Math.random()*100)+'%';s.style.animationDelay=(.5+Math.random()*1.1)+'s';s.style.animationDuration=(1.8+Math.random()*1.6)+'s';s.style.background=['#3fe0c8','#f0c95a','#ff8a4a','#efe6cf'][i%4];s.style.setProperty('--dx',(Math.random()*120-60)+'px');s.style.setProperty('--rz',(Math.random()*720-360)+'deg');cf.append(s)}
    Snd.play('lvl');setTimeout(()=>{if(this.on)Snd.play('chest')},650);
    if(typeof Voice!=='undefined'&&Voice.line)try{Voice.line('narrateur','Quête terminée. '+q.nom+'.')}catch(e){}},
  equip(){const i=hero.bag.indexOf(this.it);if(i>=0){equip(i);toast(itemTitle(this.it)+' équipée.');Snd.play('key')}this.close()},
  close(){if(!this.on)return;this.on=false;this.it=null;$('#qdone').hidden=true;$('#qdone').classList.remove('go');
    if(mode==='solo')paused=!$('#pause').hidden||!$('#talents').hidden||!$('#storyBox').hidden||!$('#bagBox').hidden||!$('#questBox').hidden}};
addEventListener('keydown',e=>{if(!QDone.on)return;if(e.key==='Enter'||e.key==='Escape'||e.key===' '){e.preventDefault();e.stopPropagation();QDone.close()}},true);
