/* ================= Musique (compositions originales, jouées par synthèse) ================= */
const NOTE=n=>{const m=/^([A-G])(b|#)?(\d)$/.exec(n);const b={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]]+(m[2]==='b'?-1:m[2]==='#'?1:0);return 12*(+m[3]+1)+b};
const hz=m=>440*Math.pow(2,(m-69)/12);
const ch=(...n)=>n.map(NOTE);
const mel=str=>str.trim().split(/\s+/).map(t=>{const[n,d]=t.split(':');return[n==='-'?null:NOTE(n),+d]});
const mels=a=>a.map(mel);

/* Thèmes originaux dans l'esprit des grandes épopées de fantasy : flûte irlandaise, cordes, cors, chœurs et timbales */
const THEMES={
  // « La Communauté des Pierres » : menu, ré majeur, large et lyrique
  menu:{bpm:76,beats:4,acc:'fellow',
    chords:[ch('D3','F#3','A3'),ch('B2','D3','F#3'),ch('G2','B2','D3'),ch('A2','C#3','E3'),ch('D3','F#3','A3'),ch('G2','B2','D3'),ch('E3','G3','B3'),ch('A2','C#3','E3')],
    melA:mels(['D5:1.5 E5:.5 F#5:1 A5:1','B5:2 A5:1 F#5:1','G5:1.5 F#5:.5 E5:1 D5:1','E5:3 -:1','F#5:1 A5:1 D6:1.5 C#6:.5','B5:2 G5:1 A5:1','F#5:1 E5:1 D5:1 B4:1','A4:2 C#5:2']),
    melB:mels(['A4:2 D5:1 E5:1','F#5:2 E5:1 D5:1','B4:2 D5:1 G5:1','F#5:2 E5:2','A5:1.5 G5:.5 F#5:1 D5:1','E5:1.5 D5:.5 B4:2','D5:1 E5:1 F#5:1 G5:1','A5:4']),
    lead:'whistle',lead2:'horn',mv:.05},
  // « Ce qui dort sous la montagne » : cinématique, voix seule et cordes
  cine:{bpm:58,beats:4,acc:'cine2',
    chords:[ch('B2','D3','F#3'),ch('G2','B2','D3'),ch('D3','F#3','A3'),ch('A2','C#3','E3'),ch('B2','D3','F#3'),ch('E3','G3','B3'),ch('G2','B2','D3'),ch('F#2','A#2','C#3')],
    melA:mels(['F#5:2 B5:2','A5:1.5 G5:.5 F#5:2','D5:2 F#5:1 A5:1','E5:4','F#5:1 G5:1 A5:1 B5:1','B5:2 G5:2','F#5:1.5 E5:.5 D5:2','C#5:4']),
    lead:'voice',lead2:'whistle',mv:.045,skip0:true},
  // « La Comté de Tarkin » : villes et auberges, sol majeur à 6/8
  town:{bpm:216,beats:6,acc:'shire',
    chords:[ch('G3','B3','D4'),ch('C3','E3','G3'),ch('G3','B3','D4'),ch('D3','F#3','A3'),ch('E3','G3','B3'),ch('C3','E3','G3'),ch('D3','F#3','A3'),ch('G3','B3','D4'),
            ch('C3','E3','G3'),ch('G3','B3','D4'),ch('A2','C3','E3'),ch('D3','F#3','A3'),ch('G3','B3','D4'),ch('E3','G3','B3'),ch('D3','F#3','A3'),ch('G3','B3','D4')],
    melA:mels(['D5:2 E5:1 G5:2 A5:1','B5:2 A5:1 G5:3','D5:2 E5:1 G5:1 A5:1 B5:1','A5:3 F#5:2 D5:1','E5:2 G5:1 B5:2 A5:1','G5:2 E5:1 C5:3','D5:2 F#5:1 A5:2 F#5:1','G5:6',
               'E5:2 G5:1 C6:2 B5:1','B5:2 A5:1 G5:3','A5:2 C6:1 B5:1 A5:1 G5:1','F#5:3 A5:3','G5:2 B5:1 D6:2 B5:1','B5:2 G5:1 E5:3','C5:2 E5:1 D5:1 F#5:1 A5:1','G5:6']),
    lead:'whistle',lead2:'fiddle',mv:.045},
  // « Les Plaines du Cheval » : exploration, ré dorien, violon et cors
  explore:{bpm:100,beats:4,acc:'rohan',
    chords:[ch('D3','F3','A3'),ch('C3','E3','G3'),ch('D3','F3','A3'),ch('Bb2','D3','F3'),ch('F3','A3','C4'),ch('C3','E3','G3'),ch('D3','F3','A3'),ch('A2','C#3','E3')],
    melA:mels(['D5:1 E5:.5 F5:.5 A5:1.5 G5:.5','F5:1 E5:1 C5:2','D5:1 F5:1 A5:1 D6:1','C6:1.5 Bb5:.5 A5:2','A5:1 C6:1 F5:1 A5:1','G5:1.5 F5:.5 E5:2','F5:1 E5:1 D5:1 C5:1','D5:2 C#5:2']),
    melB:mels(['A4:2 D5:2','C5:2 G4:2','A4:1 D5:1 F5:2','F5:2 D5:2','C5:1 F5:1 A5:2','G5:2 E5:2','F5:1.5 E5:.5 D5:2','E5:4']),
    lead:'fiddle',lead2:'horn',mv:.05},
  // « Les Salles Profondes » : donjons, chœur d'hommes et tambours de pierre
  dungeon:{bpm:84,beats:4,acc:'moria',
    chords:[ch('D3','F3','A3'),ch('D3','F3','A3'),ch('Eb3','G3','Bb3'),ch('D3','F3','A3'),ch('Bb2','D3','F3'),ch('C3','Eb3','G3'),ch('Eb3','G3','Bb3'),ch('D3','F3','A3')],
    melA:mels(['D4:2 D4:1 F4:1','E4:2 D4:2','D4:1 F4:1 G4:1 A4:1','G4:2 F4:1 Eb4:1','F4:2 D4:2','Eb4:1 G4:1 F4:1 Eb4:1','Eb4:2 D4:2','D4:4']),
    melB:mels(['A4:2 A4:1 C5:1','Bb4:2 A4:2','A4:1 C5:1 D5:1 Eb5:1','D5:2 C5:1 Bb4:1','A4:2 F4:2','G4:1 Bb4:1 A4:1 G4:1','Bb4:2 A4:2','A4:4']),
    lead:'chant',lead2:'horn',mv:.05},
  // « Le Pays de l'Ombre » : boss, mi mineur à 5/4, cuivres et chœur
  boss:{bpm:132,beats:5,acc:'mordor',
    chords:[ch('E3','G3','B3'),ch('E3','G3','B3'),ch('C3','E3','G3'),ch('B2','D#3','F#3'),ch('E3','G3','B3'),ch('E3','G3','B3'),ch('A2','C3','E3'),ch('B2','D#3','F#3')],
    melA:mels(['E5:2 G5:1 F#5:1 E5:1','B5:2 A5:1 G5:2','C6:2 B5:1 A5:1 G5:1','F#5:3 D#5:2','E5:1 G5:1 B5:2 A5:1','G5:2 F#5:1 E5:2','A5:2 C6:1 B5:1 A5:1','B5:3 D#5:2']),
    lead:'brass',lead2:'choirL',mv:.045}
};
function makeSynth(c,dest){
  const noise=(()=>{const b=c.createBuffer(1,c.sampleRate*1.2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b})();
  const env=(g,t,a,peak,hold,rel)=>{g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+hold+rel)};
  const osc=(type,f,t,stop,to)=>{const o=c.createOscillator();o.type=type;o.frequency.value=f;o.connect(to);o.start(t);o.stop(stop);return o};
  const vib=(o,t,stop,rate,depth,delay)=>{const l=c.createOscillator();l.frequency.value=rate;const lg=c.createGain();lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(depth,t+(delay||.15));l.connect(lg);for(const x of o)lg.connect(x.frequency);l.start(t);l.stop(stop)};
  const nz=(t,d,type,f,q,v,to)=>{const s=c.createBufferSource();s.buffer=noise;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q||.7;const g=c.createGain();s.connect(fl).connect(g).connect(to||dest);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);s.start(t);s.stop(t+d+.05)};
  return{
    pad(m,t,d,v){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1100;const g=c.createGain();f.connect(g).connect(dest);
      for(const det of[-8,8])osc('sawtooth',hz(m),t,t+d+1.2,f).detune.value=det;env(g,t,.35,v||.018,Math.max(0,d-.35),.9)},
    choir(m,t,d,v){const g=c.createGain();g.connect(dest);const mix=c.createGain();
      for(const[fr,q,a]of[[750,4,1],[1200,6,.6],[2600,8,.25]]){const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=fr;f.Q.value=q;const ga=c.createGain();ga.gain.value=a;mix.connect(f).connect(ga).connect(g)}
      const os=[-9,0,9].map(det=>{const o=osc('sawtooth',hz(m),t,t+d+1.6,mix);o.detune.value=det;return o});vib(os,t,t+d+1.6,4.8,hz(m)*.004,.6);env(g,t,.7,(v||.03)*2.2,Math.max(0,d-.7),1.2)},
    pluck(m,t,v,dec){const g=c.createGain();g.connect(dest);const o=osc('triangle',hz(m),t,t+(dec||1.2)+.1,g);const g2=c.createGain();g2.gain.value=.35;g2.connect(g);osc('sine',hz(m+12),t,t+(dec||1.2)+.1,g2);
      g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v||.05,t+.004);g.gain.exponentialRampToValueAtTime(0.0001,t+(dec||1.2))},
    flute(m,t,d,v){const g=c.createGain();g.connect(dest);const o=osc('sine',hz(m),t,t+d+.4,g);const g2=c.createGain();g2.gain.value=.22;g2.connect(g);const o2=osc('triangle',hz(m),t,t+d+.4,g2);
      vib([o,o2],t,t+d+.4,5.4,hz(m)*.007,.18);nz(t,.06,'bandpass',hz(m)*2,2,(v||.05)*.25,g);env(g,t,.05,v||.05,Math.max(.02,d-.12),.22)},
    horn(m,t,d,v){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(350,t);f.frequency.linearRampToValueAtTime(1500,t+.12);f.frequency.linearRampToValueAtTime(1000,t+d);const g=c.createGain();f.connect(g).connect(dest);
      const os=[osc('sawtooth',hz(m),t,t+d+.4,f),osc('square',hz(m-12),t,t+d+.4,f)];os[1].detune.value=4;vib(os,t,t+d+.4,5,hz(m)*.004,.3);env(g,t,.06,(v||.04)*.8,Math.max(.02,d-.12),.2)},
    brass(m,t,d,v){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(2400,t+.05);f.frequency.linearRampToValueAtTime(1100,t+d);const g=c.createGain();f.connect(g).connect(dest);
      for(const det of[-6,6])osc('sawtooth',hz(m),t,t+d+.3,f).detune.value=det;env(g,t,.03,v||.04,Math.max(.02,d-.08),.14)},
    fiddle(m,t,d,v){const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1700;f.Q.value=.6;const g=c.createGain();f.connect(g).connect(dest);
      const o=osc('sawtooth',hz(m),t,t+d+.2,f);vib([o],t,t+d+.2,6.2,hz(m)*.006,.12);env(g,t,.015,(v||.04)*1.4,Math.max(.02,d*.8-.03),.09)},
    stac(m,t,v){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1400;const g=c.createGain();f.connect(g).connect(dest);for(const det of[-5,5])osc('sawtooth',hz(m),t,t+.25,f).detune.value=det;env(g,t,.006,v||.03,.04,.1)},
    bass(m,t,d,v){const g=c.createGain();g.connect(dest);osc('triangle',hz(m),t,t+d+.3,g);const gs=c.createGain();gs.gain.value=.6;gs.connect(g);osc('sine',hz(m-12),t,t+d+.3,gs);env(g,t,.01,v||.1,Math.max(.02,d*.6),d*.4+.08)},
    kick(t,v){const g=c.createGain();g.connect(dest);const o=c.createOscillator();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.16);o.connect(g);g.gain.setValueAtTime(v||.22,t);g.gain.exponentialRampToValueAtTime(0.0001,t+.3);o.start(t);o.stop(t+.32)},
    snare(t,v){nz(t,.16,'highpass',1300,.7,v||.06);const g=c.createGain();g.connect(dest);const o=c.createOscillator();o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(140,t+.08);o.connect(g);g.gain.setValueAtTime((v||.06)*.7,t);g.gain.exponentialRampToValueAtTime(0.0001,t+.1);o.start(t);o.stop(t+.12)},
    hat(t,v,d){nz(t,d||.04,'highpass',7500,.7,v||.018)},
    tom(t,v,f){const g=c.createGain();g.connect(dest);const o=c.createOscillator();o.frequency.setValueAtTime(f||110,t);o.frequency.exponentialRampToValueAtTime((f||110)*.55,t+.3);o.connect(g);g.gain.setValueAtTime(v||.16,t);g.gain.exponentialRampToValueAtTime(0.0001,t+.45);o.start(t);o.stop(t+.5);nz(t,.06,'lowpass',900,.7,(v||.16)*.3)},
    crash(t,v){nz(t,1.4,'highpass',4500,.5,v||.03)}
  }}
