// À moi! : fonctionne hors ligne et se met à jour toute seule.
// Change VERSION à chaque mise à jour (et APP_VERSION dans index.html).
const VERSION = 'a-moi-v8';
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'img/logo.webp', 'img/sablier.webp', 'img/bravo.webp', 'img/avatar.webp',
  'img/icon-180.png', 'img/icon-192.png', 'img/icon-512.png',
  'fonts/barlow-latin-400-normal.woff2', 'fonts/barlow-latin-500-normal.woff2',
  'fonts/barlow-latin-600-normal.woff2', 'fonts/barlow-latin-700-normal.woff2',
  'fonts/barlow-latin-800-normal.woff2'
];
self.addEventListener('install', e => {
  // cache:'reload' = toujours prendre les fichiers frais sur GitHub, jamais une vieille copie
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // La page elle-même : Internet d'abord (pour avoir la dernière version), sinon la copie gardée.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); }
        return res;
      }).catch(() => caches.match('index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // Images, police : la copie gardée d'abord (rapide, hors ligne).
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
