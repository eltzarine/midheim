/* ================= Portraits supplémentaires ================= */
function drawPortrait(c,who){if(['garde','aubergiste','marchand','forgeron'].includes(who)){const g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);
    const gr=g.createRadialGradient(c.width/2,c.height*.4,6,c.width/2,c.height/2,c.width*.7);gr.addColorStop(0,'#3a5a62');gr.addColorStop(1,'#0c1418');g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);
    drawNPC(g,who,c.width/2,c.height*.68,0,c.width/30);return}
  drawPortraitBase(c,who)}
function showDialog(who,nom,text){const v=/^Porte|^Les Silverwoods/.test(nom)?'narrateur':who;const it=findInteract();Vig.say(v==='narrateur'?who:who,nom,text,{near:it?{x:it.x,y:it.y}:{x:L.x,y:L.y}})}

/* ================= Objets : icônes et sac ================= */
function drawItemIcon(c,it){const g=c.getContext('2d'),S=c.width;g.setTransform(S/40,0,0,S/40,0,0);g.clearRect(0,0,40,40);const col=RAR[it.r].col;
  g.fillStyle='#0c1418';g.fillRect(0,0,40,40);g.strokeStyle=col;g.lineWidth=2;g.strokeRect(1,1,38,38);
  if(it.r>=2){const gr=g.createRadialGradient(20,20,2,20,20,22);gr.addColorStop(0,col+'55');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,40,40)}
  g.lineCap='round';
  if(it.s==='arme'){const c2=it.c;
    if(c2==='mage'||(c2==='soigneur'&&it.b===2)){g.strokeStyle='#8a6034';g.lineWidth=3;g.beginPath();g.moveTo(10,32);g.lineTo(28,10);g.stroke();g.fillStyle=c2==='mage'?'#9fd0ff':'#ffe08a';g.beginPath();g.arc(29,9,5,0,6.28);g.fill()}
    else if(c2==='soigneur'){g.strokeStyle='#8a6034';g.lineWidth=3;g.beginPath();g.moveTo(10,32);g.lineTo(24,16);g.stroke();g.fillStyle='#d8d6e2';g.beginPath();g.arc(27,12,6,0,6.28);g.fill();g.fillStyle='#e0b45c';g.fillRect(25,6,4,12)}
    else if(c2==='voleur'){for(const o of[-5,5]){g.strokeStyle='#dfe6ee';g.lineWidth=2.5;g.beginPath();g.moveTo(14+o,30);g.lineTo(26+o,10);g.stroke();g.strokeStyle='#5a3e24';g.beginPath();g.moveTo(12+o,33);g.lineTo(15+o,28);g.stroke()}}
    else if(it.b===1){g.strokeStyle='#8a6034';g.lineWidth=3;g.beginPath();g.moveTo(12,33);g.lineTo(27,10);g.stroke();g.fillStyle='#c9c7d4';g.beginPath();g.moveTo(24,8);g.quadraticCurveTo(36,10,32,22);g.lineTo(26,16);g.closePath();g.fill()}
    else if(it.b===2){g.strokeStyle='#8a6034';g.lineWidth=3;g.beginPath();g.moveTo(12,33);g.lineTo(26,12);g.stroke();g.fillStyle='#9a9aa8';g.fillRect(20,4,14,10)}
    else{g.strokeStyle='#e9e9f1';g.lineWidth=4;g.beginPath();g.moveTo(12,30);g.lineTo(30,8);g.stroke();g.strokeStyle='#d6b04a';g.lineWidth=3;g.beginPath();g.moveTo(9,25);g.lineTo(17,33);g.stroke()}}
  else if(it.s==='armure'){const cc={guerrier:'#9a9aa8',mage:'#3d5fb4',voleur:'#5a3e24',soigneur:'#efe6cf'}[it.c];g.fillStyle=cc;g.beginPath();g.moveTo(10,10);g.lineTo(16,7);g.lineTo(20,11);g.lineTo(24,7);g.lineTo(30,10);g.lineTo(32,20);g.lineTo(28,20);g.lineTo(28,33);g.lineTo(12,33);g.lineTo(12,20);g.lineTo(8,20);g.closePath();g.fill();g.fillStyle='rgba(255,255,255,.18)';g.fillRect(14,12,4,18)}
  else{g.strokeStyle='#e0b45c';g.lineWidth=2;if(it.b===1){g.beginPath();g.arc(20,22,8,0,6.28);g.stroke()}else{g.beginPath();g.moveTo(10,8);g.quadraticCurveTo(20,20,30,8);g.stroke()}g.fillStyle=col;g.beginPath();g.moveTo(20,16);g.lineTo(25,22);g.lineTo(20,30);g.lineTo(15,22);g.closePath();g.fill()}
  if(it.e){g.fillStyle='#ffd27a';g.beginPath();g.arc(33,33,4,0,6.28);g.fill()}
  if(it.rq){g.fillStyle=col;g.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rr=k%2?2.4:5.6;g.lineTo(33+Math.cos(a)*rr,8+Math.sin(a)*rr)}g.closePath();g.fill()}
  if(it.u){g.font='700 10px system-ui';g.fillStyle='#fff';g.textAlign='left';g.fillText('+'+it.u,3,37)}}
function gotItem(it,quiet){if(it.rq){hero.bag.push(it);UI.newItems++;if(!quiet)toast('Relique : '+itemTitle(it));doSave(false);return}if(hero.bag.length>=BAG_MAX){const p=sellPrice(it);hero.gold+=p;toast('Sac plein : '+itemTitle(it)+' vendu '+p+' or.');return}
  hero.bag.push(it);UI.newItems++;toast('Butin : '+itemTitle(it)+' ('+RAR[it.r].nom.toLowerCase()+')');Snd.play('chest');doSave(false)}
const UI={mode:'bag',tab:0,sel:null,newItems:0,town:'',stock:null,stockKey:''};
function openBag(){UI.mode='bag';UI.tab=0;UI.sel=null;UI.newItems=0;renderBag();$('#bagBox').hidden=false;if(mode==='solo')paused=true}
function openTrade(kind,town){greet(kind);UI.mode=kind;UI.tab=0;UI.sel=null;UI.town=town||'';renderBag();$('#bagBox').hidden=false;if(mode==='solo')paused=true}
function closeBag(){$('#bagBox').hidden=true;if(mode==='solo')paused=!$('#pause').hidden||!$('#talents').hidden||!$('#storyBox').hidden;refreshStats();doSave(true)}
function shopStock(){const key=UI.town+':'+hero.lvl+':'+Math.floor((G?G.time:0)/300);if(UI.stockKey===key&&UI.stock)return UI.stock;const R=mulberry(hashStr(key));const best=['cibellos','ironhaven','honor'].includes(UI.town);
  UI.stock=[];for(let i=0;i<4;i++){const r=R()<(best?.18:.06)?2:R()<.4?1:0;UI.stock.push(genItem(1+Math.floor(R()*99999),Math.max(1,hero.lvl+(best?1:0)),r,hero.cls,SLOTS[i%3]))}UI.stockKey=key;return UI.stock}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function selItem(){const s=UI.sel;if(!s)return null;if(s.src==='eq')return hero.eq[s.key];if(s.src==='bag')return hero.bag[s.key];if(s.src==='shop')return shopStock()[s.key];return null}
