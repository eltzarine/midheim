/* ================= Vignette de dialogue : non bloquante, on peut continuer à bouger ================= */
const Vig={on:false,full:'',shown:0,t:0,near:null,done:null,vT:-1,
  say(who,name,text,o){o=o||{};if(this.on)this.close(true);this.on=true;this.full=String(text);this.shown=0;this.t=0;this.vT=-1;this.near=o.near||null;this.done=o.onDone||null;this.cine=!!o.cine;
    const v=$('#vig');v.hidden=false;v.classList.toggle('cine',this.cine);drawPortrait($('#vigP'),who);$('#vigN').textContent=name||'';$('#vigT').textContent='';
    const fin=()=>{if(this.on&&this.vT<0)this.vT=this.t};
    if(o.voice===false)fin();else Voice.say([{who:VOX[who]?who:'narrateur',text:this.full,clip:o.clip}],fin)},
  tick(dt){if(!this.on)return;this.t+=dt;if(this.shown<this.full.length){this.shown=Math.min(this.full.length,this.shown+dt*48);$('#vigT').textContent=this.full.slice(0,Math.floor(this.shown))}
    if(this.near&&G&&Math.hypot(this.near.x-L.x,this.near.y-L.y)>280){this.close();return}
    const typed=this.shown>=this.full.length,read=this.full.length*.06+1.6;
    if(typed&&this.vT>=0){const spoke=this.vT>.8;if(this.t>=(spoke?this.vT+.9:Math.max(read,this.vT+.9)))this.close()}},
  next(){if(!this.on)return;if(this.shown<this.full.length){this.shown=this.full.length;$('#vigT').textContent=this.full;return}this.close()},
  close(silent){if(!this.on)return;this.on=false;$('#vig').hidden=true;Voice.stop();const d=this.done;this.done=null;if(d)d()}};

