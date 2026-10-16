/* Tests unitaires (Node, sans dépendance) : règles du jeu, nettoyage des données reçues, sécurité de la page.
   Lancement : node --test tests/   (aussi lancé au début de tests/run.py)
   Le jeu est chargé depuis dist/bundle.js (python3 tools/build.py artifact) dans un bac à sable :
   le navigateur y est remplacé par un objet neutre qui accepte tout, seules les fonctions pures sont testées. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const BUNDLE = path.join(ROOT, 'dist', 'bundle.js');

/* objet « bouche-trou » : toute propriété, tout appel ou toute construction renvoie un autre bouche-trou */
function any() {
  return new Proxy(function () {}, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then') return undefined;
      if (k === Symbol.iterator) return function* () {};
      return any();
    },
    apply: () => any(), construct: () => any(), set: () => true,
  });
}

function loadGame() {
  const code = fs.readFileSync(BUNDLE, 'utf8');
  const ctx = {
    console, Math, JSON, Date, Promise, TextEncoder, Map, Set, WeakMap, Array, Object, String, Number, Boolean,
    RegExp, Error, Symbol, Proxy, Reflect, isFinite, isNaN, parseInt, parseFloat, Infinity, NaN, structuredClone, atob, btoa,
    Uint8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  };
  for (const k of ['document', 'navigator', 'location', 'localStorage', 'sessionStorage', 'addEventListener', 'requestAnimationFrame',
    'Image', 'Audio', 'AudioContext', 'webkitAudioContext', 'matchMedia', 'innerWidth', 'innerHeight', 'devicePixelRatio', 'screen',
    'history', 'caches', 'fetch', 'visualViewport', 'getComputedStyle', 'OffscreenCanvas', 'Path2D', 'URL', 'Blob', 'HTMLElement',
    'CSS', 'speechSynthesis', 'SpeechSynthesisUtterance', 'MutationObserver', 'ResizeObserver']) ctx[k] = any();
  ctx.performance = { now: () => Date.now() };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  // les let/const du jeu ne sont visibles que dans le même script : on y ajoute l'accès pour les tests
  vm.runInContext(code + `
;globalThis.__T={xpNeed,LVL_MAX,HERO_V,newHero,fixHero,clean,logName,treeNode,treeWhy,heroKit,treePts,TREE,SK,
  applyGuestStats,applyGuestInput,hostRequest,zoneName:typeof zoneName,tbLogLines,tbUpdate,tbClose,TS,tbStart,tbQueue,tbPack,tbUnpack,tbGate,TB_EN,tbPA,TB_DASH,
  tacFlees,tacPack,tacUnpack,patPos,patLen,reinTurns,TB_LG,hitChance,HIT_BASE,HIT_FAR,tbNoteSpend,tbAdmit,
  SPR,SHEET_HD,SHEET_NINJA,STEP_PX,proBits,proSibOf,buildLanterne,PRO_SEAT,PRO_DOOR,setG:v=>{G=v},getG:()=>G};`, ctx, { filename: 'bundle.js' });
  return ctx.__T;
}

