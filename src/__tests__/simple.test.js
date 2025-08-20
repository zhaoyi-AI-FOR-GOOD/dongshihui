import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderWithProviders, mockDirectors } from './utils/test-utils';

// 简单的测试组件
const TestComponent = ({ title, directors }) => (
  <div data-testid="test-component">
    <h1>{title}</h1>
    <div data-testid="directors-list">
      {directors?.map(director => (
        <div key={director.id} data-testid={`director-${director.id}`}>
          <span>{director.name}</span>
          <span>{director.role}</span>
        </div>
      ))}
    </div>
  </div>
);

describe('完整测试框架验证', () => {
  test('基础渲染功能正常工作', () => {
    render(<TestComponent title="测试标题" directors={[]} />);
    
    expect(screen.getByText('测试标题')).toBeInTheDocument();
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  test('renderWithProviders工具正常工作', () => {
    renderWithProviders(<TestComponent title="董事会系统" directors={mockDirectors} />);
    
    expect(screen.getByText('董事会系统')).toBeInTheDocument();
    expect(screen.getByText('史蒂夫·乔布斯')).toBeInTheDocument();
    expect(screen.getByText('埃隆·马斯克')).toBeInTheDocument();
  });

  test('Mock数据结构正确', () => {
    expect(mockDirectors).toHaveLength(2);
    expect(mockDirectors[0]).toHaveProperty('id');
    expect(mockDirectors[0]).toHaveProperty('name');
    expect(mockDirectors[0]).toHaveProperty('role');
    expect(mockDirectors[0]).toHaveProperty('is_active');
  });

  test('测试工具和断言正常工作', () => {
    const testData = { count: 5, active: true };
    
    expect(testData.count).toBe(5);
    expect(testData.active).toBeTruthy();
    expect(mockDirectors.filter(d => d.is_active)).toHaveLength(2);
  });
});