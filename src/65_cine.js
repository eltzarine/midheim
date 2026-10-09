/* ================= Voix des personnages ================= */
// Enregistrements intégrés (clé → data URI), sinon voix françaises de l'appareil.
const VOICE_CLIPS=@@CLIPS@@;
const VOX={narrateur:{g:'f',p:1.02,r:.88},virganth:{g:'m',p:.72,r:.86},grinmir:{g:'m',p:.58,r:.95},abhorash:{g:'m',p:.42,r:.82},
  reinald:{g:'m',p:.92,r:.9},reinaldj:{g:'m',p:1,r:.95},sinthara:{g:'f',p:.82,r:.92},amarath:{g:'m',p:.3,r:.76},garde:{g:'m',p:.85,r:1.05},
  aubergiste:{g:'m',p:1.12,r:1.06},marchand:{g:'m',p:1.25,r:1.14},forgeron:{g:'m',p:.62,r:1}};
const VOX_F=/am[ée]lie|audrey|aur[ée]lie|marie|julie|virginie|hortense|denise|c[ée]line|l[ée]a\b|chantal|sylvie|[ée]lo[iï]se|female|femme|v[ée]ronique|caroline|charlotte|jacqueline|vivienne|brigitte|eloise|josephine|seraphina|coralie|ariane/i;
const VOX_M=/thomas|nicolas|paul\b|henri|claude|mathieu|jacques|r[ée]mi|yves|antoine|alain|\bmale|homme|guillaume|bruno|f[ée]lix|daniel|jean|pierre|remy|gerard|g[ée]rard|maxime|fabrice|alexandre|christophe|gr[ée]goire/i;
const Voice={on:true,vs:[],tok:0,audio:null,busy:false,
  init(){const v=Store.lsGet('dd_voice');if(v===false)this.on=false;syncVoiceBtn();if(!('speechSynthesis' in window))return;
    const up=()=>{try{this.vs=speechSynthesis.getVoices().filter(v=>/^fr/i.test(v.lang))}catch(e){}};up();try{speechSynthesis.addEventListener('voiceschanged',up)}catch(e){speechSynthesis.onvoiceschanged=up}
    const unlock=()=>{try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}catch(e){}};document.addEventListener('pointerdown',unlock,{once:true,capture:true})},
  toggle(){this.on=!this.on;Store.lsSet('dd_voice',this.on);if(!this.on)this.stop();syncVoiceBtn()},
  pick(g){const vs=this.vs;if(!vs.length)return null;const re=g==='f'?VOX_F:VOX_M,other=g==='f'?VOX_M:VOX_F;
    const score=v=>(re.test(v.name)?4:0)-(other.test(v.name)?4:0)+(/fr[-_]FR/i.test(v.lang)?2:0)+(/google|premium|enhanced|natural|neural/i.test(v.name)?1:0);
    return vs.slice().sort((a,b)=>score(b)-score(a))[0]},
  canSpeak(){return this.on&&'speechSynthesis' in window},
  split(t){const out=[];for(const s of t.replace(/\s+/g,' ').match(/[^.!?…]+[.!?…]*[»"]?\s*/g)||[t]){const x=s.trim();if(!x)continue;if(out.length&&out[out.length-1].length+x.length<170)out[out.length-1]+=' '+x;else out.push(x)}return out},
  stop(){this.tok++;this.busy=false;try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}if(this.audio){try{this.audio.pause()}catch(e){}this.audio=null}Music.duck(false)},
  // segs : [{who,text,clip?}] ; un segment avec enregistrement est joué tel quel, sinon voix de l'appareil
  say(segs,cb){this.stop();const tok=this.tok;const done=()=>{if(tok!==this.tok)return;this.busy=false;this.audio=null;Music.duck(false);cb&&cb()};
    const synth=this.canSpeak();if(!this.on){if(cb)setTimeout(done,0);return}
    const parts=[];for(const s of segs){if(s.clip&&VOICE_CLIPS[s.clip])parts.push({clip:s.clip});else if(synth)for(const x of this.split(s.text.replace(/[«»]/g,'')))parts.push({who:s.who,text:x})}
    if(!parts.length){setTimeout(done,0);return}this.busy=true;Music.duck(true);let i=0;
    const next=()=>{if(tok!==this.tok)return;if(i>=parts.length){done();return}const p=parts[i++];
      let fired=false;const go=()=>{if(fired||tok!==this.tok)return;fired=true;clearTimeout(guard);setTimeout(next,p.clip?250:180)};
      const guard=setTimeout(go,p.clip?60000:2500+p.text.length*95);
      if(p.clip){const a=new Audio(VOICE_CLIPS[p.clip]);this.audio=a;a.onended=go;a.onerror=go;a.play().catch(go);return}
      const cf=VOX[p.who]||VOX.narrateur;let u;try{u=new SpeechSynthesisUtterance(p.text)}catch(e){go();return}u.lang='fr-FR';const v=this.pick(cf.g);if(v)u.voice=v;u.pitch=cf.p;u.rate=cf.r;u.volume=1;
      u.onend=go;u.onerror=go;try{speechSynthesis.speak(u)}catch(e){go()}};
    next()},
  clip(key,cb){if(!this.on||!VOICE_CLIPS[key])return false;this.say([{clip:key,text:''}],cb);return true},
  line(who,text,cb){this.say([{who,text,clip:VOICE_LINES[text]}],cb)},
  story(k){const S=STORY[k];if(!S)return;const base=STORY_VOICE[k]||'narrateur',qw=S.who==='reinaldj'?'reinald':(VOX[S.who]?S.who:'narrateur'),segs=[];
    for(const para of S.p)for(const piece of para.split(/(«[^»]*»)/)){if(!piece.trim())continue;const w=piece.startsWith('«')?qw:base;const L2=segs[segs.length-1];if(L2&&L2.who===w)L2.text+=' '+piece.trim();else segs.push({who:w,text:piece.trim()})}
    segs.forEach((g,i)=>g.clip='story_'+k+'_'+i);this.say(segs)}
};
const VOICE_LINES=@@LINES@@;
const STORY_VOICE={ch0:'virganth',ch3:'virganth'};
function syncVoiceBtn(){for(const id of['#bVoice','#bVoiceMenu']){const b=$(id);if(b)b.textContent='Voix : '+(Voice.on?'activées':'coupées')}}
const GREET={aubergiste:['Bienvenue, voyageur ! Un bon lit et une chope bien fraîche, ça te dit ?','Entre donc te réchauffer. Les routes de Midheim ne pardonnent pas.','Ici, on ne parle pas d’Amarath. On boit, on mange et on dort.'],
  marchand:['Approchez, approchez ! Les meilleures affaires de tout Midheim !','Tout se vend, tout s’achète… même les vieilles bottes.','Ah, un aventurier ! J’ai exactement ce qu’il te faut.'],
  forgeron:['Ha ! Une lame qui a besoin d’amour ? Pose-la sur l’enclume.','Le feu est chaud. Qu’est-ce qu’on forge aujourd’hui ?','Un bon acier, un bon enchantement, et tu reviendras vivant.']};
function greet(kind){const who=({auberge:'aubergiste',marchand:'marchand',forge:'forgeron'})[kind];if(!who)return;const L2=GREET[who],t=L2[Math.floor(Math.random()*L2.length)];
  toast(NPC_NAMES[who]+' : « '+t+' »');Voice.line(who,t)}

/* ================= Cinématique d'introduction ================= */
const CINE_SCENES=[
  {t:'Le monde a changé… Je le sens dans l’eau. Je le sens dans la terre. Je le sens dans le vent qui descend des Monts Oubliés.',d:'veil'},
  {t:'Il y a près de deux cents ans, les Premiers Royaumes de Midheim tombèrent face aux Hommes de l’Ouest. Valandil, la cité millénaire, fut pillée… et devint la capitale de l’Empire.',d:'war'},
  {t:'Alors Lathandre ouvrit la Fissure, et fendit le continent en deux. Depuis, un seul pont relie encore l’Ouest à la cité-forteresse de Tarkin.',d:'rift'},
  {t:'Mais beaucoup ont oublié ce qui dort sous la plus profonde montagne… Amarath. Scellé jadis par ses anciens compagnons, grâce à quatre pierres divines.',d:'seal'},
  {t:'Aujourd’hui, sa prison s’affaiblit. Ses adeptes rôdent, et cherchent les pierres.',d:'adepts'},
  {t:'Un pendentif peut les réunir. Il est entre vos mains. L’Everwatch, le Dragon de Sang, le Haut-Roi des nains, le dernier des Éternels… chacun garde une pierre.',d:'pendant'},
  {t:'Que votre route soit éclairée… Bienvenue à Midheim.',d:'title'}];
const CINE_TIMES=@@CINETIMES@@;
const Cine={on:false,i:0,t0:0,st:0,prev:-1,pt:0,cb:null,raf:0,stars:null,motes:null,mode:'',endT:0,
  play(cb){this.cb=cb;this.on=true;this.i=0;this.prev=-1;this.endT=0;Snd.init();Music.set('cine');$('#cine').hidden=false;if(mode==='solo')paused=true;
    const R=mulberry(77);this.stars=Array.from({length:140},()=>[R(),R(),R()*1.6+.3,R()*6]);this.motes=Array.from({length:60},()=>[R(),R(),R()*.5+.2,R()*6]);
    this.cv=$('#cineCv');this.g=this.cv.getContext('2d');this.size();this.t0=performance.now()/1000;
    if(VOICE_CLIPS.intro&&Voice.on){this.mode='clip';Voice.clip('intro',()=>{if(!this.on)return;if(this.now()<3){this.mode=Voice.canSpeak()?'speech':'timer';this.scene(0)}else this.finish(1.6)});this.scene(0)}
    else{this.mode=Voice.canSpeak()?'speech':'timer';this.scene(0)}
    cancelAnimationFrame(this.raf);const step=()=>{if(!this.on)return;this.draw();this.raf=requestAnimationFrame(step)};this.raf=requestAnimationFrame(step)},
  size(){const r=Math.min(2,window.devicePixelRatio||1);this.cv.width=innerWidth*r;this.cv.height=innerHeight*r;this.r=r},
  now(){return performance.now()/1000-this.t0},
  scene(i){if(!this.on)return;if(i>=CINE_SCENES.length){this.finish(.4);return}this.prev=this.i===i?-1:this.i;this.pst=this.st;this.pt=this.now();this.i=i;this.st=this.now();
    const sub=$('#cineSub');sub.classList.remove('on');setTimeout(()=>{if(this.i===i&&this.on){sub.textContent=CINE_SCENES[i].t;sub.classList.add('on')}},250);
    if(this.mode==='speech'){const my=i,st=this.st;Voice.say([{who:'narrateur',text:CINE_SCENES[i].t}],()=>{if(this.i!==my||!this.on)return;const left=Math.max(.6,4.2-(this.now()-st));setTimeout(()=>{if(this.i===my)this.scene(my+1)},left*1000)})}
    else if(this.mode==='timer'){const my=i;setTimeout(()=>{if(this.i===my)this.scene(my+1)},Math.max(4500,CINE_SCENES[i].t.length*62+1800))}},
  finish(delay){if(!this.on||this.endT)return;this.endT=this.now()+(delay||.4)},
  skip(){Snd.play('swing');this.close()},
  close(){if(!this.on)return;this.on=false;cancelAnimationFrame(this.raf);Voice.stop();$('#cine').hidden=true;$('#cineSub').classList.remove('on');if(mode==='solo')paused=false;const cb=this.cb;this.cb=null;cb&&cb()},
  // ----- dessin -----
  draw(){const g=this.g,W=this.cv.width,H=this.cv.height,T=this.now();
    if(this.mode==='clip'&&Voice.audio){const ct=Voice.audio.currentTime;let k=0;CINE_TIMES.forEach((s,j)=>{if(ct>=s)k=j});if(k!==this.i)this.scene(k)}
    g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.fillStyle='#000';g.fillRect(0,0,W,H);
    const cur=CINE_SCENES[this.i];const lt=T-this.st;
    if(this.prev>=0&&T-this.pt<1.2){g.globalAlpha=1;this.paint(CINE_SCENES[this.prev].d,T-this.pst,W,H,T);g.globalAlpha=Math.min(1,(T-this.pt)/1.2);this.paint(cur.d,lt,W,H,T)}
    else{g.globalAlpha=Math.min(1,lt/1.2+(this.i?1:0));this.paint(cur.d,lt,W,H,T)}
    g.globalAlpha=1;const vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.75)');g.fillStyle=vg;g.fillRect(0,0,W,H);
    const bars=Math.max(0,H*.07);g.fillStyle='#000';g.fillRect(0,0,W,bars);g.fillRect(0,H-bars,W,bars);
    if(this.endT){const k=Math.min(1,(T-this.endT+.9)/.9);if(k>0){g.fillStyle='rgba(0,0,0,'+k+')';g.fillRect(0,0,W,H)}if(T>this.endT+.2&&k>=1)this.close()}},
  map(cx,cy,z,a,tint){const g=this.g,W=this.cv.width,H=this.cv.height,img=$('#mapImg');if(!img||!img.complete||!img.naturalWidth)return 1;const iw=1280,ih=960;
    const s=Math.max(W/iw,H/ih)*z;g.save();g.globalAlpha*=a;g.drawImage(img,W/2-cx*s,H/2-cy*s,iw*s,ih*s);if(tint){g.fillStyle=tint;g.fillRect(0,0,W,H)}g.restore();return s},
  tpx(id){const p=PL[id];return[(p[0]+.5)*1280/WD.w,(p[1]+.5)*960/WD.h]},
  mist(T,col,n){const g=this.g,W=this.cv.width,H=this.cv.height;g.save();for(let i=0;i<(n||5);i++){const x=((i*.31+T*.012*(i%2?1:-1))%1.4-.2)*W,y=H*(.35+.12*i%1);const r=W*(.35+.1*(i%3));const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col||'rgba(200,210,230,.10)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r)}g.restore()},
  motesDraw(T,col,up){const g=this.g,W=this.cv.width,H=this.cv.height;g.save();g.fillStyle=col;for(const m of this.motes){const y=up?(m[1]-T*m[2]*.08)%1:m[1];const yy=(y+1)%1;const x=(m[0]+Math.sin(T*.5+m[3])*.02)%1;g.globalAlpha=.25+.5*Math.abs(Math.sin(T*1.3+m[3]));g.beginPath();g.arc(x*W,yy*H,m[2]*2.2*this.r,0,6.28);g.fill()}g.restore()},
  title(txt,sub,a,y){const g=this.g,W=this.cv.width,H=this.cv.height;g.save();g.globalAlpha*=a;g.textAlign='center';const fs=Math.min(W*.085,H*.11);
    g.font='400 '+fs+'px "Uncial Antiqua",Georgia,serif';g.shadowColor='rgba(255,190,90,.8)';g.shadowBlur=fs*.5;g.fillStyle='#f6e2b0';g.fillText(txt,W/2,H*(y||.42));
    if(sub){g.shadowBlur=fs*.2;g.font='600 '+fs*.32+'px Cinzel,Georgia,serif';g.fillStyle='#e8d6a8';g.fillText(sub,W/2,H*(y||.42)+fs*.75)}g.restore()},
  mountains(T,glow){const g=this.g,W=this.cv.width,H=this.cv.height;const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#05060c');sky.addColorStop(1,'#120a1c');g.fillStyle=sky;g.fillRect(0,0,W,H);
    for(const s of this.stars){g.globalAlpha=.3+.6*Math.abs(Math.sin(T*.7+s[3]));g.fillStyle='#dfe6ff';g.fillRect(s[0]*W,s[1]*H*.55,s[2]*this.r,s[2]*this.r)}g.globalAlpha=1;
    const gl=g.createRadialGradient(W/2,H*.78,0,W/2,H*.78,W*.6);gl.addColorStop(0,glow);gl.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gl;g.fillRect(0,0,W,H);
    const layer=(base,amp,seed,col,par)=>{const R=mulberry(seed);g.fillStyle=col;g.beginPath();g.moveTo(-10,H);const n=9;const off=Math.sin(T*.05)*W*par;for(let i=0;i<=n;i++){const x=i/n*W*1.2-W*.1+off;g.lineTo(x,H*base-R()*H*amp);g.lineTo(x+W/n*.5,H*base-R()*H*amp*.4)}g.lineTo(W+10,H);g.fill()};
    layer(.62,.28,11,'#1a1426',.01);layer(.74,.22,23,'#110d19',.02);layer(.88,.16,37,'#07060b',.03)},
  rune(cx,cy,R,T,crack){const g=this.g;g.save();g.translate(cx,cy);g.strokeStyle='rgba(190,150,255,.75)';g.lineWidth=2*this.r;g.shadowColor='#b98cff';g.shadowBlur=18*this.r;
    g.beginPath();g.arc(0,0,R,0,6.28);g.stroke();g.beginPath();g.arc(0,0,R*.78,0,6.28);g.stroke();g.rotate(T*.15);for(let i=0;i<8;i++){g.rotate(6.28/8);g.beginPath();g.moveTo(R*.8,0);g.lineTo(R*.95,R*.06);g.lineTo(R*.95,-R*.06);g.closePath();g.stroke()}
    g.rotate(-T*.15);for(let i=0;i<4;i++){const a=T*.4+i*1.5708,c=STONES[i][1];g.fillStyle=c;g.shadowColor=c;g.beginPath();g.arc(Math.cos(a)*R*1.15,Math.sin(a)*R*1.15,R*.07,0,6.28);g.fill()}
    if(crack){g.strokeStyle='rgba(255,90,90,'+(.4+.4*Math.sin(T*6))+')';g.shadowColor='#ff3b3b';const Rr=mulberry(5);for(let k=0;k<5;k++){g.beginPath();let x=0,y=0,a=Rr()*6.28;g.moveTo(x,y);for(let s=0;s<5;s++){a+=Rr()-.5;x+=Math.cos(a)*R*.22*crack;y+=Math.sin(a)*R*.22*crack;g.lineTo(x,y)}g.stroke()}}
    const eo=.5+.5*Math.sin(T*.9);g.shadowBlur=12*this.r;g.fillStyle='rgba(255,40,40,'+(.25+.5*eo*(crack?1:.5))+')';for(const s of[-1,1]){g.beginPath();g.ellipse(s*R*.16,-R*.05,R*.06,R*.025,0,0,6.28);g.fill()}g.restore()},
  hooded(x,y,s,T,ph){const g=this.g;const bob=Math.sin(T*3+ph)*s*.04;g.save();g.translate(x,y+bob);g.fillStyle='#050308';g.beginPath();g.moveTo(-s*.32,0);g.quadraticCurveTo(-s*.28,-s*.8,0,-s*1.05);g.quadraticCurveTo(s*.28,-s*.8,s*.32,0);g.fill();
    g.fillStyle='rgba(255,60,60,.8)';g.fillRect(-s*.07,-s*.82,s*.04,s*.02);g.fillRect(s*.03,-s*.82,s*.04,s*.02);
    const fl=Math.sin(T*14+ph)*s*.02;const tg=g.createRadialGradient(s*.36,-s*.72,0,s*.36,-s*.72,s*.6);tg.addColorStop(0,'rgba(255,170,70,.55)');tg.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=tg;g.fillRect(-s*.3,-s*1.4,s*1.3,s*1.3);
    g.fillStyle='#ffcf6a';g.beginPath();g.ellipse(s*.36,-s*.74+fl,s*.035,s*.07,0,0,6.28);g.fill();g.strokeStyle='#3a2a1a';g.lineWidth=s*.03;g.beginPath();g.moveTo(s*.36,-s*.68);g.lineTo(s*.3,-s*.25);g.stroke();g.restore()},
  paint(d,t,W,H,T){const g=this.g,mn=Math.min(W,H);
    if(d==='veil'){for(const s of this.stars){g.save();g.globalAlpha*=.3+.6*Math.abs(Math.sin(T*.7+s[3]));g.fillStyle='#dfe6ff';g.fillRect(s[0]*W,s[1]*H,s[2]*this.r,s[2]*this.r);g.restore()}
      const[mx,my]=this.tpx('montsoublies');g.save();g.globalAlpha*=Math.min(.85,t/7);this.map(mx+t*2,my+t*1.2,2.4-t*.05,1,'rgba(10,16,30,.35)');g.restore();this.mist(T,'rgba(200,215,235,.12)',6);this.motesDraw(T,'#cfe2ff',true)}
    else if(d==='war'){const[cx,cy]=[657,280];this.map(cx-t*4,cy,1.9+t*.02,1,'rgba(60,8,0,.35)');const fl=.5+.5*Math.sin(T*7)*Math.sin(T*3.1);
      const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,mn*.5);gr.addColorStop(0,'rgba(255,120,40,'+(.28+.12*fl)+')');gr.addColorStop(1,'rgba(255,60,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);
      g.save();for(const m of this.motes){const y=((m[1]-T*m[2]*.15)%1+1)%1;g.globalAlpha=.6*(1-y);g.fillStyle=m[2]>.5?'#ffcf6a':'#ff6a2a';g.fillRect((m[0]+Math.sin(T+m[3])*.03)*W,y*H,2.5*this.r,2.5*this.r)}g.restore();this.mist(T,'rgba(40,20,20,.25)',4)}
    else if(d==='rift'){const[tx,ty]=this.tpx('tarkin'),[px2,py2]=this.tpx('pont');const sh=t<1.2?(1.2-t)*6*this.r:0;g.save();g.translate((Math.random()-.5)*sh,(Math.random()-.5)*sh);
      const s=this.map(tx-20+t*3,ty-40+t*2,1.7,1,'rgba(10,10,25,.25)');const ox=W/2-(tx-20+t*3)*s,oy=H/2-(ty-40+t*2)*s;const R=mulberry(9);const grow=Math.min(1,t/2.2);
      g.strokeStyle='#ffe6a0';g.shadowColor='#ffcf6a';g.shadowBlur=24*this.r;g.lineWidth=3*this.r;g.beginPath();const x0=px2-14;for(let y=120;y<=120+840*grow;y+=24){const x=x0+(R()-.5)*22+Math.sin(y*.02)*10;const X=ox+x*s,Y=oy+y*s;if(y===120)g.moveTo(X,Y);else g.lineTo(X,Y)}g.stroke();
      if(t>2.6){const a=Math.min(1,(t-2.6)/1.2);g.shadowBlur=30*this.r;g.fillStyle='rgba(255,230,160,'+(.6*a)+')';g.beginPath();g.arc(ox+px2*s,oy+py2*s,8*this.r+4*this.r*Math.sin(T*3),0,6.28);g.fill()}
      g.restore();if(t<.5){g.fillStyle='rgba(255,245,220,'+(1-t/.5)*.8+')';g.fillRect(0,0,W,H)}this.motesDraw(T,'#ffe6a0',true)}
    else if(d==='seal'){this.mountains(T,'rgba(150,90,255,.35)');this.rune(W/2,H*.62,mn*.16,T,0);this.mist(T,'rgba(120,90,180,.12)',5)}
    else if(d==='adepts'){this.mountains(T,'rgba(255,60,60,'+(.22+.1*Math.sin(T*2))+')');this.rune(W/2,H*.62,mn*.16,T,Math.min(1,t/3));const n=5;
      for(let i=0;i<n;i++){const side=i%2?1:-1,base=W/2+side*(W*.62-Math.min(t*W*.09,W*.36))+side*i*W*.05;this.hooded(base,H*.86-i%2*H*.03,mn*(.34-i*.025),T,i)}this.mist(T,'rgba(60,20,30,.25)',4)}
    else if(d==='pendant'){const bg=g.createRadialGradient(W/2,H*.45,0,W/2,H*.45,mn*.8);bg.addColorStop(0,'#1d2433');bg.addColorStop(1,'#04060a');g.fillStyle=bg;g.fillRect(0,0,W,H);this.motesDraw(T,'#e8d6a8',true);
      const cx=W>H*1.2?W*.38:W/2,cy=H*.44,R=mn*.17;g.save();g.strokeStyle='#c9ced8';g.lineWidth=2*this.r;g.beginPath();g.moveTo(cx-R*1.6,cy-H*.5);g.quadraticCurveTo(cx-R*.6,cy-R*1.6,cx,cy-R*1.05);g.quadraticCurveTo(cx+R*.6,cy-R*1.6,cx+R*1.6,cy-H*.5);g.stroke();
      const sw=Math.sin(T*.8)*.04;g.translate(cx,cy);g.rotate(sw);const mg=g.createRadialGradient(-R*.3,-R*.3,R*.1,0,0,R);mg.addColorStop(0,'#f3f5f9');mg.addColorStop(.6,'#9aa3b3');mg.addColorStop(1,'#4c5463');g.fillStyle=mg;g.beginPath();g.arc(0,0,R,0,6.28);g.fill();
      g.strokeStyle='#e9edf4';g.lineWidth=3*this.r;g.stroke();g.fillStyle='#2a303c';g.beginPath();g.arc(0,0,R*.32,0,6.28);g.fill();
      const names=['l’Everwatch','le Dragon de Sang','le Haut-Roi des nains','le dernier des Éternels'];
      for(let i=0;i<4;i++){const a=-1.5708+i*1.5708,x=Math.cos(a)*R*.66,y=Math.sin(a)*R*.66,on=t>3.2+i*1.5;g.fillStyle='#1a1e27';g.beginPath();g.arc(x,y,R*.16,0,6.28);g.fill();
        if(on){const c=STONES[i][1],k=Math.min(1,(t-3.2-i*1.5)/.6);g.save();g.shadowColor=c;g.shadowBlur=30*this.r*k;g.fillStyle=c;g.globalAlpha*=k;g.beginPath();g.arc(x,y,R*.13,0,6.28);g.fill();g.restore();
}}
      g.restore();const fs=Math.max(13*this.r,mn*.04);g.save();g.font='600 '+fs+'px Cinzel,Georgia,serif';g.textAlign='center';
      for(let i=0;i<4;i++){const k=Math.min(1,Math.max(0,(t-3.2-i*1.5)/.6));if(!k)continue;g.globalAlpha=k;g.fillStyle=STONES[i][1];g.shadowColor=STONES[i][1];g.shadowBlur=10*this.r;if(W>H*1.2){g.textAlign='left';g.fillText(names[i],cx+R*1.5,cy-fs*1.6+i*fs*1.45)}else g.fillText(names[i],cx,cy+R*1.45+i*fs*1.45)}g.restore()}
    else if(d==='title'){this.map(640,470+Math.sin(T*.1)*10,1.05+t*.01,1,'rgba(8,10,20,.45)');const sw=(t*.35)%1.6-.3;const lg=g.createLinearGradient(W*sw-W*.3,0,W*sw+W*.3,H);lg.addColorStop(0,'rgba(255,220,150,0)');lg.addColorStop(.5,'rgba(255,220,150,.18)');lg.addColorStop(1,'rgba(255,220,150,0)');g.fillStyle=lg;g.fillRect(0,0,W,H);
      const ba=Math.min(1,Math.max(0,(t-.4)/1.6));const bd=g.createLinearGradient(0,H*.25,0,H*.6);bd.addColorStop(0,'rgba(0,0,0,0)');bd.addColorStop(.5,'rgba(0,0,0,'+.6*ba+')');bd.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=bd;g.fillRect(0,H*.25,W,H*.35);this.motesDraw(T,'#ffe6a0',true);this.title('Les Pierres de Midheim','An 147 AM',Math.min(1,Math.max(0,(t-.6)/1.6)))}
  }
};
addEventListener('resize',()=>{if(Cine.on)Cine.size()});
