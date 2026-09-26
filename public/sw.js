const CURRENT_CACHE = "hundred-eyes-v1";
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CURRENT_CACHE);
      await Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CURRENT_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase ฯลฯ → network เสมอ
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    // network-first → cache '/' → cache '/offline'
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CURRENT_CACHE);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cache = await caches.open(CURRENT_CACHE);
          return (
            (await cache.match(req)) ||
            (await cache.match("/")) ||
            (await cache.match("/offline")) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/_next/image")) {
    // cache-first (รูปผ่าน /_next/image ทำให้เปิดออฟไลน์แล้วยังเห็นรูปเก่าได้)
    event.respondWith(
      (async () => {
        const cache = await caches.open(CURRENT_CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const fresh = await fetch(req);
          if (fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          return hit || Response.error();
        }
      })()
    );
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "⚠️ Flood Alert", body: "", tag: "flood-alert", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      vibrate: [400, 150, 400],
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const url = (event.notification.data && event.notification.data.url) || "/";
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const clientWindow of windowClients) {
        if ("focus" in clientWindow) {
          await clientWindow.focus();
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