/* ================= Mises en scène dans le jeu (intro, donjons, fins de chapitre) ================= */
const Scene={on:false,q:[],steps:[],i:0,wait:null,time:0,cam:{x:0,y:0},tw:null,actors:[],fxl:[],cb:null,audio:false,def:null,pend:null,
  play(def,cb){if(this.on){this.q.push([def,cb]);return}if(!G||!G.m){cb&&cb();return}
    this.on=true;this.def=def;this.steps=def.steps;this.i=0;this.wait=null;this.time=0;this.cb=cb;this.actors=(def.actors||[]).map(a=>Object.assign({},a));this.fxl=[];this.audio=false;this.pend=null;this.tw=null;
    this.cam={x:def.cam?def.cam[0]:L.x,y:def.cam?def.cam[1]:L.y};
    document.body.classList.add('scene');$('#scn').hidden=false;this.cap('');$('#scnTitle').classList.remove('on');
    if(Vig.on&&!Vig.cine)Vig.close(true);if(mode==='solo')paused=true;Snd.init();keys.clear();touch.jx=touch.jy=0;touch.atk=false;
    if(def.fadeIn){const f=$('#scnFade');f.classList.add('on','now');requestAnimationFrame(()=>{f.classList.remove('now');setTimeout(()=>f.classList.remove('on'),60)})}
    this.run()},
  run(){while(this.on&&!this.wait&&this.i<this.steps.length)this.exec(this.steps[this.i++]);if(this.on&&!this.wait&&this.i>=this.steps.length)this.end()},
  exec(s){
    if(s.cut){this.wait={k:'t',until:this.time+.42};this.pend={to:{x:s.cut[0],y:s.cut[1]},at:this.time+.3};$('#scnFade').classList.add('on')}
    if(s.cam){if(s.dur)this.tw={fx:this.cam.x,fy:this.cam.y,tx:s.cam[0],ty:s.cam[1],t:0,d:s.dur};else{this.cam={x:s.cam[0],y:s.cam[1]};this.tw=null}}
    if(s.add)for(const a of[].concat(s.add))this.actors.push(Object.assign({},a));
    if(s.del){const ds=[].concat(s.del);this.actors=this.actors.filter(a=>!ds.includes(a.id))}
    if(s.move){const a=this.actors.find(a=>a.id===s.move);if(a)a.mv={fx:a.x,fy:a.y,tx:s.to[0],ty:s.to[1],t:0,d:s.dur||1}}
    if(s.fx)this.fxl.push(Object.assign({t:0},s.fx));
    if(s.cap!=null)this.cap(s.cap);
    if(s.title){const e=$('#scnTitle');e.textContent='';e.append(document.createTextNode(s.title[0]));if(s.title[1])e.append(el('small',null,s.title[1]));e.classList.add('on');setTimeout(()=>e.classList.remove('on'),s.titleDur||5000)}
    if(s.audio){this.audio=Voice.clip(s.audio,()=>{this.audio=false})}
    if(s.call)s.call(this);
    if(s.wait)this.wait={k:'t',until:this.time+s.wait};
    if(s.beat!=null&&this.audio)this.wait={k:'beat',at:s.beat};
    if(s.audioEnd&&this.audio)this.wait={k:'aend'};
    if(s.line){const l=s.line;this.wait={k:'line'};const my=this.wait;Vig.say(l.who,l.name,l.text,{cine:true,clip:l.clip,onDone:()=>{if(this.wait===my){this.wait=null;this.run()}}})}},
  cap(t){const c=$('#scnCap');c.classList.remove('on');if(!t){c.textContent='';return}setTimeout(()=>{if(!this.on)return;c.textContent=t;c.classList.add('on')},200)},
  tick(dt){if(!this.on)return;this.time+=dt;
    if(this.pend&&this.time>=this.pend.at){this.cam={...this.pend.to};this.tw=null;this.pend=null;setTimeout(()=>$('#scnFade').classList.remove('on'),60)}
    if(this.tw){const w=this.tw;w.t+=dt;const k=Math.min(1,w.t/w.d),e=k*k*(3-2*k);this.cam.x=w.fx+(w.tx-w.fx)*e;this.cam.y=w.fy+(w.ty-w.fy)*e;if(k>=1)this.tw=null}
    for(const a of this.actors)if(a.mv){const m=a.mv;m.t+=dt;const k=Math.min(1,m.t/m.d);a.x=m.fx+(m.tx-m.fx)*k;a.y=m.fy+(m.ty-m.fy)*k;a.moving=k<1;if(Math.abs(m.tx-m.fx)>1)a.aim=m.tx>m.fx?0:Math.PI;if(k>=1){a.mv=null;a.moving=false}}
    for(const f of this.fxl)f.t+=dt;this.fxl=this.fxl.filter(f=>f.t<(f.d||3));
    if(G&&G.players[myIdx]){L.ivT=Math.max(L.ivT,.3);if(mode!=='guest'&&G.players[0])G.players[0].ivT=Math.max(G.players[0].ivT||0,.3)}
    keys.clear();touch.jx=touch.jy=0;touch.atk=false;mouse.down=false;
    const w=this.wait;if(!w)return;
    if(w.k==='t'&&this.time>=w.until){this.wait=null;this.run()}
    else if(w.k==='beat'){const a=Voice.audio;if(!this.audio||!a||a.currentTime>=w.at){this.wait=null;this.run()}}
    else if(w.k==='aend'&&!this.audio){this.wait=null;this.run()}},
  skip(){if(!this.on)return;this.wait=null;this.i=this.steps.length;Vig.close(true);Voice.stop();this.audio=false;this.end()},
  end(){if(!this.on)return;this.on=false;Vig.close(true);document.body.classList.remove('scene');$('#scn').hidden=true;$('#scnFade').classList.remove('on');this.cap('');$('#scnTitle').classList.remove('on');this.actors=[];this.fxl=[];
    if(mode==='solo')paused=!$('#pause').hidden||!$('#talents').hidden||!$('#bagBox').hidden||!$('#questBox').hidden;const cb=this.cb;this.cb=null;if(cb)cb();
    if(!this.on&&this.q.length){const[d,c]=this.q.shift();setTimeout(()=>this.play(d,c),120)}},
  // ---- dessin des acteurs et effets (appelé par render, dans le repère du monde) ----
  drawActor(a,T){const g=ctx;
    if(a.k==='hero')drawHero2(g,a.cls,a.x,a.y,a.aim??0,T,!!a.moving,{lk:a.lk|0});
    else if(a.k==='npc')drawNPC(g,a.who,a.x,a.y,T,a.sc||1);
    else if(a.k==='boss')drawBoss(g,a.bv,a.x,a.y,T,0,1,{chg:0,id:0});
    else if(a.k==='enemy'){const e={id:a.n||1,type:a.type,x:a.x,y:a.y,rx:a.x,ry:a.y,r:EN[a.type].r,hp:1,mhp:1,hpP:100,fl:0};drawEnemy(e,a.x,a.y,T)}
    else if(a.k==='obj')drawDObj(a.o,T);
    if(a.name){g.textAlign='center';g.textBaseline='middle';g.font='700 12px "Alegreya Sans",system-ui,sans-serif';const ny=a.y-(a.k==='npc'&&a.who==='virganth'?64:a.k==='boss'?52:40);g.fillStyle='rgba(0,0,0,.75)';g.fillText(a.name,a.x+1,ny+1);g.fillStyle='#ffe9c2';g.fillText(a.name,a.x,ny)}},
  drawFx(T){const g=ctx;for(const f of this.fxl){const k=f.t/(f.d||3);
    if(f.k==='flash'){g.globalAlpha=Math.max(0,1-k);g.strokeStyle=f.c;g.lineWidth=6;g.beginPath();g.arc(f.x,f.y,20+k*240,0,6.28);g.stroke();g.fillStyle=f.c;g.globalAlpha=Math.max(0,.35-k);g.beginPath();g.arc(f.x,f.y,30+k*120,0,6.28);g.fill();g.globalAlpha=1}
    else if(f.k==='pulse'){for(let r=0;r<3;r++){const kk=((f.t*.6+r/3)%1);g.globalAlpha=(1-kk)*.8;g.strokeStyle=f.c;g.lineWidth=4;g.beginPath();g.ellipse(f.x,f.y,20+kk*130,10+kk*65,0,0,6.28);g.stroke()}g.globalAlpha=1;
      const gr=g.createRadialGradient(f.x,f.y,0,f.x,f.y,120);gr.addColorStop(0,f.c+'66');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(f.x-120,f.y-120,240,240)}
    else if(f.k==='stones'){for(let i=0;i<4;i++){const ti=f.t-i*1.4;if(ti<0)continue;const c=STONES[i][1],a=i/4*6.283+f.t*.6,r=42-Math.max(0,f.t-6.5)*30;const x=f.x+Math.cos(a)*Math.max(0,r),y=f.y-70+Math.sin(a)*Math.max(0,r)*.5-Math.min(1,ti)*20;
        g.save();g.shadowColor=c;g.shadowBlur=18;g.fillStyle=c;g.translate(x,y);g.rotate(.785+f.t);g.fillRect(-6,-6,12,12);g.restore()}
      if(f.t>6.8){g.globalAlpha=Math.min(1,(f.t-6.8)*2);const gr=g.createRadialGradient(f.x,f.y-70,0,f.x,f.y-70,46);gr.addColorStop(0,'rgba(255,240,200,.9)');gr.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=gr;g.fillRect(f.x-50,f.y-120,100,100);g.globalAlpha=1}}
    else if(f.k==='stone'){const e=Math.min(1,f.t/1.8),x=f.x+(f.tx-f.x)*e,y=f.y+(f.ty-f.y)*e-Math.sin(e*Math.PI)*60;g.save();g.shadowColor=f.c;g.shadowBlur=20;g.fillStyle=f.c;g.translate(x,y);g.rotate(f.t*3);g.fillRect(-7,-7,14,14);g.restore();
      if(f.t>1.8){g.globalAlpha=Math.max(0,1-(f.t-1.8));g.strokeStyle=f.c;g.lineWidth=4;g.beginPath();g.arc(f.tx,f.ty,10+(f.t-1.8)*80,0,6.28);g.stroke();g.globalAlpha=1}}
    else if(f.k==='mist'){for(let i=0;i<10;i++){const a=i*.63+f.t;g.globalAlpha=Math.max(0,.45*(1-k));g.fillStyle='#8a8a98';g.beginPath();g.arc(f.x+Math.cos(a)*(10+k*60),f.y-10+Math.sin(a)*(6+k*30),12+k*14,0,6.28);g.fill()}g.globalAlpha=1}}}};

