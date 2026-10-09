/* ================= Journal de bord (débogage) =================
   Garde les derniers événements de la session (erreurs JavaScript, réseau, jeu à deux) et,
   sur le site public, les envoie dans Firebase : logs/<session> (règle à part dans la base,
   lisible par tous, écriture limitée à 16 000 caractères). Rien n'est affiché aux joueurs ; on les lit côté serveur :
   https://midheim-1a4c1-default-rtdb.europe-west1.firebasedatabase.app/logs.json */
const BUILD='@@BUILD@@';
/* lit une variable globale déclarée plus loin (let/const) sans erreur avant son initialisation */
const g_=f=>{try{return f()}catch(e){return undefined}};
const Log={sid:'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),t0:Date.now(),lines:[],max:400,dirty:false,upT:null,fb:null,
  ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds())+'.'+String(d.getMilliseconds()).padStart(3,'0')},
  str(v){if(v instanceof Error)return v.name+': '+v.message+(v.stack?'\n'+String(v.stack).split('\n').slice(0,6).join('\n'):'');
    if(typeof v==='string')return v;try{return JSON.stringify(v)}catch(e){return String(v)}},
  add(lvl,tag,...a){const line=this.ts()+' '+lvl+' ['+tag+'] '+a.map(v=>this.str(v)).join(' ');
    this.lines.push(line.slice(0,1200));if(this.lines.length>this.max)this.lines.splice(0,this.lines.length-this.max);
    this.dirty=true;this.schedule(lvl==='ERR'?1500:10000)},
  ev(tag,...a){this.add('·',tag,...a)},
  warn(tag,...a){this.add('WARN',tag,...a)},
  err(tag,...a){this.add('ERR',tag,...a)},
  text(){return['Les Pierres de Midheim · version '+BUILD+' · session '+this.sid,
    navigator.userAgent,'écran '+innerWidth+'×'+innerHeight+' · dpr '+(window.devicePixelRatio||1)+' · '+(navigator.onLine?'en ligne':'hors ligne'),'']
    .concat(this.lines).join('\n')},
  /* Envoi groupé vers Firebase (site public seulement). */
  schedule(ms){if(g_(()=>netKind)!=='fb')return;if(this.upT&&ms>=10000)return;clearTimeout(this.upT);this.upT=setTimeout(()=>{this.upT=null;this.upload()},ms)},
  async upload(){const SDK=g_(()=>FB_SDK);if(!this.dirty||!SDK||!navigator.onLine)return;this.dirty=false;
    try{if(!this.fb){const A=await import(SDK+'firebase-app.js'),D=await import(SDK+'firebase-database.js');
        const app=A.getApps().length?A.getApp():A.initializeApp(FB_CONFIG);this.fb={D,ref:D.ref(D.getDatabase(app),'logs/'+this.sid)}}
      const head=this.text().split('\n').slice(0,4);const tail=[];let size=head.join('\n').length;
      for(let i=this.lines.length-1;i>=0&&size+this.lines[i].length+1<12000;i--){tail.unshift(this.lines[i]);size+=this.lines[i].length+1}
      const txt=head.concat(tail).join('\n');
      await this.fb.D.set(this.fb.ref,{j:JSON.stringify({b:BUILD,n:String(g_(()=>myName)||''),m:String(g_(()=>mode)||''),log:txt}),t:this.fb.D.serverTimestamp()})}
    catch(e){this.dirty=true;if(!this.upErr){this.upErr=1;this.lines.push(this.ts()+' WARN [journal] envoi impossible : '+(e&&e.message||e))}}}
};
addEventListener('error',e=>Log.err('js',e.error||e.message,e.filename?'@'+String(e.filename).split('/').pop()+':'+e.lineno+':'+e.colno:''));
addEventListener('unhandledrejection',e=>Log.err('promesse',e.reason));
for(const k of['error','warn']){const o=console[k];console[k]=function(...a){try{Log.add(k==='error'?'ERR':'WARN','console',...a)}catch(_){}return o.apply(this,a)}}
addEventListener('online',()=>Log.ev('réseau','internet revenu'));addEventListener('offline',()=>Log.warn('réseau','internet coupé'));
document.addEventListener('visibilitychange',()=>{Log.ev('app',document.visibilityState==='visible'?'au premier plan':'en arrière-plan');if(document.visibilityState==='hidden')Log.upload()});
addEventListener('pagehide',()=>Log.upload());
Log.ev('app','démarrage',location.href.split('#')[0]);
