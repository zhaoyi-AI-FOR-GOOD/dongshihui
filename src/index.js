import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { boardTheme } from './theme/boardTheme';

// 创建React Query客户端，优化性能配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟缓存
      cacheTime: 10 * 60 * 1000, // 10分钟内存缓存
      refetchOnWindowFocus: false, // 减少不必要的重新获取
      refetchOnReconnect: 'always',
      refetchInterval: false, // 关闭轮询减少主线程负担
      suspense: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={boardTheme}>
          <CssBaseline />
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
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
  </React.StrictMode>
);