/* ----- construction des scènes ----- */
const spx=k=>({x:(PL[k][0]+.5)*TS,y:(PL[k][1]+.5)*TS});
function partyActors(cx,cy){return G.players.map((p,i)=>({id:'h'+i,k:'hero',cls:p.cls,lk:i===myIdx?lookOf(hero.eq):(p.lk|0),name:p.name,x:cx-22*(G.players.length-1)+i*44,y:cy,aim:-Math.PI/2}))}
const SPEAKER={virganth:{k:'npc',who:'virganth',nom:'Virganth, l’Éternel'},grinmir:{k:'npc',who:'grinmir',nom:'Grinmir Thunderhammer'},abhorash:{k:'boss',bv:1,nom:'Abhorash'},
  reinald:{k:'boss',bv:5,nom:'Reinald Sterkov'},reinaldj:{k:'hero',cls:'voleur',lk:1,nom:'Reinald Sterkov'},sinthara:{k:'boss',bv:0,nom:'Sinthara'},amarath:{k:'boss',bv:4,nom:'Amarath'}};
function storyLines(k){const S=STORY[k];const base=STORY_VOICE[k]||'narrateur',qw=S.who==='reinaldj'?'reinald':(VOX[S.who]?S.who:'narrateur'),segs=[];
  for(const para of S.p)for(const piece of para.split(/(«[^»]*»)/)){if(!piece.trim())continue;const w=piece.startsWith('«')?qw:base;const l=segs[segs.length-1];if(l&&l.who===w)l.text+=' '+piece.trim();else segs.push({who:w,text:piece.trim()})}
  const out=[];segs.forEach((s,i)=>{const name=s.who==='narrateur'?'La narratrice':(SPEAKER[S.who]||{}).nom||S.nom,text=s.text.replace(/[«»]/g,'').trim(),clip='story_'+k+'_'+i;
    if(VOICE_CLIPS[clip]&&Voice.on){out.push({line:{who:s.who,name,text,clip}});return}
    const parts=[];for(const x of text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)||[text]){const t=x.trim();if(!t)continue;if(parts.length&&parts[parts.length-1].length+t.length<190)parts[parts.length-1]+=' '+t;else parts.push(t)}
    for(const t of parts)out.push({line:{who:s.who,name,text:t}})});return out}
