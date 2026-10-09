// Salon simulé : relie les onglets du même navigateur via BroadcastChannel,
// avec la même forme d'API que claude.use("room") (presence / onPeers / onConnection).
(() => { window.__noStory = true;
  const me = 'p' + Math.random().toString(36).slice(2, 10);
  const bc = new BroadcastChannel('dd-room');
  let mine = {};
  const others = new Map();
  const handlers = [];
  const snapshot = () => {
    const list = [{ peer: me, presence: mine, sameTab: true, isMe: true, by: null, kind: 'viewer', guest: false, updatedAt: Date.now() }];
    for (const [peer, presence] of others) list.push({ peer, presence, sameTab: false, isMe: false, by: null, kind: 'viewer', guest: false, updatedAt: Date.now() });
    return list;
  };
  const notify = () => { const peers = snapshot(); for (const h of handlers) h({ peers, joined: [], left: [], updated: [] }); };
  bc.onmessage = (ev) => {
    const m = ev.data;
    if (m.t === 'p') { others.set(m.peer, Object.freeze(m.pres)); notify(); }
    if (m.t === 'hello') { bc.postMessage({ t: 'p', peer: me, pres: mine }); }
    if (m.t === 'bye') { others.delete(m.peer); notify(); }
  };
  addEventListener('pagehide', () => bc.postMessage({ t: 'bye', peer: me }));
  const room = {
    presence(patch) {
      const next = Object.assign({}, mine);
      for (const k in patch) { if (patch[k] === null) delete next[k]; else next[k] = patch[k]; }
      mine = Object.freeze(JSON.parse(JSON.stringify(next)));
      const size = new TextEncoder().encode(JSON.stringify(mine)).length;
      if (size > 4096) { window.__presTooBig = (window.__presTooBig || 0) + 1; return Promise.reject({ code: 'invalid_argument' }); }
      window.__maxPres = Math.max(window.__maxPres || 0, size);
      bc.postMessage({ t: 'p', peer: me, pres: mine });
      setTimeout(notify, 0);
      return Promise.resolve();
    },
    onPeers(h) { handlers.push(h); setTimeout(() => h({ peers: snapshot(), joined: snapshot(), left: [], updated: [] }), 0); return () => {}; },
    onConnection(h) { setTimeout(() => h(true), 0); return () => {}; },
    connected: () => true,
    peers: snapshot,
  };
  window.claude = { use: async (n) => (n === 'room' ? room : null) };
  bc.postMessage({ t: 'hello', peer: me });
})();
