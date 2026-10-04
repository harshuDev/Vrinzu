/* Vrinzu service worker — makes the app installable, lets it open offline and
   shows the daily writing reminder. API calls always go to the network. */
const SHELL_CACHE = 'vrinzu-shell-v3';
const ASSET_CACHE = 'vrinzu-assets-v1';
const STATE_CACHE = 'vrinzu-state';
const KEEP = [SHELL_CACHE, ASSET_CACHE, STATE_CACHE];
const SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];
const MAX_ASSETS = 80;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Page loads: network first (so new deploys show up at once), cached copy offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // App code, styles and fonts never change under the same name: cache first.
  const isBuildAsset = url.origin === self.location.origin && url.pathname.startsWith('/static/');
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (isBuildAsset || isFont) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok || response.type === 'opaque') {
              const copy = response.clone();
              caches
                .open(ASSET_CACHE)
                .then((cache) => cache.put(request, copy))
                .then(() => trim(ASSET_CACHE, MAX_ASSETS));
            }
            return response;
          }),
      ),
    );
  }
});

/* ---------- Daily reminder ---------- */
const STATE_URL = '/__vrinzu/reminder';
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function checkReminder() {
  const cache = await caches.open(STATE_CACHE);
  const res = await cache.match(STATE_URL);
  if (!res) return;
  const state = await res.json();
  if (!state.enabled) return;
  const [h, m] = String(state.time || '20:00')
    .split(':')
    .map(Number);
  const now = new Date();
  const due = now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
  const day = today();
  if (!due || state.lastWritten === day || state.lastNotified === day) return;

  await self.registration.showNotification('Time to write ✍️', {
    body: 'A few lines about today keeps your streak going.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'vrinzu-reminder',
    data: { url: '/app' },
  });
  await cache.put(
    STATE_URL,
    new Response(JSON.stringify({ ...state, lastNotified: day }), { headers: { 'Content-Type': 'application/json' } }),
  );
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'vrinzu-reminder') event.waitUntil(checkReminder());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/app';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) return open.focus().then((w) => w.navigate?.(target));
      return self.clients.openWindow(target);
    }),
  );
});
