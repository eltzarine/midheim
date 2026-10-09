/* ================= Ciel : heure du jour, météo, lune =================
   Horloge tirée de l'heure réelle : une journée de Midheim dure 24 minutes (1 minute = 1 heure).
   Les deux joueurs ont donc toujours la même heure et le même temps, sans rien échanger.
   Matin, midi, après-midi, soir, nuit ; beau, nuageux, pluie, orage, brume du matin ;
   la lune change chaque nuit et elle est pleine tous les 5 jours. */
const SKY_DAY=24*60000,SKY_EPOCH=Date.UTC(2026,9,9,18,0,0);
const SKY_W={beau:{nom:'Beau temps',cloud:.15,rain:0},nuages:{nom:'Nuageux',cloud:.65,rain:0},pluie:{nom:'Pluie',cloud:.9,rain:.75},orage:{nom:'Orage',cloud:1,rain:1,storm:1}};
const MOON=['Pleine lune','Lune décroissante','Dernier quartier','Fin croissant','Nouvelle lune'];
const Sky={secs:0,hour:12,day:1,dark:0,lamps:false,folkOut:1,tint:'26,18,48',gold:0,dawn:0,rain:0,cloud:0,fog:0,storm:0,flash:0,wkey:'beau',moon:0,
  drops:[],splash:[],acc:1,
  /* état du ciel à un instant donné (fonction pure : même résultat sur les deux téléphones) */
  at(now){const u=(now-SKY_EPOCH)/SKY_DAY+.25,day=Math.floor(u),hour=(u-day)*24;return{u,day:day+1,hour}},
  blockWeather(b){if(this.force)return this.force;const h=hash2(b,7,91);return h<.46?'beau':h<.72?'nuages':h<.94?'pluie':'orage'},
  moonOf(hour,day){const d=hour<6?day-1:day;return((d%5)+5)%5}, // 0 = pleine lune
  period(h){return h<5?'Nuit':h<7?'Aube':h<11?'Matin':h<14?'Midi':h<18?'Après-midi':h<21.5?'Soir':'Nuit'},
  /* off (ms) et force (clé météo) : seulement pour les tests */
  update(dt){if(this.off===undefined&&window.__skyHour!=null){const h=this.at(Date.now()).hour;this.off=((window.__skyHour-h+24)%24)/24*SKY_DAY;this.force=window.__skyWeather||null}
    const now=Date.now()+(this.off||0),s=this.at(now);this.secs=(now-SKY_EPOCH)/1000;this.hour=s.hour;this.day=s.day;const h=s.hour;
    // météo par tranches de 6 h, avec un fondu d'environ 20 minutes de jeu aux changements
    const bu=s.u*4,b=Math.floor(bu),f=bu-b,cur=SKY_W[this.blockWeather(b)];this.wkey=this.blockWeather(b);
    const edge=.08;let w=cur,nb=null,t=0;if(f>1-edge){nb=SKY_W[this.blockWeather(b+1)];t=(f-(1-edge))/edge*.5}else if(f<edge){nb=SKY_W[this.blockWeather(b-1)];t=(edge-f)/edge*.5}
    const mix=k=>(w[k]||0)*(1-t)+(nb?(nb[k]||0):(w[k]||0))*t;
    this.rain=mix('rain');this.cloud=mix('cloud');this.storm=mix('storm');
    // brume certains matins sans pluie
    this.fog=(h>4.5&&h<10&&this.rain<.1&&hash2(s.day,3,92)<.4)?Math.sin(Math.PI*(h-4.5)/5.5)*.9:0;
    // lune : pleine tous les 5 jours
    this.moon=this.moonOf(h,s.day);
    // obscurité selon l'heure
    const night=[.8,.84,.87,.9,.92][this.moon];let d;
    if(h<4.5||h>=21.5)d=night;else if(h<7)d=night*(1-(h-4.5)/2.5);else if(h<17)d=0;else if(h<19)d=.26*(h-17)/2;else d=.26+(night-.26)*(h-19)/2.5;
    this.dark=Math.min(.94,d+this.cloud*.06+this.rain*.2+this.storm*.08);
    this.gold=h>16.5&&h<20.5?Math.sin(Math.PI*(h-16.5)/4):0;this.dawn=h>4.5&&h<7.5?Math.sin(Math.PI*(h-4.5)/3):0;
    this.tint=d>=night*.8?(this.moon===0?'22,34,64':'8,14,34'):this.dawn>.2?'40,30,70':'34,18,52';
    this.lamps=this.dark>.16||this.rain>.6;
    this.folkOut=h<7||h>21?0:this.rain>.5?.4:1;
    // éclairs
    if(this.storm>.4&&this.flash<=0&&Math.random()<dt*.12){this.flash=1;this.thunder=1.2+Math.random()*1.5}
    this.flash=Math.max(0,this.flash-dt*3.5);if(this.thunder>0){this.thunder-=dt;if(this.thunder<=0)this.boom()}
    this.watch();this.audio()},
  /* ---- son de la pluie (bruit filtré) et tonnerre ---- */
  audio(){const c=Snd.ctx;if(!c)return;const outdoors=G&&G.m&&G.m.kind==='world'&&(mode==='solo'||mode==='host'||mode==='guest');
    if(!this.rainSrc){try{const src=c.createBufferSource();src.buffer=Snd.nb;src.loop=true;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=300;
        const gn=c.createGain();gn.gain.value=0;src.connect(hp).connect(lp).connect(gn).connect(c.destination);src.start();this.rainSrc=src;this.rainGain=gn}catch(e){return}}
    const v=Snd.on&&outdoors?this.rain*.07:0;this.rainGain.gain.setTargetAtTime(v,c.currentTime,.6)},
  boom(){const c=Snd.ctx;if(!c||!Snd.on||!(G&&G.m&&G.m.kind==='world'))return;try{const t=c.currentTime,s=c.createBufferSource();s.buffer=Snd.nb;s.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(220,t);f.frequency.exponentialRampToValueAtTime(60,t+2.4);
    const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.35,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+2.6);s.connect(f).connect(g).connect(c.destination);s.start(t);s.stop(t+2.7)}catch(e){}},
  /* ---- ombres des nuages qui glissent sur le sol (coordonnées du monde) ---- */
  drawWorld(x0,y0,x1,y1){const k=this.cloud;if(k<.05)return;const g=ctx,t=this.secs,sp=900;
    for(let i=0;i<10;i++){const ox=hash2(i,1,93)*sp*4,oy=hash2(i,2,94)*sp*3,cx=((ox+t*14)%(sp*4)),cy=oy%(sp*3);
      // on répète le motif autour de la vue
      const bx=Math.floor((x0-sp)/(sp*4))*(sp*4)+cx,by=Math.floor((y0-sp)/(sp*3))*(sp*3)+cy;
      for(let X=bx;X<x1+sp;X+=sp*4)for(let Y=by;Y<y1+sp;Y+=sp*3){const r=300+hash2(i,3,95)*260;if(X+r<x0||X-r>x1||Y+r<y0||Y-r>y1)continue;
        const gr=g.createRadialGradient(X,Y,0,X,Y,r);gr.addColorStop(0,'rgba(18,26,38,'+(.34*k)+')');gr.addColorStop(.55,'rgba(18,26,38,'+(.2*k)+')');gr.addColorStop(1,'rgba(20,28,40,0)');g.fillStyle=gr;g.fillRect(X-r,Y-r,r*2,r*2)}}},
  /* ---- pluie, brume, lumière dorée, éclairs (coordonnées de l'écran) ---- */
  drawScreen(dt){const g=ctx,W=cv.width,H=cv.height,s=dpr;g.save();g.setTransform(1,0,0,1,0,0);
    if(this.gold>0){g.fillStyle='rgba(255,130,50,'+(.16*this.gold*(1-this.rain))+')';g.fillRect(0,0,W,H)}
    if(this.dawn>0){g.fillStyle='rgba(255,170,190,'+(.06*this.dawn)+')';g.fillRect(0,0,W,H)}
    if(this.fog>0){for(let i=0;i<5;i++){const x=((hash2(i,5,96)*W+this.secs*(8+i*3)*s)%(W*1.6))-W*.3,y=H*(.15+hash2(i,6,97)*.8),r=Math.max(W,H)*(.35+hash2(i,7,98)*.25);
        const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(225,230,235,'+(.28*this.fog)+')');gr.addColorStop(1,'rgba(225,230,235,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}}
    if(this.rain>.02){const n=Math.round(this.rain*170*Math.min(1.6,W*H/(800*600*s*s))*this.acc);
      while(this.drops.length<n)this.drops.push({x:Math.random()*W,y:Math.random()*H,v:.8+Math.random()*.5});this.drops.length=n;
      const ang=.22,len=16*s,vy=1100*s;g.strokeStyle='rgba(205,220,240,'+(.4+.25*this.rain)+')';g.lineWidth=1.3*s;g.beginPath();
      for(const d of this.drops){d.y+=vy*d.v*dt;d.x+=vy*d.v*dt*ang;if(d.y>H){d.y=-len;d.x=Math.random()*W*1.2-W*.2;if(Math.random()<.5)this.splash.push({x:Math.random()*W,y:H*(.2+Math.random()*.8),t:.35})}
        g.moveTo(d.x,d.y);g.lineTo(d.x-len*ang*d.v,d.y-len*d.v)}g.stroke();
      g.strokeStyle='rgba(210,225,240,.35)';g.lineWidth=1*s;for(const p of this.splash){p.t-=dt;const k=1-p.t/.35;g.globalAlpha=Math.max(0,p.t/.35);g.beginPath();g.ellipse(p.x,p.y,(2+k*6)*s,(1+k*2)*s,0,0,6.28);g.stroke()}
      g.globalAlpha=1;this.splash=this.splash.filter(p=>p.t>0).slice(-60)}
    else{this.drops.length=0;this.splash.length=0}
    if(this.flash>0){g.fillStyle='rgba(235,240,255,'+(.55*this.flash*this.flash)+')';g.fillRect(0,0,W,H)}
    g.restore()},
  /* ---- textes et icônes ---- */
  label(){return this.period(this.hour)},
  /* la nuit (21 h 30 – 5 h), dehors, les ennemis sont 4 fois plus forts */
  isNight(){return this.hour>=21.5||this.hour<5},
  mul(){return G&&G.m&&G.m.kind==='world'&&this.isNight()?4:1},
  /* à chaque changement de moment de la journée : tic-tac d'horloge (et annonce la nuit et l'aube) */
  watch(){const p=this.period(this.hour);if(this.lastP===undefined){this.lastP=p;return}if(p===this.lastP)return;const was=this.lastP;this.lastP=p;
    const out=G&&G.m&&G.m.kind==='world'&&(mode==='solo'||mode==='host'||mode==='guest');if(!out)return;this.tick();
    if(p==='Nuit')toast('La nuit tombe : les ennemis sont 4 fois plus forts.');else if(was==='Nuit')toast('Le jour se lève : les ennemis retrouvent leur force normale.');else toast(p==='Midi'?'Il est midi.':p+'.')},
  tick(){const c=Snd.ctx;if(!c||!Snd.on)return;try{const t0=c.currentTime;for(let k=0;k<4;k++){const t=t0+k*.42,s=c.createBufferSource();s.buffer=Snd.nb;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=k%2?2600:3400;f.Q.value=9;
      const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.32,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.05);s.connect(f).connect(g).connect(c.destination);s.start(t);s.stop(t+.06)}}catch(e){}},
  clock(){const h=Math.floor(this.hour),m=Math.floor((this.hour-h)*60/15)*15;return h+' h '+String(m).padStart(2,'0')},
  weatherName(){return this.rain>.5?(this.storm>.5?'Orage':'Pluie'):this.fog>.3?'Brume':this.cloud>.5?'Nuageux':'Beau temps'},
  nextFull(){if(this.moon===0&&(this.hour>=18||this.hour<6))return'Pleine lune cette nuit';const d=(5-this.moonOf(18,this.day))%5;return d===0?'Pleine lune ce soir':d===1?'Pleine lune demain soir':'Pleine lune dans '+d+' jours'},
  icon(){const night=this.hour<5.5||this.hour>=21;const w=this.rain>.5?(this.storm>.5?'orage':'pluie'):this.fog>.3?'brume':this.cloud>.5?'nuages':night?'lune':'soleil';return skyIcon(w,this.moon)}
};
/* Icônes en trait (pas d'emoji) : soleil, lune (selon la phase), nuages, pluie, orage, brume */
function skyIcon(k,phase){const S='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';
  const cloud='<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.3 1.6A3.3 3.3 0 0 0 7 18z" fill="rgba(255,255,255,.12)"/>';
  if(k==='soleil')return S+'<circle cx="12" cy="12" r="4.2" fill="#f0c95a" stroke="#f0c95a"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="#f0c95a"/></svg>';
  if(k==='lune'){const f=['#e8eefc','#e8eefc','#e8eefc','#e8eefc','none'][phase],cut=[0,4,7,10,0][phase];
    return S+'<circle cx="12" cy="12" r="7" stroke="#cfe2ff" fill="'+(phase===4?'none':f)+'"/>'+(cut?'<circle cx="'+(12-cut*1.0)+'" cy="12" r="7" fill="#13252c" stroke="none"/>':'')+'</svg>'}
  if(k==='nuages')return S+cloud+'</svg>';
  if(k==='pluie')return S+cloud.replace('M7 18','M7 15').replace('a4 4 0 0 0 .5-8','a4 4 0 0 0 .5-8')+'<path d="M8 19l-1 2.5M12 19l-1 2.5M16 19l-1 2.5" stroke="#8ec5e8"/></svg>';
  if(k==='orage')return S+cloud+'<path d="M12.5 13l-2.5 4h3l-2 4" stroke="#f0c95a"/></svg>';
  return S+'<path d="M4 9h16M3 13h18M5 17h14" opacity=".8"/></svg>'}
