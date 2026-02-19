const CACHE_NAME = "cw-cache-v6"; // <-- aumenta versione quando aggiorni SW
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

// Solo shell: NON precachiamo data.json così non resta “congelato”
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const resp = await fetch(request);
  const copy = resp.clone();
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, copy);
  return resp;
}

async function networkFirst(request) {
  try {
    const resp = await fetch(request, { cache: "no-store" });
    const copy = resp.clone();
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, copy);
    return resp;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw e;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Gestiamo solo same-origin
  if (url.origin !== self.location.origin) return;

  // 1) SEMPRE network-first per data.json (così gli aggiornamenti arrivano)
  if (url.pathname.endsWith("/data.json") || url.pathname.endsWith("data.json")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 2) (Consigliato) network-first anche per app.js durante lo sviluppo
  if (url.pathname.endsWith("/app.js") || url.pathname.endsWith("app.js")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3) HTML: network-first con fallback cache/offline
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const resp = await fetch(req);
          const copy = resp.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, copy);
          return resp;
        } catch {
          return (await caches.match("./")) || (await caches.match("./index.html"));
        }
      })()
    );
    return;
  }

  // 4) Tutto il resto: cache-first (CSS, icone, immagini ecc.)
  event.respondWith(cacheFirst(req));
});