function statLine(lbl,val){const s=el('span');s.append(el('i',null,lbl),el('b',null,val));return s}
function renderBag(){const box=$('#bagMain');box.textContent='';const tabs=$('#bagTabs');tabs.textContent='';
  const titles={bag:'Équipement',marchand:'Marchand',forge:'Forge',auberge:'Auberge'};$('#bagTitle').textContent=titles[UI.mode]||'Équipement';
  $('#bagGold').textContent=hero.gold+' or · '+hero.sh+' éclat'+(hero.sh>1?'s':'');
  const T={marchand:['Acheter','Vendre'],forge:['Améliorer','Enchanter','Recycler']}[UI.mode];
  if(T)T.forEach((t,i)=>{const b=el('button',null,t);b.setAttribute('aria-selected',i===UI.tab);b.onclick=()=>{UI.tab=i;UI.sel=null;renderBag()};tabs.append(b)});
  if(UI.mode==='auberge'){box.append(el('p','muted','L’aubergiste vous sert une soupe chaude. Ici, on se repose et on repart soigné. Si le groupe tombe au combat, il se relève au lieu découvert le plus proche.'));
    const b=el('button','btn main','Se reposer (gratuit)');b.onclick=()=>{hero.pot=Math.max(hero.pot,3);requestAct('rest');toast('Le groupe se repose. Potions : '+hero.pot+'.');doSave(true);closeBag()};box.append(b);return}
  // emplacements équipés
  const eq=el('div','eq');for(const s of SLOTS){const it=hero.eq[s];const b=el('button','slotc');if(UI.sel&&UI.sel.src==='eq'&&UI.sel.key===s)b.classList.add('selc');
    const c=el('canvas');c.width=80;c.height=80;if(it)drawItemIcon(c,it);else{const g=c.getContext('2d');g.fillStyle='#0c1418';g.fillRect(0,0,80,80);g.strokeStyle='#4b6a70';g.setLineDash([6,6]);g.strokeRect(4,4,72,72)}
    b.append(el('small',null,SLOT_NOM[s]),c,el('b',null,it?itemTitle(it):'Vide'));if(it){b.style.setProperty('--rc',RAR[it.r].col);b.querySelector('b').style.color=RAR[it.r].col}
    b.onclick=()=>{UI.sel=it?{src:'eq',key:s}:null;renderBag()};eq.append(b)}
  const showEq=!(UI.mode==='marchand'&&UI.tab===0)&&!(UI.mode==='forge'&&UI.tab===2);if(showEq)box.append(eq);
  if(UI.mode==='bag'){const st=el('div','stats');const S=ST;st.append(statLine('Points de vie',S.mhp),statLine('Dégâts',Math.round(S.dmg)),statLine('Armure',Math.round(S.arm*100)+' %'),statLine('Critique',Math.round(S.crit*100)+' %'),
      statLine('Recharge',Math.round((1-S.cdm)*100)+' %'),statLine('Vitesse',Math.round(S.spd)),statLine('Vol de vie',Math.round(S.vol*100)+' %'),statLine('Régén.',(+S.reg).toFixed(1)+' PV/s'));
    if(S.we)st.append(statLine('Arme',enchOf('arme',S.we).nom));if(S.ae)st.append(statLine('Armure',enchOf('armure',S.ae).nom));box.append(st)}
  // liste
  const shop=UI.mode==='marchand'&&UI.tab===0;
  const list=shop?shopStock():hero.bag;const lab=el('p','lab',shop?'À vendre':'Sac ('+hero.bag.length+'/'+BAG_MAX+')');lab.style.margin='4px 0 0';box.append(lab);
  const grid=el('div','bag');
  if(shop){const pb=el('button','itc');const c=el('canvas');c.width=80;c.height=80;const g=c.getContext('2d');g.fillStyle='#0c1418';g.fillRect(0,0,80,80);g.fillStyle='#c8483c';g.beginPath();g.arc(40,46,18,0,6.28);g.fill();g.fillStyle='#8a6a3a';g.fillRect(34,18,12,10);
    pb.append(c,el('small',null,'Potion · 25 or'));pb.onclick=()=>{if(hero.pot>=POT_MAX){toast('Tu as déjà '+POT_MAX+' potions.');return}if(hero.gold<25){toast('Pas assez d’or.');return}hero.gold-=25;hero.pot++;Snd.play('coin');renderBag()};grid.append(pb)}
  list.forEach((it,i)=>{const b=el('button','itc');b.style.setProperty('--rc',RAR[it.r].col);const src=shop?'shop':'bag';if(UI.sel&&UI.sel.src===src&&UI.sel.key===i)b.classList.add('selc');
    const c=el('canvas');c.width=80;c.height=80;drawItemIcon(c,it);b.append(c,el('small',null,shop?buyPrice(it)+' or':'Niv '+it.l));b.title=itemTitle(it);b.onclick=()=>{UI.sel={src,key:i};renderBag()};grid.append(b)});
  if(!list.length&&!shop)grid.append(el('p','muted','Le sac est vide. Les monstres, les coffres et les marchands t’en donneront.'));
  box.append(grid);
  const it=selItem();if(it)box.append(itemDetail(it))}
function itemDetail(it){const d=el('div','detail');d.style.setProperty('--rc',RAR[it.r].col);
  d.append(el('h4',null,itemTitle(it)));d.append(el('p','muted',RAR[it.r].nom+' · '+SLOT_NOM[it.s]+' · niveau '+it.l+(it.u?' · amélioré +'+it.u:'')));
  const ul=el('ul');for(const l of itemLines(it))ul.append(el('li',null,l));if(it.sp)ul.append(el('li','ench',SP[it.sp]));if(it.e){const e=enchOf(it.s,it.e);ul.append(el('li','ench',e.nom+' : '+e.desc))}d.append(ul);if(it.lore)d.append(el('p','lore',it.lore));
  // comparaison
  const cur=hero.eq[it.s];if(UI.sel.src!=='eq'&&cur!==it){const save=hero.eq[it.s];const a=derive(hero);hero.eq[it.s]=it;const b=derive(hero);hero.eq[it.s]=save;
    const diffs=[['PV',b.mhp-a.mhp,0],['Dégâts',b.dmg-a.dmg,0],['Armure',(b.arm-a.arm)*100,1],['Critique',(b.crit-a.crit)*100,1],['Recharge',(a.cdm-b.cdm)*100,1],['Vitesse',b.spd-a.spd,0],['Vol de vie',(b.vol-a.vol)*100,1],['Régén.',b.reg-a.reg,1]].filter(x=>Math.abs(x[1])>=.05);
    if(diffs.length){const cl=el('ul');for(const[n,v,dec]of diffs){cl.append(el('li',v>0?'up':'dn',(v>0?'+':'')+(dec?v.toFixed(1):Math.round(v))+(dec&&n!=='Régén.'?' %':'')+' '+n))}d.append(el('p','muted','Par rapport à ton équipement :'),cl)}}
  const row=el('div','row');const btn=(t,f,cls,dis)=>{const b=el('button','btn sm'+(cls?' '+cls:''),t);b.disabled=!!dis;b.onclick=f;row.append(b);return b};
  const s=UI.sel;
  if(UI.mode==='bag'){if(s.src==='bag'){btn('Équiper',()=>equip(s.key),'main');btn('Jeter',()=>{hero.bag.splice(s.key,1);UI.sel=null;renderBag()})}}
  else if(UI.mode==='marchand'){if(s.src==='shop')btn('Acheter · '+buyPrice(it)+' or',()=>{if(hero.bag.length>=BAG_MAX){toast('Sac plein.');return}if(hero.gold<buyPrice(it)){toast('Pas assez d’or.');return}hero.gold-=buyPrice(it);hero.bag.push(it);shopStock().splice(s.key,1);UI.sel=null;Snd.play('coin');renderBag()},'main');
    else if(s.src==='bag')btn('Vendre · '+sellPrice(it)+' or',()=>{hero.gold+=sellPrice(it);hero.bag.splice(s.key,1);UI.sel=null;Snd.play('coin');renderBag()},'main');
    if(s.src==='bag')btn('Équiper',()=>equip(s.key))}
  else if(UI.mode==='forge'){
    if(UI.tab===0){const c=upCost(it);btn(it.u>=5?'Amélioration maximale':'Améliorer +'+((it.u||0)+1)+' · '+c+' or',()=>{if(hero.gold<c){toast('Pas assez d’or.');return}hero.gold-=c;it.u=(it.u||0)+1;Snd.play('lvl');questEvent('upgrade',{v:it.u});refreshStats();renderBag()},'main',it.u>=5)}
    else if(UI.tab===1){if(it.rq)d.append(el('p','muted','Relique : son pouvoir fait partie de l’objet et ne peut pas être changé.'));else if(it.s==='talisman')d.append(el('p','muted','Les talismans ne s’enchantent pas.'));else{const c=enchCost(it);const box=el('div','enchs');
      for(const e of ENCH[it.s]){const ok=hero.q>=e.q;const b=el('button');b.append(el('b',null,e.nom),el('small',null,ok?e.desc+' · '+c.g+' or, '+c.s+' éclats':'Se débloque avec '+STONES[[0,0,0,1,2,3][e.q]||0][0]+'.'));b.disabled=!ok||it.e===e.id;
        b.onclick=()=>{if(hero.gold<c.g||hero.sh<c.s){toast('Il faut '+c.g+' or et '+c.s+' éclats.');return}hero.gold-=c.g;hero.sh-=c.s;it.e=e.id;Snd.play('key');toast(itemTitle(it)+' : '+e.nom+'.');refreshStats();renderBag()};box.append(b)}
      d.append(el('p','muted','Un seul enchantement par objet. Le nouveau remplace l’ancien.'),box)}}
    else if(UI.tab===2&&s.src==='bag')btn('Recycler · +'+salvage(it)+' éclats',()=>{hero.sh+=salvage(it);hero.bag.splice(s.key,1);UI.sel=null;Snd.play('chest');renderBag()},'main')}
  if(row.children.length)d.append(row);return d}
