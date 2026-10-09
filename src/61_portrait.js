function drawPortraitBase(c,who){const g=c.getContext('2d'),S=c.width;g.setTransform(S/84,0,0,S/84,0,0);g.clearRect(0,0,84,84);
  const bg=(a,b)=>{const gr=g.createRadialGradient(42,36,6,42,42,60);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,84,84)};
  if(who==='virganth'){bg('#5a4a1a','#120e08');
    g.fillStyle='#b8862a';g.beginPath();g.moveTo(14,80);g.quadraticCurveTo(18,50,34,40);g.lineTo(58,40);g.quadraticCurveTo(70,52,70,80);g.fill();
    g.fillStyle='#e2b54a';g.beginPath();g.moveTo(22,46);g.quadraticCurveTo(26,22,46,18);g.quadraticCurveTo(66,16,76,30);g.lineTo(80,40);g.quadraticCurveTo(70,46,58,44);g.quadraticCurveTo(46,52,34,52);g.closePath();g.fill();
    g.fillStyle='#f6d77a';g.beginPath();g.moveTo(30,30);g.lineTo(14,6);g.lineTo(36,24);g.fill();g.beginPath();g.moveTo(40,22);g.lineTo(34,2);g.lineTo(48,20);g.fill();
    g.fillStyle='#c9952e';for(let k=0;k<5;k++){g.beginPath();g.arc(30+k*7,40-k*2,3,0,6.28);g.fill()}
    g.fillStyle='#1a1206';g.beginPath();g.ellipse(56,28,5,3.5,-.2,0,6.28);g.fill();g.fillStyle='#7ff0e8';g.beginPath();g.ellipse(57,28,1.4,3,0,0,6.28);g.fill();
    g.fillStyle='#8a5a1a';g.beginPath();g.arc(76,36,1.6,0,6.28);g.fill();g.strokeStyle='#8a5a1a';g.lineWidth=1.5;g.beginPath();g.moveTo(60,42);g.lineTo(78,40);g.stroke();return}
  if(who==='grinmir'){bg('#3a2a1a','#0e0a06');
    g.fillStyle='#4a4a56';g.fillRect(14,58,56,26);g.fillStyle='#c9a23a';g.fillRect(14,62,56,3);
    g.fillStyle='#e9c4a0';g.beginPath();g.arc(42,36,15,0,6.28);g.fill();
    g.fillStyle='#b8541e';g.beginPath();g.moveTo(26,38);g.quadraticCurveTo(28,74,42,80);g.quadraticCurveTo(56,74,58,38);g.quadraticCurveTo(42,48,26,38);g.fill();g.strokeStyle='#8a3a12';g.lineWidth=1.5;for(const xx of[36,42,48]){g.beginPath();g.moveTo(xx,50);g.lineTo(xx,74);g.stroke()}
    g.fillStyle='#e0b23a';g.fillRect(39,64,6,4);g.fillStyle='#9a9aa8';g.beginPath();g.arc(42,30,16,Math.PI,0);g.fill();g.fillRect(26,28,32,4);
    g.fillStyle='#f0c95a';for(const xx of[30,38,46,54]){g.beginPath();g.moveTo(xx-3,18);g.lineTo(xx,10);g.lineTo(xx+3,18);g.fill()}
    g.fillStyle='#1a1220';g.fillRect(35,35,3,3);g.fillRect(46,35,3,3);g.fillStyle='#d8a070';g.beginPath();g.arc(42,41,3,0,6.28);g.fill();
    g.strokeStyle='#6b4a28';g.lineWidth=4;g.beginPath();g.moveTo(74,82);g.lineTo(74,30);g.stroke();g.fillStyle='#8d93a8';rr(g,64,18,20,16,2);g.fill();g.save();g.shadowColor='#f0c95a';g.shadowBlur=8;g.fillStyle='#f0c95a';g.beginPath();g.arc(74,26,3.5,0,6.28);g.fill();g.restore();return}
  if(who==='abhorash'){bg('#5a0f16','#0e0406');
    g.fillStyle='#3a0d12';g.beginPath();g.moveTo(10,30);g.quadraticCurveTo(4,60,20,84);g.lineTo(64,84);g.quadraticCurveTo(80,60,74,30);g.quadraticCurveTo(42,56,10,30);g.fill();
    g.fillStyle='#8e1a24';rr(g,18,56,48,30,8);g.fill();g.fillStyle='#c9a23a';g.fillRect(18,64,48,3);
    g.fillStyle='#d9d2d8';g.beginPath();g.arc(42,38,14,0,6.28);g.fill();g.fillStyle='#8e1a24';g.beginPath();g.arc(42,34,16,Math.PI,0);g.fill();g.fillRect(26,32,5,18);g.fillRect(53,32,5,18);
    g.fillStyle='#c9a23a';for(const sd of[-1,1]){g.beginPath();g.moveTo(42+sd*12,24);g.lineTo(42+sd*24,8);g.lineTo(42+sd*18,26);g.fill()}
    g.save();g.shadowColor='#ff2020';g.shadowBlur=10;g.fillStyle='#ff3030';g.fillRect(35,37,5,3);g.fillRect(45,37,5,3);g.restore();g.fillStyle='#fff';g.fillRect(39,46,2,4);g.fillRect(44,46,2,4);return}
  if(who==='sinthara'){bg('#1f3358','#06080e');
    g.fillStyle='#2a1a22';g.beginPath();g.moveTo(22,30);g.quadraticCurveTo(18,64,26,80);g.lineTo(58,80);g.quadraticCurveTo(66,64,62,30);g.fill();
    g.fillStyle='#c9cbe0';rr(g,16,58,52,28,8);g.fill();g.fillStyle='#8d93a8';g.fillRect(16,70,52,3);
    g.save();g.shadowColor='#cfe2ff';g.shadowBlur=12;g.fillStyle='#cfe2ff';g.beginPath();g.moveTo(42,60);g.lineTo(47,66);g.lineTo(42,72);g.lineTo(37,66);g.closePath();g.fill();g.restore();
    g.fillStyle='#e9cdb0';g.beginPath();g.arc(42,38,13,0,6.28);g.fill();g.fillStyle='#2a1a22';g.beginPath();g.arc(42,32,14,Math.PI*1.05,Math.PI*1.95);g.fill();
    g.fillStyle='#c9cbe0';g.beginPath();g.moveTo(28,26);g.lineTo(56,26);g.lineTo(52,16);g.lineTo(42,22);g.lineTo(32,16);g.closePath();g.fill();
    g.fillStyle='#1a1424';g.fillRect(35,38,4,2.6);g.fillRect(45,38,4,2.6);g.fillStyle='#a0505a';g.fillRect(39,46,6,1.6);return}
  if(who==='amarath'){bg('#3a0d22','#08030a');
    g.strokeStyle='rgba(200,170,255,.25)';g.lineWidth=1;for(let k=0;k<7;k++){g.beginPath();g.moveTo(42,40);g.lineTo(k*14,84);g.stroke()}
    g.fillStyle='#14080f';rr(g,14,58,56,30,10);g.fill();g.fillStyle='#5a0f22';g.fillRect(36,58,12,28);
    g.fillStyle='#d9d4e2';g.beginPath();g.moveTo(26,30);g.quadraticCurveTo(22,60,28,76);g.lineTo(34,50);g.closePath();g.fill();g.beginPath();g.moveTo(58,30);g.quadraticCurveTo(62,60,56,76);g.lineTo(50,50);g.closePath();g.fill();
    g.fillStyle='#e9e2ea';g.beginPath();g.arc(42,38,13,0,6.28);g.fill();for(const sd of[-1,1]){g.beginPath();g.moveTo(42+sd*11,36);g.lineTo(42+sd*24,26);g.lineTo(42+sd*12,42);g.fill()}
    g.fillStyle='#d9d4e2';g.beginPath();g.arc(42,33,14,Math.PI*1.05,Math.PI*1.95);g.fill();
    g.save();g.shadowColor='#ff2050';g.shadowBlur=10;g.fillStyle='#ff3060';g.fillRect(35,38,4,2.6);g.fillRect(45,38,4,2.6);g.restore();g.fillStyle='#fff';g.fillRect(39,47,1.6,3.5);g.fillRect(43.4,47,1.6,3.5);return}
  if(who==='reinald'||who==='reinaldj'){const ev=who==='reinald';bg('#1d2a22','#050806');
    g.fillStyle='#1d3a2a';g.beginPath();g.moveTo(14,84);g.quadraticCurveTo(12,40,42,16);g.quadraticCurveTo(72,40,70,84);g.fill();
    g.fillStyle='#24262e';rr(g,20,60,44,26,8);g.fill();g.fillStyle='#3a3d48';g.fillRect(20,66,44,2.5);
    g.strokeStyle='#d8dbe6';g.lineWidth=1.2;g.beginPath();g.moveTo(34,58);g.lineTo(42,68);g.lineTo(50,58);g.stroke();g.fillStyle='#e8ebf4';g.beginPath();g.arc(42,69,2.6,0,6.28);g.fill();
    g.fillStyle='#ece6ea';g.beginPath();g.arc(42,42,13,0,6.28);g.fill();g.fillStyle='#120c16';g.beginPath();g.arc(42,36,14,Math.PI*1.02,Math.PI*1.98);g.fill();g.fillRect(28,34,4,14);g.fillRect(52,34,4,10);
    g.save();if(ev){g.shadowColor='#ff2020';g.shadowBlur=8}g.fillStyle=ev?'#ff4040':'#5a6a78';g.fillRect(35,42,4,2.4);g.fillRect(45,42,4,2.4);g.restore();
    g.strokeStyle='#8a7a6a';g.lineWidth=1.2;g.beginPath();g.moveTo(38,50);g.quadraticCurveTo(42,52,46,50);g.stroke();return}
  bg('#2b3f55','#0a0e14');g.save();g.translate(42,42);g.strokeStyle='#e8e1cc';g.fillStyle='#e8e1cc';g.lineWidth=1.5;g.beginPath();g.arc(0,0,14,0,6.28);g.stroke();g.beginPath();g.arc(0,0,8,0,6.28);g.stroke();
  for(let k=0;k<8;k++){g.save();g.rotate(k*Math.PI/4);g.beginPath();g.moveTo(0,-(k%2?24:34));g.lineTo(4,-8);g.lineTo(-4,-8);g.closePath();g.globalAlpha=k%2?.6:1;g.fill();g.restore()}g.restore()}
