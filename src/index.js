import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { boardTheme } from './theme/boardTheme';

// 创建React Query客户端，极致优化性能配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // 减少重试次数，快速失败
      staleTime: 2 * 60 * 1000, // 2分钟缓存，减少请求频率
      cacheTime: 5 * 60 * 1000, // 5分钟内存缓存，减少内存占用
      refetchOnWindowFocus: false, // 减少不必要的重新获取
      refetchOnReconnect: false, // 减少重连时的请求
      refetchInterval: false, // 关闭轮询
      suspense: false,
      networkMode: 'online',
      // 快速失败策略
      retryDelay: () => 500,
      // 使用更短的查询超时
      queryFn: undefined,
    },
    mutations: {
      retry: 0, // 快速失败
      networkMode: 'online',
    },
  },
  // 限制查询缓存大小，减少内存使用
  queryCache: {
    onError: (error) => {
      // 静默处理错误，减少不必要的处理
      console.warn('Query error:', error);
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