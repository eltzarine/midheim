/* ================= Écran de démarrage : reste affiché le temps de tout charger ================= */
const Splash={t0:performance.now(),
  set(label,frac){const s=$('#spStep'),b=$('#spBar');if(s&&label!=null)s.textContent=label;if(b)b.style.width=Math.round(Math.max(0,Math.min(1,frac))*100)+'%'},
  /* tâches : [libellé, poids, fonction (reçoit un rapporteur d'avancement 0..1)] */
  async run(tasks){const total=tasks.reduce((a,t)=>a+t[1],0);let done=0;
    for(const[label,w,fn]of tasks){this.set(label,done/total);
      try{await fn(p=>this.set(null,(done+w*Math.max(0,Math.min(1,p)))/total))}catch(e){}
      done+=w;this.set(null,done/total)}
    this.set('Prêt.',1)},
  async hide(){const sp=$('#splash');if(!sp)return;const wait=1600-(performance.now()-this.t0);if(wait>0)await sleep(wait);
    sp.classList.add('out');setTimeout(()=>sp.remove(),500)}
};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* Une étape ne bloque jamais le jeu : au-delà du délai, on passe à la suite. */
const within=(p,ms)=>Promise.race([Promise.resolve(p).catch(()=>{}),sleep(ms)]);

const Loader={
  fonts(){if(!document.fonts||!document.fonts.load)return;
    return within(Promise.all(['40px "Uncial Antiqua"','700 16px Cinzel','500 16px Cinzel','16px "Alegreya Sans"','700 16px "Alegreya Sans"'].map(f=>document.fonts.load(f))),5000)},
  images(){const imgs=[...document.images].filter(i=>i.src);
    return within(Promise.all(imgs.map(i=>i.decode?i.decode().catch(()=>{}):null)),5000)},
  /* Les voix enregistrées : chaque clip est décodé une fois pour qu'il parte sans attente. */
  async voices(report){const keys=Object.keys(VOICE_CLIPS);if(!keys.length)return;
    const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;let ac=null;try{if(OAC)ac=new OAC(1,1,44100)}catch(e){}
    let n=0;for(const k of keys){const url=VOICE_CLIPS[k];
      if(ac&&typeof url==='string'&&url.startsWith('data:')){try{const b=atob(url.slice(url.indexOf(',')+1)),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
        await within(new Promise((ok,ko)=>{const r=ac.decodeAudioData(u.buffer,ok,ko);if(r&&r.then)r.then(ok,ko)}),6000)}catch(e){}}
      report(++n/keys.length);await sleep(0)}},
  /* Voix de synthèse du téléphone (repli quand un clip manque) : elles arrivent un peu après le chargement. */
  speech(){if(!('speechSynthesis' in window))return;if(speechSynthesis.getVoices().length)return;
    return within(new Promise(r=>speechSynthesis.addEventListener('voiceschanged',r,{once:true})),2000)}
};