function equip(i){const it=hero.bag[i];if(!it)return;const old=hero.eq[it.s];hero.eq[it.s]=it;hero.bag.splice(i,1);if(old)hero.bag.push(old);UI.sel={src:'eq',key:it.s};refreshStats();Snd.play('key');renderBag()}

/* ================= Carte plein écran et voyage rapide ================= */
function pctOf(tx,ty){return[(tx+.5)/WORLD.W*100,(ty+.5)/WORLD.H*100]}
function mark(box,cls,x,y,c){const m=el('div','mk '+cls);m.style.left=x+'%';m.style.top=y+'%';if(c)m.style.setProperty('--c',c);box.append(m);return m}
function openMap(){$('#mapSky').innerHTML=skyLine();const box=$('#bigMarks');box.textContent='';const inWorld=G&&G.m&&G.m.kind==='world';
  for(const k of Object.keys(WAYPOINTS)){const w=WAYPOINTS[k],[x,y]=pctOf(w.pt[0],w.pt[1]);const known=hero.wp.includes(k);const b=el('button','mk wp'+(known?'':' off'),known?'◆':'?');b.style.left=x+'%';b.style.top=y+'%';b.title=w.nom;b.setAttribute('aria-label',(known?'Voyager vers ':'Lieu inconnu : ')+w.nom);
    b.onclick=()=>travel(k);box.append(b)}
  const o=objTarget();if(o){const[x,y]=pctOf(o.x/TS-.5,o.y/TS-.5);mark(box,'obj',x,y)}
  if(G&&G.players)G.players.forEach((p,i)=>{let px=i===myIdx?{x:L.x,y:L.y}:{x:p.x,y:p.y};if(!inWorld){const r=G.m.exitTo||(G.dun&&G.dun.ret);if(r)px=r}const[x,y]=pctOf(px.x/TS-.5,px.y/TS-.5);mark(box,'me',x,y,CLS[p.cls].col)});
  $('#mapNote').textContent=mode==='guest'?'Seul l’hôte de la partie peut lancer un voyage rapide.':inWorld?'Les losanges sont les lieux découverts : touche-en un pour y voyager. Le cercle doré est ton objectif.':'Sors d’abord du bâtiment pour voyager.';
  $('#mapBox').hidden=false;if(mode==='solo')paused=true}
function travel(k){if(mode==='guest'||!G.m||G.m.kind!=='world')return;if(G.enemies.some(e=>e.act&&Math.hypot(e.x-L.x,e.y-L.y)<12*TS)){$('#mapBox').hidden=true;if(mode==='solo')paused=false;toast('Impossible de voyager en plein combat.');return}
  const w=WAYPOINTS[k];const p=worldFree(w.pt[0],w.pt[1]+2);$('#mapBox').hidden=true;paused=false;hostEnter('w',p);showLoading(w.nom,'Voyage rapide')}

/* ================= HUD ================= */
let hudT=0,miniT=0;
function buildSkillUI(){if(!ST)return;const ks=ST.ks,cc=CLS[hero.cls].col;$('#bAtk').querySelector('.ic').innerHTML=iconSvg('atk_'+hero.cls,'#fff6e8');$('#bAtk').setAttribute('aria-label','Attaque : '+CLS[hero.cls].atk);
  ['bS1','bS2','bS3','bUlt'].forEach((id,i)=>{const b=$('#'+id),S=SK[ks[i]];b.hidden=!S;if(!S)return;if(i<3)b.style.setProperty('--c',cc);b.querySelector('.ic').innerHTML=iconSvg(ks[i],'#fff6e8');b.querySelector('.k').textContent=S.court;b.setAttribute('aria-label',S.nom)});
  const pp=$('#mePas');if(pp){pp.hidden=!ST.pa;if(ST.pa)pp.textContent='Passif : '+SK[ST.pa].nom}
  const bar=$('#skillbar');bar.textContent='';const keysL=['1','2','3','R'];
  ks.forEach((id,i)=>{const s=SK[id];if(!s)return;const d=el('div','sk'+(s.t==='u'?' ult':''));d.id='sk'+i;const ic=el('i','ic');ic.innerHTML=iconSvg(id,s.t==='u'?'#f0c95a':cc);d.append(el('em',null,keysL[i]),ic,el('span',null,s.court));d.title=s.nom+' : '+s.desc;d.onclick=()=>{skQ[i]=true};bar.append(d)});
  if(ST.pa){const s=SK[ST.pa],d=el('div','sk pas');const ic=el('i','ic');ic.innerHTML=iconSvg(ST.pa,'#9ff08a');d.append(el('em',null,'P'),ic,el('span',null,s.court));d.title='Passif · '+s.nom+' : '+s.desc;bar.append(d)}
  const pd=el('div','sk');pd.id='skPot';pd.append(el('em',null,'E'),el('span',null,'Potion'));pd.onclick=()=>{potQ=true};bar.append(pd);buildBar()}
