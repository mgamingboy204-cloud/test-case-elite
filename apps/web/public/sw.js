const STATIC_CACHE = "vael-static-v2";
const PAGE_CACHE = "vael-pages-v2";

const APP_SHELL = ["/", "/discover", "/likes", "/matches", "/alerts", "/profile", "/manifest.json"];
const DYNAMIC_DATA_PREFIXES = [
  "/discover/",
  "/likes",
  "/matches",
  "/alerts",
  "/notifications",
  "/me/",
  "/verification/",
  "/offline-meet",
  "/online-meet",
  "/social-exchange",
  "/consent"
];

function isDynamicDataRequest(url) {
  return DYNAMIC_DATA_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys
      .filter((key) => ![STATIC_CACHE, PAGE_CACHE].includes(key))
      .map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  if (isDynamicDataRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await caches.match("/"));
  }
}
