const CACHE_NAME = "sfk-sw.js-gc-student-delete-fallback-v23";
const APP_SHELL = [
  "./",
  "./index.html",
  "./reset-cache.html",
  "./style.css",
  "./script.js",
  "./class-chat.css",
  "./class-chat.js",
  "./time-capsule.css",
  "./time-capsule.js",
  "./class-chat-admin.js",
  "./pwa.js",
  "./firebase-config.js",
  "./firebase-adapter.js",
  "./auth.js",
  "./orientation-lock.js",
  "./memories.html",
  "./memories.css",
  "./memories.js",
  "./admin.html",
  "./admin.css",
  "./admin.js",
  "./officer.html",
  "./officer.css",
  "./officer.js",
  "./manifest.webmanifest",
  "./class-photo.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    APP_SHELL.map((url) => cache.add(url).catch((error) => {
      console.warn("SFK cache skipped:", url, error);
    }))
  );
}

async function trimOldCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
}

function shouldCache(response) {
  return response && response.ok && response.type === "basic";
}

async function cacheMatch(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const url = new URL(request.url);
  if (url.pathname.endsWith("/")) {
    return caches.match("./index.html", { ignoreSearch: true });
  }
  return null;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (shouldCache(response)) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cacheMatch(request);
    return cached || caches.match("./index.html", { ignoreSearch: true });
  }
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cacheMatch(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (shouldCache(response)) {
        event.waitUntil(cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached || Response.error());

  return cached || fetchPromise;
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(trimOldCaches());
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, event));
});
