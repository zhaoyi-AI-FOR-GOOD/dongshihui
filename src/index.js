import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { boardTheme } from './theme/boardTheme';

// 创建React Query客户端，极致优化性能配置
const queryCache = new QueryCache({
  onError: (error) => {
    // 静默处理错误，减少不必要的处理
    console.warn('Query error:', error);
  },
});

const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      retry: 1, // 适度重试，避免网络错误处理开销
      staleTime: 5 * 60 * 1000, // 5分钟缓存，减少请求频率
      cacheTime: 10 * 60 * 1000, // 10分钟内存缓存
      refetchOnWindowFocus: false, // 减少不必要的重新获取
      refetchOnReconnect: true, // 移动网络重连时适度刷新
      refetchInterval: false, // 关闭轮询
      suspense: false,
      networkMode: 'online',
      // 延长重试间隔，减少频繁失败的CPU开销
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      retry: 1, // 适度重试
      networkMode: 'online',
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'), {
  // 启用并发特性，提升性能
  unstable_strictMode: false, // 在生产环境关闭StrictMode减少双重渲染
});

// Service Worker注册 - 提升缓存性能
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// 使用startTransition包装非紧急更新
import { startTransition } from 'react';

startTransition(() => {
  root.render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={boardTheme}>
          <CssBaseline />
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000, // 减少toast显示时间，减少DOM操作
              style: {
                background: '#1565C0',
                color: '#fff',
                borderRadius: '8px',
                fontWeight: 500
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
});