/* ================= Appli installable + bandeau de mise à jour (même brique que FGC 2026) =================
   Service worker, bandeau « Nouvelle version disponible ». Ici la mise à jour est OBLIGATOIRE :
   tant qu'une nouvelle version attend, on ne peut ni lancer ni rejoindre une partie (les deux
   joueurs doivent avoir la même version). Inactif sans manifeste (version claude.ai) ou hors HTTPS. */
const Pwa={on:false,waiting:null,reg:null,clicked:false,reloading:false,lastCheck:0,
  init(){
    this.on=!!document.querySelector('link[rel="manifest"]')&&('serviceWorker' in navigator)&&window.isSecureContext;
    if(!this.on)return;
    const btn=$('#updateBtn');
    navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
      this.reg=reg;
      if(reg.waiting&&navigator.serviceWorker.controller)this.offer(reg.waiting);
      this.track(reg.installing);
      reg.addEventListener('updatefound',()=>this.track(reg.installing));
      this.lastCheck=Date.now();
      setInterval(()=>this.check(),10*60000);
    }).catch(()=>{/* PWA indisponible : le jeu fonctionne quand même */});
    /* Retour sur l'app (onglet réactivé, téléphone déverrouillé, réseau revenu) : vérification immédiate. */
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')this.check()});
    addEventListener('online',()=>this.check());
    addEventListener('pageshow',e=>{if(e.persisted)this.check()});
    btn.addEventListener('click',()=>{
      if(this.clicked)return;this.clicked=true;btn.setAttribute('aria-busy','true');btn.textContent='Mise à jour…';
      if(hero)doSave(true);
      /* La nouvelle version a déjà pris la main (depuis un autre onglet) : simple rechargement. */
      if(!this.waiting||this.waiting.state!=='installed'){this.reload();return}
      this.waiting.postMessage({type:'SKIP_WAITING'});
      setTimeout(()=>this.reload(),4000)});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(this.clicked)this.reload()});
  },
  reload(){if(this.reloading)return;this.reloading=true;location.reload()},
  offer(sw){this.waiting=sw;const b=$('#updateBanner');if(b.hidden){b.hidden=false;document.documentElement.classList.add('has-update')}},
  /* Suit un service worker en cours d'installation jusqu'à ce qu'il attende son tour. */
  track(sw){if(!sw)return;const done=()=>{if(sw.state==='installed'&&navigator.serviceWorker.controller)this.offer(sw)};done();sw.addEventListener('statechange',done)},
  /* Cherche une nouvelle version (au plus une fois par minute, sauf si on force). */
  check(force){if(!this.reg||!navigator.onLine||(!force&&Date.now()-this.lastCheck<60000))return Promise.resolve();
    this.lastCheck=Date.now();return this.reg.update().catch(()=>{})},
  blocked(){return!!this.waiting},
  nudge(){const b=$('#updateBanner');b.hidden=false;b.classList.remove('nudge');void b.offsetWidth;b.classList.add('nudge');},
  /* Porte d'entrée de toute partie : vérifie qu'on a la dernière version avant de lancer. */
  async gate(go){
    if(this.busy)return;
    if(!this.on||!this.reg){go();return}
    this.busy=true;try{await this.gate2(go)}finally{this.busy=false}},
  async gate2(go){
    if(this.blocked()){this.nudge();return}
    await within(this.check(true),2500);
    const inst=this.reg.installing;
    if(inst&&navigator.serviceWorker.controller){ // une version arrive : on l'attend, elle sera obligatoire
      const b=$('#updateBanner'),t=$('#updTxt');b.hidden=false;document.documentElement.classList.add('has-update');
      t.innerHTML='<b>Nouvelle version en cours de téléchargement…</b>Encore un instant.';
      await within(new Promise(r=>inst.addEventListener('statechange',()=>{if(inst.state!=='installing')r()})),20000);
      t.innerHTML='<b>Nouvelle version disponible.</b>Mets à jour pour lancer une partie.';
      if(inst.state==='installed')this.offer(inst);
      else{b.hidden=true;document.documentElement.classList.remove('has-update')}
    }
    if(this.blocked()){this.nudge();return}
    go()}
};
