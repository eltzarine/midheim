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
  applyGuestStats,applyGuestInput,hostRequest,zoneName:typeof zoneName,tbLogLines,
  setG:v=>{G=v},getG:()=>G};`, ctx, { filename: 'bundle.js' });
  return ctx.__T;
}

if (!fs.existsSync(BUNDLE)) {
  test('dist/bundle.js existe (lancer python3 tools/build.py artifact)', () => assert.fail('bundle absent'));
} else {
  const T = loadGame();
  const hero = (cls, lvl, tr = []) => Object.assign(T.newHero(cls), { lvl, tr });

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
