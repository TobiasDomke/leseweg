const CACHE = "leseweg-offline-__VERSION__";
const ASSETS = __ASSETS__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await (await caches.open(CACHE)).addAll(ASSETS);
      // The first Pages release cached a redirect and could not reopen to show
      // the update button. Repair only that broken version automatically.
      for (const name of await caches.keys()) {
        if (!name.startsWith("leseweg-offline-") || name === CACHE) continue;
        const previous = await caches.open(name);
        if ((await previous.match("/index.html"))?.redirected) {
          await self.skipWaiting();
          break;
        }
      }
    })(),
  );
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

self.addEventListener("push", (event) => {
  // Safari displays immutable Declarative Web Push itself. Other browsers use
  // the same encrypted payload through this standard service-worker handler.
  if (event.notification) return;
  let notification;
  try {
    notification = event.data?.json()?.notification;
  } catch {}
  event.waitUntil(
    self.registration.showNotification("Leseweg", {
      body:
        typeof notification?.body === "string"
          ? notification.body
          : "Zeit zum Bibellesen. Öffne Leseweg für deine heutigen Kapitel.",
      icon: "/icon-192.png",
      tag:
        notification?.tag === "leseweg-test" ? "leseweg-test" : "leseweg-daily",
      lang: ["de", "ru", "en", "uk"].includes(notification?.lang)
        ? notification.lang
        : "de",
      data: { url: self.location.origin + "/" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const url = self.location.origin + "/";
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = windows.find(
        (client) => new URL(client.url).origin === self.location.origin,
      );
      if (existing) {
        await existing.navigate(url);
        await existing.focus();
      } else await self.clients.openWindow(url);
    })(),
  );
});
