// Cache só do "casco" do app; dados vêm sempre do banco.
const CACHE = 'vinek-v8';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/supabase.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // rede primeiro, cache se offline
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});

// lembretes (push do servidor)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { title: 'VINEK', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'VINEK', {
    body: d.body || '', tag: d.tag, icon: '/icon-192.png', badge: '/icon-192.png', data: { tag: d.tag || '' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const t = (e.notification.data && e.notification.data.tag) || '';
  const aba = t.startsWith('rem_') ? 'remedios' : t.startsWith('agua') ? 'nutricao' : t === 'check' ? 'check' : 'inicio';
  const url = '/#' + aba;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) { c.navigate(url); return c.focus(); } }
    return clients.openWindow(url);
  }));
});
