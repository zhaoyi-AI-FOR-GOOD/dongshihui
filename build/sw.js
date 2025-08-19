// Service Worker for performance optimization - 极致缓存策略
const CACHE_NAME = 'dongshihui-v2';
const API_CACHE_NAME = 'dongshihui-api-v2';

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
  
  // 跳过非GET请求和chrome-extension等协议
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }
  
  // API请求缓存策略
  if (url.origin === API_BASE_URL) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        
        // 对于列表API使用stale-while-revalidate
        if (url.pathname.includes('/directors') || url.pathname.includes('/meetings')) {
          if (cachedResponse) {
            // 非阻塞后台更新
            event.waitUntil(
              fetch(event.request).then(response => {
                if (response.ok) {
                  cache.put(event.request, response.clone());
                }
              }).catch(() => {}) // 忽略后台更新错误
            );
            return cachedResponse;
          }
        }
        
        // 网络优先，快速失败
        try {
          const response = await Promise.race([
            fetch(event.request),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 8000)
            )
          ]);
          
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (error) {
          return cachedResponse || new Response('{"success":false,"error":"Network error"}', {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
    return;
  }
  
  // 静态资源缓存优先策略 - 优化匹配逻辑
  const isStaticResource = STATIC_RESOURCE_PATTERNS.some(pattern => 
    pattern.test(url.pathname)
  );
  
  if (isStaticResource || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(fetchResponse => {
          if (fetchResponse.ok && isStaticResource) {
            // 只缓存静态资源和成功响应
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return fetchResponse;
        });
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