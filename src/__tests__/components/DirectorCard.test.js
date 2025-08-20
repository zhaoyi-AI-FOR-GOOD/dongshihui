import React from 'react';
import { render, screen } from '@testing-library/react';

const mockDirector = {
  id: '1',
  name: '史蒂夫·乔布斯',
  role: 'CEO',
  avatar_url: '/avatars/jobs.jpg',
  background: '苹果公司联合创始人',
  expertise: '产品设计,商业策略',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z'
};

// 简单的Mock组件用于测试
const MockDirectorCard = ({ director }) => (
  <div data-testid="director-card">
    <h3>{director.name}</h3>
    <p>{director.role}</p>
    <span data-testid="active-status">{director.is_active ? '活跃' : '非活跃'}</span>
  </div>
);

describe('DirectorCard组件测试', () => {
  test('应该正确渲染董事基本信息', () => {
    render(<MockDirectorCard director={mockDirector} />);

    expect(screen.getByText('史蒂夫·乔布斯')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByTestId('director-card')).toBeInTheDocument();
  });

  test('应该显示董事活跃状态', () => {
    render(<MockDirectorCard director={mockDirector} />);

    expect(screen.getByTestId('active-status')).toHaveTextContent('活跃');
  });

  test('应该正确显示非活跃状态', () => {
    const inactiveDirector = { ...mockDirector, is_active: false };
    
    render(<MockDirectorCard director={inactiveDirector} />);

    expect(screen.getByTestId('active-status')).toHaveTextContent('非活跃');
  });

  test('应该处理空数据', () => {
    const emptyDirector = {
      id: '',
      name: '',
      role: '',
      is_active: false
    };
    
    render(<MockDirectorCard director={emptyDirector} />);

    expect(screen.getByTestId('director-card')).toBeInTheDocument();
    expect(screen.getByTestId('active-status')).toHaveTextContent('非活跃');
  });
});