const ACC={
  epic(S,chd,t0,b,k,pass,n){const r=chd[0];for(const m of chd)S.pad(m+12,t0,b*4,.014);if(pass>0)S.choir(chd[1]+12,t0,b*4,.02);
    for(let j=0;j<8;j++)S.stac((j%2?chd[2]:r)+12,t0+j*b/2,j%2?.022:.03);S.bass(r-12,t0,b*1.5);S.bass(r-12,t0+b*2,b*1.5,.08);
    S.tom(t0,.2,72);S.tom(t0+b*2.5,.12,72);S.tom(t0+b*3,.16,82);if(k===0)S.crash(t0,.03);if(k===n-1)for(let j=0;j<4;j++)S.snare(t0+b*3+j*b/4,.02+j*.008);if(pass>0)for(let j=0;j<4;j++)S.hat(t0+j*b+b/2,.012)},
  cine(S,chd,t0,b,k,pass){const r=chd[0];for(const m of chd)S.pad(m+12,t0,b*4,.012);S.choir(chd[0]+12,t0,b*4,.022);if(k%2===0)S.choir(chd[2]+12,t0,b*4,.014);
    S.bass(r-12,t0,b*3.5,.07);const ar=[0,1,2,3,2,1,0,1].map(q=>[chd[0],chd[1],chd[2],chd[0]+12][q]+24);ar.forEach((m,j)=>S.pluck(m,t0+j*b/2,.022,1.6));if(k%2===0)S.tom(t0,.14,60)},
  jig(S,chd,t0,b,k,pass){const r=chd[0];S.bass(r-12,t0,b*1.6,.1);S.bass(chd[2]-12,t0+b*3,b*1.6,.08);
    for(const at of[2,5])for(const m of chd)S.pluck(m+12,t0+at*b,.024,.35);S.tom(t0,.11,140);S.tom(t0+3*b,.08,150);for(const at of[1,2,4,5])S.hat(t0+at*b,at%3===2?.02:.012,.05);
    if(pass%2===1)S.pad(chd[0]+12,t0,b*6,.01)},
  gallop(S,chd,t0,b,k,pass,n){const r=chd[0];for(const m of chd)S.pad(m+12,t0,b*4,.012);
    for(let j=0;j<4;j++)for(const[o,v]of[[0,.03],[.5,.02],[.75,.022]])S.stac((o===0?r:chd[2])+12,t0+(j+o)*b,v);
    S.bass(r-12,t0,b*.9);S.bass(r-12,t0+b*1.5,b*.4,.07);S.bass(r-12,t0+b*2,b*.9);S.bass(chd[2]-12,t0+b*3.5,b*.4,.07);
    S.kick(t0,.2);S.kick(t0+b*2,.18);if(pass>0||k>=4){S.snare(t0+b,.045);S.snare(t0+b*3,.05)}for(let j=0;j<8;j++)S.hat(t0+j*b/2,j%2?.01:.016);
    if(k===n-1){S.tom(t0+b*3,.12,150);S.tom(t0+b*3.25,.12,125);S.tom(t0+b*3.5,.14,100);S.tom(t0+b*3.75,.16,80)}if(k===0&&pass>0)S.crash(t0,.025)},
  drive(S,chd,t0,b,k,pass){const r=chd[0];for(const m of chd)S.pad(m,t0,b*4,.014);if(pass%2===1)S.choir(r+12,t0,b*4,.018);
    const pat=[0,0,12,0,0,7,0,10,0,0,12,0,7,0,5,3];pat.forEach((q,j)=>S.stac(r+q,t0+j*b/4,j%4===0?.03:.018));S.bass(r-12,t0,b*2,.09);S.bass(r-12,t0+b*2,b*2,.08);
    S.tom(t0,.16,70);S.tom(t0+b*1.5,.1,80);S.tom(t0+b*2,.15,70);if(k%2===1){S.tom(t0+b*3.5,.1,95);S.tom(t0+b*3.75,.12,85)}for(let j=0;j<4;j++)S.hat(t0+j*b+b/2,.012)},
  battle(S,chd,t0,b,k,pass,n){const r=chd[0];for(const m of chd)S.pad(m+12,t0,b*4,.012);S.choir(r+12,t0,b*4,.02);
    for(let j=0;j<8;j++)S.bass(r-12+(j===7?7:0),t0+j*b/2,b/2,.1);for(let j=0;j<4;j++){S.kick(t0+j*b,.2);if(j%2)S.snare(t0+j*b,.06)}for(let j=0;j<8;j++)S.hat(t0+j*b/2,.014);
    S.brass(chd[2]+12,t0,b*.35,.03);S.brass(chd[2]+12,t0+b*.5,b*.35,.025);S.brass(r+12,t0+b*1.5,b*.4,.03);if(k===n-1)for(let j=0;j<4;j++)S.tom(t0+b*3+j*b/4,.14,150-j*20);if(k===0)S.crash(t0,.03)}
};
/* instruments d'orchestre supplémentaires */
function makeSynth2(c,dest){const S=makeSynth(c,dest);
  const noise=(()=>{const b=c.createBuffer(1,c.sampleRate*1.2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b})();
  const env=(g,t,a,peak,hold,rel)=>{g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+hold+rel)};
  const osc=(type,f,t,stop,to)=>{const o=c.createOscillator();o.type=type;o.frequency.value=f;o.connect(to);o.start(t);o.stop(stop);return o};
  const vib=(os,t,stop,rate,depth,delay)=>{const l=c.createOscillator();l.frequency.value=rate;const lg=c.createGain();lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(depth,t+(delay||.15));l.connect(lg);for(const x of os)lg.connect(x.frequency);l.start(t);l.stop(stop)};
  const nz=(t,d,type,f,q,v,to)=>{const s=c.createBufferSource();s.buffer=noise;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q||.7;const g=c.createGain();s.connect(fl).connect(g).connect(to||dest);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);s.start(t);s.stop(t+d+.05)};
  const formant=(m,t,d,v,F,dets,a,vibD)=>{const g=c.createGain();g.connect(dest);const mix=c.createGain();
    for(const[fr,q,amp]of F){const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=fr;f.Q.value=q;const ga=c.createGain();ga.gain.value=amp;mix.connect(f).connect(ga).connect(g)}
    const os=dets.map(det=>{const o=osc('sawtooth',hz(m),t,t+d+1.4,mix);o.detune.value=det;return o});vib(os,t,t+d+1.4,5,hz(m)*(vibD||.005),.4);env(g,t,a,v,Math.max(0,d-a),1)};
  Object.assign(S,{
    strings(m,t,d,v){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=m<52?900:1900;f.Q.value=.4;const g=c.createGain();f.connect(g).connect(dest);
      const os=[-13,-5,5,13].map(det=>{const o=osc('sawtooth',hz(m),t,t+d+1.2,f);o.detune.value=det;return o});vib(os,t,t+d+1.2,5.2,hz(m)*.003,.4);env(g,t,Math.min(.45,d*.4),v||.012,Math.max(0,d-.45),.8)},
    whistle(m,t,d,v){v=v||.05;const g=c.createGain();g.connect(dest);
      if(d>.22){const gg=c.createGain();gg.connect(dest);osc('sine',hz(m+2),t,t+.06,gg);gg.gain.setValueAtTime(v*.7,t);gg.gain.exponentialRampToValueAtTime(.0001,t+.05);t+=.035;d-=.035}
      const o=osc('sine',hz(m),t,t+d+.3,g);const g2=c.createGain();g2.gain.value=.12;g2.connect(g);const o2=osc('triangle',hz(m*1),t,t+d+.3,g2);
      vib([o,o2],t,t+d+.3,5.8,hz(m)*.009,.25);nz(t,Math.min(.5,d),'bandpass',hz(m)*1.5,1.5,v*.12,g);env(g,t,.03,v,Math.max(.02,d-.08),.18)},
    voice(m,t,d,v){formant(m,t,d,(v||.04)*1.6,[[800,5,1],[1150,7,.55],[2900,9,.25]],[-6,0,6],.5,.008)},
    chant(m,t,d,v){formant(m,t,d,(v||.05)*1.7,[[420,4,1],[800,6,.5],[2400,9,.12]],[-11,-3,4,12],.18,.003);formant(m-12,t,d,(v||.05)*1.1,[[380,4,1],[720,6,.4]],[-7,7],.2,.002)},
    choirL(m,t,d,v){formant(m,t,d,(v||.04)*1.5,[[700,5,1],[1100,7,.5],[2600,9,.2]],[-12,-4,4,12],.12,.004)},
    harp(m,t,v,dec){dec=dec||1.6;const g=c.createGain();g.connect(dest);osc('triangle',hz(m),t,t+dec+.1,g);const g2=c.createGain();g2.gain.value=.4;g2.connect(g);osc('sine',hz(m+12),t,t+dec*.5,g2);
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v||.04,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+dec);nz(t,.02,'highpass',3000,.7,(v||.04)*.3,g)},
    timp(t,v,f){f=f||73;const g=c.createGain();g.connect(dest);const o=c.createOscillator();o.frequency.setValueAtTime(f*1.08,t);o.frequency.exponentialRampToValueAtTime(f,t+.08);o.connect(g);
      g.gain.setValueAtTime(v||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+1.3);o.start(t);o.stop(t+1.35);nz(t,.25,'lowpass',500,.7,(v||.2)*.35)},
    taiko(t,v){const g=c.createGain();g.connect(dest);const o=c.createOscillator();o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(36,t+.35);o.connect(g);
      g.gain.setValueAtTime(v||.3,t);g.gain.exponentialRampToValueAtTime(.0001,t+.8);o.start(t);o.stop(t+.85);nz(t,.18,'lowpass',380,.8,(v||.3)*.6)},
    anvil(t,v){for(const[r,k]of[[1,1],[2.76,.5],[5.4,.3]]){const g=c.createGain();g.connect(dest);osc('sine',1180*r,t,t+.7,g);g.gain.setValueAtTime((v||.03)*k,t);g.gain.exponentialRampToValueAtTime(.0001,t+.6/k*.5+.1)}}
  });return S}
