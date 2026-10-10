/* ================= Monde de Midheim : lieux, régions, donjons, quêtes ================= */
const WD=@@WORLD@@;
const PL=WD.places;
const REGIONS=[
  {id:'wild',nom:'Les Wild Realms',pt:[22,112],lv:1,mobs:[['slime',1]]},
  {id:'tarkin',nom:'Tarkin et le Pont de Lathandre',pt:[64,110],lv:1,mobs:[['slime',3],['archer',1]]},
  {id:'free',nom:'Les Royaumes Libres',pt:[92,124],lv:2,mobs:[['orc',3],['slime',3],['archer',1]]},
  {id:'shield',nom:'Les Woods of the Shield',pt:[126,98],lv:3,mobs:[['bat',3],['slime',2],['archer',2]]},
  {id:'lastfire',nom:'Last Fire',pt:[139,117],lv:3,mobs:[['orc',3],['archer',2],['slime',1]]},
  {id:'silver',nom:'Les Silverwoods',pt:[112,146],lv:4,mobs:[['bat',3],['slime',2],['orc',2]]},
  {id:'oublies',nom:'Les Monts Oubliés',pt:[86,58],lv:9,mobs:[['slime',3],['bat',3],['archer',3]]},
  {id:'nord',nom:'Le nord de l’Empire de Tomora',pt:[150,62],lv:5,mobs:[['orc',2],['bat',2],['archer',2]]},
  {id:'tomora',nom:'L’Empire de Tomora',pt:[176,84],lv:5,mobs:[['orc',3],['slime',2],['archer',2]]},
  {id:'aman',nom:'La Confédération d’Aman',pt:[243,124],lv:6,mobs:[['orc',3],['bat',2],['archer',1]]},
  {id:'firsttear',nom:'Les Woods of the First Tear',pt:[180,134],lv:7,mobs:[['archer',4],['slime',3],['bat',2]]},
  {id:'pics',nom:'Les Pics Rouges',pt:[165,154],lv:6,mobs:[['orc',4],['archer',2]]},
  {id:'mir',nom:'Le Royaume de Mir',pt:[188,186],lv:7,mobs:[['orc',2],['bat',2],['archer',2]]},
  {id:'kadrin',nom:'Karaz Kadrin',pt:[118,176],lv:5,mobs:[['orc',3],['bat',2]]},
];
const regionAt=(tx,ty)=>{let b=REGIONS[0],bd=1e9;for(const r of REGIONS){const d=(r.pt[0]-tx)**2+(r.pt[1]-ty)**2;if(d<bd){bd=d;b=r}}return b};
/* Villes : bâtiments posés autour du centre lu sur la carte */
const TOWNS={
  tarkin:{nom:'Tarkin',walls:9,roof:'#5a3b6e',b:[['keep','La forteresse de l’Everwatch','dun:everwatch'],['auberge','Auberge du Pont','house:auberge'],['marchand','Comptoir du Conseil','house:marchand'],['forge','Forge de Tarkin','house:forge'],['maison'],['maison'],['maison']]},
  lastfire:{nom:'Last Fire',roof:'#8e3a2a',b:[['auberge','Auberge de Last Fire','house:auberge'],['marchand','Marchand de Last Fire','house:marchand'],['forge','Forge de Last Fire','house:forge'],['puits'],['maison'],['maison']]},
  honor:{nom:'Honor',walls:9,roof:'#2f4f8e',b:[['palais','Palais d’Er Manar','closed:Les gardes impériaux vous refusent l’entrée du palais de l’empereur Er Manar.'],['auberge','Auberge d’Honor','house:auberge'],['marchand','Marché d’Honor','house:marchand'],['forge','Forge d’Honor','house:forge'],['maison'],['maison'],['maison'],['maison']]},
  cibellos:{nom:'Cibellos',roof:'#7a3a2a',b:[['forge','Ateliers de Cibellos','house:forge'],['marchand','Marchand de Cibellos','house:marchand'],['auberge','Auberge de Cibellos','house:auberge'],['maison'],['maison'],['puits']]},
  ironhaven:{nom:'Ironhaven',roof:'#3a5a6e',b:[['marchand','Comptoir d’Ironhaven','house:marchand'],['auberge','Auberge d’Ironhaven','house:auberge'],['forge','Forge d’Ironhaven','house:forge'],['maison'],['maison']]},
  oka:{nom:'Oka',roof:'#6e5a2a',b:[['auberge','Auberge d’Oka','house:auberge'],['marchand','Marchand d’Oka','house:marchand'],['maison'],['maison']]},
  vindheim:{nom:'Vindheim',roof:'#5a2a2a',b:[['auberge','Auberge de Vindheim','house:auberge'],['marchand','Marchand de Vindheim','house:marchand'],['maison'],['maison']]},
  eastwatch:{nom:'Eastwatch',roof:'#2a4a5a',b:[['tour','La tour d’Eastwatch','dun:eastwatch'],['auberge','Auberge d’Eastwatch','house:auberge'],['maison'],['maison']]},
};
const BSIZE={maison:[4,2],statue:[2,2],auberge:[4,3],marchand:[3,3],forge:[4,3],keep:[6,5],palais:[7,5],puits:[1,1],tour:[5,2]};
const WAYPOINTS={start:{nom:'Le Pont de Lathandre (ouest)',pt:PL.start},tarkin:{nom:'Tarkin',pt:PL.tarkin},lastfire:{nom:'Last Fire',pt:PL.lastfire},honor:{nom:'Honor',pt:PL.honor},cibellos:{nom:'Cibellos',pt:PL.cibellos},ironhaven:{nom:'Ironhaven',pt:PL.ironhaven},oka:{nom:'Oka',pt:PL.oka},vindheim:{nom:'Vindheim',pt:PL.vindheim},eastwatch:{nom:'Eastwatch',pt:PL.eastwatch},karazankor:{nom:'Karaz Ankor',pt:PL.karazankor},firsttear:{nom:'Woods of the First Tear',pt:PL.firsttear}};
/* Donjons et monuments où l'on entre */
const DUNGEONS={
  everwatch:{nom:'La forteresse de l’Everwatch',pal:0,soldat:true,floors:2,lv:2,mobs:[['orc',4],['archer',3],['slime',2]],eliteType:'orc',elite:'l’officier de l’Everwatch',boss:0,fl:['La cour de l’Everwatch','La salle du trône de Sinthara'],need:0,done:0,story:null},
  karazankor:{nom:'Karaz Ankor',pal:2,floors:2,lv:6,mobs:[['orc',5],['bat',2],['archer',2]],eliteType:'orc',elite:'le chef orc',boss:2,fl:['Le col des Pics Rouges','Le Trône des Âges'],need:3,done:3,story:null},
  antre:{nom:'L’antre de Virganth',pal:1,floors:2,lv:8,mobs:[['slime',3],['bat',3],['archer',4]],eliteType:'archer',elite:'le grand adepte',boss:3,fl:['Les bois de la Première Larme','Le trésor de Virganth'],need:4,done:4,story:null},
  prison:{nom:'La prison d’Amarath',pal:3,floors:3,lv:10,mobs:[['slime',4],['bat',3],['archer',3],['orc',2]],eliteType:'slime',elite:'la marionnette géante',boss:4,fl:['Le sentier des Monts Oubliés','Les sceaux de la prison','La prison d’Amarath'],need:5,done:5,story:'ch4'},
  // quête annexe de fin de partie : la tour de guet d'Eastwatch, cinq étages à gravir
  eastwatch:{nom:'La tour d’Eastwatch',pal:3,soldat:true,floors:5,lv:9,mobs:[['orc',3],['archer',3],['bat',2]],eliteType:'orc',elite:'le caporal de la garnison',boss:6,
    fl:['Le corps de garde','L’armurerie','Les quartiers','La salle des signaux','Le sommet de la tour'],need:5,done:-1,story:null},
};
/* Étapes de l'histoire (hero.q) */
const OBJ=[
  {t:'Traverse le Pont de Lathandre et entre dans la forteresse de l’Everwatch, à Tarkin.',at:'everwatch'},
  {t:'Rends-toi au carrefour de Last Fire.',at:'lastfire'},
  {t:'Trouve Abhorash dans les Silverwoods.',at:'arena'},
  {t:'Va à Karaz Ankor, dans les Pics Rouges.',at:'karazankor'},
  {t:'Défends l’antre de Virganth, dans les Woods of the First Tear.',at:'antre'},
  {t:'Les quatre pierres montrent le chemin : la plus profonde montagne.',at:'prison'},
  {t:'Le sceau tient. Explore Midheim, améliore ton équipement et relève les défis.',at:null}];