if (!fs.existsSync(BUNDLE)) {
  test('dist/bundle.js existe (lancer python3 tools/build.py artifact)', () => assert.fail('bundle absent'));
} else {
  const T = loadGame();
  const hero = (cls, lvl, tr = []) => Object.assign(T.newHero(cls), { lvl, tr });


  /* ---------- Prologue de 2999 (la Lanterne froide) ---------- */
  test('Prologue : « pr » reçu de l’autre joueur est borné au bit de fin de scène', () => {
    assert.deepEqual([0, 1, 2, 3, 7, 255, -1, 'x', null, 1e40, NaN, '2', '1'].map(T.proBits), [0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1]);
  });
  test('Prologue : chaque classe joue son frère ou sa sœur', () => {
    assert.deepEqual(['guerrier', 'voleur', 'mage', 'soigneur', 'inconnu'].map(T.proSibOf), ['bjorn', 'kari', 'sigrid', 'liv', 'kari']);
  });
  test('Prologue : la porte de la Lanterne est fermée au départ et les places autour de la table sont libres', () => {
    const m = T.buildLanterne('tarkin_auberge', { x: 0, y: 0 });
    assert.equal(m.t[(m.H - 1) * m.W + T.PRO_DOOR], 6);
    for (const s of ['kari', 'bjorn', 'sigrid', 'liv']) { const [x, y] = T.PRO_SEAT[s]; assert.equal(m.t[Math.floor(y) * m.W + Math.floor(x)], 0, s); }
    assert.ok(m.inter.some(i => i.act === 'exit'));
  });

  /* ---------- Planches de personnage ---------- */
  test('Planches : 8 directions, angle -> ligne de la planche', () => {
    const m = T.SHEET_HD, d = a => T.SPR.pick(m, a * Math.PI / 180).d;
    assert.deepEqual([0, 45, 90, 135, 180, -135, -90, -45, 20, 60].map(d), ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']);
    assert.equal(T.SPR.pick(m, Math.PI / 2).i, 0);   // bas = 1re ligne
  });
  test('Planches : miroir quand la planche n’a que le côté droit', () => {
    const m = Object.assign({}, T.SHEET_HD, { order: ['S', 'SE', 'E', 'NE', 'N'], mirror: true });
    const p = T.SPR.pick(m, Math.PI);
    assert.equal(p.flip, true); assert.equal(m.order[p.i], 'E');
  });
  test('Planches : le pack garde ses 4 directions (bas, haut, gauche, droite)', () => {
    const m = T.SHEET_NINJA, c = a => T.SPR.pick(m, a).i;
    assert.deepEqual([Math.PI / 2, -Math.PI / 2, Math.PI, 0].map(c), [0, 1, 2, 3]);
  });
  test('Planches : la course avance avec la distance, l’attaque avec le coup', () => {
    const m = Object.assign({}, T.SHEET_HD, { walk: [1, 2, 3, 4, 5, 6, 7, 8], stride: 64, atk: [9, 10, 11, 12] });
    assert.equal(T.SPR.frame(m, 'walk', 0, 0), 1);
    assert.equal(T.SPR.frame(m, 'walk', 8, 0), 2);
    assert.equal(T.SPR.frame(m, 'walk', 64, 0), 1);
    assert.equal(T.SPR.frame(m, 'atk', 0, 0), 9);
    assert.equal(T.SPR.frame(m, 'atk', .99, 0), 12);
    // pack : même cadence qu'avant (une image tous les STEP_PX)
    assert.equal(T.SPR.frame(T.SHEET_NINJA, 'walk', T.STEP_PX * 3, 0), 3);
  });

  /* ---------- Progression ---------- */
  test('XP : 96 pour le niveau 2, puis ×1,5 par niveau, ~7 200 jusqu’au niveau 10', () => {
    const need = [];
    for (let l = 1; l < T.LVL_MAX; l++) need.push(T.xpNeed(l));
    assert.deepEqual(need, [96, 144, 216, 324, 486, 729, 1094, 1640, 2460]);
    const tot = need.reduce((a, b) => a + b, 0);
    assert.ok(tot > 7000 && tot < 7400, String(tot));
    assert.equal(T.LVL_MAX, 10);
  });

  test('Points de talent : 1 par niveau, moins les crans appris', () => {
    assert.equal(T.treePts(hero('mage', 1)), 1);
    assert.equal(T.treePts(hero('mage', 5, ['0.0', '0.1'])), 3);
    assert.equal(T.treePts(hero('mage', 2, ['0.0', '0.1', '0.2'])), 0);
  });

  /* ---------- Arbre de talents ---------- */
  test('Arbre : 4 classes × 3 branches, 4 compétences chacune dont 1 passive (niv 1 ou 4) et 1 ultime (niv 7)', () => {
    for (const cls of ['guerrier', 'mage', 'voleur', 'soigneur']) {
      assert.equal(T.TREE[cls].length, 3, cls);
      for (const B of T.TREE[cls]) {
        const t = [1, 2, 3, 4].map(k => T.SK[B[k]] && T.SK[B[k]].t);
        assert.ok(t.every(Boolean), cls + ' ' + B[0] + ' : compétence inconnue');
        assert.equal(t[2], 'u', B[0] + ' : niv 7 = ultime');
        assert.equal(t.filter(x => x === 'p').length, 1, B[0] + ' : une passive');
        assert.ok(t[0] === 'p' || t[1] === 'p', B[0] + ' : passive au niv 1 ou 4');
        assert.equal(B[5].length, 6, B[0] + ' : 6 bonus');
      }
    }
  });

  test('Arbre : un cran demande le cran relié au-dessus', () => {
    assert.equal(T.treeWhy(hero('guerrier', 5), '0.0'), '');
    assert.match(T.treeWhy(hero('guerrier', 5), '0.1'), /cran relié/);
    assert.match(T.treeWhy(hero('guerrier', 5), '0.3'), /cran relié/);
    assert.equal(T.treeWhy(hero('guerrier', 5, ['0.0']), '0.1'), '');
    assert.equal(T.treeWhy(hero('guerrier', 9, ['0.0', '0.1', '0.2', '0.3']), '0.7'), '', 'deuxième rameau après le niv 4');
  });

  test('Arbre : pas de point, pas d’apprentissage', () => {
    assert.match(T.treeWhy(hero('voleur', 1, ['0.0']), '0.1'), /Plus de point/);
    assert.match(T.treeWhy(hero('voleur', 10, ['0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '1.0']), '1.1'), /dépensés/);
  });

  test('Arbre : une seule passive, un seul ultime, 3 compétences au plus', () => {
    // guerrier : passive Protecteur (Rempart niv 1) puis passive Fracas (Briseur niv 4) refusée
    const h = hero('guerrier', 10, ['0.0', '1.0', '1.1', '1.2']);
    assert.match(T.treeWhy(h, '1.3'), /Une seule compétence passive/);
    // deux ultimes
    const u = hero('mage', 10, ['0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '1.0', '1.1', '1.2', '1.3', '1.4', '1.5']);
    u.lvl = 99; // assez de points pour isoler la règle
    assert.match(T.treeWhy(u, '1.6'), /Un seul ultime/);
    // 4e compétence (hors ultime) refusée
    const k = hero('soigneur', 99, ['0.0', '0.1', '0.2', '0.3', '0.7', '0.8', '0.9']);
    assert.match(T.treeWhy(k, '2.0'), /Au plus 3 compétences/);
  });

  test('Boutons : une active va sur le bouton de son palier', () => {
    const k = T.heroKit(hero('mage', 10, ['2.0', '2.1', '2.2', '2.3', '2.7', '2.8', '2.9']));
    assert.equal(k.slots[0], T.TREE.mage[2][1], 'niv 1 → bouton 1');
    assert.equal(k.slots[2], T.TREE.mage[2][4], 'niv 10 → bouton 3');
    assert.equal(k.pa, T.TREE.mage[2][2], 'passive de niv 4');
  });

  /* ---------- Sauvegarde ---------- */
  test('Sauvegarde : une autre version repart de zéro', () => {
    const h = T.fixHero({ v: T.HERO_V - 1, lvl: 9, gold: 999 }, 'mage');
    assert.equal(h.lvl, 1); assert.equal(h.gold, 30);
    assert.equal(T.fixHero(null, 'mage').lvl, 1);
    assert.equal(T.fixHero('texte', 'mage').lvl, 1);
  });

  test('Sauvegarde : valeurs bornées et crans invalides ignorés', () => {
    const h = T.fixHero({ v: T.HERO_V, cls: 'guerrier', lvl: 500, gold: -5, pot: 99, q: 42,
      tr: ['0.0', '0.0', '9.9', 'x', 7, '0.1', '0.5'], pos: [1, 'a'], sq: { ok: 3, 'BAD KEY': 1, zz: 1e9 },
      fl: ['a', 3, {}], story: Array(80).fill('s') }, 'mage');
    assert.equal(h.cls, 'mage', 'la classe vient de l’emplacement, pas du fichier');
    assert.equal(h.lvl, 10); assert.equal(h.gold, 0); assert.equal(h.q, 6); assert.ok(h.pot <= 6);
    assert.deepEqual([...h.tr], ['0.0', '0.1'], 'doublons, clés inconnues et crans sans parent retirés');
    assert.equal(h.pos, null);
    assert.deepEqual(Object.keys(h.sq), ['ok', 'zz']); assert.equal(h.sq.zz, 99);
    assert.deepEqual([...h.fl], ['a']); assert.equal(h.story.length, 40);
    assert.equal(h.pts, 0);
  });

  /* ---------- Données venues de l'autre joueur ---------- */
  test('Noms : caractères de contrôle et d’inversion retirés, 14 caractères au plus', () => {
    assert.equal(T.clean('Al‮ice\u0000'), 'Alice');
    assert.equal(T.clean('a'.repeat(40)).length, 14);
    assert.equal(T.clean(null), '');
    assert.equal(T.clean({ toString: () => 'Bob' }), 'Bob');
  });

  test('Journal : prénom complet', () => {
    assert.equal(T.logName(' César '), 'César');
    assert.equal(T.logName(''), '?');
  });

  test('Stats de l’invité : compétences d’une autre classe refusées, valeurs bornées', () => {
    const p = { cls: 'voleur', mhp: 100, hp: 100 };
    const mage = T.TREE.mage[0];
    T.applyGuestStats(p, { mhp: 1e12, dmg: 'x', crit: 5, arm: -1, vol: 9, reg: 1e9, pb: 2, we: 'poison', ae: 'feu',
      ks: [mage[1], T.TREE.voleur[0][2], T.TREE.voleur[2][3], T.TREE.voleur[1][3]], pa: T.TREE.voleur[0][1] });
    assert.equal(p.mhp, 99999);
    assert.equal(p.st.crit, 0.9); assert.equal(p.st.arm, 0); assert.equal(p.st.vol, 0.2); assert.equal(p.st.reg, 500);
    assert.equal(p.st.dmg, 1); assert.equal(p.st.pb, 0.5);
    assert.equal(p.st.we, null); assert.equal(p.st.ae, 'feu');
    assert.equal(p.st.ks[0], '', 'compétence du magicien refusée au voleur');
    assert.equal(p.st.ks[3], T.TREE.voleur[1][3], 'ultime sur le bouton d’ultime');
    assert.equal(p.st.pa, T.TREE.voleur[0][1]);
    T.applyGuestStats(p, null); // stats absentes : rien ne casse
    assert.equal(p.st.crit, 0.9);
  });

  test('Stats de l’invité : recalculées seulement quand elles changent', () => {
    const p = { cls: 'mage', mhp: 100, hp: 100 };
    const s = { mhp: 120, dmg: 10 };
    T.applyGuestStats(p, s); const first = p.st;
    T.applyGuestStats(p, { mhp: 120, dmg: 10 });
    assert.equal(p.st, first);
    T.applyGuestStats(p, { mhp: 120, dmg: 11 });
    assert.notEqual(p.st, first); assert.equal(p.st.dmg, 11);
  });

  function fakeG(m) {
    return { players: [{ x: 0, y: 0, hp: 1, mhp: 10 }, { x: 0, y: 0, hp: 1, mhp: 10 }], m, cool: {}, msgs: [], msgId: 0, time: 0, q: 0, zones: [] };
  }
  test('Demandes de l’invité : « se reposer » seulement dans une auberge', () => {
    T.setG(fakeG({ kind: 'world', inter: [], W: 10, H: 10 }));
    T.hostRequest('rest', 1);
    assert.equal(T.getG().players[0].hp, 1, 'repos refusé dehors');
    T.setG(fakeG({ kind: 'house', hk: 'forge', inter: [], W: 10, H: 10 }));
    T.hostRequest('rest', 1);
    assert.equal(T.getG().players[0].hp, 1, 'repos refusé à la forge');
    T.setG(fakeG({ kind: 'house', hk: 'auberge', inter: [], W: 10, H: 10 }));
    T.hostRequest('rest', 1);
    assert.equal(T.getG().players[0].hp, 10, 'repos accepté à l’auberge');
  });

  test('Demandes de l’invité : interaction trop loin ou inconnue ignorée', () => {
    const G = fakeG({ kind: 'world', inter: [{ act: 'arena', x: 5000, y: 5000, r: 40 }], W: 10, H: 10 });
    G.q = 5; T.setG(G);
    T.hostRequest('arena', 1); T.hostRequest('dun:inexistant', 1); T.hostRequest('house:x', 1);
    assert.ok(!T.getG().abhOn);
  });

  test('Entrées de l’invité : visée et cible toujours des nombres finis', () => {
    const G = fakeG({ kind: 'world', inter: [], W: 10, H: 10 });
    G.ep = 1; G.guestPres = { l: 3, i: { z: 1, p: [50, 60], m: ['a', 9], a: 'Infinity', tp: ['NaN', 1e99] } };
    G.players[1].cls = 'mage';
    T.setG(G); T.applyGuestInput();
    const gp = T.getG().players[1];
    assert.ok(Number.isFinite(gp.aim)); assert.deepEqual([...gp.mv], [0, 1]);
    assert.equal(gp.x, 50); assert.equal(gp.y, 60);
  });

  /* ---------- Standards du code ---------- */
  const SRC = path.join(ROOT, 'src');
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.js'));
  test('Code : chaque module se lit sans erreur de syntaxe', () => {
    // les marqueurs @@…@@ sont remplacés au build par des données : ici, par null
    for (const f of files) assert.doesNotThrow(() => new vm.Script(fs.readFileSync(path.join(SRC, f), 'utf8').replace(/@@[A-Z_]+@@/g, 'null'), { filename: f }), f);
  });

  test('Code : ni eval, ni new Function, ni debugger, ni console.log oublié', () => {
    for (const f of files) {
      const s = fs.readFileSync(path.join(SRC, f), 'utf8');
      for (const [re, what] of [[/\beval\s*\(/, 'eval'], [/new\s+Function\s*\(/, 'new Function'], [/\bdebugger\b/, 'debugger'],
        [/console\.log\s*\(/, 'console.log'], [/document\.write\s*\(/, 'document.write']]) assert.ok(!re.test(s), f + ' : ' + what);
    }
  });

  test('Code : innerHTML seulement avec du texte fixe ou des icônes du jeu', () => {
    const ok = /^(?:'|iconSvg\(|Sky\.icon\(\)|skyLine\(\))/; // texte écrit dans le code, ou icônes construites par le jeu
    for (const f of files) {
      const s = fs.readFileSync(path.join(SRC, f), 'utf8');
      for (const m of s.matchAll(/(?:innerHTML|outerHTML)\s*=\s*([^;]{0,60})/g)) assert.ok(ok.test(m[1]), f + ' : innerHTML=' + m[1]);
      assert.ok(!/insertAdjacentHTML/.test(s), f + ' : insertAdjacentHTML');
    }
  });

  /* ---------- Combat ---------- */
  test('Journal des ennemis : actions identiques regroupées, 3 lignes au plus', () => {
    const old = T.getG(); T.setG({ players: [{ name: 'César' }] });
    try {
      const x = (n, k, d) => ({ n, k, pi: 0, d });
      const four = [x('Adepte', 2, 10), x('Adepte', 2, 10), x('Adepte', 2, 10), x('Adepte', 2, 10)];
      const a = T.tbLogLines(four);
      assert.equal(a.length, 1); assert.ok(a[0].endsWith(' ×4'), a[0]);
      const b = T.tbLogLines([x('Orc', 0, 15), x('Adepte', 2, 8), x('Orc', 0, 19), x('Marionnette', 0, 5)]);
      assert.equal(b.length, 3); assert.equal(b[2], '+ 2 autres actions');
      assert.equal(T.tbLogLines([]).length, 0);
    } finally { T.setG(old); }
  });

  test('Combat : pas de combat sans ennemi debout (coup qui tue d’emblée), zone de combat comptée sur les ennemis en alerte', () => {
    const old = T.getG(), S = T.TS;
    const foe = (x, o = {}) => Object.assign({ x, y: 0, hp: 10, act: true, ret: false }, o);
    try {
      // le héros vient de frapper (initiative) mais le coup a tué le seul ennemi : aucun combat n'est ouvert
      const G = { time: 5, tbBy: { pi: 0, t: 5 }, cb: null, players: [{ x: 0, y: 0, down: false }], enemies: [foe(S, { hp: 0 })] };
      T.setG(G); T.tbUpdate(.016);
      assert.equal(G.cb, null); assert.equal(G.tbBy, null);
      // zone de combat : seuls les ennemis vivants, en alerte et qui ne rentrent pas chez eux comptent
      const p = { x: 0, y: 0 };
      G.enemies = [foe(8 * S)]; assert.equal(T.tbClose(p, 9), true);
      G.enemies = [foe(8 * S, { act: false }), foe(8 * S, { ret: true }), foe(8 * S, { hp: 0 }), foe(10 * S)];
      assert.equal(T.tbClose(p, 9), false);
    } finally { T.setG(old); }
  });

  test('Combat : ordre des tours selon la vitesse, héros et ennemis mêlés, un seul acteur à la fois', () => {
    const old = T.getG(), S = T.TS;
    const foe = (id, type, x, o = {}) => Object.assign({ id, type, x, y: 0, r: 12, hp: 20, mhp: 20, act: true, ret: false, kx: 0, ky: 0 }, o);
    const fresh = () => ({ time: 5, tbBy: null, cb: null, coop: true, projs: [], later: [], fires: [], zones: [], traps: [], decoys: [], emap: new Map(),
      msgs: [], msgId: 0, cool: {}, fx: [], fxId: 0,
      players: [{ name: 'César', cls: 'guerrier', st: { spd: 150 }, x: 0, y: 0, down: false }, { name: 'Léo', cls: 'mage', st: { spd: 146 }, x: 0, y: S, down: false }],
      enemies: [foe(5, 'slime', 2 * S), foe(6, 'bat', 3 * S), foe(7, 'orc', 2 * S, { elite: true }), foe(8, 'archer', 8 * S)] });   // l'Adepte hors de l'aura du Chef (5 cases)
    try {
      // vitesse : Rejeton 13+1 (aura du Chef), héros 12 (le 1er joueur d'abord), Chef orc 9+1, Adepte 10, Marionnette 7+1 ; à égalité les héros d'abord
      let G = fresh(); T.setG(G); T.tbStart(-1, [true, true]);
      assert.deepEqual([...G.cb.q], [6, -1, -2, 7, 8, 5]);
      assert.equal(G.cb.ph, 'e'); assert.equal(G.cb.eid, 6);
      // l'invité ne peut rien faire hors de son tour
      assert.equal(T.tbGate(1, 'ac', 1), false);
      // le Rejeton finit son tour → César joue, seul
      T.tbUpdate(T.TB_EN + .1);
      assert.equal(G.cb.ph, 'h'); assert.equal(G.cb.who, 0); assert.equal(G.cb.ap[0], 3);
      assert.equal(T.tbGate(1, 'ac', 1), false);
      // César a fini → au tour de Léo (l'invité), qui peut agir
      G.cb.rd[0] = true; T.tbUpdate(.016);
      assert.equal(G.cb.who, 1); assert.equal(T.tbGate(1, 'ac', 1), true); assert.equal(G.cb.ap[1], 1);
      // Léo a fini → les ennemis restants, un par un : Chef orc, Adepte, Marionnette, puis manche 2
      G.cb.rd[1] = true; T.tbUpdate(.016);
      assert.equal(G.cb.ph, 'e'); assert.equal(G.cb.eid, 7);
      T.tbUpdate(T.TB_EN + .1); assert.equal(G.cb.eid, 8);
      T.tbUpdate(T.TB_EN + .1); assert.equal(G.cb.eid, 5);
      T.tbUpdate(T.TB_EN + .1); assert.equal(G.cb.r, 2); assert.equal(G.cb.k, 0); assert.equal(G.cb.eid, 6);
      // l'invité reçoit l'ordre et sait à qui est le tour
      const g = T.tbUnpack(JSON.parse(JSON.stringify(T.tbPack())));
      assert.deepEqual(g.q, [6, -1, -2, 7, 8, 5]); assert.equal(g.ph, 'e'); assert.equal(g.eid, 6); assert.equal(g.who, -1);
      // embuscade : le héros qui frappe le premier ouvre la manche, avec un point d'action déjà dépensé
      G = fresh(); T.setG(G); T.tbStart(1, [true, true]);
      assert.equal(G.cb.q[0], -2); assert.equal(G.cb.who, 1); assert.equal(G.cb.ap[1], 1);
      // un héros à terre passe son tour ; un ennemi mort disparaît de l'ordre
      G = fresh(); G.players[0].down = true; G.enemies[1].hp = 0; T.setG(G); T.tbStart(-1, [true, true]);
      assert.equal(G.cb.who, 1);
    } finally { T.setG(old); }
  });

  test('Combat : points d’action selon la classe, Foncer coûte 2 points', () => {
    const old = T.getG();
    const G = { time: 5, tbBy: null, cb: null, coop: true, projs: [], later: [], fires: [], zones: [], traps: [], decoys: [], emap: new Map(), msgs: [], msgId: 0, cool: {}, fx: [], fxId: 0,
      players: [{ name: 'César', cls: 'guerrier', st: { spd: 100 }, x: 0, y: 0, down: false }, { name: 'Léo', cls: 'mage', st: { spd: 200 }, x: 0, y: 0, down: false }],
      enemies: [{ id: 9, type: 'slime', x: 2 * T.TS, y: 0, r: 12, hp: 20, mhp: 20, act: true, ret: false, kx: 0, ky: 0 }] };
    try {
      T.setG(G);
      assert.deepEqual([0, 1].map(T.tbPA), [3, 2]);
      G.players[1].cls = 'voleur'; assert.equal(T.tbPA(1), 3); G.players[1].cls = 'soigneur'; assert.equal(T.tbPA(1), 2); G.players[1].cls = 'mage';
      // Léo (le plus rapide) ouvre la manche avec 2 points : Foncer les prend tous, plus rien ensuite
      T.tbStart(-1, [true, true]);
      assert.equal(G.cb.who, 1); assert.equal(G.cb.ap[1], 2); assert.equal(T.TB_DASH, 2);
      assert.equal(T.tbGate(1, 'ac', T.TB_DASH), true); assert.equal(G.cb.ap[1], 0);
      assert.equal(T.tbGate(1, 'ac', T.TB_DASH), false); assert.equal(T.tbGate(1, 'ac', 1), false);
      // César : 3 points, Foncer puis une attaque
      G.cb.rd[1] = true; T.tbUpdate(.016);
      assert.equal(G.cb.who, 0); assert.equal(G.cb.ap[0], 3);
    } finally { T.setG(old); }
  });

  /* ---------- Ennemis stratégiques ---------- */
  test('Moral : qui fuit quand le groupe flanche', () => {
    assert.equal(T.tacFlees('slime', .1, 0), false);   // la Marionnette tient bon
    assert.equal(T.tacFlees('mimic', .1, 0), false);
    assert.equal(T.tacFlees('bat', .4, .9), true);      // Rejeton sous 50 % de vie
    assert.equal(T.tacFlees('bat', .6, .1), false);
    assert.equal(T.tacFlees('orc', 1, .3), true);       // Orc et Adepte : une fois sur deux
    assert.equal(T.tacFlees('archer', 1, .7), false);
    assert.equal(T.tacFlees('boss', .1, 0), false);
  });
  test('Rôles des ennemis : envoi à l’invité sans perte, valeurs bornées', () => {
    const o = { guard: true, sh: true, cry: false, pan: true, flee: false, prot: true, pat: false, aura: true, shT: 2, cryT: 0, panT: 1 };
    assert.deepEqual(JSON.parse(JSON.stringify(T.tacUnpack(T.tacPack(o)))), o);
    const b = T.tacUnpack(T.tacPack({ shT: 99, cryT: -4 }));
    assert.equal(b.shT, 15); assert.equal(b.cryT, 0);
    assert.equal(T.tacUnpack('n’importe quoi').guard, false);
  });
  test('Patrouille : position sur la ronde calculée à partir de la distance parcourue', () => {
    const R = [[0, 0], [100, 0], [100, 100], [0, 100]];
    assert.equal(T.patLen(R), 400);
    assert.deepEqual([T.patPos(R, 50).x, T.patPos(R, 50).y], [50, 0]);
    assert.deepEqual([T.patPos(R, 150).x, T.patPos(R, 150).y], [100, 50]);
    assert.deepEqual([T.patPos(R, 450).x, T.patPos(R, 450).y], [50, 0]);   // la ronde boucle
    assert.deepEqual([T.patPos(R, -50).x, T.patPos(R, -50).y], [0, 50]);   // en retard sur la tête de file
  });
  test('Renforts : tours avant d’arriver au contact', () => {
    assert.equal(T.reinTurns(2 * T.TS, 55), 0);
    assert.equal(T.reinTurns(2 * T.TS + 55 * T.TB_EN, 55), 1);
    assert.equal(T.reinTurns(15 * T.TS, 55), Math.ceil(13 * T.TS / (55 * T.TB_EN)));
  });
  test('Tour par tour : marque, agrippé, provoqué et renforts passent à l’invité, bornés', () => {
    const old = T.getG();
    const G = { players: [{ name: 'A', cls: 'guerrier', x: 0, y: 0, hp: 50, mhp: 50 }, { name: 'B', cls: 'mage', x: 0, y: 0, hp: 50, mhp: 50 }], enemies: [], coop: true, time: 0,
      cb: { ph: 'h', who: 0, eid: -1, q: [-1, -2], k: 0, r: 4, t: 0, in: [true, true], rd: [false, false], ap: [3, 2], po: [false, false], pre: [0, 0], lg: [{ id: 7, k: 8, pi: -1, d: 0, o: 9 }],
        mk: { pi: 1, by: 3, u: 6 }, gr: 1, grU: 0, grBy: [5, -1], pv: [null, null], rf: { x: 320, y: 64, n: 2 } } };
    try {
      T.setG(G);
      const u = T.tbUnpack(JSON.parse(JSON.stringify(T.tbPack())));
      assert.deepEqual([u.mk.pi, u.mk.u, u.gr, u.pvb, u.rf.n, u.lg[0].o], [1, 6, 1, 0, 2, 9]);
      const bad = T.tbUnpack([1, 4, 0, 0, [], [], 0, 7, 99, 'x', ['a', 2, 3]]);
      assert.deepEqual([bad.mk && bad.mk.pi, bad.gr, bad.rf], [1, 0, null]);
      assert.equal(T.TB_LG.length, 16);
    } finally { T.setG(old); }
  });

  /* ---------- Retours de jeu du 14/10 ---------- */
  test('Combat : chance de toucher de l’attaque de base (contact, distance, cible étourdie ou marquée)', () => {
    const S = T.TS;
    assert.equal(T.hitChance('guerrier', 40, false, false), T.HIT_BASE);
    assert.equal(T.hitChance('voleur', 40, true, false), 1);                         // cible étourdie : touchée à coup sûr
    assert.equal(T.hitChance('mage', 3 * S, false, false), T.HIT_BASE);              // de près
    assert.ok(Math.abs(T.hitChance('mage', 300, false, false) - T.HIT_FAR) < 1e-9);  // à la portée maximale
    const mid = T.hitChance('soigneur', 230, false, false);
    assert.ok(mid < T.HIT_BASE && mid > T.HIT_FAR, String(mid));
    assert.ok(Math.abs(T.hitChance('mage', 300, false, true) - (T.HIT_FAR + .1)) < 1e-9);   // cible marquée : +10 %
  });

  test('Combat : ce qu’on lance juste avant d’entrer au combat compte sur le 1er tour ; un ennemi alerté en cours de manche prend sa place', () => {
    const old = T.getG(), S = T.TS;
    const foe = (id, type, x, o = {}) => Object.assign({ id, type, x, y: 0, r: 12, hp: 20, mhp: 20, act: true, ret: false, kx: 0, ky: 0 }, o);
    const fresh = () => ({ time: 5, tbBy: null, cb: null, coop: true, projs: [], later: [], fires: [], zones: [], traps: [], decoys: [], emap: new Map(),
      msgs: [], msgId: 0, cool: {}, fx: [], fxId: 0,
      players: [{ name: 'César', cls: 'guerrier', st: { spd: 150 }, x: 0, y: 0, down: false }, { name: 'Léo', cls: 'mage', st: { spd: 146 }, x: 0, y: S, down: false }],
      enemies: [foe(5, 'slime', 2 * S), foe(8, 'archer', 3 * S)] });
    try {
      // Léo lance un ultime (2 actions) puis entre au combat : il n'a plus de point d'action à son 1er tour
      let G = fresh(); T.setG(G); T.tbNoteSpend(1, 2); G.time = 6; T.tbStart(1, [true, true]);
      assert.equal(G.cb.who, 1); assert.equal(G.cb.ap[1], 0);
      // trop ancien (plus de 3 s) : rien n'est décompté ; un tir isolé compte pour 1 point (embuscade)
      G = fresh(); T.setG(G); T.tbNoteSpend(0, 2); G.time = 9; T.tbStart(0, [true, false]);
      assert.equal(G.cb.who, 0); assert.equal(G.cb.ap[0], 2);
      // une fois au combat, rien n'est plus noté
      T.tbNoteSpend(0, 1); assert.equal(G.preSp[0].n, 0);
      // un Rejeton (initiative 13) réveillé en cours de manche joue avant ceux qui n'ont pas encore joué et sont plus lents
      G = fresh(); T.setG(G); T.tbStart(-1, [true, true]);
      assert.deepEqual([...G.cb.q], [-1, -2, 8, 5]);
      G.enemies.push(foe(9, 'bat', 4 * S)); T.tbAdmit();
      assert.deepEqual([...G.cb.q], [-1, 9, -2, 8, 5]);
      T.tbAdmit(); assert.equal(G.cb.q.length, 5);   // une seule fois
    } finally { T.setG(old); }
  });

  /* ---------- Page publiée ---------- */
  const DOCS = path.join(ROOT, 'docs', 'index.html');
  test('Site : la politique de sécurité autorise le script du jeu par son empreinte', { skip: !fs.existsSync(DOCS) }, () => {
    const html = fs.readFileSync(DOCS, 'utf8');
    const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)[1];
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 1, 'un seul script dans la page');
    const h = crypto.createHash('sha256').update(scripts[0][1]).digest('base64');
    assert.ok(csp.includes(`'sha256-${h}'`), 'empreinte du script absente de la CSP (relancer tools/build.py)');
    for (const d of ["object-src 'none'", "base-uri 'none'", "form-action 'none'"]) assert.ok(csp.includes(d), d);
    assert.ok(!csp.includes('unsafe-eval'));
    assert.ok(!/ on[a-z]+="/.test(html), 'pas de gestionnaire d’événement en attribut HTML');
  });
}
