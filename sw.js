// رقم الإصدار يُكتب تلقائياً عند البناء (build.js) — لا حاجة لتغييره يدوياً
const CACHE = 'shasha-debts-202611231958';
const FILES = ['./','index.html','manifest.json','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/icon-maskable-192.png','icons/icon-maskable-512.png','icons/logo-small.png'];

self.addEventListener('install', e => {
  // cache:'reload' حتى لا تُخزَّن نسخة قديمة من ذاكرة المتصفح
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache:'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // نحذف الكاش القديم فقط (ملفات التطبيق) — بيانات الزبائن في IndexedDB لا تتأثر أبداً
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('shasha-debts-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// يفتح فوراً من النسخة المحفوظة (حتى مع إنترنت ضعيف جداً)، ويجلب التحديث في الخلفية للمرة القادمة
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const nav = req.mode === 'navigate';
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = nav ? await cache.match('index.html') : await cache.match(req);
    const net = fetch(req).then(res => {
      if(res && res.ok && res.type === 'basic') cache.put(nav ? 'index.html' : req, res.clone());
      return res;
    });
    if(hit){ e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => cache.match('index.html'));
  }));
});
