const CACHE = "leseweg-offline-__VERSION__";
const ASSETS = __ASSETS__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("leseweg-offline-") && name !== CACHE)
          await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data === "ACTIVATE_UPDATE") self.skipWaiting();
  if (event.data?.type === "CHECK_OFFLINE_READY" && event.ports?.[0]) {
    event.waitUntil(
      (async () => {
        let offlineReady = false;
        try {
          const cache = await caches.open(CACHE);
          const entries = await Promise.all(
            ASSETS.map((url) => cache.match(url)),
          );
          offlineReady = entries.every(Boolean);
        } catch {
          /* A missing/inaccessible cache must never be reported ready. */
        }
        event.ports[0].postMessage({ offlineReady });
      })(),
    );
  }
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(
      caches
        .open(CACHE)
        .then(async (cache) => (await cache.match("/")) || fetch(request)),
    );
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches
        .open(CACHE)
        .then(
          async (cache) => (await cache.match(url.pathname)) || fetch(request),
        ),
    );
  }
});
