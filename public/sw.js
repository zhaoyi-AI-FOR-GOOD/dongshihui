// Service Worker for performance optimization - 极致缓存策略
const CACHE_NAME = 'dongshihui-v3';
const API_CACHE_NAME = 'dongshihui-api-v3';

// 缓存静态资源 - 动态处理构建文件
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

// 匹配静态资源模式
const STATIC_RESOURCE_PATTERNS = [
  /\/static\/js\/.*\.js$/,
  /\/static\/css\/.*\.css$/,
  /\/static\/media\/.*\.(png|jpg|jpeg|gif|svg|webp)$/
];

// API缓存策略
const API_BASE_URL = 'https://dongshihui-api.jieshu2023.workers.dev';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 只处理GET请求和我们关心的资源
  if (event.request.method !== 'GET') {
    return;
  }
  
  // 简化API缓存 - 只缓存核心列表API
  if (url.origin === API_BASE_URL && 
      (url.pathname.includes('/directors/active') || url.pathname.includes('/meetings'))) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // 简单的网络请求
          return fetch(event.request).then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }
  
  // 静态资源简单缓存
  if (url.pathname.includes('/static/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

// 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});