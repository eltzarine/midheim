import os, json, subprocess
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tests', 'shots'); os.makedirs(OUT, exist_ok=True)
FAKE = open(os.path.join(ROOT, 'tests', 'fake_room.js')).read()
FAKE_STORY = FAKE.replace('window.__noStory = true;', '')
body = open(os.path.join(ROOT, 'dist', 'midheim.html')).read()
IDX = os.path.join(ROOT, 'tests', 'index.html')
open(IDX, 'w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + body + '</body></html>')
URL = 'file://' + IDX
res = []
def check(n, ok, info=''):
    res.append((n, bool(ok))); print(('PASS ' if ok else 'FAIL ') + n + (' — ' + str(info) if info != '' else ''), flush=True)
def page(br, story=False, w=390, h=844, tag='', persist=None):
    ctx = persist or br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True)
    if not persist:
        ctx.route('**/fonts.g*/**', lambda r: r.abort()); ctx.add_init_script(FAKE_STORY if story else FAKE)
    p = ctx.new_page(); p.errs = []
    p.on('pageerror', lambda e: p.errs.append(f'[{tag}] {e}'))
    return ctx, p
def skip(p):
    for _ in range(20):
        if p.evaluate("QDone.on"):
            p.click('#qdOk'); p.wait_for_timeout(150); continue
        if p.evaluate("Scene.on"):
            p.click('#scnSkip'); p.wait_for_timeout(300); continue
        if p.evaluate("Scene.q.length||storyBusy"):
            p.wait_for_timeout(300); continue
        if p.locator('#storyBox').is_hidden(): return
        if p.is_visible('#stSkip'): p.click('#stSkip')
        else: p.click('#stNext')
        p.wait_for_timeout(150)
def story_shown(p, k): return p.evaluate(f"Scene.on||hero.story.includes('{k}')")
def go(p, js): return p.evaluate(js)
def tele(p, tx, ty):  # téléporte le héros (et l'allié) près d'une case du monde
    go(p, f"(()=>{{const q=worldFree({tx},{ty});L.x=q.x;L.y=q.y;G.players[0].x=q.x;G.players[0].y=q.y}})()")
def clearUI(p): go(p, "document.querySelector('#toasts').textContent='';document.querySelector('#banner').classList.remove('show');document.querySelector('#loadBox').hidden=true")

# ================= Tests unitaires (Node) : règles, nettoyage des données reçues, sécurité de la page =================
u = subprocess.run(['node', '--test', os.path.join(ROOT, 'tests', 'unit.test.cjs')], capture_output=True, text=True)
for line in u.stdout.splitlines():
    if line.startswith('not ok') or line.strip().startswith(('error:', 'actual:', 'expected:')): print('  ' + line.strip())
check('Tests unitaires (node --test tests/unit.test.cjs)', u.returncode == 0,
      ' '.join(l[2:] for l in u.stdout.splitlines() if l.startswith(('# pass', '# fail'))))

