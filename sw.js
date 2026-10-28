// Dibuat otomatis oleh scripts/pwa.py di repo umroh-satu-hati.
var CACHE = 'umrah-v1';
var HALAMAN = ['./', './panduan/', './lengkap/'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(HALAMAN.map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () {}); }));
  }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function kunciHalaman(req) {
  var u = new URL(req.url);
  if (!/\/$/.test(u.pathname) && !/\.[a-z0-9]+$/i.test(u.pathname)) u.pathname += '/';
  return u.origin + u.pathname;
}
function jaringanDulu(req) {
  var kunci = kunciHalaman(req);
  return caches.open(CACHE).then(function (c) {
    var ambil = fetch(req).then(function (res) { if (res.ok) c.put(kunci, res.clone()); return res; });
    var batas = new Promise(function (r) { setTimeout(r, 4000); });
    return Promise.race([ambil.catch(function () { return null; }), batas.then(function () { return null; })]).then(function (res) {
      return res || c.match(kunci).then(function (s) { return s || ambil; });
    });
  });
}
function simpananDulu(req) {
  return caches.open(CACHE).then(function (c) {
    return c.match(req).then(function (s) {
      var ambil = fetch(req).then(function (res) { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; })
        .catch(function () { return s; });
      return s || ambil;
    });
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  if (req.mode === 'navigate' && u.origin === location.origin) { e.respondWith(jaringanDulu(req)); return; }
  if (u.origin === location.origin || /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) e.respondWith(simpananDulu(req));
});