function storyScene(k){const S=STORY[k];const me=wpos(myIdx);const cx=me.x,cy=me.y;const steps=[];const actors=partyActors(cx,cy+8);
  const sp=SPEAKER[S.who];let spk=null;
  if(sp&&k!=='stone0'){spk=Object.assign({id:'spk',x:cx,y:cy-(sp.k==='npc'&&sp.who==='virganth'?120:86),name:sp.nom},sp);if(sp.k==='hero')spk.aim=Math.PI/2}
  if(k==='reinald2'&&spk)steps.push({fx:{k:'mist',x:spk.x,y:spk.y,d:2.5}},{wait:.6},{del:'spk'});
  if(spk&&k!=='reinald2')actors.push(spk);
  steps.push({cam:[cx,cy-40],dur:.8},{title:[S.titre,S.nom],titleDur:3800},{wait:.9});
  const lines=storyLines(k);
  if(S.gem!=null){const c=STONES[S.gem][1];const from=spk?{x:spk.x,y:spk.y-30}:{x:cx,y:cy-90};steps.push(...lines.slice(0,-1),{fx:{k:'stone',x:from.x,y:from.y,tx:cx,ty:cy-10,c,d:3.2}},{wait:1.2},lines[lines.length-1])}
  else steps.push(...lines);
  if(k==='reinald1'&&spk)steps.push({fx:{k:'mist',x:spk.x,y:spk.y,d:2}});
  if(k==='epilogue')steps.push({fx:{k:'stones',x:cx,y:cy+10,d:9}},{wait:3});
  return{cam:[cx,cy-20],actors,steps,hideP:true}}
