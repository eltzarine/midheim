/* ================= Accueil : un décor vivant dans le style du jeu ================= */
const MenuBg={t:0,
  draw(dt){const c=$('#menuBg');if(!c||!WORLD||$('#menu').hidden)return;c.hidden=false;this.t+=dt;const T=this.t;const r=Math.min(2,window.devicePixelRatio||1),W=innerWidth,H=innerHeight;
    if(c.width!==Math.round(W*r)||c.height!==Math.round(H*r)){c.width=Math.round(W*r);c.height=Math.round(H*r)}const g=c.getContext('2d');
    const camp=spx('start');const ftx=Math.floor(camp.x/TS)+2,fty=Math.floor(camp.y/TS)-3;const fx=(ftx+.5)*TS,fy=(fty+.5)*TS;
    const s=clamp(Math.min(W,H)/330,1.1,2.4);const cx=fx+Math.sin(T*.07)*30,cy=fy+8;const focus=H*(W>H?.4:.33);
    g.setTransform(1,0,0,1,0,0);g.fillStyle='#d58c4c';g.fillRect(0,0,c.width,c.height);
    g.setTransform(r*s,0,0,r*s,W*r/2-cx*r*s,focus*r-cy*r*s);g.imageSmoothingEnabled=false;
    const x0=cx-W/2/s-40,x1=cx+W/2/s+40,y0=cy-focus/s-40,y1=cy+(H-focus)/s+60;
    for(let qy=Math.max(0,Math.floor(y0/(CHK*TS)));qy<=Math.floor(y1/(CHK*TS));qy++)for(let qx=Math.max(0,Math.floor(x0/(CHK*TS)));qx<=Math.floor(x1/(CHK*TS));qx++){const ch=chunkOf(qx,qy);g.drawImage(ch,qx*CHK*TS,qy*CHK*TS-CPAD,ch.width+1,ch.height+1)}
    g.imageSmoothingEnabled=true;
    const L2=[];const pos=[[-50,-8],[50,-8],[-30,36],[30,36]];
    CLS_IDS.forEach((k,i)=>{const h=heroes[k];L2.push({y:fy+6+pos[i][1],f:()=>{const x=fx+pos[i][0],y=fy+6+pos[i][1];if(k===selCls){g.strokeStyle='rgba(240,201,90,'+(.6+.3*Math.sin(T*3))+')';g.lineWidth=2;g.beginPath();g.ellipse(x,y+13,16,6,0,0,6.28);g.stroke()}
      drawHero2(g,k,x,y,Math.atan2(-pos[i][1],-pos[i][0])+Math.sin(T*.6+i)*.25,T+i,false,{lk:h&&h.eq?lookOf(h.eq):0})}})});
    L2.push({y:fy+TS*.5,f:()=>drawDObj({k:'feu',x:ftx,y:fty,w:1,h:1,s:.4},T,g)});
    for(const[dx,dy,k]of[[-140,-60,'tonneaux'],[130,-40,'caisses'],[-110,70,'charrette'],[150,60,'foin']])L2.push({y:fy+dy+TS,f:()=>drawDObj({k,x:Math.floor((fx+dx)/TS),y:Math.floor((fy+dy)/TS),w:1,h:1,s:.5},T,g)});
    L2.sort((a,b)=>a.y-b.y);for(const o of L2)o.f();
    // lueur du feu et escarbilles
    const gr=g.createRadialGradient(fx,fy,0,fx,fy,120);gr.addColorStop(0,'rgba(255,170,80,.28)');gr.addColorStop(1,'rgba(255,170,80,0)');g.fillStyle=gr;g.fillRect(fx-120,fy-120,240,240);
    g.fillStyle='#ffcf6a';for(let k=0;k<10;k++){const ph=(T*.5+k*.37)%1;g.globalAlpha=1-ph;g.fillRect(fx+Math.sin(k*7+T)*10,fy-10-ph*90,2,2)}g.globalAlpha=1;
    g.setTransform(1,0,0,1,0,0);const sh=g.createLinearGradient(0,focus*r,0,c.height);sh.addColorStop(0,'rgba(30,18,10,0)');sh.addColorStop(.35,'rgba(30,18,10,.55)');sh.addColorStop(1,'rgba(20,12,6,.85)');g.fillStyle=sh;g.fillRect(0,focus*r,c.width,c.height-focus*r);
    const tp=g.createLinearGradient(0,0,0,focus*r*.6);tp.addColorStop(0,'rgba(30,18,10,.55)');tp.addColorStop(1,'rgba(30,18,10,0)');g.fillStyle=tp;g.fillRect(0,0,c.width,focus*r*.6)}};
