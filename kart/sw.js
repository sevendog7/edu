/* 우리 팀 카트 레이스 뽑기 - 서비스 워커
   - 설치할 때 앱 파일을 모두 저장해 인터넷 없이도 실행
   - 화면(HTML)은 온라인이면 새 버전을 받고, 3초 안에 응답이 없거나 오프라인이면 저장본 사용
   - 앱을 고친 뒤에는 아래 CACHE 이름의 숫자를 올려야 사용자 기기에 반영됨 */
const CACHE = 'kart-race-office-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const withTimeout = (p, ms) => new Promise((ok, no) => {
  const t = setTimeout(() => no(new Error('timeout')), ms);
  p.then(v => { clearTimeout(t); ok(v); }, err => { clearTimeout(t); no(err); });
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      withTimeout(fetch(req), 3000)
        .then(res => {
          if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); }
          return res;
        })
        .catch(() => caches.match('./index.html').then(m => m || fetch(req)))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return res;
    }))
  );
});
