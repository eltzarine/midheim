/* ================= Son : bruitages d'épopée (synthèse, sans fichiers) ================= */
const Snd={ctx:null,on:true,last:{},bus:null,nb:null,
  init(){if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});return}try{this.ctx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}if(this.ctx){this.mkBus();Music.init()}},
  mkBus(){const c=this.ctx;const out=c.createGain();out.gain.value=.9;out.connect(c.destination);const dry=c.createGain();dry.gain.value=1;dry.connect(out);
    const len=Math.floor(c.sampleRate*1.1),ir=c.createBuffer(2,len,c.sampleRate);for(let q=0;q<2;q++){const d=ir.getChannelData(q);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,4)}
    const cv=c.createConvolver();cv.buffer=ir;const wet=c.createGain();wet.gain.value=.22;cv.connect(wet).connect(out);
    this.bus=c.createGain();this.bus.connect(dry);this.bus.connect(cv);
    const b=c.createBuffer(1,c.sampleRate,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.nb=b},
  // ---- briques ----
  env(g,t,a,v,d){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)},
  noise(t,d,type,f0,f1,q,v,a){const c=this.ctx,s=c.createBufferSource();s.buffer=this.nb;s.loop=true;const f=c.createBiquadFilter();f.type=type;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+d);
    const g=c.createGain();s.connect(f).connect(g).connect(this.bus);this.env(g,t,a||.01,v,d);s.start(t);s.stop(t+d+(a||.01)+.05)},
  osc(t,type,f0,f1,d,v,a,dest){const c=this.ctx,o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);const g=c.createGain();o.connect(g).connect(dest||this.bus);this.env(g,t,a||.005,v,d);o.start(t);o.stop(t+d+(a||.005)+.05);return o},
  metal(t,f,v,d){for(const[r,k]of[[1,1],[2.76,.6],[5.4,.35],[8.93,.2],[13.3,.1]])this.osc(t,'sine',f*r,null,d*(1.2-k*.5),v*k,.002)},
  bell(t,f,v,d){this.osc(t,'sine',f,null,d,v,.003);this.osc(t,'sine',f*2.01,null,d*.6,v*.4,.003);this.osc(t,'sine',f*3.02,null,d*.35,v*.18,.003)},
  thud(t,f,v){this.osc(t,'sine',f,f*.42,.28,v,.004);this.noise(t,.12,'lowpass',900,200,.7,v*.5)},
  whoosh(t,d,f0,f1,v){this.noise(t,d,'bandpass',f0,f1,1.6,v,d*.35)},
  horn(t,f,d,v){const c=this.ctx,fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(300,t);fl.frequency.linearRampToValueAtTime(1400,t+.15);fl.connect(this.bus);
    for(const det of[-7,6]){const o=this.osc(t,'sawtooth',f,null,d,v*.5,.08,fl);o.detune.value=det}},
  voice(t,f,d,v){const c=this.ctx,mix=c.createGain(),out=c.createGain();out.connect(this.bus);
    for(const[fr,q,a]of[[650,5,1],[1100,7,.5],[2500,9,.2]]){const b=c.createBiquadFilter();b.type='bandpass';b.frequency.value=fr;b.Q.value=q;const ga=c.createGain();ga.gain.value=a;mix.connect(b).connect(ga).connect(out)}
    for(const det of[-10,0,10]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;o.connect(mix);o.start(t);o.stop(t+d+.6)}
    out.gain.setValueAtTime(.0001,t);out.gain.linearRampToValueAtTime(v,t+d*.4);out.gain.exponentialRampToValueAtTime(.0001,t+d+.5)},
  tone(f,d,type,v){if(!this.ctx||!this.bus)return;this.osc(this.ctx.currentTime,type||'sine',f,null,d,v||.05)},
  play(k){if(!this.on||!this.ctx)return;if(!this.bus)this.mkBus();const now=performance.now();if(this.last[k]&&now-this.last[k]<45)return;this.last[k]=now;const t=this.ctx.currentTime+.005;
    switch(k){
      case'swing':this.whoosh(t,.2,2600,520,.22);this.osc(t,'sine',190,90,.12,.05);break;
      case'fire':this.whoosh(t,.3,500,2400,.14);this.osc(t,'triangle',660,1320,.28,.035,.02);this.osc(t+.04,'sine',990,1980,.3,.025,.02);break;
      case'hit':this.thud(t,150,.2);this.metal(t,430+Math.random()*80,.035,.18);this.noise(t,.05,'highpass',2500,null,.7,.08);break;
      case'crit':this.thud(t,120,.26);this.metal(t,620,.06,.5);this.whoosh(t,.12,4000,1200,.12);break;
      case'hurt':this.thud(t,95,.26);this.noise(t,.18,'bandpass',700,300,2,.08);this.osc(t,'sawtooth',150,90,.16,.03);break;
      case'coin':this.bell(t,1567,.05,.4);this.bell(t+.07,2093,.045,.5);break;
      case'pot':for(let i=0;i<4;i++)this.osc(t+i*.06,'sine',300+i*90,520+i*120,.07,.06,.005);this.bell(t+.28,1318,.04,.6);break;
      case'lvl':{const D=[293.7,370,440,587.3];D.forEach((f,i)=>this.horn(t+i*.11,f,.5+(3-i)*.1,.07));this.horn(t+.5,587.3,1.1,.09);this.horn(t+.5,440,1.1,.06);this.voice(t+.45,293.7,1.3,.05);this.voice(t+.45,440,1.3,.035);this.thud(t+.5,70,.3);break}
      case'key':[1318,1661,1976].forEach((f,i)=>this.bell(t+i*.09,f,.045,.9));break;
      case'boom':this.osc(t,'sine',85,32,.7,.4,.005);this.noise(t,.9,'lowpass',700,120,.7,.3);this.noise(t,.08,'highpass',1800,null,.7,.12);break;
      case'nova':for(let i=0;i<7;i++)this.bell(t+i*.035,1800+Math.random()*1600,.025,.6);this.whoosh(t,.5,800,5000,.1);break;
      case'heal':[587.3,740,880,1174.7,1480].forEach((f,i)=>this.osc(t+i*.055,'triangle',f,null,.9,.04,.004));this.voice(t+.1,587.3,.9,.04);this.voice(t+.1,880,.9,.025);break;
      case'die':this.thud(t,110,.18);this.noise(t,.35,'bandpass',900,200,1.2,.08,.02);break;
      case'gate':this.noise(t,1.1,'lowpass',260,90,.8,.28,.08);this.thud(t+.9,60,.3);break;
      case'stairs':this.horn(t,146.8,.55,.08);this.horn(t+.45,220,.9,.09);this.noise(t,.6,'lowpass',300,120,.7,.06,.1);break;
      case'dash':this.whoosh(t,.22,900,3800,.2);break;
      case'chest':this.noise(t,.3,'bandpass',420,700,8,.12,.04);this.osc(t,'sawtooth',90,130,.28,.02,.04);this.bell(t+.25,1046.5,.04,.6);this.bell(t+.33,1568,.04,.8);break;
    }}
};

