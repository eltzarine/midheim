/* Les Pierres de Midheim — service worker (généré par tools/build.py, ne pas modifier docs/sw.js).
   VERSION = empreinte de la page : chaque nouvelle publication est une nouvelle version,
   que le jeu propose (et impose) via le bandeau « Nouvelle version disponible ». */
"use strict";
const VERSION = "midheim-1c33f46cb470";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const PRECACHE = ["./", "index.html", "manifest.webmanifest", ...["icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"]];
const FONT_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: "reload" })))));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, RUNTIME]);
    for (const k of await caches.keys()) if (!keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* La page vient toujours de la version installée : la nouvelle n'arrive qu'en touchant « Mettre à jour ».
   Ainsi les deux joueurs restent sur la même version tant qu'ils n'ont pas mis à jour. */
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") {
      event.respondWith(caches.open(SHELL).then(c => c.match("index.html")).then(hit => hit || fetch(req)));
      return;
    }
    event.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
    return;
  }
  if (FONT_HOSTS.has(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const hit = await cache.match(req);
      const update = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit || Response.error());
      if (hit) { event.waitUntil(update); return hit; }
      return update;
    })());
  }
  /* Tout le reste (Firebase…) passe directement par le réseau. */
});
