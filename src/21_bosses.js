const BOSSES=[
  {nom:'Sinthara, Lady Commandeuse de l’Everwatch',court:'Sinthara',hp:1,ring:12,triple:true,charge:false,tp:true,minions:['orc','archer'],guards:['archer','archer'],
   win:'Sinthara est vaincue ! La sortie est ouverte.'},
  {nom:'Abhorash, le Dragon de Sang',court:'Abhorash',hp:1.2,ring:10,triple:false,charge:true,tp:false,minions:[],guards:[],
   win:'Abhorash abaisse son épée. La sortie est ouverte.'},
  {nom:'Le chef de guerre orc',court:'le chef de guerre orc',hp:1.1,ring:0,triple:true,charge:true,tp:false,minions:['orc','orc'],guards:['orc','orc'],
   win:'Le chef de guerre orc est vaincu ! Karaz Ankor tient bon.'},
  {nom:'Le Haut-Adepte d’Amarath',court:'le Haut-Adepte',hp:1.15,ring:16,triple:true,charge:false,tp:true,minions:['slime','archer'],guards:['archer','archer'],
   win:'Le Haut-Adepte est vaincu ! La sortie est ouverte.'},
  {nom:'Amarath',court:'Amarath',hp:1.6,ring:18,triple:true,charge:true,tp:true,minions:['slime','bat'],guards:['slime','slime'],
   win:'Amarath s’effondre ! Le sceau se referme.'},
  {nom:'Reinald Sterkov, Maître des Ombres',court:'Reinald',hp:.6,ring:0,triple:false,charge:true,tp:true,near:true,regen:.01,minions:['slime','bat'],guards:[],
   win:'Reinald se change en brouillard et disparaît.'}
];
const STONES=[['la pierre de l’Everwatch','#cfe2ff'],['la pierre de la déesse du feu','#ff7a3a'],['la pierre de Talos','#f0c95a'],['la pierre de Kelemvor','#b98cff']];