const ACC2={
  fellow(S,chd,t0,b,k,pass,n){const r=chd[0];for(const m of chd)S.strings(m+12,t0,b*4,.009);S.strings(r-12,t0,b*4,.012);
    const ar=[0,1,2,3,2,1,2,3].map(q=>[chd[0],chd[1],chd[2],chd[0]+12][q]+24);ar.forEach((m,j)=>S.harp(m,t0+j*b/2,j%4===0?.035:.025,1.5));
    if(pass>0){S.choir(chd[0]+12,t0,b*4,.02);S.choir(chd[2]+12,t0,b*4,.014)}
    if(k===0)S.timp(t0,.22,hz(r-12));if(k===n-1)for(let j=0;j<8;j++)S.timp(t0+b*2+j*b/4,.05+j*.02,hz(r-12));if(k===3)S.timp(t0+b*3,.12,hz(r-12))},
  cine2(S,chd,t0,b,k){const r=chd[0];S.strings(r-12,t0,b*4,.014);S.strings(chd[2],t0,b*4,.009);S.choir(chd[0]+12,t0,b*4,.016);
    [0,2,4,6].forEach((q,j)=>S.harp([chd[0],chd[1],chd[2],chd[1]][j]+24,t0+q*b/2,.02,2.2));if(k%4===0)S.timp(t0,.15,hz(r-12))},
  shire(S,chd,t0,b,k,pass){const r=chd[0];S.harp(r-12,t0,.06,1.2);S.harp(chd[2]-12,t0+3*b,.05,1.2);
    for(const at of[1,2,4,5])for(const m of chd)S.harp(m+12,t0+at*b,.016,.45);
    S.tom(t0,.12,95);S.tom(t0+2*b,.05,120);S.tom(t0+3*b,.09,100);S.tom(t0+5*b,.05,125);
    S.strings(r-12,t0,b*6,.007);if(pass%2===1)S.pad(chd[1]+12,t0,b*6,.008)},
  rohan(S,chd,t0,b,k,pass,n){const r=chd[0];S.strings(r,t0,b*4,.008);S.strings(chd[2],t0,b*4,.007);
    [0,7,12,7,0,7,12,15].forEach((q,j)=>S.stac(r+q,t0+j*b/2,j%2?.016:.024));
    if(pass>0)S.horn(r-12,t0,b*3.6,.025);S.timp(t0,.2,hz(r-12));S.timp(t0+b*2,.15,hz(r-12));S.timp(t0+b*3.5,.08,hz(r-12));
    S.snare(t0+b,.02);S.snare(t0+b*3,.025);if(k===0&&pass>0)S.crash(t0,.022);if(k===n-1)for(let j=0;j<4;j++)S.timp(t0+b*3+j*b/4,.08+j*.03,hz(r-5))},
  moria(S,chd,t0,b,k,pass){const r=chd[0];S.chant(r-12,t0,b*4,.012);S.strings(r-24,t0,b*4,.014);
    S.taiko(t0,.34);S.taiko(t0+b*1.5,.16);S.taiko(t0+b*2,.24);S.taiko(t0+b*3,.18);if(k%2===1)S.taiko(t0+b*3.5,.14);
    if(k%2===1)S.anvil(t0+b*2,.02);if(k%2===0)S.brass(r-12,t0,b*.6,.02)},
  mordor(S,chd,t0,b,k,pass,n){const r=chd[0];S.choir(r+12,t0,b*5,.02);S.choir(chd[2]+12,t0,b*5,.014);S.strings(r-12,t0,b*5,.012);
    [0,0,3,0,2,0,0,3,5,3].forEach((q,j)=>S.stac(r+12+q,t0+j*b/2,j%5===0?.03:.02));
    for(const[at,v]of[[0,.36],[1,.2],[3,.3],[3.5,.18],[4,.22]])S.taiko(t0+at*b,v);
    S.brass(chd[2]+12,t0,b*.5,.03);S.brass(r+12,t0+b*3,b*.6,.03);if(k===0)S.crash(t0,.03);if(k===n-1)for(let j=0;j<6;j++)S.snare(t0+b*3.5+j*b/4,.02+j*.008)}};