// entrées de donjon : une courte mise en scène, une seule fois par héros
const DSCENE={
  everwatch0:{to:'exit',who:'sinthara',add:true,text:'Des intrus dans ma cour ? Gardes, abaissez les herses ! Personne n’entre dans mon donjon.'},
  everwatch1:{to:'boss',who:'sinthara',text:'Cette pierre a choisi la plus forte. Venez donc me la reprendre.'},
  karazankor0:{to:'wave',who:'grinmir',add:true,text:'Les orcs remontent le col ! Tenez les portes avec nous, et Karaz Ankor s’en souviendra.'},
  karazankor1:{to:'boss',who:'chef',text:'Le Trône des Âges est à nous, petits hommes ! Vos os décoreront le marteau du roi.'},
  antre0:{to:'mark',who:'virganth',add:true,text:'Les adeptes ont éteint mes pierres runiques. Rallumez-les, et mon antre s’ouvrira.'},
  antre1:{to:'boss',who:'adepte',text:'La pierre de Kelemvor reviendra au maître. Le vieux dragon ne pourra pas la cacher éternellement.'},
  prison0:{to:'exit',who:'narrateur',text:'Le sentier grimpe vers la plus profonde montagne. Une marionnette géante garde la clé du sceau.'},
  prison1:{to:'exit',who:'amarath',text:'Approchez… Posez les pierres sur les sceaux… Libérez-moi…'},
  prison2:{to:'boss',who:'amarath',text:'Mes vieux compagnons envoient des enfants. Je vais vous montrer ce qu’est la vraie paix.'}};
const DS_NAME={sinthara:'Sinthara',grinmir:'Grinmir Thunderhammer',virganth:'Virganth, l’Éternel',chef:'Le chef de guerre orc',adepte:'Le Haut-Adepte',amarath:'Amarath',narrateur:'La narratrice'};
function dunScene(m){const key=m.did+m.idx,d=DSCENE[key];if(!d)return null;const me=wpos(myIdx);let t=m.stairs;
  if(d.to==='boss'){const b=G.enemies.find(e=>e.type==='boss');if(b)t={x:b.rx??b.x,y:b.ry??b.y}}
  else if(d.to==='wave'&&m.goal&&m.goal.at)t=m.goal.at;else if(d.to==='mark'&&m.marks&&m.marks[0])t={x:(m.marks[0].x+.5)*TS,y:(m.marks[0].y+.5)*TS};
  const actors=[];if(d.add){const sp=d.who==='sinthara'?{k:'boss',bv:0}:{k:'npc',who:d.who};actors.push(Object.assign({id:'spk',x:t.x+(d.who==='grinmir'?40:0),y:t.y+(d.who==='virganth'?-40:20),name:DS_NAME[d.who]},sp))}
  const portrait=d.who==='chef'?'narrateur':d.who==='adepte'?'narrateur':d.who;
  return{cam:[me.x,me.y],actors,hideP:false,steps:[{cam:[t.x,t.y-30],dur:2.2},{wait:2.3},{line:{who:portrait,name:DS_NAME[d.who],text:d.text}},{cam:[me.x,me.y],dur:1.4},{wait:1.4}]}}
function maybeDunScene(){const m=G&&G.m;if(!m||m.kind!=='dun'||window.__noStory)return;const key='sc_'+m.did+m.idx;if(!DSCENE[m.did+m.idx]||(hero.fl||[]).includes(key))return;
  hero.fl.push(key);setTimeout(()=>{if(G&&G.m===m){const s=dunScene(m);if(s)Scene.play(s)}},700)}
