// Aegis Shelf Capture - offline worker. Caches the app shell so it opens without signal; never touches uploads.
const CACHE = 'aegis-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;                       // uploads (POST) go straight to the network
  if (u.origin !== location.origin && !u.hostname.endsWith('cdnjs.cloudflare.com') && !u.hostname.endsWith('gstatic.com') && !u.hostname.endsWith('googleapis.com')) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r && r.status === 200) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; }).catch(() => hit);
    return hit || net;                                            // cached shell first, then refresh in the background
  }));
});