const stonesQ=q=>(q>=1)+(q>=3)+(q>=4)+(q>=5);
const DIALOG={
  virganth0:['Virganth, l’Éternel','Allez à Tarkin. L’Everwatch garde la première pierre, dans l’armure de Sinthara.'],
  virganth1:['Virganth, l’Éternel','Le pendentif brille plus fort. Continuez : chaque pierre vous rapproche de la prison.'],
  garde:['Garde du Conseil','Tarkin est tenue par le Conseil des espèces non-humaines. Le Pont de Lathandre est le seul passage vers l’Est. Gare aux yeux de l’Everwatch.'],
  grinmir0:['Grinmir Thunderhammer','Le Witangamot est réuni. Revenez quand vous aurez la force d’affronter ce qui arrive.'],
  grinmir1:['Grinmir Thunderhammer','La pierre de Talos est entre de bonnes mains. Ne laissez pas Amarath revenir.'],
  abhorash:['Abhorash, le Dragon de Sang','Vous vous êtes battus avec honneur. Revenez me défier quand vous voulez.'],
  nains:['Porte naine','Les portes de cette forteresse naine sont closes. Les nains vivent ici à l’écart du monde.'],
  scelle:['Porte scellée','Une porte noire, gravée de quatre emplacements vides. Il faut les quatre pierres.'],
  ferme:['Porte close','Cette porte ne s’ouvrira pas pour l’instant.'],
};
