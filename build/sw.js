// Service Worker for performance optimization - 极致缓存策略 + 503错误处理
const CACHE_NAME = 'dongshihui-v4';
const API_CACHE_NAME = 'dongshihui-api-v4';
const ERROR_CACHE_NAME = 'dongshihui-error-v4';

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
  
  // API缓存策略 - 处理503错误和降级
  if (url.origin === API_BASE_URL && 
      (url.pathname.includes('/directors/active') || url.pathname.includes('/meetings'))) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          // 尝试网络请求
          const networkRequest = fetch(event.request).then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
              return response;
            } else if (response.status === 503) {
              // 503错误：如果有缓存则返回缓存，否则返回错误响应
              if (cachedResponse) {
                console.warn('🚨 API 503错误，返回缓存数据');
                return cachedResponse;
              } else {
                // 返回空数据响应避免应用崩溃
                return new Response(JSON.stringify({
                  success: false,
                  error: 'Service temporarily unavailable',
                  data: []
                }), {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
            }
            throw new Error(`HTTP ${response.status}`);
          }).catch(error => {
            console.warn('🚨 网络请求失败，尝试缓存:', error);
            // 网络错误时返回缓存
            if (cachedResponse) {
              return cachedResponse;
            }
            // 返回降级响应
            return new Response(JSON.stringify({
              success: false,
              error: 'Network error, service temporarily unavailable',
              data: []
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
          
          // 网络优先策略，但有缓存降级
          return networkRequest;
        });
      })
    );
    return;
  }
  
  // 静态资源缓存 - 增强chunk加载失败处理
  if (url.pathname.includes('/static/') || STATIC_RESOURCE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // 网络请求失败时的重试机制
          return fetch(event.request).then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(error => {
            console.error('🚨 静态资源加载失败:', error, event.request.url);
            // 对于JS chunk，返回一个空模块避免应用崩溃
            if (url.pathname.includes('.js')) {
              return new Response('console.warn("Chunk load failed, using fallback");', {
                headers: { 'Content-Type': 'application/javascript' }
              });
            }
            throw error;
          });
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
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME && cacheName !== ERROR_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});