/* barre de combat : attaque, 3 compétences, ultime, potion ; les compétences partent vers la cible (ou l'ennemi le plus proche) */
function buildBar(){const bar=$('#hbar');if(!bar)return;const be=$('#bEnd');bar.textContent='';const ks=ST.ks,cc=CLS[hero.cls].col;
  const mk=(key,label,col,cls)=>{const b=el('button','hb'+(cls?' '+cls:''));b.type='button';b.dataset.k=key;b.append(el('i','ic'),el('b',null,label),el('small',null,''),el('span','cdn',''));if(col)b.style.setProperty('--c',col);bar.append(b);return b},ic=b=>b.querySelector('.ic');
  {const b=mk('atk',CLS[hero.cls].atk,'#c8483c');ic(b).innerHTML=iconSvg('atk_'+hero.cls,'#fff6e8');b.setAttribute('aria-label','Attaque : '+CLS[hero.cls].atk)}
  for(let i=0;i<3;i++){const S=SK[ks[i]];const b=S?mk('s'+i,S.court,cc):mk('s'+i,'—',null,'lock');if(S)ic(b).innerHTML=iconSvg(ks[i],'#fff6e8');b.setAttribute('aria-label',S?S.nom:'Compétence à apprendre')}
  {const S=SK[ks[3]];const b=S?mk('ult',S.court,'#f0c95a','ult'):mk('ult','Ultime',null,'ult lock');if(S)ic(b).innerHTML=iconSvg(ks[3],'#f0c95a');b.setAttribute('aria-label',S?'Ultime : '+S.nom:'Ultime à apprendre')}
  {const b=mk('pot','Potion','#8fb357');ic(b).innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2h6v2h-1v4.2c3 1 5 3.7 5 6.8a7 7 0 01-14 0c0-3.1 2-5.8 5-6.8V4H9z" fill="#c8e8a0"/></svg>';b.setAttribute('aria-label','Potion')}
  // au combat seulement : Foncer (2 points d'action, déplacement doublé) ; « Fin du tour » se range au bout de la barre
  {const b=mk('dash','Foncer','#3c7aa0','cbo');ic(b).innerHTML='<svg viewBox="0 0 26 24" aria-hidden="true"><path d="M3 6l6 6-6 6M11 6l6 6-6 6M19 6l4 6-4 6" fill="none" stroke="#bfe2ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';b.setAttribute('aria-label','Foncer : 2 actions, déplacement doublé')}
  for(const b of bar.children){const k=b.dataset.k;
    b.addEventListener('pointerdown',e=>{Snd.init();touch.on=true;b.classList.add('on');try{b.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault();
      if(k==='atk'){if(tbMe())atkQ=true;else touch.atk=true}else if(k==='pot')potQ=true;else if(k==='dash')tbDash();else skQ[k==='ult'?3:+k.slice(1)]=true});
    const up=()=>{b.classList.remove('on');if(k==='atk')touch.atk=false};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up)}
  if(be)bar.append(be)}
/* état de chaque bouton : coût, recharge (en tours au combat), portée sur la cible */
function barHud(){const bar=hq('#hbar');if(!bar||!bar.children.length)return;
  {const h=hq('#pvHint'),on=!!(L.pv&&pvOn());setHid(h,!on);if(on){const i=L.pv==='atk'?-1:L.pv==='ult'?3:+L.pv.slice(1),nm=i<0?CLS[hero.cls].atk:(SK[ST.ks[i]]||{}).court||'';setTxt(h,'Aperçu : touche encore « '+nm+' » pour agir · touche ailleurs pour annuler')}}const inTb=tbMe(),t=tbAimAt(),ks=ST.ks;
  for(const b of bar.children){const k=b.dataset.k;if(!k)continue;let sub='',hot=false,far=false,off=false,cd=0,cdn='';
    if(k==='dash'){sub=TB_DASH+' actions';off=!tbCanAct(TB_DASH)}
    else if(k==='atk'){const r=t?inReach('atk',t):false;sub=inTb?'1 action':'';if(t&&!r){far=true;sub='trop loin'}hot=!!(t&&r);off=inTb&&!tbCanAct()}
    else if(k==='pot'){sub='× '+hero.pot;off=hero.pot<=0||inTb&&!tbCanPot()}
    else{const i=k==='ult'?3:+k.slice(1),id=ks[i],S=SK[id];if(!S)continue;
      if(S.t==='u'){const rd=L.ult>=100;b.classList.toggle('ready',rd);sub=rd?(inTb?'2 actions':'prête'):Math.floor(L.ult)+' %';cd=rd?0:1-L.ult/100;off=inTb&&!tbCanAct(2)}
      else if(L.cd[i]>0){cd=clamp(L.cd[i]/(S.cd*ST.cdm),0,1);cdn=inTb?String(tbTurns(L.cd[i])):String(Math.ceil(L.cd[i]));sub=inTb?'tour'+(tbTurns(L.cd[i])>1?'s':''):'s'}
      else if(L.mp<S.mp){sub='mana';off=true}
      else{sub=S.mp+' mana';off=inTb&&!tbCanAct(1)}
      if(!cdn&&(S.t!=='u'||L.ult>=100)){const r=inReach(id,t);if(r===false){far=true;sub='trop loin'}else if(r===true)hot=true}}
    const pv=L.pv===k;if(pv)sub='Valider';b.classList.toggle('pv',pv);
    b.classList.toggle('hot',hot&&!off);b.classList.toggle('far',far);b.classList.toggle('off',off);setTxt(b.querySelector('small'),sub);setTxt(b.querySelector('.cdn'),cdn);setCss(b,'--cd',cd.toFixed(3))}}
/* pastille heure + météo sous la mini-carte */
function skyTag(){const t=$('#skyTag'),mi=$('#mini');if(!t||!mi)return;const out=G&&G.m&&G.m.kind==='world';t.hidden=!out;if(!out)return;
  const nt=Sky.isNight(),key=Sky.label()+Sky.weatherName()+Sky.moon+(Sky.hour<5.5||Sky.hour>=21)+nt;if(t.dataset.k!==key){t.dataset.k=key;t.innerHTML=Sky.icon()+'<span>'+Sky.label()+'</span>'+(nt?'<span class="x4">×4</span>':'');t.classList.toggle('danger',nt)}
  // la pastille se pose sur le haut de la mini-carte (placée à droite, sous l'en-tête en portrait) ; les messages restent à sa gauche
  const hudEl=$('#hud'),hr=hudEl.getBoundingClientRect(),mr=mi.getBoundingClientRect();if(!mr.width)return;hudEl.style.setProperty('--miniR',(hr.right-mr.left+8)+'px');
  const l=mr.left-hr.left+mr.width/2-t.offsetWidth/2,tp=mr.top-hr.top-8;t.style.left=Math.round(Math.max(4,l))+'px';t.style.top=Math.round(Math.max(2,tp))+'px'}
/* fiche détaillée de ton héros, tant que tu restes appuyé sur ta fiche (nom et barres) : vie, mana, ultime,
   effets en cours avec ce qu'ils font, passif, et tes chiffres (dégâts, armure, critiques, vitesse ; points d'action au combat) */
function meEffects(me){const inTb=tbMe(),d=s=>inTb?tbTurns(s):Math.ceil(s),u=n=>n===''?'':inTb?' · '+n+' tour'+(n>1?'s':''):' · '+n+' s',fx=[];
  if((me.shield||me.sh||0)>0)fx.push(['Bouclier','#f0c95a',me.shieldT>0?d(me.shieldT):'','absorbe encore '+Math.round(me.shield||me.sh)+' dégâts']);
  if(L.rageT>0)fx.push(['Rage','#e0644c',d(L.rageT),'+50 % de dégâts et de vitesse d’attaque']);
  if(L.stealthT>0)fx.push(['Disparition','#c9a2ff',d(L.stealthT),'les ennemis te perdent de vue']);
  if(L.buffT>0&&hero.cls==='voleur')fx.push(['Prochain coup renforcé','#ffe08a',d(L.buffT),'ton prochain coup frappe plus fort']);
  return fx.map(f=>(f.push(u(f[2])),f))}
function meBigHud(me){const box=hq('#meBig'),on=!!(L.meBig&&me);setHid(box,!on);if(!on){if(!L.tgtBig)setHid(hq('#tgtVeil'),true);return}setHid(hq('#tgtVeil'),false);
  const inTb=tbMe(),pa=ST.pa&&SK[ST.pa],key=[Math.round(me.hp),Math.round(L.mp),Math.floor(L.ult),hero.lvl,inTb?tbAP()+':'+Math.round(L.tbMv/TS*10):'',meEffects(me).map(f=>f[0]+f[2]).join()].join('|');
  if(box._k===key)return;box._k=key;box.textContent='';
  const h=el('h4',null,myName+' · '+CLS[hero.cls].nom);h.append(el('small',null,'Niv '+hero.lvl));box.append(h);
  const row=(lab,f,txt,cls)=>{const r=el('div','mbr'),b=el('div','bar '+(cls||'')),i=el('i');i.style.width=(clamp(f,0,1)*100).toFixed(1)+'%';b.append(i);r.append(el('span',null,lab),b,el('span',null,txt));box.append(r)};
  row('PV',me.hp/me.mhp,Math.round(me.hp)+' / '+me.mhp,'hp');row('Mana',L.mp/ST.mmp,Math.round(L.mp)+' / '+Math.round(ST.mmp),'mp');
  if(ST.ks[3])row('Ultime',L.ult/100,Math.floor(L.ult)+' %','ul');
  const fx=meEffects(me);if(fx.length||pa)box.append(el('hr'));
  for(const f of fx){const r=el('div','mfx'),c=el('i','fxc',String(f[2]));c.style.setProperty('--c',f[1]);r.style.setProperty('--c',f[1]);const t=el('span');t.append(el('b',null,f[0]),document.createTextNode(f[4]+' · '+f[3]));r.append(c,t);box.append(r)}
  if(pa){const r=el('div','mfx'),c=el('i','fxc','P');c.style.setProperty('--c','#9ff08a');r.style.setProperty('--c','#9ff08a');const t=el('span');t.append(el('b',null,'Passif · '+pa.nom),document.createTextNode(' · '+pa.desc));r.append(c,t);box.append(r)}
  box.append(el('hr'));const st=el('div','mst'),sv=(k,v)=>{const s=el('span',null,k+' ');s.append(el('b',null,v));st.append(s)};
  sv('Dégâts',String(Math.round(ST.dmg*(inTb?TB_DMG:1))));sv('Armure',Math.round(ST.arm*100)+' %');sv('Critiques',Math.round(ST.crit*100)+' %');sv('Vitesse',String(Math.round(ST.spd)));
  if(inTb){sv('Actions',tbAP()+' / '+tbPA(myIdx));sv('Déplacement',(L.tbMv/TS).toFixed(1).replace('.',',')+' cases')}else sv('Actions au combat',String(tbPA(myIdx)));
  box.append(st)}
/* pastilles des effets sur ton héros (bouclier, rage, disparition, passif) : durée en tours au combat, en secondes sinon */
function meFx(me){const box=hq('#meFx');if(!box||!me)return;const inTb=tbMe(),d=s=>inTb?tbTurns(s):Math.ceil(s),fx=[];
  if((me.shield||me.sh||0)>0)fx.push(['Bouclier','#f0c95a',me.shieldT>0?d(me.shieldT):'']);if(L.rageT>0)fx.push(['Rage','#e0644c',d(L.rageT)]);
  if(L.stealthT>0)fx.push(['Disparition','#c9a2ff',d(L.stealthT)]);if(L.buffT>0&&hero.cls==='voleur')fx.push(['Prochain coup renforcé','#ffe08a',d(L.buffT)]);
  if(ST.pa)fx.push(['Passif : '+SK[ST.pa].nom,'#9ff08a','P']);
  const key=fx.map(f=>f.join(':')).join('|');if(box._k===key)return;box._k=key;box.textContent='';
  for(const f of fx){const i=el('i','fxc',String(f[2]));i.style.setProperty('--c',f[1]);i.title=f[0]+(f[2]&&f[2]!=='P'?' · '+f[2]+(inTb?' tour'+(f[2]>1?'s':''):' s'):'');i.setAttribute('role','listitem');i.setAttribute('aria-label',i.title);box.append(i)}}
function skyLine(){const night=Sky.hour<5.5||Sky.hour>=21;
  return'<span>'+Sky.icon()+'<b>Jour '+Sky.day+' · '+Sky.label()+'</b> <span class="dim">'+Sky.clock()+'</span></span>'
    +'<span>'+skyIcon(Sky.rain>.5?(Sky.storm>.5?'orage':'pluie'):Sky.fog>.3?'brume':Sky.cloud>.5?'nuages':'soleil')+Sky.weatherName()+'</span>'
    +'<span>'+skyIcon('lune',Sky.moon)+(night?MOON[Sky.moon]:Sky.nextFull())+'</span>'
    +(Sky.isNight()?'<span style="color:#ff9a8a"><b>Nuit : ennemis 4 fois plus forts</b></span>':'<span class="dim">La nuit (21 h 30 – 5 h), les ennemis sont 4 fois plus forts</span>')}
/* Le HUD est rafraîchi 10 fois par seconde : on n'écrit dans la page que ce qui a changé
   (chaque écriture inutile oblige le navigateur à recalculer la mise en page sur téléphone). */
const hq=s=>hq.c[s]||(hq.c[s]=$(s));hq.c={};
const setTxt=(e,v)=>{v=String(v);if(e&&e._t!==v){e._t=v;e.textContent=v}};
const setCss=(e,k,v)=>{v=String(v);const m=e&&(e._c||(e._c={}));if(e&&m[k]!==v){m[k]=v;e.style.setProperty(k,v)}};
const setW=(e,f)=>setCss(e,'width',(clamp(f,0,1)*100).toFixed(1)+'%');
const setHid=(e,h)=>{h=!!h;if(e&&e.hidden!==h)e.hidden=h};
function hud(dt){hudT-=dt;miniT-=dt;if(miniT<=0){miniT=.2;drawMini();skyTag()}if(hudT>0)return;hudT=.1;const me=myP();if(!me)return;
  setTxt(hq('#meName'),myName+' · '+CLS[hero.cls].nom);setTxt(hq('#meLvl'),'Niv '+hero.lvl);
  setW(hq('#meHp'),me.hp/me.mhp);setW(hq('#meSh'),(me.sh||me.shield||0)/me.mhp);setW(hq('#meMp'),L.mp/ST.mmp);setW(hq('#meXp'),hero.lvl>=LVL_MAX?1:hero.xp/xpNeed(hero.lvl));
  const oi=myIdx===0?1:0,o=G.players[oi];
  // l'allié : une petite vignette carrée à droite de ta fiche (comme celles de l'ordre des tours)
  {const ca=hq('#cAlly');ca.classList.toggle('none',!o);ca.classList.toggle('dn',!!(o&&o.down));ca.classList.toggle('fight',!!(o&&G.cb&&G.cb.in[oi]&&!tbMe()));
  if(o){setTxt(hq('#alName'),o.name);setCss(hq('#alFig'),'--c',CLS[o.cls].col);setHid(hq('#alBar'),false);setW(hq('#alHp'),o.hp/o.mhp);setTxt(hq('#alSt'),o.down?'À terre':G.cb&&G.cb.in[oi]&&!tbMe()?'Au combat':'');
    ca.setAttribute('aria-label',o.name+', '+CLS[o.cls].nom+', '+(o.down?'à terre : va le relever':Math.round(o.hp)+' sur '+o.mhp+' PV'))}
  else{setTxt(hq('#alName'),'');setHid(hq('#alBar'),true);setTxt(hq('#alSt'),room&&netOn?'Place libre':'Seul');ca.setAttribute('aria-label',room&&netOn?'Place libre : un 2ᵉ joueur peut te rejoindre':'Seul dans Midheim')}}
  meFx(me);meBigHud(me);
  const boss=G.enemies.find(e=>e.type==='boss');setHid(hq('#bossBox'),!boss);if(boss){setTxt(hq('#bossName'),BOSSES[boss.bv??0].nom+(boss.bv===5?' · régénère':''));setW(hq('#bossHp'),(boss.hpP!=null?boss.hpP:boss.hp/boss.mhp*100)/100)}
  const m=G.m;let obj;if(m.kind==='dun'){obj=goalText()}
  else if(m.kind==='house')obj='Parle à l’habitant ou sors par la porte';else obj=G.reinOn?'Survis à Reinald':OBJ[Math.min(G.q,6)].t;
  const tq=m.kind==='world'&&!G.reinOn?trackedText():null;
  const ob=tq?tq[0]+' · ':m.kind==='world'?'Quête · ':m.kind==='dun'?DUNGEONS[m.did].nom+' · ':'',os=tq?tq[1]:obj;
  const ot=hq('#objTxt');if(ot._t!==ob+'\n'+os){ot._t=ob+'\n'+os;ot.textContent='';ot.append(el('b',null,ob),document.createTextNode(os))}
  setTxt(hq('#goldTxt'),hero.gold);setTxt(hq('#pPotN'),hero.pot);hq('#pPot').classList.toggle('empty',hero.pot<=0);const pts=treePts(hero);setHid(hq('#ptsB'),pts<=0);setTxt(hq('#ptsB'),pts);setHid(hq('#bagB'),!UI.newItems);
  {const n=stonesQ(Math.max(G.q,hero.q));const gp=hq('#gemPill');if(gp.dataset.n!==String(n)){gp.dataset.n=n;gp.textContent='';for(let k=0;k<4;k++){const i=el('i','gm'+(k<n?' on':''));i.style.setProperty('--c',STONES[k][1]);gp.append(i)}}}
  {const tp=hq('#hud .top'),hb=hq('#hud');if(tp){const b=Math.round(tp.offsetTop+tp.offsetHeight);if(hb._tb!==b){hb._tb=b;hb.style.setProperty('--topB',b+'px')}}}
  const ks=ST.ks,inTb=tbMe();['bS1','bS2','bS3'].forEach((id,i)=>{const S=SK[ks[i]];if(!S)return;const b=hq('#'+id);b.classList.remove('lock');setTxt(b.querySelector('.t'),L.cd[i]>0?(inTb?Math.ceil(L.cd[i]/TB_ROUND-.01)+' t':Math.ceil(L.cd[i])):'');b.classList.toggle('used',inTb&&!tbCanAct());setCss(b,'--cd',clamp(L.cd[i]/(S.cd*ST.cdm),0,1).toFixed(3));b.classList.toggle('nomp',L.mp<S.mp)});
  hq('#bAtk').classList.toggle('used',inTb&&!tbCanAct());hq('#bPot').classList.toggle('used',inTb&&!tbCanPot());
  if(ks[3]){const b=hq('#bUlt');b.classList.remove('lock');b.classList.toggle('used',inTb&&!tbCanAct());b.classList.toggle('ready',L.ult>=100);setTxt(b.querySelector('.t'),L.ult>=100?'':Math.floor(L.ult)+'%');setCss(b,'--cd',(1-L.ult/100).toFixed(3))}
  ks.forEach((id,i)=>{const S=SK[id],d=$('#sk'+i);if(!S||!d)return;if(S.t==='u'){d.classList.toggle('ready',L.ult>=100);setCss(d,'--cd',(1-L.ult/100).toFixed(3))}else setCss(d,'--cd',clamp(L.cd[i]/(S.cd*ST.cdm),0,1).toFixed(3))});
  {const d=$('#skPot');if(d)setTxt(d.querySelector('span'),'Potion '+hero.pot)}
  setTxt(hq('#potN'),hero.pot);hq('#bPot').classList.toggle('empty',hero.pot<=0);
  tbHud();barHud();
  const it=findInteract();const lab=interactLabel(it);const ba=hq('#bAct');setHid(ba,!it);if(it)setTxt(ba,lab.length>24?lab.split(' : ')[0]:lab);const ah=hq('#actHint');setHid(ah,!it);if(it)setTxt(ah,'F · '+lab)}

/* ================= Talents et compétences ================= */
let talSel=null,talHouse=false,talConfirm=false;
function toggleTalents(house){const t=$('#talents');const open=t.hidden;t.hidden=!open;$('#pause').hidden=true;paused=open&&mode==='solo';talHouse=open&&house===true;talSel=null;talConfirm=false;if(open)renderTalents()}
/* position des crans : 3 branches de 10 crans (voir NODE_PARENT) */
function talPos(b,k){const x=65+b*120,Y=[44,92,132,178,232,272,320,232,272,320];return{x:k>=7?x+30:k>=4?x-30:x,y:Y[k]}}
function renderTalents(){const pts=treePts(hero),kit=heroKit(hero);
  $('#talPts').textContent=pts+(pts>1?' points':' point')+' à dépenser · 1 point par niveau (niveau '+LVL_MAX+' au plus) · compétences '+(kit.act.length+(kit.pa?1:0))+'/3 · ultime '+(kit.ult?1:0)+'/1';
  const NS='http://www.w3.org/2000/svg',sv=document.createElementNS(NS,'svg');sv.setAttribute('viewBox','0 0 370 352');sv.setAttribute('width','100%');sv.setAttribute('role','img');sv.setAttribute('aria-label','Arbre de talents');
  const mk=(t,a,txt)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;sv.appendChild(e);return e};
  TREE[hero.cls].forEach((B,b)=>{mk('text',{x:65+b*120,y:14,'text-anchor':'middle',class:'tbn'},B[0]);
    for(let k=1;k<10;k++){const pk=NODE_PARENT[k],a=talPos(b,pk),c=talPos(b,k),on=hero.tr.includes(b+'.'+k),y0=a.y+([0,3].includes(pk)?31:25),y1=c.y-([6,9].includes(k)?14:9);mk('path',{d:'M'+a.x+' '+y0+' C'+a.x+' '+(y0+y1)/2+' '+c.x+' '+(y0+y1)/2+' '+c.x+' '+y1,class:'tl'+(on?' on':'')})}});
  TREE[hero.cls].forEach((B,b)=>{for(let k=0;k<10;k++){const key=b+'.'+k,n=treeNode(hero.cls,key),c=talPos(b,k),on=hero.tr.includes(key),ok=!on&&!treeWhy(hero,key);
    const g=document.createElementNS(NS,'g');g.setAttribute('class','tn'+(on?' on':ok?' ok':' off')+(n.kind==='u'?' ult':'')+(n.kind==='s'&&n.sk.t==='p'?' pas':'')+(talSel===key?' sel':''));g.setAttribute('role','button');g.setAttribute('aria-label',n.nom);sv.appendChild(g);
    const add=(t,a,txt)=>{const e=document.createElementNS(NS,t);for(const q in a)e.setAttribute(q,a[q]);if(txt!=null)e.textContent=txt;g.appendChild(e)};
    if(n.kind==='b')add('circle',{cx:c.x,cy:c.y,r:9});else{add('rect',{x:c.x-14,y:c.y-14,width:28,height:28,rx:5});const ic=document.createElementNS(NS,'g');ic.setAttribute('transform','translate('+(c.x-9)+' '+(c.y-9)+') scale(.75)');ic.innerHTML=iconSvg(n.id,on?'#2a1d10':'#efe6cf').replace(/^<svg[^>]*>|<\/svg>$/g,'');g.appendChild(ic)}
    add('text',{x:c.x,y:c.y+(n.kind==='b'?21:27),'text-anchor':'middle'},n.kind==='b'?n.nom:n.sk.court);
    add('rect',{x:c.x-28,y:c.y-16,width:56,height:42,fill:'transparent'});
    g.onclick=()=>{talSel=key;talConfirm=false;renderTalents()}}});
  const box=$('#talTree');box.textContent='';box.append(sv);
  const d=$('#talDet');d.textContent='';
  if(!talSel){d.append(el('p','muted',pts&&!hero.tr.length&&talHouse?'Touche le premier cran d’une branche pour choisir ta première compétence.':'Touche un cran pour voir son effet. Carré : compétence ; rond : bonus ; bord doré : ultime.'+(talHouse?'':' Les points se dépensent auprès du maître des talents, dans la maison à l’arbre doré de chaque ville.')))}
  else{const n=treeNode(hero.cls,talSel),why=treeWhy(hero,talSel),own=hero.tr.includes(talSel);
    const kind=n.kind==='b'?'Bonus':n.kind==='u'?'Ultime':n.sk.t==='p'?'Compétence passive':'Compétence';
    d.append(el('b',null,n.nom),el('small','muted',' · '+kind),el('p',null,n.desc+(n.kind==='s'&&n.sk.t==='a'?' ('+n.sk.mp+' mana, '+n.sk.cd+' s)':'')));
    if(own)d.append(el('p','okt','Acquis'));else if(why)d.append(el('p','bad',why));
    else if(!talHouse)d.append(el('p','muted','À apprendre auprès du maître des talents, dans une ville.'));
    else{const bt=el('button','btn main','Apprendre · 1 point');bt.onclick=()=>{if(treeWhy(hero,talSel))return;hero.tr.push(talSel);refreshStats();buildSkillUI();doSave(true);Snd.play('lvl');
      if(n.kind!=='b')toast((n.kind==='u'?'Ultime':'Compétence')+' apprise : '+n.nom+'.');renderTalents()};d.append(bt)}}
  const rs=$('#talReset');rs.textContent='';
  if(talHouse){const cost=TREE_RESET*hero.lvl;const bt=el('button','btn',talConfirm?'Confirmer : '+cost+' or':'Réinitialiser l’arbre · '+cost+' or');
    bt.onclick=()=>{if(!hero.tr.length){toast('Rien à réinitialiser.');return}if(hero.gold<cost){toast('Pas assez d’or : il en faut '+cost+'.');return}
      if(!talConfirm){talConfirm=true;renderTalents();return}hero.gold-=cost;hero.tr=[];talSel=null;talConfirm=false;refreshStats();buildSkillUI();doSave(true);Snd.play('coin');toast('Arbre remis à zéro. Tous tes points sont à redépenser.');renderTalents()};
    rs.append(el('p','muted','Le maître des talents peut aussi remettre ton arbre à zéro (20 or par niveau).'),bt)}
  else rs.append(el('p','muted','Pour apprendre un cran ou changer de chemin, va voir le maître des talents dans une ville.'))}

