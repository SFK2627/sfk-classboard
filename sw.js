const CACHE_NAME = "sfk-main-pwa-v112-autoplay-sound";
const CACHE_PREFIXES_TO_DELETE = ["sfk-main-pwa-", "sfk-sw.js-"];
const NAVIGATION_FALLBACK_URL = "./index.html";
const NAVIGATION_TIMEOUT_MS = 2500;

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
  "./birthday-music.mp3",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

function appShellRequest(url) {
  return new Request(new URL(url, self.location.href).toString(), {
    cache: "reload",
    credentials: "same-origin"
  });
}

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    APP_SHELL.map(async (url) => {
      try {
        await cache.add(appShellRequest(url));
      } catch (error) {
        console.warn("SFK cache skipped:", url, error);
      }
    })
  );
}

async function trimOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key !== CACHE_NAME && CACHE_PREFIXES_TO_DELETE.some((prefix) => key.startsWith(prefix)))
      .map((key) => caches.delete(key))
  );
}

function shouldCache(response) {
  return response && response.ok && response.type === "basic";
}

async function cacheMatch(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const url = new URL(request.url);
  if (url.pathname.endsWith("/")) {
    return cache.match(NAVIGATION_FALLBACK_URL, { ignoreSearch: true });
  }
  return null;
}

function isHomeNavigation(request) {
  const url = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  const scopePath = scopeUrl.pathname.endsWith("/") ? scopeUrl.pathname : scopeUrl.pathname + "/";
  return url.pathname === scopePath || url.pathname === scopePath + "index.html";
}

async function navigationCacheMatch(request) {
  const cache = await caches.open(CACHE_NAME);
  const exact = await cache.match(request, { ignoreSearch: true });
  if (exact) return exact;

  if (isHomeNavigation(request)) {
    return (
      (await cache.match(NAVIGATION_FALLBACK_URL, { ignoreSearch: true })) ||
      (await cache.match("./", { ignoreSearch: true })) ||
      null
    );
  }

  return null;
}

async function navigationFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  return (
    (await navigationCacheMatch(request)) ||
    (await cache.match(NAVIGATION_FALLBACK_URL, { ignoreSearch: true })) ||
    (await cache.match("./", { ignoreSearch: true })) ||
    null
  );
}

function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(request, {
    cache: "no-store",
    credentials: "same-origin",
    signal: controller.signal
  }).finally(() => clearTimeout(timer));
}

async function saveNavigationResponse(request, response) {
  if (!shouldCache(response)) return;

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());

  // Keep the homepage fallback as homepage only.
  // This prevents Admin/Officers clicks from showing the previous page first.
  if (isHomeNavigation(request)) {
    await cache.put(NAVIGATION_FALLBACK_URL, response.clone());
  }
}

async function updateNavigationCache(request, event) {
  try {
    const preloadResponse = event.preloadResponse ? await event.preloadResponse : null;
    const response = preloadResponse || await fetch(request, { cache: "no-store", credentials: "same-origin" });
    await saveNavigationResponse(request, response.clone());
    return response;
  } catch (error) {
    return null;
  }
}

async function handleNavigation(request, event) {
  const cached = await navigationCacheMatch(request);

  if (cached) {
    event.waitUntil(updateNavigationCache(request, event));
    return cached;
  }

  try {
    const response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
    event.waitUntil(saveNavigationResponse(request, response.clone()));
    return response;
  } catch (error) {
    const fallback = await navigationFallback(request);
    return fallback || new Response("SFK ClassBoard is loading. Please close and open the app again if this stays on screen.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

async function cacheFirstWithRefresh(request, event) {
  const cached = await cacheMatch(request);
  const cache = await caches.open(CACHE_NAME);

  const refreshPromise = fetch(request, { credentials: "same-origin" })
    .then((response) => {
      if (shouldCache(response)) {
        return cache.put(request, response.clone()).then(() => response);
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(refreshPromise);
    return cached;
  }

  const response = await refreshPromise;
  return response || Response.error();
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable().catch(() => {});
    }
    await trimOldCaches();
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (!event.data || !event.data.type) return;
  if (String(event.data.type).includes("SKIP_WAITING")) {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(handleNavigation(request, event));
    return;
  }

  event.respondWith(cacheFirstWithRefresh(request, event));
});
