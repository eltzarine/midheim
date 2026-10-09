/* ================= Humour : répliques ================= */
const LINES={
  guerrier:{crit:['Et BIM !','C’est ça, la stratégie.','J’ai même pas visé.'],low:['C’est rien, c’est superficiel !','Quelqu’un a un pansement ?'],rev:['J’ai rien vu venir.','Je me reposais les yeux.'],lock:['Je peux taper dessus, au moins ?','Un coffre fermé ? C’est une insulte.'],key:['Une clé ! Ça ouvre quoi, une clé ?'],idle:['On attend quoi, le bus ?','J’ai faim. On a prévu le goûter ?'],lvl:['Je me sens plus fort. Et plus beau.'],pick:['Clic.']},
  mage:{crit:['Ha ! La théorie fonctionne !','J’avais les yeux fermés, personne n’a vu ?'],low:['Je suis un intellectuel, moi !','Il me faut une pause… et un thé.'],rev:['Note pour plus tard : ne pas mourir.'],lock:['Il me faudrait un sort d’ouverture. Je l’ai pas appris.'],key:['Une clé magique ? Non. Juste une clé.'],idle:['Je réfléchis. Ça se voit pas, mais je réfléchis.','Ma barbe gratte.'],lvl:['Je comprends presque mes sorts !'],pick:['Clic.']},
  voleur:{crit:['Dans le dos, c’est plus efficace.','Hop, emprunté.'],low:['Je propose qu’on fuie. Moi d’abord.'],rev:['Merci. Ta bourse est toujours là, promis.'],lock:['Laissez faire le professionnel.'],key:['Une clé ? J’en avais déjà une copie.'],idle:['Personne regarde ? Bon.','Je recompte les pièces. Encore.'],lvl:['Plus rapide, plus discret, plus riche.'],pick:['Clic. Trop facile.','Ce coffre ne m’a jamais résisté.']},
  soigneur:{crit:['Pardon ! C’était pas fait exprès.','La lumière punit !'],low:['Le soigneur a besoin d’un soigneur !'],rev:['Je me suis relevé. Enfin presque tout seul.'],lock:['Il nous faudrait un voleur. Pour la bonne cause.'],key:['Une clé bénie ! Bon… une clé.'],idle:['Tout le monde a bu son eau ?','Je soigne, mais je juge.'],lvl:['Ma lumière brille plus fort !'],pick:['Clic.']},
  marionnette:{aggro:['Grrrh…','(Les fils grincent.)','…']},
  rejeton:{aggro:['Ton sang sent bon !','Sssss !']},
  adepte:{aggro:['Amarath reviendra !','Les pierres sont à nous !','Seule la mort apporte la paix !']},
  veilleur:{aggro:['Halte ! L’Everwatch vous voit.','Personne ne passe le Pont sans autorisation !']},
  orc:{aggro:['Moi taper toi !','Toi pas passer !','Orc fâché !']},
  elite:{aggro:['La clé ? Viens la chercher.','Vous n’irez pas plus loin.']},
  boss0:{aggro:['L’Everwatch voit tout.','Gare à ceux qui pensent déjouer mes yeux.'],rage:['Cette pierre est à moi !','Gardes ! À moi !']},
  boss1:{aggro:['Seuls les impurs se nourrissent des faibles.','Montrez-moi votre valeur !'],rage:['Enfin, des adversaires dignes !']},
  boss2:{aggro:['Les nains tomberont !','Moi casser la montagne !'],rage:['Orcs ! Tous sur eux !']},
  boss3:{aggro:['Seule la mort de chaque combattant apportera la paix !','Le Maître reviendra !'],rage:['Levez-vous, marionnettes !']},
  boss4:{aggro:['Je voulais la paix. Seule la mort l’apporte.'],rage:['Mes anciens compagnons ont échoué. Vous aussi.','Devenez mes marionnettes !']},
  boss5:{aggro:['J’ai mis un certain temps à vous rattraper.','Je vais vous donner une chance de mourir sans souffrance.'],rage:['Vous n’avez pas idée de l’énergie que je dépense pour ne pas être senti.','Soyons équitables.'],mist:['Vous pensez sérieusement pouvoir m’affronter ?','1 grain de courage pour 3 grains de folie.']},
  mimic:{aggro:['SURPRISE !']}
};
const BUB=[],BIDX={};
for(const who in LINES)for(const cat in LINES[who]){BIDX[who+'.'+cat]=[];for(const t of LINES[who][cat]){BIDX[who+'.'+cat].push(BUB.length);BUB.push(t)}}
const pickB=(who,cat)=>{const a=BIDX[who+'.'+cat];return a?a[Math.floor(Math.random()*a.length)]:-1};
const MJ={
  floor:['Bonne chance. Vous en aurez besoin.','Les pièges sont d’origine. Merci de ne pas les abîmer.','La sortie est rarement là où on croit.','Les monstres d’ici ont été prévenus. Ils sont ravis.','Les adeptes d’Amarath ne sont jamais loin.'],
  defeat:['Le Maître du Donjon soupire très fort. On recommence l’étage.','Défaite… Le Maître du Donjon note ça dans son carnet des bêtises.','Tout le monde par terre ? Bon. On recommence, mais avec dignité.'],
  down:['{n} fait une petite sieste forcée !','{n} a trébuché sur sa propre dignité !','{n} est à terre. Il dit que c’est tactique.'],
  loot:['Dans le coffre : une chaussette d’orc. Et de l’or.','Dans le coffre : un fromage qui sent très fort. Et de l’or.','Dans le coffre : un mot « Désolé, plus rien ». Mais il reste de l’or.','Dans le coffre : une cuillère en argent. Ça peut servir.','Dans le coffre : la facture du coffre. Et de l’or.'],
  mimic:['Ce coffre avait des dents. Classique.']
};
const pickL=a=>a[Math.floor(Math.random()*a.length)];
function sayP(i,cat){const p=G.players[i];if(!p)return;p.sayT=p.sayT||0;if(G.time<p.sayT)return;const id=pickB(p.cls,cat);if(id<0)return;p.sayT=G.time+4;fx(21,p.x,p.y,id,i)}
function eKey(e){if(e.type==='boss')return'boss'+(e.bv??0);if(e.elite)return'elite';return({slime:'marionnette',bat:'rejeton',archer:'adepte',orc:G.m&&G.m.soldat?'veilleur':'orc',mimic:'mimic'})[e.type]}
function sayE(e,cat){const id=pickB(eKey(e),cat||'aggro');if(id>=0)fx(22,e.x,e.y,id,e.id)}
let bubbles=[];
function addBubble(o){bubbles=bubbles.filter(b=>!(b.who===o.who&&b.o===o.o));bubbles.push(o);if(bubbles.length>8)bubbles.shift()}
function drawBubble(x,y,txt,a){ctx.save();ctx.globalAlpha=a;ctx.font='600 11px "Pixelify Sans",monospace';const words=txt.replace(/ ([?!:;»])/g,'\u00a0$1').replace(/« /g,'«\u00a0').split(' ');const lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>150&&cur){lines.push(cur);cur=w}else cur=t}lines.push(cur);
  const w=Math.max(...lines.map(l=>ctx.measureText(l).width))+14,h=lines.length*13+8,bx=x-w/2,by=y-h-10;
  ctx.fillStyle='rgba(0,0,0,.35)';rr(ctx,bx+2,by+2,w,h,6);ctx.fill();ctx.fillStyle='#fbf6e8';rr(ctx,bx,by,w,h,6);ctx.fill();ctx.beginPath();ctx.moveTo(x-5,by+h-1);ctx.lineTo(x,by+h+7);ctx.lineTo(x+4,by+h-1);ctx.fill();
  ctx.strokeStyle='#3a2a1a';ctx.lineWidth=1.5;rr(ctx,bx,by,w,h,6);ctx.stroke();ctx.fillStyle='#2a1d12';ctx.textAlign='center';ctx.textBaseline='middle';lines.forEach((l,k)=>ctx.fillText(l,x,by+10+k*13));ctx.restore()}
