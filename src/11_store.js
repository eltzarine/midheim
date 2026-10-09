/* ================= Sauvegarde ================= */
const Store={db:null,uid:null,
  lsGet(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},
  lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  async init(){if(!window.claude||!window.claude.use)return;try{const[u,db]=await Promise.all([claude.use('user'),claude.use('db')]);if(u&&db){const id=await u.id();if(id){this.uid=id;this.db=db}}}catch(e){}},
  async load(cls){let a=this.lsGet('dd_hero_'+cls),b=null;
    if(this.db){try{const s=await this.db.doc(`data/users/${this.uid}/hero_${cls}`).get();b=s.data()||null}catch(e){}}
    const h=(a&&b)?((b.ts||0)>(a.ts||0)?b:a):(a||b);return fixHero(h,cls)},
  save(h){h.ts=Date.now();this.lsSet('dd_hero_'+h.cls,h);if(this.db){this.db.doc(`data/users/${this.uid}/hero_${h.cls}`).set(JSON.parse(JSON.stringify(h))).catch(()=>{})}}
};