// introduction : les héros réunis autour du feu, au bout des Wild Realms
function introScene(){const camp=spx('start'),seal=placePx('prison')||spx('montsoublies'),honor=spx('honor'),pont=spx('pont');
  const fx0=camp.x+TS*2,fy0=camp.y-TS*3;const ftx=Math.floor(fx0/TS),fty=Math.floor(fy0/TS);const fire={id:'feu',k:'obj',o:{k:'feu',x:ftx,y:fty,w:1,h:1,s:.4},x:(ftx+.5)*TS,y:(fty+1)*TS};
  const cx=(ftx+.5)*TS,cy=(fty+.5)*TS+6;const mine=hero.cls;const pos=[[-50,-8],[50,-8],[-30,36],[30,36]];const looks=[3+36,1+9,2+6+36,4];
  const heroes=CLS_IDS.map((c,i)=>({id:'h'+c,k:'hero',cls:c,lk:c===mine?lookOf(hero.eq):looks[i],name:c===mine?myName:CLS[c].nom,x:cx+pos[i][0],y:cy+pos[i][1],aim:Math.atan2(-pos[i][1],-pos[i][0])}));
  const rein={id:'rein',k:'hero',cls:'voleur',lk:1,name:'Reinald',x:cx+84,y:cy+10,aim:Math.PI};
  const sold=[0,1,2,3].map(i=>({id:'s'+i,k:'enemy',type:'orc',n:i+1,x:honor.x-160+i*30,y:honor.y+60+(i%2)*26}));
  const adepts=[0,1,2].map(i=>({id:'a'+i,k:'enemy',type:'archer',n:i+5,x:seal.x-140+i*70,y:seal.y+190+(i%2)*20}));
  const clip=!!(VOICE_CLIPS.intro&&Voice.on);const TT=CINE_TIMES;
  const seg=(i,setup)=>clip?[{beat:TT[i]},...setup,{cap:CINE_SCENES[i].t}]:[...setup,{line:{who:'narrateur',name:'La narratrice',text:CINE_SCENES[i].t}}];
  const steps=[];if(clip)steps.push({audio:'intro'});
  steps.push(...seg(0,[{cam:[seal.x-200,seal.y-160]},{cam:[seal.x+80,seal.y-40],dur:10}]));
  steps.push(...seg(1,[{cut:[honor.x-80,honor.y]},{add:sold},...sold.map(s=>({move:s.id,to:[s.x+260,s.y],dur:11})),{fx:{k:'pulse',x:honor.x,y:honor.y,c:'#ff7a3a',d:12}},{cam:[honor.x+60,honor.y],dur:11}]));
  steps.push(...seg(2,[{cut:[pont.x-120,pont.y]},{del:sold.map(s=>s.id)},{fx:{k:'flash',x:pont.x-40,y:pont.y,c:'#ffe6a0',d:2.5}},{cam:[pont.x+40,pont.y],dur:10}]));
  steps.push(...seg(3,[{cut:[seal.x,seal.y+40]},{fx:{k:'pulse',x:seal.x,y:seal.y,c:'#b98cff',d:24}}]));
  steps.push(...seg(4,[{add:adepts},...adepts.map(a=>({move:a.id,to:[seal.x-30+(+a.id[1])*30,seal.y+60],dur:6}))]));
  steps.push(...seg(5,[{cut:[cx,cy-20]},{del:adepts.map(a=>a.id)},{fx:{k:'stones',x:cx,y:cy,d:9}}]));
  steps.push(...seg(6,[{add:{id:'vir',k:'npc',who:'virganth',name:'Virganth',x:cx,y:cy-330}},{move:'vir',to:[cx,cy-120],dur:3.2},{title:['Les Pierres de Midheim','An 147 AM']}]));
  if(clip)steps.push({audioEnd:true});steps.push({cap:''},{wait:.6});
  // Reinald, puis la prophétie de Virganth
  const r0=storyLines('reinald0');steps.push(r0[0],r0[1]||{wait:0},{move:'rein',to:[cx-420,cy+30],dur:6},r0[2]||{wait:0});
  steps.push(...storyLines('ch0'),{del:'rein'});
  return{cam:[seal.x-200,seal.y-160],fadeIn:true,actors:[fire,...heroes,rein],steps,hideP:true,hideNpc:['virganth'],music:'cine'}}
