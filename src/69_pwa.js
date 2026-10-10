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
    btn.addEventListener('click',()=>this.apply());
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(this.clicked)this.reload()});
  },
  /* « Mettre à jour » : en partie, on sauvegarde et on quitte proprement (la place à deux se libère), puis on recharge */
  apply(){const btn=$('#updateBtn');
    if(this.clicked)return;this.clicked=true;btn.setAttribute('aria-busy','true');btn.textContent='Mise à jour…';
    if(typeof mode!=='undefined'&&mode!=='menu'&&typeof quitGame==='function'){Log.ev('appli','mise à jour demandée en partie',mode);quitGame()}else if(hero)doSave(true);
    /* La nouvelle version a déjà pris la main (depuis un autre onglet) : simple rechargement. */
    if(!this.waiting||this.waiting.state!=='installed'){this.reload();return}
    this.waiting.postMessage({type:'SKIP_WAITING'});
    setTimeout(()=>this.reload(),4000)},
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
      t.innerHTML='<b>Nouvelle version disponible.</b><span class="u-menu">Mets à jour pour lancer une partie.</span><span class="u-game">Ta partie est sauvegardée avant la mise à jour.</span>';
      if(inst.state==='installed')this.offer(inst);
      else{b.hidden=true;document.documentElement.classList.remove('has-update')}
    }
    if(this.blocked()){this.nudge();return}
    go()}
};

/* ================= Navigateur intégré (Messenger, Facebook, Instagram…) =================
   Un lien ouvert depuis une appli s'affiche dans son navigateur intégré : la sauvegarde y reste
   enfermée (un héros créé là n'existe pas dans Safari), l'appli ne s'installe pas et le jeu à deux
   y est moins fiable. On le détecte et on propose d'ouvrir le jeu dans le vrai navigateur. Rien n'est bloqué. */
const Iab={
  APPS:[[/MessengerForiOS|MessengerLite|Orca-Android/,'Messenger'],[/FBAN|FBAV|FB_IAB|FBIOS|FB4A/,'Facebook ou Messenger'],[/Instagram/,'Instagram'],
    [/musical_ly|BytedanceWebview|TikTok/i,'TikTok'],[/Snapchat/,'Snapchat'],[/LinkedInApp/,'LinkedIn'],[/\bLine\//,'LINE'],[/; wv\)/,'une appli']],
  detect(ua){ua=ua||navigator.userAgent;for(const[re,n]of this.APPS)if(re.test(ua))return n;return null},
  ios(ua){ua=ua||navigator.userAgent;return/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)},
  android(ua){return/Android/.test(ua||navigator.userAgent)},
  url(){return location.href.split('#')[0]},
  /* adresse qui demande au téléphone d'ouvrir la page dans son navigateur :
     iPhone (iOS 17 et plus) : x-safari-https://… ; Android : intent:// vers le navigateur par défaut */
  openUrl(){const u=this.url();if(this.ios())return'x-safari-'+u;
    if(this.android()){const p=new URL(u);return'intent://'+p.host+p.pathname+p.search+'#Intent;scheme='+p.protocol.replace(':','')+';action=android.intent.action.VIEW;S.browser_fallback_url='+encodeURIComponent(u)+';end'}
    return u},
  init(){const app=this.detect();if(!app)return;
    const box=$('#iabBox');if(!box)return;const nav=this.ios()?'Safari':this.android()?'Chrome':'ton navigateur';
    Log.ev('navigateur','intégré : '+app);
    $('#iabApp').textContent=app==='une appli'?'le navigateur intégré d’une appli':'le navigateur de '+app;box.querySelectorAll('.iab-nav').forEach(e=>{e.textContent=nav});box.hidden=false;
    $('#iabOpen').onclick=()=>{Log.ev('navigateur','ouverture dans '+nav+' demandée');const t0=Date.now();
      try{location.href=this.openUrl()}catch(e){Log.warn('navigateur','ouverture impossible',e)}
      /* toujours là après un moment : la bascule n'a pas marché, on met en avant la marche à suivre */
      setTimeout(()=>{if(document.visibilityState==='visible'&&Date.now()-t0<4000){box.classList.add('fail');Log.warn('navigateur','toujours dans '+app+' après la demande')}},1500)};
    $('#iabCopy').onclick=async()=>{const u=this.url();let ok=false;
      try{await navigator.clipboard.writeText(u);ok=true}catch(e){}
      if(!ok){try{const i=document.createElement('textarea');i.value=u;i.setAttribute('readonly','');i.style.cssText='position:fixed;opacity:0;top:0';document.body.append(i);i.select();i.setSelectionRange(0,u.length);ok=document.execCommand('copy');i.remove()}catch(e){}}
      Log.ev('navigateur','copie du lien',ok?'réussie':'impossible');
      toast(ok?'Lien copié : colle-le dans '+nav+'.':'Copie impossible : le lien est '+u)}}
};