/* ================= Menu ================= */
const heroes={};
async function loadAll(){const got={};for(const c of CLS_IDS)got[c]=await Store.load(c);
  for(const c of CLS_IDS){const cur=heroes[c];if(cur&&(cur.ts||0)>=(got[c].ts||0))continue;if(mode!=='menu'&&hero&&c===hero.cls)continue;heroes[c]=got[c]}
  if(mode==='menu'){hero=heroes[selCls];ST=derive(hero);renderMenu()}}
function renderMenu(){const box=$('#classes');box.textContent='';
  for(const c of CLS_IDS){const C=CLS[c],h=heroes[c];const b=el('button','cls');b.style.setProperty('--c',C.col);b.setAttribute('aria-pressed',c===selCls);
    const pc=el('canvas');pc.width=56;pc.height=56;drawPlayerTo(pc.getContext('2d'),{cls:c,lk:h&&h.eq?lookOf(h.eq):0},28,32);
    const lv=h?(h.lvl>1||h.q>0?'Niveau '+h.lvl+' · '+stonesQ(h.q)+'/4 pierres':'Nouveau héros'):'…';
    b.append(pc,el('b',null,C.nom),el('span','lv',lv),el('small',null,C.desc));b.onclick=()=>{selCls=c;Store.lsSet('dd_cls',c);hero=heroes[c]||newHero(c);ST=derive(hero);renderMenu();pres({c,l:hero.lvl})};box.append(b)}
  if(!hero)return;
  const fresh=hero.q===0&&!hero.pos;$('#bSolo').textContent=fresh?'Commencer l’aventure':'Continuer l’aventure';
  const pos=hero.pos||PL.start;const where=townAt(pos[0],pos[1])||regionAt(pos[0],pos[1]);
  const rs=$('#resumeTxt');rs.textContent='';rs.append(el('b',null,CLS[hero.cls].nom+' niveau '+hero.lvl),document.createTextNode(' · '+where.nom+' · '+hero.gold+' or · '+hero.pot+' potions. Objectif : '+OBJ[Math.min(hero.q,6)].t));
  // carte du menu
  const mk=$('#menuMarks');mk.textContent='';for(const k of hero.wp){const w=WAYPOINTS[k];if(!w)continue;const[x,y]=pctOf(w.pt[0],w.pt[1]);const m=mark(mk,'wp',x,y);m.textContent='◆';m.style.pointerEvents='none'}
  const o=OBJ[Math.min(hero.q,6)];if(o.at){const p=placePx(o.at);if(p){const[x,y]=pctOf(p.x/TS-.5,p.y/TS-.5);mark(mk,'obj',x,y)}}
  {const[x,y]=pctOf(pos[0],pos[1]);mark(mk,'me',x,y,CLS[hero.cls].col)}
  const pd=$('#pendant');pd.textContent='';const n=stonesQ(hero.q);STONES.forEach((s,i)=>{const d=el('span','gem'+(i<n?' on':''));d.style.setProperty('--c',s[1]);d.append(el('i'),document.createTextNode(s[0].replace('la pierre ','Pierre ')));pd.append(d)})}

