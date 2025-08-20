import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { boardTheme } from '../../theme/boardTheme';

// 创建测试专用的QueryClient
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // 测试中不重试
        cacheTime: 0, // 测试中不缓存
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// 自定义render函数，包含所有必要的Provider
export const renderWithProviders = (ui, options = {}) => {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={boardTheme}>
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return { 
    ...render(ui, { wrapper: Wrapper, ...renderOptions }), 
    queryClient 
  };
};

// 模拟用户数据
export const mockDirectors = [
  {
    id: '1',
    name: '史蒂夫·乔布斯',
    role: 'CEO',
    avatar_url: '/avatars/jobs.jpg',
    background: '苹果公司联合创始人',
    expertise: '产品设计,商业策略',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2', 
    name: '埃隆·马斯克',
    role: 'CTO',
    avatar_url: '/avatars/musk.jpg',
    background: '特斯拉CEO',
    expertise: '技术创新,未来思维',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockMeetings = [
  {
    id: '1',
    title: '2024年产品战略讨论',
    topic: '如何制定新一年的产品发展战略？',
    status: 'discussing',
    discussion_mode: 'round_robin',
    total_statements: 8,
    total_participants: 3,
    created_at: '2024-01-01T10:00:00Z',
    participants: mockDirectors.slice(0, 2),
    statements: []
  },
  {
    id: '2',
    title: 'AI技术发展趋势',
    topic: '人工智能如何改变商业模式？',
    status: 'finished',
    discussion_mode: 'debate',
    total_statements: 12,
    total_participants: 2,
    created_at: '2024-01-02T14:00:00Z',
    participants: mockDirectors,
    statements: []
  }
];

// 等待异步操作完成的工具函数
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export * from '@testing-library/react';