Object.assign(ACC,ACC2);
function scheduleBar(T,i,t0,S){const b=60/T.bpm,n=T.chords.length,k=i%n,pass=Math.floor(i/n),chd=T.chords[k];
  ACC[T.acc](S,chd,t0,b,k,pass,n);
  if(T.skip0&&pass===0)return;const M=(pass%2&&T.melB)?T.melB:T.melA,inst=pass%2?T.lead2:T.lead,sh=inst==='horn'||inst==='brass'?-12:0;
  let t=t0;for(const[m,d]of M[k]){if(m!=null){S[inst](m+sh,t,d*b*.92,T.mv);if(T.acc==='jig'&&pass%2)S.flute(m+12,t,d*b*.9,T.mv*.45)}t+=d*b}}
function buildChain(c,dest){const out=c.createGain();const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=7000;const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3;const bus=c.createGain();
  const len=Math.floor(c.sampleRate*2.2),ir=c.createBuffer(2,len,c.sampleRate);for(let q=0;q<2;q++){const d=ir.getChannelData(q);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)}
  const conv=c.createConvolver();conv.buffer=ir;const wet=c.createGain();wet.gain.value=.28;const dry=c.createGain();dry.gain.value=.9;
  bus.connect(lp);lp.connect(dry).connect(comp);lp.connect(conv);conv.connect(wet).connect(comp);comp.connect(out);out.connect(dest);return{bus,out}}