/* ================= Écrans ================= */
function showGame(){document.documentElement.classList.add('ingame');$('#menu').hidden=true;$('#menuBg').hidden=true;$('#game').hidden=false;$('#pause').hidden=true;$('#talents').hidden=true;$('#joining').hidden=true;resize();buildSkillUI();
  $('#pauseNote').textContent=mode==='solo'?'Le jeu est en pause. Ta progression est sauvegardée automatiquement.':'Le jeu continue pendant ce menu : ton coéquipier joue encore.'}
function toMenu(){Log.ev('jeu','retour au menu depuis',mode);document.documentElement.classList.remove('ingame');Voice.stop();mode='menu';paused=false;G=null;storyQ=[];$('#storyBox').hidden=true;$('#questBox').hidden=true;$('#bagBox').hidden=true;$('#mapBox').hidden=true;storyCtx=null;$('#game').hidden=true;$('#menu').hidden=false;renderMenu();renderLobby()}
function startLocal(asHost){Log.ev('jeu','lancement',asHost?'hôte':'solo',logName(myName),hero&&hero.cls,'niv '+(hero&&hero.lvl));Snd.init();bubbles=[];mode=asHost?'host':'solo';myIdx=0;paused=false;G=newWorld();G.coop=asHost;G.q=hero.q;G.fl=new Set(hero.fl);
  if(!WORLD)buildWorld();G.camps=WORLD.camps.map(()=>({state:'idle',t:0}));L=newLocal();resetGains();parts=[];lastFx=-1;lastMsg=-1;UI.newItems=0;
  G.players=[mkPlayer(myName,hero.cls,ST)];G.players[0].lvl=hero.lvl;
  const pos=hero.pos?worldFree(hero.pos[0],hero.pos[1]):WORLD.start;hostEnter('w',pos,{heal:true});showGame();
  if(hero.q===0){if(!window.__noStory&&!hero.story.includes('prologue')){Scene.play(introScene(),()=>{for(const k of['prologue','reinald0','ch0'])if(!hero.story.includes(k))hero.story.push(k);doSave(true)})}else['prologue','reinald0','ch0'].forEach(queueStoryKey)}
  // toute partie est ouverte : tant qu'il reste une place, un 2e joueur peut la rejoindre depuis le menu
  if(room)pres({r:'h',n:myName,c:hero.cls,l:hero.lvl,gp:null,h:null,i:null,st:null,g:null,wh:zoneName(G.m)})}
