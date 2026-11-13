// Lecture Z — keeps the game's sounds and pictures on the device, like an installed app.
// - Voice clips and sound effects: kept once downloaded (each regenerated clip gets a new name).
// - Pictures and fonts: served from the device, refreshed in the background.
// - The game itself (page, script, clip list): fresh from the network when online, kept for offline.

const CACHE = "lecture-z-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("lecture-z-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const kept = (req) =>
  caches.open(CACHE).then((c) =>
    c.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) c.put(req, res.clone());
          return res;
        }),
    ),
  );

const refreshed = (req) =>
  caches.open(CACHE).then((c) =>
    c.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok) c.put(req, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );

const fresh = (req) =>
  caches.open(CACHE).then((c) =>
    fetch(req)
      .then((res) => {
        if (res.ok) c.put(req, res.clone());
        return res;
      })
      .catch(() => c.match(req)),
  );

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return; // let the browser stream media ranges itself
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (/^\/lecture\/(voice|sfx)\/.+\.mp3$/.test(url.pathname)) return e.respondWith(kept(req));
    if (url.pathname.startsWith("/assets/dbz/ready/")) return e.respondWith(refreshed(req));
    if (url.pathname.startsWith("/lecture/")) return e.respondWith(fresh(req));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    return e.respondWith(refreshed(req));
  }
});