const Music={on:true,vol:.7,c:null,ch:null,S:null,theme:null,want:'menu',bar:0,next:0,ducked:false,
  init(){if(this.c||!Snd.ctx)return;const v=Store.lsGet('dd_music');if(v===false)this.on=false;this.c=Snd.ctx;this.ch=buildChain(this.c,this.c.destination);this.S=makeSynth2(this.c,this.ch.bus);this.ch.out.gain.value=this.level();setInterval(()=>this.tick(),100);syncMusicBtn()},
  level(){return this.on?this.vol*(this.ducked?.4:1):0},
  apply(){if(!this.ch)return;const t=this.c.currentTime,g=this.ch.out.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.setTargetAtTime(this.level(),t,.25)},
  set(n){this.want=n},
  duck(on){if(this.ducked===on)return;this.ducked=on;this.apply()},
  toggle(){this.on=!this.on;Store.lsSet('dd_music',this.on);this.apply();syncMusicBtn()},
  tick(){const c=this.c;if(!c||c.state!=='running')return;
    if(this.theme!==this.want){const t=c.currentTime;const g=this.ch.bus.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0.0001,t+.6);g.linearRampToValueAtTime(1,t+.9);this.theme=this.want;this.bar=0;this.next=t+.75}
    const T=THEMES[this.theme];if(!T||!this.on)return;if(this.next<c.currentTime-1)this.next=c.currentTime+.05;
    while(this.next<c.currentTime+.5){scheduleBar(T,this.bar,this.next,this.S);this.next+=T.beats*60/T.bpm;this.bar++}}
};
function syncMusicBtn(){for(const id of['#bMusic','#bMusicMenu'])$(id).textContent='Musique : '+(Music.on?'activée':'coupée')}