function quitGame(){doSave(true);if(mode==='host'||mode==='solo')pres({r:'m',g:null,gp:null});if(mode==='guest'||mode==='joining')pres({r:'m',h:null,i:null,st:null});hostPeer=null;toMenu()}
function togglePause(){if(mode==='joining')return;const p=$('#pause');p.hidden=!p.hidden;$('#talents').hidden=true;paused=!p.hidden&&mode==='solo'}
function pickTheme(){if(Cine.on)return'cine';if(Scene.on&&Scene.def&&Scene.def.music)return Scene.def.music;if(mode==='menu'||mode==='joining'||!G||!G.m)return'menu';const b=G.enemies.find(e=>e.type==='boss');if(b&&Math.hypot((b.rx??b.x)-L.x,(b.ry??b.y)-L.y)<12*TS)return'boss';
  if(G.m.kind==='house')return'town';
  if(G.m.kind==='world'&&townAt(Math.floor(L.x/TS),Math.floor(L.y/TS)))return'ville';if(G.m.kind!=='world')return'dungeon';
  // dehors : la musique suit le moment de la journée
  return({Aube:'aube',Matin:'matin',Midi:'midi','Après-midi':'aprem',Soir:'soir',Nuit:'nuit'})[Sky.label()]||'explore'}

/* ================= Boucle ================= */
let lastT=performance.now();
/* Une erreur dans une image ne doit jamais figer le jeu : on la note et on continue. */
function loop(now){try{frame(now)}catch(e){loop.n=(loop.n||0)+1;if(loop.n<=20||loop.n%300===0)Log.err('boucle ('+mode+')',e,loop.n>1?'×'+loop.n:'')}requestAnimationFrame(loop)}
function frame(now){const dt=Math.min(.05,(now-lastT)/1000);lastT=now;Music.set(pickTheme());
  if(mode==='solo'||mode==='host'){if(!(mode==='solo'&&paused))hostUpdate(dt);netTick(dt)}
  else if(mode==='guest'){guestUpdate(dt);netTick(dt)}
  if(mode==='solo'||mode==='host'||mode==='guest'){
    for(const q of parts){q.life-=dt;if(q.k==='sp'){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.9;q.vy*=.9}else if(q.k==='txt'){q.y+=q.vy*dt}else if(q.vx!=null){q.x+=q.vx*dt;q.y+=q.vy*dt}}
    parts=parts.filter(q=>q.life>0);if(parts.length>360)parts.splice(0,parts.length-360);
    if(G&&G.m&&Math.random()<dt*(G.m.kind==='world'?8:14))parts.push(G.m.kind==='world'&&Math.random()<.4?{k:'leaf',x:L.x+(Math.random()-.5)*400,y:L.y-220+Math.random()*200,vx:20+Math.random()*20,vy:18+Math.random()*12,life:6,max:6,col:['#8aa04a','#c9a24a','#6f8c38'][Math.floor(Math.random()*3)]}:{k:'mote',x:L.x+(Math.random()-.5)*360,y:L.y+(Math.random()-.5)*360,vx:(Math.random()-.5)*6,vy:-3-Math.random()*5,life:3+Math.random()*3,max:6});
    for(const b of bubbles)b.life-=dt;bubbles=bubbles.filter(b=>b.life>0);
    Sky.update(dt);Vitrine.tick(dt);tavernTick();Scene.tick(dt);Vig.tick(dt);QDone.tick(dt);if(!$('#game').hidden)fitCanvas();render(dt);hud(dt);doSave(false)}
  else if(mode==='menu')MenuBg.draw(dt)}

/* ================= Entrées ================= */
const isTouch=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0);
if(isTouch){document.body.classList.add('touch');touch.on=true;const mb=$('#mbar');for(const id of['pGold','pBag','pQuest','pTal','pPot'])mb.append($('#'+id));$('#pMap').style.display='none';
  // le menu (☰) passe en haut à gauche, devant la fiche du héros
  const pm=$('#pMenu');pm.classList.add('mbtn');$('#hud .top').prepend(pm)}
const inGame=()=>mode==='solo'||mode==='host'||mode==='guest';
const anyOverlay=()=>!$('#bagBox').hidden||!$('#mapBox').hidden||!$('#storyBox').hidden||!$('#chronBox').hidden;
addEventListener('keydown',e=>{if(!inGame())return;if(e.target&&e.target.tagName==='INPUT')return;
  if(e.code==='Escape'){e.preventDefault();if(!$('#questBox').hidden){closeQuests();return}if(!$('#bagBox').hidden){closeBag();return}if(!$('#mapBox').hidden){$('#mapBox').hidden=true;paused=false;return}if(!$('#talents').hidden){toggleTalents();return}togglePause();return}
  if(e.code==='KeyI'){$('#bagBox').hidden?openBag():closeBag();return}if(e.code==='KeyO'){$('#questBox').hidden?openQuests():closeQuests();return}if(e.code==='KeyM'){$('#mapBox').hidden?openMap():($('#mapBox').hidden=true,paused=false);return}
  if(anyOverlay())return;keys.add(e.code);
  if(e.code==='Space'||e.code==='Digit1'||e.code==='KeyK'){skQ[0]=true;e.preventDefault()}if(e.code==='Digit2'||e.code==='KeyL')skQ[1]=true;if(e.code==='Digit3')skQ[2]=true;if(e.code==='KeyR')skQ[3]=true;
  if(e.code==='KeyE')potQ=true;if(e.code==='KeyF')actQ=true;if(e.code==='KeyT')toggleTalents();if(e.code==='Enter'||e.code==='KeyN'){e.preventDefault();endTurn()}
  if(e.code.startsWith('Arrow'))e.preventDefault()});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();mouse.down=false;touch.atk=false});