with sync_playwright() as pw:
    br = pw.chromium.launch()
    # ================= Solo, téléphone vertical =================
    ctx, pg = page(br, story=True, tag='solo')
    pg.goto(URL); pg.wait_for_timeout(700)
    check('Menu : carte de Midheim et marqueurs', pg.locator('#menuMarks .mk').count() >= 2)
    # le monde : chaque porte est atteignable à pied depuis le départ, et aucun bâtiment ne la bouche ni ne la cache
    audit = go(pg, """(()=>{const m=WORLD,W=m.W,H=m.H,free=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&!m.sol[y*W+x];
      const s=worldFree(PL.start[0],PL.start[1]),sx=Math.floor(s.x/TS),sy=Math.floor(s.y/TS),seen=new Uint8Array(W*H),q=[[sx,sy]];seen[sy*W+sx]=1;
      while(q.length){const[x,y]=q.pop();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(free(nx,ny)&&!seen[ny*W+nx]){seen[ny*W+nx]=1;q.push([nx,ny])}}}
      const bad=[];for(const b of m.builds){if(!b.act)continue;const d=b.door;
        if(!free(d.x,d.y)||!seen[d.y*W+d.x])bad.push((b.label||b.kind)+' : porte inaccessible');
        const cov=m.builds.find(o=>o!==b&&d.x>=o.x&&d.x<o.x+o.w&&o.y>d.y&&o.y<=d.y+3);if(cov)bad.push((b.label||b.kind)+' : porte cachée par '+(cov.label||cov.kind))}
      const placed=Object.keys(TOWNS).filter(k=>m.builds.filter(b=>b.town===k).length!==TOWNS[k].b.length).map(k=>k+' : bâtiment manquant');
      return bad.concat(placed)})()""")
    check('Monde : toutes les portes sont accessibles et dégagées', not audit, audit[:5])
    sky = go(pg, """(()=>{const keep=[Sky.off,Sky.force];const at=h=>{Sky.force='beau';const c=Sky.at(Date.now()).hour;Sky.off=((h-c+24)%24)/24*SKY_DAY;Sky.testOff=true;Sky.update(0);return[Sky.label(),Sky.dark]};
      const r={midi:at(12.5),soir:at(19.5),nuit:at(23)};r.mulNuit=G&&G.m?(G.m.kind==='world'?Sky.mul():4):4;at(12.5);r.mulJour=G&&G.m?Sky.mul():1;Sky.off=keep[0];Sky.force=keep[1];return r})()""")
    check('Ciel : midi clair, soir qui baisse, nuit sombre', sky['midi'][0]=='Midi' and sky['midi'][1] < .15 and .15 < sky['soir'][1] < sky['nuit'][1] and sky['nuit'][1] > .75, sky)
    pg.fill('#name', 'César'); pg.click('#bSolo'); pg.wait_for_timeout(900)
    check('Départ dans le monde, côté Wild Realms', go(pg, "G.zd") == 'w' and go(pg, "Math.floor(L.x/TS)") < 55)
    check('Mise en scène d’introduction dans le jeu', go(pg, "Scene.on&&Scene.def.hideP") and go(pg, "Music.want") == 'cine' and pg.is_visible('#scnSkip'))
    pg.wait_for_timeout(2500)
    check('Intro : la narratrice parle (sous-titre ou vignette)', 'Le monde a changé' in (pg.inner_text('#scnCap') + pg.inner_text('#vig')))
    pg.screenshot(path=f'{OUT}/cine0.png')
    go(pg, "Scene.wait=null;Scene.i=Scene.steps.findIndex(s=>s.fx&&s.fx.k==='stones');Scene.run()"); pg.wait_for_timeout(3500)
    pg.screenshot(path=f'{OUT}/cine5.png')
    check('Intro : les quatre héros réunis autour du feu', go(pg, "Scene.actors.filter(a=>a.k==='hero').length") >= 4)
    skip(pg)
    check('Intro passée : prologue, Reinald et prophétie marqués', go(pg, "['prologue','reinald0','ch0'].every(k=>hero.story.includes(k))"))
    check('Mise en scène terminée, jeu actif', not go(pg, 'Scene.on') and go(pg, 'paused') is False)
    # marcher (joystick) vers l'est jusqu'au pont
    go(pg, "touch.jx=1;touch.jy=0"); pg.wait_for_timeout(1500); go(pg, "touch.jx=0")
    x1 = go(pg, "L.x/TS")
    check('Le héros marche vers le Pont de Lathandre', x1 > 43.5, round(x1, 1))
    go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(150); pg.screenshot(path=f'{OUT}/a1_depart.png'); go(pg, "paused=false")
    # Tarkin et la forteresse
    door = go(pg, "(()=>{const b=WORLD.builds.find(b=>b.act==='dun:everwatch');return[b.door.x,b.door.y]})()")
    tele(pg, door[0], door[1]); pg.wait_for_timeout(300)
    go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(150); pg.screenshot(path=f'{OUT}/a2_tarkin.png'); go(pg, "paused=false")
    check('Bouton « Entrer » devant la forteresse', pg.is_visible('#bAct') and 'Entrer' in pg.inner_text('#bAct'))
    pg.click('#bAct'); pg.wait_for_timeout(700)
    check('Entrée dans la forteresse de l’Everwatch', go(pg, "G.m.kind==='dun'&&G.m.did==='everwatch'&&G.m.soldat===true"))
    check('Musique de donjon dans la forteresse', go(pg, "Music.want") in ('dungeon', 'boss'))
    check('Ennemis présents (veilleurs, adeptes)', go(pg, "G.enemies.length") > 4)
    pg.wait_for_timeout(600); check('Mise en scène d’entrée du donjon (Sinthara)', go(pg, "Scene.on")); skip(pg)
    go(pg, "G.players[0].hp=G.players[0].mhp=1e6;paused=true"); clearUI(pg); pg.wait_for_timeout(150); pg.screenshot(path=f'{OUT}/a3_forteresse.png'); go(pg, "paused=false")
    go(pg, "L.x=G.m.leave.x;L.y=G.m.leave.y"); pg.wait_for_timeout(400)
    check('Bouton « Quitter le donjon » à l’entrée', pg.is_visible('#bAct') and 'Quitter' in pg.inner_text('#bAct'))
    pg.click('#bAct'); pg.wait_for_timeout(800)
    check('On ressort dans le monde devant la forteresse', go(pg, "G.zd==='w'") and abs(go(pg, "L.x/TS") - door[0]) < 3)
    tele(pg, door[0], door[1]); pg.wait_for_timeout(300); pg.click('#bAct'); pg.wait_for_timeout(700)
    pg.wait_for_timeout(600); skip(pg)
    check('Sortie fermée tant que les herses sont baissées', go(pg, "!G.stairsOpen&&G.m.goal.id==='levers'&&G.m.marks.length===3"))
    for i in range(3):
        go(pg, f"(()=>{{const mk=G.m.marks[{i}];L.x=(mk.x+.5)*TS;L.y=(mk.y+.5)*TS;G.enemies.length=0;G.cb=null}})()"); pg.wait_for_timeout(2300)
    check('Les trois herses levées ouvrent le donjon', go(pg, "G.stairsOpen&&G.gp.every(v=>v>=1)"))
    go(pg, "L.x=G.m.stairs.x;L.y=G.m.stairs.y"); pg.wait_for_timeout(1400); skip(pg)
    check('Étage 2 : le donjon de Sinthara', go(pg, "G.m.idx===1&&G.enemies.some(e=>e.type==='boss'&&e.bv===0)"))
    pg.wait_for_timeout(900); skip(pg)
    go(pg, "(()=>{const e=G.enemies.find(e=>e.type==='boss');killEnemy(e)})()"); pg.wait_for_timeout(300)
    go(pg, "L.x=G.m.stairs.x;L.y=G.m.stairs.y"); pg.wait_for_timeout(1500)
    check('Retour dans le monde devant la forteresse', go(pg, "G.zd==='w'") and abs(go(pg, "L.x/TS") - door[0]) < 3)
    check('Quête : étape 1, pierre de l’Everwatch (mise en scène)', go(pg, "G.q===1&&hero.q===1") and story_shown(pg,'stone0'))
    skip(pg)
    # forge de Tarkin
    fd = go(pg, "(()=>{const b=WORLD.builds.find(b=>b.hid==='tarkin_forge');return[b.door.x,b.door.y]})()")
    tele(pg, fd[0], fd[1]); pg.wait_for_timeout(250); go(pg, "actQ=true"); pg.wait_for_timeout(700)
    check('Entrée dans la forge (intérieur)', go(pg, "G.m.kind==='house'&&G.m.hk==='forge'"))
    go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(150); pg.screenshot(path=f'{OUT}/a4_forge.png'); go(pg, "paused=false")
    go(pg, "(()=>{const it=G.m.inter[0];L.x=it.x;L.y=it.y;hero.gold=2000;hero.sh=50})()"); pg.wait_for_timeout(200); go(pg, "actQ=true"); pg.wait_for_timeout(300)
    check('Le forgeron ouvre la forge', pg.is_visible('#bagBox') and 'Forge' in pg.inner_text('#bagTitle'))
    check('Le forgeron salue (texte + voix)', 'Forgeron : «' in pg.inner_text('#toasts'))
    check('Musique de taverne en ville', go(pg, "Music.want") == 'town')
    pg.click('#bagMain .eq .slotc >> nth=0'); pg.wait_for_timeout(100)
    d0 = go(pg, "ST.dmg"); pg.click('#bagMain .detail .btn.main'); pg.wait_for_timeout(100)
    check('Améliorer l’arme : +1 et plus de dégâts', go(pg, "hero.eq.arme.u") == 1 and go(pg, "ST.dmg") > d0)
    pg.click('#bagTabs button >> nth=1'); pg.click('#bagMain .eq .slotc >> nth=0'); pg.wait_for_timeout(100)
    pg.click('#bagMain .enchs button >> nth=0'); pg.wait_for_timeout(100)
    check('Enchantement de Lathandre posé sur l’arme', go(pg, "hero.eq.arme.e==='lath'&&ST.we==='lath'"))
    check('Les enchantements des pierres suivantes sont verrouillés', go(pg, "[...document.querySelectorAll('#bagMain .enchs button')].filter(b=>b.disabled).length") >= 3)
    pg.screenshot(path=f'{OUT}/a5_enchant.png')
    pg.click('#bagClose'); pg.wait_for_timeout(100)
    go(pg, "(()=>{L.x=5.5*TS;L.y=(G.m.H-1)*TS})()"); pg.wait_for_timeout(700)
    check('Sortie de la forge vers Tarkin', go(pg, "G.zd==='w'"))
    # marchand
    md = go(pg, "(()=>{const b=WORLD.builds.find(b=>b.hid==='tarkin_marchand');return[b.door.x,b.door.y]})()")
    tele(pg, md[0], md[1]); pg.wait_for_timeout(200); go(pg, "actQ=true"); pg.wait_for_timeout(600)
    go(pg, "(()=>{const it=G.m.inter[0];L.x=it.x;L.y=it.y})()"); pg.wait_for_timeout(150); go(pg, "actQ=true"); pg.wait_for_timeout(250)
    pot0 = go(pg, "hero.pot"); pg.click('#bagMain .bag .itc >> nth=0'); pg.wait_for_timeout(100)
    check('Acheter une potion', go(pg, "hero.pot") == min(6, pot0 + 1))
    pg.click('#bagMain .bag .itc >> nth=1'); pg.click('#bagMain .detail .btn.main'); pg.wait_for_timeout(100)
    check('Acheter une pièce d’équipement', go(pg, "hero.bag.length") >= 1)
    pg.click('#bagTabs button >> nth=1'); pg.wait_for_timeout(100); g0 = go(pg, "hero.gold")
    pg.click('#bagMain .bag .itc >> nth=0'); pg.click('#bagMain .detail .btn.main'); pg.wait_for_timeout(100)
    check('Revendre au marchand', go(pg, "hero.gold") > g0)
    pg.click('#bagClose'); go(pg, "requestAct('exit')"); pg.wait_for_timeout(700)
    # butin et sac
    go(pg, "addDrop(6,L.x+5,L.y,4242,2,3)"); pg.wait_for_timeout(1200)
    check('Butin ramassé dans le sac (épique)', go(pg, "hero.bag.some(i=>i.r===2)"))
    pg.click('#pBag'); pg.wait_for_timeout(150)
    n = go(pg, "hero.bag.findIndex(i=>i.r===2)")
    pg.click(f'#bagMain .bag .itc >> nth={n}'); pg.wait_for_timeout(100)
    check('Comparaison affichée avant d’équiper', pg.locator('#bagMain .detail li.up, #bagMain .detail li.dn').count() > 0)
    pg.screenshot(path=f'{OUT}/a6_sac.png')
    pg.click('#bagMain .detail .btn.main'); pg.wait_for_timeout(100)
    check('Équiper depuis le sac', go(pg, "Object.values(hero.eq).some(i=>i&&i.r===2)"))
    pg.click('#bagClose')
    # arbre de talents : chaque branche de chaque classe, jusqu'au niveau 10
    for cls in ['guerrier', 'mage', 'voleur', 'soigneur']:
        for b in range(3):
            go(pg, f"""(()=>{{QDone.q.length=0;QDone.close();hero.cls='{cls}';hero.lvl=LVL_MAX;hero.tr=[];for(let k=0;k<10;k++){{const key='{b}.'+k;if(!treeWhy(hero,key))hero.tr.push(key)}}hero.eq={{arme:starter('{cls}','arme'),armure:starter('{cls}','armure'),talisman:null}};refreshStats();G.players[0].cls='{cls}';G.players[0].st=ST;L.mp=ST.mmp;L.ult=100;L.cd=[0,0,0,0];buildSkillUI();
              for(let k=0;k<4;k++){{const q=freeNear(L.x,L.y,60,120);const e=spawnEnemy('orc',q.x,q.y,false,false,undefined,3);e.act=true}}tbUpdate(0)}})()""")
            n = go(pg, "hero.tr.length")
            for sl in range(4):
                go(pg, f"QDone.q.length=0;QDone.close();if(G.cb){{G.cb.ph='h';G.cb.who=0;G.cb.ap=[9,9];G.cb.rd=[false,false]}}L.tbSpent=0;L.tbEnd=false;if(G.cb)L.tbKey=G.cb.r+':'+G.cb.k+'h0';L.pv=pvOn()?({sl}===3?'ult':'s{sl}'):null;skQ[{sl}]=true"); pg.wait_for_timeout(220); go(pg, "L.mp=ST.mmp")  # au tour par tour : assez de points pour chaque compétence
            pg.wait_for_timeout(300)
            ok = go(pg, "ST.ks.every((id,i)=>!id||L.sk[i]>=1)&&!!ST.ks[3]&&!!ST.pa&&ST.ks.filter(Boolean).length===3")
            check(f'{cls} branche {b + 1} : 10 crans, passif, 2 compétences et ultime lancés', ok and n == 10, go(pg, "[hero.tr.join(' '),ST.ks.join(','),ST.pa,L.sk.join(',')].join(' | ')"))
            go(pg, "L.sk=[0,0,0,0];G.traps=[];G.decoys=[];G.later=[];G.enemies=[]")
    check('Arbre : pas plus de 10 points au niveau 10', go(pg, "(()=>{hero.lvl=LVL_MAX;hero.tr=[];let n=0;for(let b=0;b<3;b++)for(let k=0;k<10;k++){if(!treeWhy(hero,b+'.'+k)){hero.tr.push(b+'.'+k);n++}}return n===10&&treePts(hero)===0})()"))
    check('Arbre : une seule passive', go(pg, "(()=>{hero.cls='voleur';hero.lvl=LVL_MAX;hero.tr=['0.0','1.0','1.1','1.2'];return /passive/.test(treeWhy(hero,'1.3'))})()"))
    check('Arbre : au plus 3 compétences', go(pg, "(()=>{hero.tr=['0.0','0.1','0.2','0.3','1.0'];return /Au plus 3/.test(treeWhy(hero,'2.0'))})()"))
    check('Niveau 10 au plus', go(pg, "(()=>{hero.lvl=9;hero.xp=0;giveXp(1e6);return hero.lvl===LVL_MAX&&hero.xp===0})()"))
    check('Ancienne sauvegarde : héros remis à zéro', go(pg, "(()=>{const h=fixHero({cls:'mage',lvl:14,gold:900,tal:{for:3}},'mage');return h.lvl===1&&h.gold===30&&h.tr.length===0&&h.v===HERO_V})()"))
    go(pg, "(()=>{hero.cls='guerrier';hero.lvl=1;hero.tr=[];refreshStats()})()")
    pg.click('#pTal'); pg.wait_for_timeout(200)
    check('Arbre : l’écran s’ouvre avec 30 crans', pg.locator('#talTree .tn').count() == 30)
    pg.click('#talTree .tn >> nth=0'); pg.wait_for_timeout(100)
    check('Arbre : hors de la maison, pas de bouton Apprendre', pg.locator('#talDet .btn.main').count() == 0)
    pg.click('#bTalClose'); pg.wait_for_timeout(100); go(pg, "toggleTalents(true)"); pg.wait_for_timeout(150)
    pg.click('#talTree .tn >> nth=0'); pg.wait_for_timeout(100); pg.click('#talDet .btn.main'); pg.wait_for_timeout(150)
    check('Arbre : apprendre la première compétence au toucher', go(pg, "hero.tr.join()==='0.0'&&ST.pa==='protecteur'"))
    pg.screenshot(path=f'{OUT}/a7_arbre.png')
    pg.click('#bTalClose'); pg.wait_for_timeout(100)
    go(pg, "(()=>{hero.cls='voleur';hero.lvl=LVL_MAX;hero.tr=['0.0','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9'];hero.eq={arme:starter('voleur','arme'),armure:starter('voleur','armure'),talisman:null};refreshStats();G.players[0].cls='voleur';G.players[0].st=ST;buildSkillUI()})()")
    go(pg, "(()=>{const q=freeNear(L.x+7*TS,L.y,0,TS);const e=spawnEnemy('slime',q.x,q.y,false,false,undefined,1);e.pt=1;L.tbT=e.id})()"); pg.wait_for_timeout(250)
    check('Portrait : hors combat, la barre d’attaques n’apparaît qu’avec un ennemi sélectionné', pg.is_visible('#hbar') and pg.is_hidden('#mbar'))
    rs = go(pg, "[...document.querySelectorAll('#hbar .hb')].map(e=>{const r=e.getBoundingClientRect();return[r.left,r.top,r.right,r.bottom]})")
    ov = any(not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1]) for i, a in enumerate(rs) for b in rs[i + 1:])
    check('Portrait : boutons sans chevauchement', not ov, rs)
    go(pg, "buildSkillUI();L.mp=ST.mmp;L.ult=60;L.cd=[0,0,0,0]"); clearUI(pg); pg.wait_for_timeout(250); pg.screenshot(path=f'{OUT}/a8_boutons.png'); go(pg, "L.tbT=0;G.enemies=G.enemies.filter(e=>!e.pt)")
    hb = go(pg, "(()=>{const b=WORLD.builds.filter(b=>(b.act||'').startsWith('house:talents'));return b.length})()")
    check('Une maison des talents dans chaque ville', hb == len(go(pg, "Object.keys(TOWNS)")), hb)
    go(pg, "hero.gold=1000;toggleTalents(true)"); pg.wait_for_timeout(150)
    pg.click('#talReset .btn'); pg.wait_for_timeout(80); pg.click('#talReset .btn'); pg.wait_for_timeout(120)
    check('Maison des talents : réinitialisation payante', go(pg, "hero.tr.length===0&&hero.gold===1000-TREE_RESET*LVL_MAX"))
    go(pg, "toggleTalents()")
    tb = go(pg, "(()=>{const b=WORLD.builds.find(b=>(b.act||'').startsWith('house:talents')&&b.town==='cibellos');return[b.door.x,b.door.y+2]})()")
    tele(pg, tb[0], tb[1]); pg.wait_for_timeout(700); clearUI(pg); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/a9_maison_talents.png')
    ha = go(pg, "WORLD.builds.find(b=>(b.act||'').startsWith('house:talents')&&b.town==='cibellos').act")
    go(pg, f"QDone.q.length=0;QDone.close();hostEnter({ha!r}.replace('house:','h:'),null)"); pg.wait_for_timeout(900); go(pg, "QDone.q.length=0;QDone.close()")
    check('Maison des talents : le maître des talents est là', go(pg, "G.m.kind==='house'&&G.m.npcs[0].who==='maitre'&&G.m.inter[0].act==='talents'"), go(pg, "[G.m.kind,G.m.hk,JSON.stringify(G.m.npcs),G.m.inter&&G.m.inter[0].act]"))
    go(pg, "L.x=G.m.inter[0].x;L.y=G.m.inter[0].y"); clearUI(pg); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/b1_maitre_talents.png')
    go(pg, "doInteract(G.m.inter[0])"); pg.wait_for_timeout(150)
    check('Maître des talents : il ouvre l’arbre avec Apprendre', go(pg, "!$('#talents').hidden&&talHouse"))
    go(pg, "toggleTalents();hostEnter('w',G.m.exitTo)"); pg.wait_for_timeout(700)
    check('Garde du Conseil à gauche du pont', go(pg, "(()=>{const n=WORLD.npcs.find(n=>n.id==='garde');return n.x<(PL.pont[0]-2)*TS})()"))
    tele(pg, *go(pg, "[PL.pont[0]-2,PL.pont[1]+1]")); pg.wait_for_timeout(700); go(pg, "QDone.q.length=0;QDone.close()"); clearUI(pg); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/b2_garde_pont.png')
    pg.wait_for_timeout(1200); go(pg, "QDone.q.length=0;QDone.close()")
    go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(100); pg.screenshot(path=f'{OUT}/a7_competences.png'); go(pg, "paused=false;G.enemies=[]")
    go(pg, "(()=>{hero.cls='guerrier';hero.eq={arme:starter('guerrier','arme'),armure:starter('guerrier','armure'),talisman:null};refreshStats();G.players[0].cls='guerrier';G.players[0].st=ST;buildSkillUI()})()")
    # Last Fire, Reinald, Abhorash
    lf = go(pg, "PL.lastfire"); tele(pg, lf[0], lf[1]); pg.wait_for_timeout(900)
    for _ in range(10):  # la vérification des étapes passe toutes les 0,5 s : on lui laisse le temps
        if go(pg, "G.q===2"): break
        pg.wait_for_timeout(300)
    check('Last Fire : étape 2 et scène « Royaumes Libres »', go(pg, "G.q===2") and story_shown(pg,'ch1'))
    skip(pg)
    lf = go(pg, "PL.lastfire"); tele(pg, lf[0] - 20, lf[1] + 12); pg.wait_for_timeout(900)
    check('Embuscade de Reinald, la nuit tombe', go(pg, "G.reinOn&&G.night===1&&G.enemies.some(e=>e.bv===5)"))
    skip(pg)
    go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(100); pg.screenshot(path=f'{OUT}/a8_reinald_nuit.png'); go(pg, "paused=false")
    go(pg, "(()=>{const e=G.enemies.find(e=>e.bv===5);hitEnemy(e,e.hp+5,false)})()"); pg.wait_for_timeout(1300)
    go(pg, "(()=>{const e=G.enemies.find(e=>e.bv===5);e.mistT=0;hitEnemy(e,e.hp+5,false)})()"); pg.wait_for_timeout(500)
    check('Reinald s’enfuit, le jour revient', go(pg, "!G.reinOn&&G.night===0&&G.fl.has('rein')"))
    skip(pg)
    ar = go(pg, "[Math.floor(WORLD.arena.x/TS),Math.floor(WORLD.arena.y/TS)]"); tele(pg, ar[0], ar[1] + 3); pg.wait_for_timeout(900)
    check('Arène des Silverwoods : Abhorash apparaît', go(pg, "G.enemies.some(e=>e.bv===1)"))
    go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(100); pg.screenshot(path=f'{OUT}/a9_arene.png'); go(pg, "paused=false")
    go(pg, "(()=>{const e=G.enemies.find(e=>e.bv===1);killEnemy(e)})()"); pg.wait_for_timeout(400)
    check('Abhorash vaincu : étape 3, pierre du feu', go(pg, "G.q===3"))
    skip(pg)
    # donjons suivants (raccourci jusqu'à l'étage du boss)
    for did, nextq, card in [('karazankor', 4, 'ch2'), ('antre', 5, 'ch3'), ('prison', 6, None)]:
        dd = go(pg, f"(()=>{{const b=WORLD.builds.find(b=>b.act==='dun:{did}');return[b.door.x,b.door.y]}})()")
        tele(pg, dd[0], dd[1]); pg.wait_for_timeout(800)
        skip(pg)
        go(pg, f"requestAct('dun:{did}')"); pg.wait_for_timeout(600)
        skip(pg)
        ok_in = go(pg, f"G.m.kind==='dun'&&G.m.did==='{did}'")
        go(pg, f"(()=>{{const s=DUNGEONS['{did}'];G.dun=G.dun||{{ret:WORLD.start}};hostEnter('d:{did}:'+(s.floors-1)+':77:'+G.m.lv,null,{{heal:true}})}})()"); pg.wait_for_timeout(400)
        bv = go(pg, "(()=>{const e=G.enemies.find(e=>e.type==='boss');return e?e.bv:-1})()")
        go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(100); pg.screenshot(path=f'{OUT}/b_{did}.png'); go(pg, "paused=false")
        go(pg, "(()=>{const e=G.enemies.find(e=>e.type==='boss');if(e)killEnemy(e)})()"); pg.wait_for_timeout(900)
        skip(pg)  # la scène d'arrivée à l'étage du boss bloque l'escalier tant qu'elle joue
        go(pg, "L.x=G.m.stairs.x;L.y=G.m.stairs.y"); pg.wait_for_timeout(1400)
        check(f'{did} : entrée, boss {bv}, sortie et étape {nextq}', ok_in and go(pg, f"G.zd==='w'&&G.q==={nextq}"), go(pg, "G.q"))
        skip(pg)
    # quête annexe : la tour d'Eastwatch (Brann à la porte, cinq étages praticables, le Veilleur Noir, le feu rallumé)
    dd = go(pg, "(()=>{const b=WORLD.builds.find(b=>b.act==='dun:eastwatch');return b?[b.door.x,b.door.y]:null})()")
    tele(pg, dd[0], dd[1] + 2); pg.wait_for_timeout(800); skip(pg)
    go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(150); pg.screenshot(path=f'{OUT}/e0_tour_eastwatch.png'); go(pg, "paused=false")
    pre = go(pg, "[!!WORLD.npcs.find(n=>n.id==='brann'),ewState(),sqActive(SQ_BY.eastwatch)]")
    go(pg, "requestAct('dun:eastwatch')"); pg.wait_for_timeout(1200)
    sc = go(pg, "Scene.on")
    if sc: go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(100); pg.screenshot(path=f'{OUT}/e1_brann.png'); go(pg, "paused=false")
    skip(pg)
    ok_in = go(pg, "G.m.kind==='dun'&&G.m.did==='eastwatch'&&sqActive(SQ_BY.eastwatch)")
    walk = go(pg, """(()=>{const out=[];for(let i=0;i<5;i++){const z=genDungeon2('eastwatch',i,77,10);const W=z.W,ok=v=>v===0||v===3||v===4||v===5;
      const sx=Math.floor(z.start.x/TS),sy=Math.floor(z.start.y/TS),ex=Math.floor(z.stairs.x/TS),ey=Math.floor(z.stairs.y/TS),seen=new Uint8Array(W*z.H),q=[[sx,sy]];seen[sy*W+sx]=1;
      while(q.length){const[x,y]=q.pop();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=z.H||seen[ny*W+nx]||!ok(z.t[ny*W+nx]))continue;seen[ny*W+nx]=1;q.push([nx,ny])}}
      const mk=(z.marks||[]).every(m=>seen[m.y*W+m.x]);if(!seen[ey*W+ex]||!mk||z.spawns.length<(i===4?2:6))out.push(i+' : '+z.spawns.length+' ennemis, sortie '+!!seen[ey*W+ex]+', leviers '+mk)}return out})()""")
    for i in range(5):
        go(pg, f"G.dun=G.dun||{{ret:WORLD.start}};hostEnter('d:eastwatch:{i}:77:'+G.m.lv,null,{{heal:true}})"); pg.wait_for_timeout(1000); skip(pg)
        go(pg, "G.players[0].hp=G.players[0].mhp=1e6;paused=true"); clearUI(pg); pg.wait_for_timeout(100); pg.screenshot(path=f'{OUT}/e2_etage{i}.png'); go(pg, "paused=false")
    bv = go(pg, "(()=>{const e=G.enemies.find(e=>e.type==='boss');return e?e.bv:-1})()")
    go(pg, "(()=>{const e=G.enemies.find(e=>e.type==='boss');if(e)killEnemy(e)})()"); pg.wait_for_timeout(900); skip(pg)
    go(pg, "L.x=G.m.stairs.x;L.y=G.m.stairs.y"); pg.wait_for_timeout(2600)
    if go(pg, "Scene.on"): go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(100); pg.screenshot(path=f'{OUT}/e3_feu.png'); go(pg, "paused=false")
    skip(pg); pg.wait_for_timeout(300); skip(pg)
    check('Tour d’Eastwatch : Brann, porte, 5 étages, Veilleur Noir, feu rallumé', pre == [True, 1, False] and ok_in and not walk and bv == 6 and go(pg, "G.zd==='w'&&hero.sqd.includes('eastwatch')&&ewState()===2"), [pre, ok_in, walk, bv, go(pg, "[G.zd,hero.sqd]")])
    check('Les quatre pierres réunies', go(pg, "stonesQ(G.q)") == 4)
    # objectifs variés des donjons
    go(pg, "G.dun={ret:WORLD.start};hostEnter('d:antre:0:55:8',null,{heal:true});G.enemies.length=0"); pg.wait_for_timeout(300); pg.wait_for_timeout(900); skip(pg); go(pg,'G.enemies.length=0')
    for i in range(4):
        go(pg, f"(()=>{{const mk=G.m.marks[{i}];L.x=(mk.x+.5)*TS;L.y=(mk.y+.5)*TS;G.enemies.length=0}})()"); pg.wait_for_timeout(2300)
    go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(100); pg.screenshot(path=f'{OUT}/b_runes.png'); go(pg, "paused=false")
    check('Bois de la Première Larme : 4 pierres runiques rallumées', go(pg, "G.stairsOpen&&G.m.style==='bois'"))
    go(pg, "hostEnter('d:karazankor:0:56:8',null,{heal:true})"); pg.wait_for_timeout(300); pg.wait_for_timeout(900); skip(pg)
    go(pg, "G.enemies.length=0;L.x=G.m.goal.at.x;L.y=G.m.goal.at.y"); pg.wait_for_timeout(600)
    w1 = go(pg, "G.wave")
    for k in range(3):
        go(pg, "G.enemies.filter(e=>e.wv).forEach(e=>killEnemy(e))"); pg.wait_for_timeout(3200)
    check('Col des Pics Rouges : trois vagues repoussées', w1 == 1 and go(pg, "G.stairsOpen"), go(pg, "[G.wave,G.stairsOpen]"))
    go(pg, "hostEnter('d:prison:0:57:10',null,{heal:true})"); pg.wait_for_timeout(300); pg.wait_for_timeout(900); skip(pg)
    go(pg, "(()=>{const e=G.enemies.find(e=>e.elite);killEnemy(e);const d=G.drops.find(d=>d.k===4);L.x=d.x;L.y=d.y})()"); pg.wait_for_timeout(900)
    check('Sentier des Monts Oubliés : la clé de la marionnette', go(pg, "G.stairsOpen&&G.m.style==='sentier'"))
    go(pg, "hostEnter('d:prison:1:58:10',null,{heal:true})"); pg.wait_for_timeout(300); pg.wait_for_timeout(900); skip(pg)
    for i in range(4):
        go(pg, f"(()=>{{const mk=G.m.marks[{i}];L.x=(mk.x+.5)*TS;L.y=(mk.y+.5)*TS;G.enemies.length=0}})()"); pg.wait_for_timeout(2300)
    go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(100); pg.screenshot(path=f'{OUT}/b_sceaux.png'); go(pg, "paused=false")
    check('Sceaux de la prison : quatre sceaux activés', go(pg, "G.stairsOpen&&G.m.style==='sceaux'"))
    go(pg, "hostEnter('w',WORLD.start,{heal:true});G.dun=null"); pg.wait_for_timeout(400)
    # journal de quêtes
    check('Quêtes : plus de bouton dans le menu du bas, l’or y est affiché', pg.is_hidden('#pQuest') and pg.is_visible('#mbar #pGold') and go(pg, "$('#goldTxt').textContent==String(hero.gold)") and not pg.query_selector('#shTxt'))
    pg.click('#objTxt b'); pg.wait_for_timeout(200)
    check('Journal de quêtes : histoire et sous-quêtes', pg.is_visible('#questBox') and pg.locator('#questList .qcard').count() >= 6)
    pg.screenshot(path=f'{OUT}/c0_quetes.png')
    pg.locator('#questList .qcard', has_text='Feux de camp ennemis').click(); pg.wait_for_timeout(150)
    check('Suivre une quête', go(pg, "hero.track==='camps'") and 'Butins possibles' in pg.inner_text('#questList'))
    pg.click('#qClose'); pg.wait_for_timeout(300)
    check('Quête suivie affichée en haut', 'Feux de camp' in pg.inner_text('#objTxt'))
    check('Flèche vers un camp', go(pg, "!!questTarget()"))
    g0 = go(pg, "hero.gold")
    for k in range(3): go(pg, f"fx(42,L.x,L.y,{k})"); pg.wait_for_timeout(250)
    check('Sous-quête terminée : récompense', go(pg, "hero.sqd.includes('camps')") and go(pg, "hero.gold") >= g0 + 100)
    check('Relique de quête dans le sac', go(pg, "hero.bag.some(it=>it.rq==='camps'&&it.r===4&&!!it.lore)"))
    pg.wait_for_timeout(2600)
    check('Animation de fin de quête avec la relique', pg.is_visible('#qdone') and 'Feux de camp' in pg.inner_text('#qdName') and pg.is_visible('#qdIcon') and '100' in pg.inner_text('#qdGains'), [pg.inner_text('#qdName'), pg.is_visible('#qdIcon'), pg.is_visible('#qdRelic')] if pg.is_visible('#qdone') else 'cache')
    pg.screenshot(path=f'{OUT}/c0b_quete_finie.png')
    pg.click('#qdEquip'); pg.wait_for_timeout(200)
    check('Équiper la relique depuis l’animation', go(pg, "hero.eq.armure.rq==='camps'&&ST.ae==='lath'") and not pg.is_visible('#qdone'))
    check('Relique conservée après rechargement', go(pg, "fixHero(JSON.parse(JSON.stringify(hero)),hero.cls).eq.armure.rq==='camps'"))
    check('Talisman relique : bonus d’or', go(pg, "(()=>{const t=makeRelic('coffres',hero.cls,5);const s=hero.eq.talisman;hero.eq.talisman=t;const d=derive(hero);hero.eq.talisman=s;return d.gb>0.29&&t.n==='Anneau du Cartographe'})()"))
    # carte et voyage rapide
    go(pg, "hero.wp=Object.keys(WAYPOINTS);G.enemies.forEach(e=>e.act=false)"); pg.click('#mini'); pg.wait_for_timeout(200)
    pg.screenshot(path=f'{OUT}/c1_carte.png')
    go(pg, "G.enemies.length=0"); pg.click('#bigMarks button[title="Cibellos"]'); pg.wait_for_timeout(800)
    cb = go(pg, "PL.cibellos"); d = go(pg, f"Math.hypot(L.x/TS-{cb[0]},L.y/TS-{cb[1]})")
    check('Voyage rapide vers Cibellos', d < 8, [round(d, 1), pg.inner_text('#toasts'), pg.is_visible('#mapBox')])
    go(pg, "paused=true"); clearUI(pg); pg.wait_for_timeout(100); pg.screenshot(path=f'{OUT}/c2_cibellos.png'); go(pg, "paused=false")
    # défaite dans le monde
    go(pg, "(()=>{const p=G.players[0];p.hp=1;p.mhp=200;L.ivT=0;p.ivT=0;hurt(p,999)})()"); pg.wait_for_timeout(3200)
    check('Défaite : réveil au lieu découvert le plus proche', go(pg, "!G.players[0].down&&G.zd==='w'"))
    # sauvegarde et reprise
    pos = go(pg, "[Math.floor(L.x/TS),Math.floor(L.y/TS)]")
    pg.click('#pMenu'); pg.click('#bQuit'); pg.wait_for_timeout(300)
    check('Menu : « Continuer l’aventure »', 'Continuer' in pg.inner_text('#bSolo'))
    pg.reload(); pg.wait_for_timeout(800)
    pg.click('#bSolo'); pg.wait_for_timeout(800)
    np = go(pg, "[Math.floor(L.x/TS),Math.floor(L.y/TS)]")
    check('Reprise au même endroit, même étape', abs(np[0] - pos[0]) + abs(np[1] - pos[1]) < 4 and go(pg, "G.q") == 6, [pos, np])
    check('Aucune erreur JavaScript (solo)', not pg.errs, pg.errs[:4])
    ctx.close()

    # ================= Téléphone à l'horizontale =================
    ctx, pg = page(br, w=844, h=390, tag='paysage'); pg.goto(URL); pg.wait_for_timeout(600); pg.click('#bSolo'); pg.wait_for_timeout(900)
    go(pg, "(()=>{hero.lvl=LVL_MAX;hero.tr=['1.0','1.1','1.2','1.3','1.4','1.5','1.6','1.7','1.8','1.9'];refreshStats();buildSkillUI();['bS1','bS2','bS3','bUlt'].forEach(i=>$('#'+i).hidden=false)})()"); clearUI(pg); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/d1_paysage.png')
    go(pg, "(()=>{if(G.m.kind!=='world')hostEnter('w',WORLD.start);G.enemies=[];const q=freeNear(L.x+7*TS,L.y,0,TS);const e=spawnEnemy('orc',q.x,q.y,false,false,undefined,1);L.tbT=e.id})()"); pg.wait_for_timeout(300)
    check('Paysage : ennemi sélectionné hors combat, barre d’attaques à la place du menu, petite fiche à gauche de la carte', pg.is_visible('#hbar') and pg.is_hidden('#mbar') and go(pg, "$('#tgtBox').getBoundingClientRect().right<=$('#mini').getBoundingClientRect().left+2"))
    clearUI(pg); pg.wait_for_timeout(150); pg.screenshot(path=f'{OUT}/d1b_paysage_cible.png')
    rs = go(pg, "[...document.querySelectorAll('#hbar .hb')].map(e=>{const r=e.getBoundingClientRect();return[r.left,r.top,r.right,r.bottom]})")
    ov = any(not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1]) for i, a in enumerate(rs) for b in rs[i + 1:])
    check('Paysage : boutons sans chevauchement', not ov, rs)
    pg.click('#mini'); pg.wait_for_timeout(250)
    check('Paysage : la carte ronde s’ouvre au toucher', pg.is_visible('#mapBox'))
    go(pg, "$('#mapBox').hidden=true;paused=false"); pg.wait_for_timeout(100)
    go(pg, "L.tbT=0"); pg.wait_for_timeout(250)
    check('Paysage : barre de menus sans Carte (Or, Sac, Talents, Potion), ☰ en haut à gauche ; carte et fiche alignées sur la fiche du héros', go(pg, "Math.abs($('#mini').getBoundingClientRect().top-$('#cMe').getBoundingClientRect().top)<=1") and go(pg, "[...document.querySelectorAll('#mbar .pill')].filter(e=>e.offsetParent).length") == 4 and go(pg, "$('#pMenu').getBoundingClientRect().left<40&&$('#pMenu').getBoundingClientRect().top<40"))
    pg.locator('#cMe').dispatch_event('pointerdown'); pg.wait_for_timeout(500)
    check('Paysage : rester appuyé sur sa fiche ouvre le détail du héros (vie, mana, passif, chiffres)', pg.is_visible('#meBig') and pg.is_visible('#tgtVeil') and 'Dégâts' in pg.inner_text('#meBig') and 'Passif' in pg.inner_text('#meBig'))
    clearUI(pg); pg.screenshot(path=f'{OUT}/d1d_fiche_heros.png')
    pg.locator('#cMe').dispatch_event('pointerup'); pg.wait_for_timeout(200)
    check('Paysage : en relâchant, le détail du héros se ferme', pg.is_hidden('#meBig') and pg.is_hidden('#tgtVeil'))
    go(pg, "(()=>{G.enemies=[];for(let k=0;k<6;k++){const q=freeNear(L.x+(3+k%3)*TS,L.y+(k<3?-1:1)*TS,0,TS);spawnEnemy(k%2?'orc':'slime',q.x,q.y,false,false,undefined,1)}})()")
    for _ in range(40):
        if go(pg, "!!G.cb&&tbHero()"): break
        pg.wait_for_timeout(200)
    go(pg, "(()=>{L.tbT=G.enemies[0].id})()"); pg.wait_for_timeout(400)
    rs = go(pg, "[...document.querySelectorAll('#hbar .hb,#hbar #bEnd,#tbCol,#tgtBox,#cMe,#pMenu,#tbInfo')].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return[r.left,r.top,r.right,r.bottom,e.id||e.dataset.k]})")
    ov = [(a[4], b[4]) for i, a in enumerate(rs) for b in rs[i + 1:] if not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])]
    check('Paysage, combat : colonne des tours, fiche de la cible, barre (avec Foncer et Fin du tour) et ligne du tour sans chevauchement', go(pg, "!!G.cb&&tbHero()") and len(rs) >= 12 and not ov, [len(rs), ov])
    clearUI(pg); pg.wait_for_timeout(150); pg.screenshot(path=f'{OUT}/d1c_paysage_combat.png')
    check('Aucune erreur JavaScript (paysage)', not pg.errs, pg.errs[:4])
    ctx.close()

    # ================= Ordinateur =================
    ctx = br.new_context(viewport={'width': 1280, 'height': 800}); ctx.route('**/fonts.g*/**', lambda r: r.abort()); ctx.add_init_script(FAKE)
    pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(600); pg.click('#bSolo'); pg.wait_for_timeout(900)
    pg.keyboard.down('KeyD'); pg.wait_for_timeout(700); pg.keyboard.up('KeyD')
    check('Clavier : déplacement', go(pg, "L.x/TS") > 43.3)
    go(pg, "hero.lvl=7;hero.tr=['0.0','0.1','0.2','0.3'];refreshStats();buildSkillUI()"); pg.keyboard.press('KeyI'); pg.wait_for_timeout(150)
    check('Clavier : I ouvre le sac', pg.is_visible('#bagBox')); pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    pg.keyboard.press('KeyM'); pg.wait_for_timeout(150); check('Clavier : M ouvre la carte', pg.is_visible('#mapBox')); pg.keyboard.press('Escape')
    clearUI(pg); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/d2_ordi.png')
    check('Aucune erreur JavaScript (ordinateur)', not pg.errs, pg.errs[:4])
    ctx.close()

    # ================= Combat au tour par tour (solo) =================
    ctx, pg = page(br, tag='tour'); pg.goto(URL); pg.wait_for_timeout(700); pg.click('#bSolo'); pg.wait_for_timeout(900)
    go(pg, "(()=>{if(G.m.kind!=='world')hostEnter('w',WORLD.start);QDone.q.length=0;QDone.close();G.enemies=[];G.cb=null;G.night=0;G.reinOn=false;hero.lvl=3;refreshStats();G.players[0].hp=G.players[0].mhp})()"); pg.wait_for_timeout(400)
    go(pg, "(()=>{for(let k=0;k<3;k++){const q=freeNear(L.x+6*TS,L.y,0,TS);const e=spawnEnemy('orc',q.x,q.y,false,false,undefined,3);e.hx=q.x;e.hy=q.y;e.hp=e.mhp=600}})()")  # assez de vie pour que les trois orcs jouent leur tour; pg.wait_for_timeout(300)
    jz = go(pg, "(()=>{const z=$('#joyZone'),o={pointerId:7,bubbles:true,pointerType:'touch'},x=vw*.8,y=vh*.45;z.dispatchEvent(new PointerEvent('pointerdown',Object.assign({clientX:x,clientY:y},o)));z.dispatchEvent(new PointerEvent('pointermove',Object.assign({clientX:x+60,clientY:y},o)));const r=[touch.jx,!$('#joy').hidden];z.dispatchEvent(new PointerEvent('pointerup',Object.assign({clientX:x+60,clientY:y},o)));return r.concat(touch.jx)})()")
    check('Joystick : il apparaît aussi à droite de l’écran', jz[0] > .5 and jz[1] and jz[2] == 0, jz)
    check('Tour par tour : hors de la zone d’alerte, pas de combat', not go(pg, "G.cb") and go(pg, "AGGRO") == 3.5)
    go(pg, "L.x+=3.2*TS"); pg.wait_for_timeout(300)
    check('Tour par tour : entrer dans la zone lance le combat ; le guerrier (vitesse 12) joue avant les orcs (9)', go(pg, "!!G.cb&&G.cb.ph==='h'&&G.cb.who===0&&G.cb.in[0]&&G.cb.q.length===4&&G.cb.q[0]===-1"), go(pg, "G.cb&&G.cb.q"))
    check('Tour par tour : colonne de l’ordre des tours (vignettes carrées, héros qui joue en or), ligne du tour et bouton Fin du tour dans la barre', pg.is_visible('#tbCol') and pg.is_visible('#tbInfo') and go(pg, "document.querySelectorAll('#tbOrd .to').length") == 4 and go(pg, "document.querySelector('#tbOrd .to.cur.h.me')!==null") and go(pg, "(()=>{const t=$('#tbOrd .to');return t.offsetWidth===52&&t.offsetHeight===52})()") and pg.is_visible('#bEnd') and go(pg, "$('#bEnd').parentNode.id==='hbar'"))
    check('Tour par tour : la carte, la quête et le menu du bas disparaissent ; la caméra recule', pg.is_hidden('#mini') and pg.is_hidden('#objTxt') and pg.is_hidden('#mbar') and go(pg, "(()=>{for(let i=0;i<60;i++)render(.05);return camZ<.82&&scale<baseScale})()"))
    check('Tour par tour : le guerrier a 3 points d’action, Foncer est dans la barre', go(pg, "G.cb.ap[0]===3&&tbAP()===3") and pg.is_visible('#hbar .hb[data-k=dash]'))
    go(pg, "G.enemies.forEach((e,k)=>{const q=freeNear(L.x+40,L.y+(k-1)*34,0,TS);e.x=e.rx=q.x;e.y=e.ry=q.y})")  # les orcs au contact
    hp = go(pg, "G.enemies.map(e=>e.hp).reduce((a,b)=>a+b,0)")
    ac0 = go(pg, "L.ac"); hb = pg.locator('#hbar .hb[data-k=atk]')
    for _ in range(4): hb.dispatch_event('pointerdown'); pg.wait_for_timeout(500); hb.dispatch_event('pointerup')
    check('Tour par tour : 3 points d’action au plus, une attaque par appui', go(pg, "L.ac") - ac0 <= 3 and go(pg, "!G.cb||G.cb.ap[0]<3"), [go(pg, "L.ac") - ac0, go(pg, "G.cb&&G.cb.ap[0]")])
    x0 = go(pg, "L.x"); go(pg, "touch.jx=-1"); pg.wait_for_timeout(3000); go(pg, "touch.jx=0")
    mv = (x0 - go(pg, "L.x")) / 32; left = go(pg, "L.tbMv") / 32
    go(pg, "touch.jx=1"); pg.wait_for_timeout(700); go(pg, "touch.jx=0")
    check('Tour par tour : revenir vers le départ rend du déplacement', go(pg, "L.tbMv") / 32 > left + .5, [round(left, 2), round(go(pg, "L.tbMv") / 32, 2)])
    check('Tour par tour : déplacement limité à 5 cases', 0 < mv <= 5.1 and mv + left <= 5.15, [round(mv, 2), round(left, 2)])
    pg.screenshot(path=f'{OUT}/f1_tour_heros.png')
    pg.click('#bEnd'); pg.wait_for_timeout(250)
    check('Tour par tour : Fin du tour → au tour du 1er orc, seul', go(pg, "G.cb.ph==='e'&&G.cb.eid===G.cb.q[1]") and pg.is_hidden('#bEnd'))
    still = go(pg, "G.enemies.filter(e=>e.id!==G.cb.eid).map(e=>[Math.round(e.x),Math.round(e.y)])"); pg.wait_for_timeout(700)
    check('Tour par tour : pendant le tour d’un ennemi, les autres ne bougent pas', go(pg, "G.enemies.filter(e=>e.id!==G.cb.eid).map(e=>[Math.round(e.x),Math.round(e.y)])") == still)
    pg.screenshot(path=f'{OUT}/f5_tour_ennemi.png')
    seen = set()
    for _ in range(60):
        if go(pg, "G.cb&&G.cb.ph==='h'"): break
        e = go(pg, "G.cb&&G.cb.ph==='e'?G.cb.eid:null")
        if e is not None: seen.add(e)
        pg.wait_for_timeout(200)
    check('Tour par tour : les trois orcs jouent l’un après l’autre, puis manche 2 (recharges comptées en tours)', len(seen) == 3 and go(pg, "G.cb.ph==='h'&&G.cb.r===2"), [len(seen), go(pg, "G.cb&&G.cb.r")])
    go(pg, "(()=>{const q=freeNear(L.x-18*TS,L.y,0,2*TS);L.x=q.x;L.y=q.y})()"); pg.click('#bEnd')
    for _ in range(60):
        if not go(pg, "G.cb"): break
        pg.wait_for_timeout(200)
    check('Tour par tour : fuite à plus de 12 cases, les ennemis rentrent chez eux', not go(pg, "G.cb") and go(pg, "G.enemies.every(e=>e.ret||!e.act)"))
    go(pg, "G.enemies=[];(()=>{const q=freeNear(L.x+5*TS,L.y,0,TS);const e=spawnEnemy('orc',q.x,q.y,false,false,undefined,1);e.hp=e.mhp=400})()")  # assez de vie pour survivre à un coup critique; pg.wait_for_timeout(300)
    sc = go(pg, "(()=>{const e=G.enemies[0];return[(e.x-camX)*scale+vw/2,(e.y-camY)*scale+vh*focusY()]})()")
    pg.touchscreen.tap(sc[0], sc[1]); pg.wait_for_timeout(200)
    check('Tour par tour : toucher un ennemi le choisit pour cible (fiche affichée)', go(pg, "L.tbT===G.enemies[0].id") and pg.is_visible('#tgtBox'))
    hb0 = pg.locator('#hbar .hb[data-k=atk]'); hx0 = go(pg, "G.enemies[0].hp")
    hb0.dispatch_event('pointerdown'); pg.wait_for_timeout(500); hb0.dispatch_event('pointerup'); pg.wait_for_timeout(100)
    check('Hors combat, ennemi sélectionné : 1er appui = aperçu, sans frapper', go(pg, "L.pv==='atk'&&!G.cb") and go(pg, "G.enemies[0].hp") == hx0 and pg.is_visible('#pvHint'))
    pg.wait_for_timeout(900); pg.screenshot(path=f'{OUT}/f4_apercu_hors_combat.png')
    go(pg, "L.pv=null")
    go(pg, "(()=>{const e=G.enemies[0];L.x=e.x-30;L.y=e.y})()")  # on entre dans sa zone : les ennemis jouent, puis c'est à nous
    for _ in range(30):
        if go(pg, "G.cb&&G.cb.ph==='h'&&G.cb.ap[0]===3"): break
        pg.wait_for_timeout(200)
    go(pg, "(()=>{const e=G.enemies[0];L.x=e.x-30;L.y=e.y})()"); pg.wait_for_timeout(100)
    sc = go(pg, "(()=>{const e=G.enemies[0];return[(e.x-camX)*scale+vw/2,(e.y-camY)*scale+vh*focusY()]})()")
    h0 = go(pg, "G.enemies[0].hp"); pg.touchscreen.tap(sc[0], sc[1]); pg.wait_for_timeout(300); h0b = go(pg, "G.enemies[0].hp")
    check('Tour par tour : toucher la cible ne frappe pas', h0b == h0 and go(pg, "G.cb.ap[0]") == 3)
    pg.touchscreen.tap(sc[0], sc[1]); pg.wait_for_timeout(200)
    check('Tour par tour : la cible à portée allume l’attaque dans la barre', go(pg, "document.querySelector('#hbar .hb[data-k=atk]').classList.contains('hot')"))
    pg.screenshot(path=f'{OUT}/f2_cible.png')
    hb.dispatch_event('pointerdown'); pg.wait_for_timeout(300); hb.dispatch_event('pointerup')
    check('Tour par tour : 1er appui = aperçu de l’attaque, sans frapper', go(pg, "L.pv==='atk'&&G.cb.ap[0]===3") and pg.is_visible('#pvHint'))
    pg.screenshot(path=f'{OUT}/f3_apercu.png')
    hb.dispatch_event('pointerdown'); pg.wait_for_timeout(600); hb.dispatch_event('pointerup')
    h1 = go(pg, "G.enemies[0]?G.enemies[0].hp:0")
    check('Tour par tour : 2e appui = l’attaque part et vise la cible', h1 < h0 and go(pg, "!G.cb||G.cb.ap[0]===2"), [h0, h1])
    if go(pg, "!!G.cb&&tbHero()"):
        b0 = go(pg, "L.tbBud"); m0 = go(pg, "tbMoveMax()"); pg.locator('#hbar .hb[data-k=dash]').dispatch_event('pointerdown'); pg.wait_for_timeout(150); pg.locator('#hbar .hb[data-k=dash]').dispatch_event('pointerup')
        check('Tour par tour : Foncer coûte 2 points et ajoute un déplacement complet', go(pg, "G.cb.ap[0]===0") and go(pg, "L.tbMv") > m0 * .9, [b0, m0, go(pg, "L.tbBud"), go(pg, "L.tbMv"), go(pg, "G.cb.ap[0]")])
        ti = go(pg, "[...document.querySelectorAll('#tbOrd .to.e')].length")
        pg.locator('#tbOrd .to.e').first.dispatch_event('pointerdown'); pg.wait_for_timeout(500)
        check('Tour par tour : rester appuyé sur la vignette d’un ennemi ouvre sa fiche détaillée (écran assombri)', ti >= 1 and go(pg, "L.tgtBig&&!!tbTarget()") and pg.is_visible('#tgtVeil') and 'Prochain tour' in pg.inner_text('#tgtBox'))
        pg.screenshot(path=f'{OUT}/f6_fiche_detaillee.png')
        pg.locator('#tbOrd .to.e').first.dispatch_event('pointerup'); pg.wait_for_timeout(200)
        check('Tour par tour : en relâchant, la fiche redevient petite', go(pg, "!L.tgtBig") and pg.is_hidden('#tgtVeil') and pg.is_visible('#tgtBox'))
    for _ in range(30):
        if go(pg, "tbHero()&&!L.tbEnd"): break
        pg.wait_for_timeout(200)
    go(pg, "G.cb.ap[0]=0;L.tbSpent=0;L.tbReA=false;L.tbMv=0"); pg.wait_for_timeout(500)
    early = go(pg, "!L.tbEnd"); pg.wait_for_timeout(1100)
    check('Tour par tour : plus d’actions ni de déplacement, le tour se finit tout seul après un court délai', early and go(pg, "L.tbEnd||!tbHero()"))
    go(pg, "G.enemies.forEach(e=>killEnemy(e))"); pg.wait_for_timeout(400)
    check('Tour par tour : victoire, retour au temps réel', not go(pg, "G.cb") and pg.is_hidden('#tbInfo') and pg.is_hidden('#tbCol'))
    go(pg, "L.tbT=0"); pg.wait_for_timeout(250)
    check('Hors combat sans cible : Sac, Quêtes, Talents, Potion en bas, pas de barre d’attaques', pg.is_hidden('#hbar') and pg.is_visible('#mbar #pPot') and pg.is_visible('#mini') and pg.is_visible('#objTxt'))
    check('Aucune erreur JavaScript (tour par tour)', not pg.errs, pg.errs[:4])
    ctx.close()

    # ================= À deux =================
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    ctx.route('**/fonts.g*/**', lambda r: r.abort()); ctx.add_init_script(FAKE)
    A = ctx.new_page(); A.errs = []; A.on('pageerror', lambda e: A.errs.append('[hôte] ' + str(e)))
    A.goto(URL); A.wait_for_timeout(600); A.fill('#name', 'César'); A.click('#bSolo'); A.wait_for_timeout(800)
    B = ctx.new_page(); B.errs = []; B.on('pageerror', lambda e: B.errs.append('[frère] ' + str(e)))
    B.goto(URL); B.wait_for_timeout(800); B.fill('#name', 'Petit frère'); B.click('.cls >> nth=2'); B.wait_for_timeout(300)
    B.wait_for_selector('#hosts button:not([disabled])', timeout=5000); B.click('#hosts button'); B.wait_for_timeout(1000)
    for _ in range(16):
        if go(B, "mode==='guest'&&!!G&&!!L"): break
        B.wait_for_timeout(250)
    check('À deux : le frère rejoint le monde', go(B, "mode==='guest'&&G.zd==='w'") and go(A, "G.players.length") == 2)
    go(B, "hero.lvl=7;hero.tr=['0.0','0.1','0.2','0.3'];refreshStats();buildSkillUI();L.mp=ST.mmp"); B.wait_for_timeout(500)
    go(A, "(()=>{for(let k=0;k<3;k++){const p=G.players[1];const e=spawnEnemy('orc',p.x+40+k*10,p.y,false,false,undefined,2);e.act=true}})()"); A.wait_for_timeout(300)
    for _ in range(25):  # au tour par tour, le frère attend le tour des héros pour agir
        if go(B, "!tbMe()||tbHero()"): break
        B.wait_for_timeout(200)
    go(B, "skQ[1]=true"); B.wait_for_timeout(300); go(B, "skQ[1]=true"); B.wait_for_timeout(600)  # au combat : aperçu puis validation
    check('À deux : compétence du frère exécutée par l’hôte', go(A, "G.players[1].sk[1]") >= 1)
    go(A, "addDrop(6,G.players[1].x+4,G.players[1].y,999,1,2)"); A.wait_for_timeout(1500)
    for _ in range(24):
        if go(B, "hero.bag.some(i=>i.c==='voleur')"): break
        A.wait_for_timeout(250)
    check('À deux : le frère ramasse un objet pour sa classe', go(B, "hero.bag.some(i=>i.c==='voleur')"))
    go(A, "G.enemies=[];G.players.forEach(q=>{q.down=false;q.hp=q.mhp})")
    door = go(A, "(()=>{const b=WORLD.builds.find(b=>b.act==='dun:everwatch');return[b.door.x,b.door.y]})()")
    go(A, f"(()=>{{const q=worldFree({door[0]},{door[1]});L.x=q.x;L.y=q.y}})()"); go(B, f"(()=>{{const q=worldFree({door[0]},{door[1]});L.x=q.x+10;L.y=q.y}})()"); A.wait_for_timeout(600)
    for _ in range(15):
        if go(A, f"Math.hypot(G.players[1].x-L.x,G.players[1].y-L.y)<40"): break
        A.wait_for_timeout(200)
    go(B, "requestAct('dun:everwatch')"); A.wait_for_timeout(1500)
    for _ in range(10):
        if go(B, "G.m.kind==='dun'"): break
        A.wait_for_timeout(300)
    check('À deux : entrée ensemble dans la forteresse (demandée par le frère)', go(A, "G.m.kind==='dun'") and go(B, "G.m.kind==='dun'&&G.m.did==='everwatch'"))
    B.screenshot(path=f'{OUT}/e1_coop_frere.png')
    mp = go(A, "window.__maxPres||0")
    check('À deux : messages réseau sous 4 Ko', 0 < mp <= 4096, mp)
    # pause : le frère passe l'appli en arrière-plan 20 s ; l'hôte garde sa place et la partie continue au retour
    go(B, "pres({bg:1})"); A.wait_for_timeout(600)
    go(A, "G.guestSeen=performance.now()-20000"); A.wait_for_timeout(600)
    check('À deux : pause de l’allié, sa place est gardée', go(A, "G.players.length===2&&!!G.guestPeer"))
    go(B, "pres({bg:0})"); A.wait_for_timeout(600)
    check('À deux : retour de pause, toujours ensemble', go(A, "G.players.length") == 2 and go(B, "mode") == 'guest')
    # tour par tour à deux : chacun entre et sort pour son compte ; un seul héros joue à la fois, dans l'ordre des vitesses
    go(A, "G.enemies=[];G.cb=null;G.players.forEach(q=>{q.down=false;q.hp=q.mhp})"); go(B, "(()=>{L.x=G.players[0].x+14*TS;L.y=G.players[0].y})()"); A.wait_for_timeout(500)
    go(A, "(()=>{for(let k=0;k<2;k++){const q=freeNear(L.x+3*TS,L.y,0,TS);const e=spawnEnemy('slime',q.x,q.y,false,false,undefined,1);e.act=true}})()"); A.wait_for_timeout(500)
    check('À deux : l’hôte au combat, le frère reste en temps réel', go(A, "!!G.cb&&G.cb.in[0]&&!G.cb.in[1]") and go(B, "!tbMe()"))
    go(B, "(()=>{const e=G.enemies[0];L.x=e.x+6*TS;L.y=e.y})()"); B.wait_for_timeout(800)
    check('À deux : le frère entre dans la zone de combat et rejoint le tour par tour', go(A, "G.cb.in[1]") and go(B, "tbMe()"))
    check('À deux : le frère (voleur, plus rapide) prend sa place avant les ennemis, la colonne le montre', go(A, "G.cb.q.slice(G.cb.k+1)[0]===-2") and go(B, "document.querySelectorAll('#tbOrd .to.h').length") == 2, go(A, "[G.cb.q,G.cb.k]"))
    for _ in range(25):
        if go(A, "tbHero()"): break
        A.wait_for_timeout(200)
    check('À deux : au tour de l’hôte, le frère attend (ni action ni déplacement)', go(A, "tbHero()") and go(B, "tbAlly()&&!tbCanAct()&&!tbCanPot()") and B.is_hidden('#bEnd'))
    go(A, "endTurn()"); A.wait_for_timeout(500)
    check('À deux : l’hôte a fini → au tour du frère, l’hôte attend', go(A, "G.cb.ph==='h'&&G.cb.who===1&&tbAlly()") and go(B, "tbHero()") and B.is_visible('#bEnd') and A.is_hidden('#bEnd'))
    B.click('#bEnd'); A.wait_for_timeout(800)
    check('À deux : le frère a fini → tour des ennemis, un par un', go(A, "G.cb.ph==='e'") and go(B, "tbFoe()"))
    for _ in range(40):
        if go(A, "G.cb&&G.cb.r===2&&G.cb.ph==='h'"): break
        A.wait_for_timeout(200)
    check('À deux : manche 2, le frère (vitesse 14) ouvre la manche', go(A, "G.cb.r===2&&G.cb.who===1&&G.cb.q[0]===-2") and go(B, "tbHero()"), go(A, "G.cb&&[G.cb.r,G.cb.q,G.cb.k]"))
    go(B, "(()=>{L.x+=0})()"); go(A, "G.enemies.forEach(e=>killEnemy(e))"); A.wait_for_timeout(600)
    B.click('#pMenu'); B.click('#bQuit'); A.wait_for_timeout(900)
    check('À deux : le frère quitte, l’hôte continue', go(A, "G.players.length") == 1)
    check('Aucune erreur JavaScript (à deux)', not A.errs and not B.errs, (A.errs + B.errs)[:4])

    # ================= À deux sur le site public (Firebase simulé) : toute partie lancée reste ouverte =================
    FBA = open(os.path.join(ROOT, 'tests', 'fake_firebase_app.js')).read(); FBD = open(os.path.join(ROOT, 'tests', 'fake_firebase_database.js')).read()
    def fb_route(r):
        body = FBA if r.request.url.endswith('firebase-app.js') else FBD
        r.fulfill(status=200, body=body, headers={'Content-Type': 'application/javascript', 'Access-Control-Allow-Origin': '*'})
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    ctx.route('**/fonts.g*/**', lambda r: r.abort()); ctx.route('https://www.gstatic.com/firebasejs/**', fb_route); ctx.add_init_script('window.__noStory = true;')
    A = ctx.new_page(); A.errs = []; A.on('pageerror', lambda e: A.errs.append('[hôte] ' + str(e)))
    A.goto(URL); A.wait_for_selector('#splash', state='detached', timeout=30000); A.wait_for_timeout(800)
    check('Site : connecté au jeu à deux, sans code ni bouton spécial', go(A, "netOn") and not A.query_selector('#bHost') and not A.query_selector('#codeIn'))
    A.fill('#name', 'César'); A.click('#bSolo'); A.wait_for_timeout(1000)
    check('Site : on commence à jouer seul, la partie est ouverte', go(A, "mode==='solo'&&peers.find(p=>p.sameTab).presence.r==='h'") and 'Place libre' in A.inner_text('#alSt'))
    B = ctx.new_page(); B.errs = []; B.on('pageerror', lambda e: B.errs.append('[frère] ' + str(e)))
    B.goto(URL); B.wait_for_timeout(1000); B.fill('#name', 'Petit frère'); B.click('.cls >> nth=1'); B.wait_for_timeout(200)
    check('Site : le 2e joueur voit la partie en cours', 'César' in B.inner_text('#hosts') and B.is_visible('#hosts button'))
    B.click('#hosts button'); B.wait_for_timeout(2500)
    check('Site : le 2e joueur rejoint, l’hôte passe à deux', go(B, "mode==='guest'&&G.zd==='w'") and go(A, "mode==='host'&&G.players.length===2"), [go(B, "mode"), go(A, "mode")])
    go(B, "(()=>{L.x+=60})()"); B.wait_for_timeout(700)
    check('Site : l’hôte voit bouger le frère', abs(go(A, "G.players[1].x") - go(B, "L.x")) < 30)
    mp = go(A, "window.__maxPres||0"); check('Site : messages Firebase légers', 0 < mp <= 6000, mp)
    C = ctx.new_page(); C.errs = []; C.goto(URL); C.wait_for_selector('#hosts button', timeout=20000); C.wait_for_timeout(300)  # chargement parfois lent quand la machine est chargée
    check('Site : partie complète pour un 3e joueur', C.is_disabled('#hosts button') and 'Complète' in C.inner_text('#hosts'))
    B.close(); A.wait_for_timeout(800)
    for _ in range(40):
        if go(A, "G.players.length") == 1: break
        A.wait_for_timeout(250)
    check('Site : le frère part, l’hôte continue seul et la place se libère', go(A, "G.players.length===1&&mode==='solo'"))
    for _ in range(12):
        if C.query_selector('#hosts button') and C.is_enabled('#hosts button'): break
        C.wait_for_timeout(250)
    check('Site : la place libérée réapparaît pour un autre joueur', C.is_enabled('#hosts button'), C.inner_text('#hosts'))
    # journal de débogage : prénom complet, index de dates, ménage des journaux de plus de 7 jours
    go(A, "(()=>{const s=window.__fbStore;s.set('logidx/svieux',Date.now()-8*864e5);s.set('logs/svieux',{j:'{}',t:Date.now()-8*864e5});Log.ev('test','journal');Log.dirty=true;Log.purged=0;Log.upload()})()"); A.wait_for_timeout(1500)
    lg = go(A, "(()=>{const s=window.__fbStore,v=s.get('logs/'+Log.sid);return v?JSON.parse(v.j):null})()")
    check('Journal : envoyé avec le prénom complet', lg and lg.get('n') == 'César' and 'César' in lg.get('log', ''), lg and lg.get('n'))
    check('Journal : index de date inscrit', isinstance(go(A, "window.__fbStore.get('logidx/'+Log.sid)"), (int, float)))
    check('Journal : vieux journaux (> 7 jours) effacés', not go(A, "window.__fbStore.has('logs/svieux')||window.__fbStore.has('logidx/svieux')"))
    check('Aucune erreur JavaScript (site, à deux)', not A.errs and not B.errs and not C.errs, (A.errs + B.errs + C.errs)[:4])
    br.close()
print(f"\n{sum(1 for r in res if r[1])}/{len(res)} tests réussis")
