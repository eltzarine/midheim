// Faux SDK Firebase Realtime Database : relie les onglets d'un même navigateur (BroadcastChannel).
// N'implémente que ce que le jeu utilise : ref, child, set, remove, onChild*, onValue(.info/connected), onDisconnect,
// et pour le ménage du journal : get(query(ref, orderByValue(), endAt(x), limitToFirst(n))).
const bc = new BroadcastChannel('fb-mock');
const store = new Map(); window.__fbStore = store; const mine = new Map(), listeners = [], onDc = new Set();
const parentOf = p => p.slice(0, p.lastIndexOf('/'));
const snap = (key, val) => ({ key, val: () => val });
function fire(path, type, val) {
  const par = parentOf(path), key = path.slice(par.length + 1);
  for (const l of listeners) if (l.base === par && l.type === type) setTimeout(() => l.cb(snap(key, val)), 0);
}
function apply(path, val) {
  const had = store.has(path);
  if (val == null) { if (had) { store.delete(path); fire(path, 'removed', null); } return; }
  store.set(path, val); fire(path, had ? 'changed' : 'added', val);
}
bc.onmessage = e => { const m = e.data; if (m.t === 'w') apply(m.path, m.val); if (m.t === 'hello') for (const [p, v] of mine) bc.postMessage({ t: 'w', path: p, val: v }); };
export function getDatabase() { return {}; }
export function ref(db, path) { return { path: path.replace(/^\/|\/$/g, '') }; }
export function child(r, k) { return { path: r.path + '/' + k }; }
export function serverTimestamp() { return { '.sv': 'timestamp' }; }
export function set(r, v) {
  v = JSON.parse(JSON.stringify(v), (k, x) => x && x['.sv'] === 'timestamp' ? Date.now() : x); const size = new TextEncoder().encode(JSON.stringify(v)).length;
  window.__maxPres = Math.max(window.__maxPres || 0, size); window.__fbWrites = (window.__fbWrites || 0) + 1;
  mine.set(r.path, v); apply(r.path, v); bc.postMessage({ t: 'w', path: r.path, val: v }); return Promise.resolve();
}
export function remove(r) { mine.delete(r.path); apply(r.path, null); bc.postMessage({ t: 'w', path: r.path, val: null }); return Promise.resolve(); }
const on = type => (r, cb) => {
  listeners.push({ base: r.path, type, cb });
  if (type === 'added') for (const [p, v] of store) if (parentOf(p) === r.path) setTimeout(() => cb(snap(p.slice(r.path.length + 1), v)), 0);
  return () => {};
};
export const onChildAdded = on('added'), onChildChanged = on('changed'), onChildRemoved = on('removed');
export function onValue(r, cb) { if (r.path === '.info/connected') setTimeout(() => cb(snap('connected', true)), 0); return () => {}; }
export function onDisconnect(r) { return { remove() { onDc.add(r.path); return Promise.resolve(); }, cancel() { onDc.delete(r.path); return Promise.resolve(); } }; }
addEventListener('pagehide', () => { for (const p of onDc) bc.postMessage({ t: 'w', path: p, val: null }); });
bc.postMessage({ t: 'hello' });
export function orderByValue() { return { k: 'ov' }; }
export function endAt(v) { return { k: 'end', v }; }
export function limitToFirst(n) { return { k: 'lim', n }; }
export function query(r, ...c) { return { path: r.path, c }; }
export function get(q) {
  const end = (q.c || []).find(x => x.k === 'end'), lim = (q.c || []).find(x => x.k === 'lim');
  let rows = [...store].filter(([p]) => parentOf(p) === q.path).map(([p, v]) => [p.slice(q.path.length + 1), v]);
  rows.sort((a, b) => a[1] - b[1]); if (end) rows = rows.filter(r => typeof r[1] === 'number' && r[1] <= end.v); if (lim) rows = rows.slice(0, lim.n);
  return Promise.resolve({ forEach(f) { rows.forEach(([k, v]) => f(snap(k, v))); } });
}