cv.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;mouse.x=e.offsetX;mouse.y=e.offsetY;mouse.t=performance.now();touch.on=false});
cv.addEventListener('pointerdown',e=>{Snd.init();const r=cv.getBoundingClientRect();if(e.button===0&&tapEnemy(e.clientX-r.left,e.clientY-r.top,e.pointerType!=='mouse'))return;if(e.pointerType!=='mouse'||tbMe())return;mouse.x=e.offsetX;mouse.y=e.offsetY;mouse.t=performance.now();if(e.button===0)mouse.down=true;if(e.button===2)skQ[0]=true});
addEventListener('pointerup',e=>{if(e.pointerType==='mouse'&&e.button===0)mouse.down=false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
(function(){const zone=$('#joyZone'),joy=$('#joy'),knob=$('#knob');let id=null,cx=0,cy=0,t0=0,far=false;
  const R=()=>joy.offsetWidth*.42||45;
  const set=(x,y)=>{let dx=x-cx,dy=y-cy;const d=Math.hypot(dx,dy),r=R();if(d>r){dx*=r/d;dy*=r/d}knob.style.transform=`translate(${dx}px,${dy}px)`;const n=Math.hypot(dx,dy)/r;touch.jx=n<.18?0:dx/r;touch.jy=n<.18?0:dy/r};
  zone.addEventListener('pointerdown',e=>{if(id!==null)return;Snd.init();{const r=cv.getBoundingClientRect();if(tapEnemy(e.clientX-r.left,e.clientY-r.top)){e.preventDefault();return}}id=e.pointerId;t0=performance.now();far=false;try{zone.setPointerCapture(id)}catch(_){}const g=$('#game').getBoundingClientRect();cx=e.clientX;cy=e.clientY;joy.style.left=(cx-g.left)+'px';joy.style.top=(cy-g.top)+'px';joy.hidden=false;knob.style.transform='';touch.on=true;e.preventDefault()});
  zone.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;if(Math.hypot(e.clientX-cx,e.clientY-cy)>12)far=true;set(e.clientX,e.clientY)});
  // un simple toucher du sol (sans glisser) annule l'aperçu ou libère la cible
  const end=e=>{if(e.pointerId!==id)return;id=null;joy.hidden=true;knob.style.transform='';touch.jx=touch.jy=0;
    if(e.type==='pointerup'&&!far&&performance.now()-t0<350){const r=cv.getBoundingClientRect();tapEnemy(cx-r.left,cy-r.top,true)}};zone.addEventListener('pointerup',end);zone.addEventListener('pointercancel',end)})();
const holdBtn=(elx,on,off)=>{elx.addEventListener('pointerdown',e=>{Snd.init();try{elx.setPointerCapture(e.pointerId)}catch(_){}elx.classList.add('on');touch.on=true;on();e.preventDefault()});const up=()=>{elx.classList.remove('on');off&&off()};elx.addEventListener('pointerup',up);elx.addEventListener('pointercancel',up)};
holdBtn($('#bAct'),()=>actQ=true);
$('#bEnd').addEventListener('click',()=>{Snd.init();endTurn()});
document.addEventListener('gesturestart',e=>e.preventDefault());
$('#mini').onclick=()=>openMap();$('#skyTag').onclick=()=>openMap();$('#pMap').onclick=()=>openMap();$('#pBag').onclick=()=>openBag();$('#pQuest').onclick=()=>openQuests();$('#objTxt').addEventListener('click',e=>{if(e.target&&e.target.tagName==='B'&&inGame())openQuests()});$('#qClose').onclick=closeQuests;$('#bagClose').onclick=closeBag;$('#mapClose').onclick=()=>{$('#mapBox').hidden=true;paused=!$('#pause').hidden&&mode==='solo'};
$('#pMenu').onclick=togglePause;$('#pPot').onclick=()=>{potQ=true};
holdable($('#tgtBox'),()=>{},on=>{L.tgtBig=on});holdable($('#cMe'),()=>{},on=>{if(L)L.meBig=on});$('#pTal').onclick=()=>toggleTalents();$('#bResume').onclick=togglePause;$('#bTalClose').onclick=()=>toggleTalents();
$('#bQuit').onclick=quitGame;$('#bSound').onclick=()=>{Snd.on=!Snd.on;$('#bSound').textContent='Bruitages : '+(Snd.on?'activés':'coupés')};
$('#bMusic').onclick=$('#bMusicMenu').onclick=()=>{Snd.init();Music.toggle()};
$('#bVoice').onclick=$('#bVoiceMenu').onclick=()=>Voice.toggle();$('#cineSkip').onclick=()=>Cine.skip();$('#scnSkip').onclick=()=>Scene.skip();$('#vig').onclick=()=>Vig.next();$('#qdOk').onclick=()=>QDone.close();$('#qdEquip').onclick=()=>QDone.equip();$('#bIntro').onclick=()=>Cine.play(null);
addEventListener('pointerdown',()=>Snd.init(),{capture:true});addEventListener('keydown',()=>Snd.init(),{capture:true});
$('#bJoinCancel').onclick=()=>{pres({r:'m',h:null,i:null,st:null});hostPeer=null;toMenu()};
$('#bSolo').onclick=()=>Pwa.gate(()=>startLocal(false));
$('#bChron').onclick=()=>{Snd.init();openChron()};$('#chronClose').onclick=()=>{$('#chronBox').hidden=true};
$('#stNext').onclick=()=>{if(storyCtx==='play')nextStory();else closeStory()};$('#stSkip').onclick=()=>{storyQ.forEach(k=>{if(!hero.story.includes(k))hero.story.push(k)});storyQ=[];doSave(true);closeStory()};
addEventListener('keydown',e=>{if(!Scene.on)return;e.preventDefault();e.stopImmediatePropagation();keys.clear();if(e.code==='Escape')Scene.skip();else if(e.code==='Enter'||e.code==='Space')Vig.next()},{capture:true});
addEventListener('keydown',e=>{if($('#storyBox').hidden)return;if(e.code==='Enter'||e.code==='Space'||e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();keys.clear();$('#stNext').click()}},{capture:true});
const nameIn=$('#name');let nameT=0;nameIn.addEventListener('input',()=>{myName=clean(nameIn.value)||'Héros';Store.lsSet('dd_name',myName);
  // envoi groupé : le nom part une fois la saisie finie, pas à chaque lettre
  clearTimeout(nameT);nameT=setTimeout(()=>pres({n:myName}),600)});

/* Pas de zoom du navigateur (double tap, pincement) : on joue, on ne zoome pas. */
(function noZoom(){let last=0;
  document.addEventListener('touchend',e=>{const n=performance.now();if(n-last<350&&!(e.target&&e.target.closest&&e.target.closest('input,textarea,button,a,.pill,.qcard,.chap,.itc,.slotc,.mk')))e.preventDefault();last=n},{passive:false});
  document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
  for(const ev of['gesturestart','gesturechange'])document.addEventListener(ev,e=>e.preventDefault(),{passive:false})})();

/* ================= Démarrage ================= */
(async function boot(){
  myName=clean(Store.lsGet('dd_name'))||'Héros';nameIn.value=myName==='Héros'?'':myName;nameIn.placeholder='Héros';
  const c=Store.lsGet('dd_cls');if(CLS_IDS.includes(c))selCls=c;
  $('#mapImg2').src=$('#mapImg').src;Voice.init();Pwa.init();Iab.init();
  await Splash.run([
    ['Les polices de Midheim',1,()=>Loader.fonts()],
    ['La carte du royaume',1,()=>Loader.images()],
    ['Le monde et ses donjons',2,async()=>{await sleep(30);buildWorld();
      for(const k of CLS_IDS)heroes[k]=fixHero(Store.lsGet('dd_hero_'+k),k);hero=heroes[selCls];ST=derive(hero);renderMenu();renderLobby();
      requestAnimationFrame(loop)}],
    ['Les voix des personnages',4,p=>Loader.voices(p)],
    ['La musique et les bruitages',1,async()=>{await Loader.speech();await sleep(120)}],
    ['Tes héros sauvegardés',1,async()=>{await within(Store.init(),5000);if(Store.db)await within(loadAll(),6000)}],
    ['Le salon de jeu',1,()=>within(initNet(),6000)],
  ]);
  Splash.hide();
  setInterval(()=>{if(mode==='joining'&&performance.now()-joinT>(hostBg?PAUSE_WAIT:12000))endGuest('Pas de réponse de la partie. Vérifie que l’autre joueur est bien en jeu.')},1000);
  addEventListener('pagehide',()=>{if(hero)doSave(true)});
  /* verrouillage ou passage à une autre appli : sur iPhone, la fermeture de la page n'est pas toujours signalée
     (appli balayée, onglet tué en arrière-plan) ; on sauvegarde donc dès que le jeu passe en arrière-plan */
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&hero){doSave(true);Log.ev('jeu','sauvegarde (arrière-plan)',mode)}});
})();
