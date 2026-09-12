// 檔名：sw.js（新檔案，與 index.html 同層目錄）

const CACHE_NAME = 'trip-app-v1'; // 【需用戶設定】每次更新內容時把 v1 改成 v2、v3... 才會強制刷新快取

const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
  /* 【需用戶設定】若有其他自訂圖片/檔案，請在此加入相對路徑，格式：'./your-file.png' */
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
