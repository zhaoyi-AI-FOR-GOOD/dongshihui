# 私人董事会系统 - 自动化测试指南

## 📋 测试架构概述

本系统采用多层级自动化测试策略，确保代码质量和用户体验：

```
┌─────────────────────────────────────────┐
│                E2E Tests                │  ← 用户行为验证
├─────────────────────────────────────────┤
│            Integration Tests            │  ← 组件协作验证  
├─────────────────────────────────────────┤
│              Unit Tests                 │  ← 功能单元验证
└─────────────────────────────────────────┘
```

## 🚀 快速开始

### 安装测试依赖

```bash
# 核心测试依赖已安装
npm install

# 安装Playwright浏览器
npx playwright install
```

### 运行所有测试

```bash
# 运行单元测试
npm run test:unit

# 运行E2E测试
npm run test:e2e

# 运行性能测试
npm run test:performance

# 运行可访问性测试
npm run test:a11y
```

## 🧪 测试类型详解

### 1. 单元测试 (Unit Tests)

**位置**: `src/__tests__/`
**框架**: Jest + React Testing Library
**覆盖范围**: 组件、工具函数、API服务

```bash
# 运行单元测试
npm run test:unit

# 带覆盖率报告
npm run test:ci
```

**测试文件结构**:
```
src/__tests__/
├── components/          # 组件测试
│   ├── DirectorCard.test.js
│   └── MeetingCard.test.js
├── pages/              # 页面测试
│   ├── BoardHall.test.js
│   └── MeetingHistory.test.js
├── services/           # API服务测试
│   └── api.test.js
├── utils/              # 测试工具
│   └── test-utils.js
└── mocks/              # Mock服务
    ├── handlers.js
    └── server.js
```

### 2. E2E测试 (End-to-End Tests)

**位置**: `e2e/`
**框架**: Playwright
**覆盖范围**: 完整用户流程

```bash
# 运行E2E测试
npm run test:e2e

# 交互式运行
npm run test:e2e:ui
```

**测试场景**:
- ✅ 董事会大厅浏览和导航
- ✅ 完整会议创建和管理流程
- ✅ 会议搜索和筛选功能
- ✅ 响应式布局适配
- ✅ 错误处理和边界情况

### 3. 性能测试 (Performance Tests)

**工具**: Lighthouse CI
**配置**: `.lighthouserc.js`

```bash
# 运行性能测试
npm run test:performance
```

**性能预算**:
- 🎯 **LCP** < 3.5s
- 🎯 **FCP** < 2.0s  
- 🎯 **TBT** < 300ms
- 🎯 **Performance Score** > 80

### 4. 可访问性测试 (Accessibility Tests)

**工具**: axe-core
**标准**: WCAG 2.1 AA

```bash
# 运行可访问性测试
npm run test:a11y
```

## 🔧 开发工作流

### 本地开发测试

```bash
# 启动开发服务器
npm start

# 在另一个终端运行测试
npm run test:unit -- --watch

# 运行特定测试文件
npm test -- DirectorCard.test.js
```

### 提交前检查

```bash
# 代码质量检查
npm run lint

# 运行完整测试套件
npm run test:ci
npm run test:e2e

# 格式化代码
npm run format
```

### CI/CD集成

测试在以下情况自动运行：

1. **每次提交**: 单元测试
2. **Pull Request**: 完整测试套件
3. **主分支合并**: 性能测试 + 部署验证

## 📊 测试覆盖率报告

### 查看覆盖率

```bash
# 生成覆盖率报告
npm run test:ci

# 在浏览器中查看详细报告
open coverage/lcov-report/index.html
```

### 覆盖率目标

- 📈 **单元测试覆盖率**: > 90%
- 📈 **集成测试覆盖率**: > 80%
- 📈 **E2E功能覆盖率**: > 70%

## 🎯 测试最佳实践

### 单元测试原则

```javascript
// ✅ 好的测试
test('应该正确渲染董事基本信息', async () => {
  const mockDirector = { name: '史蒂夫·乔布斯', role: 'CEO' };
  
  renderWithProviders(<DirectorCard director={mockDirector} />);
  
  expect(screen.getByText('史蒂夫·乔布斯')).toBeInTheDocument();
  expect(screen.getByText('CEO')).toBeInTheDocument();
});
```

### E2E测试原则

```javascript
// ✅ 好的E2E测试
test('完整会议创建流程', async ({ page }) => {
  // 导航到会议创建页面
  await page.goto('/meetings/create');
  
  // 填写会议信息
  await page.fill('[data-testid="title-input"]', '测试会议');
  await page.fill('[data-testid="topic-input"]', '测试话题');
  
  // 选择参与者
  await page.click('[data-testid="participant-1"]');
  
  // 创建会议
  await page.click('button:has-text("创建会议")');
  
  // 验证结果
  await expect(page).toHaveURL(/\/meeting\/\w+/);
});
```

## 🚨 故障排除

### 常见问题

1. **测试超时**
```bash
# 增加测试超时时间
npm test -- --testTimeout=10000
```

2. **Mock服务问题**
```javascript
// 重置Mock状态
afterEach(() => {
  server.resetHandlers();
});
```

3. **E2E测试失败**
```bash
# 查看测试录像
npx playwright show-trace trace.zip
```

## 📚 扩展测试

### 添加新的单元测试

1. 在 `src/__tests__/` 下创建测试文件
2. 使用 `renderWithProviders` 渲染组件
3. 编写测试断言
4. 运行测试验证

### 添加新的E2E测试

1. 在 `e2e/` 下创建测试文件
2. 使用Playwright API编写用户场景
3. 添加适当的等待和断言
4. 在多个浏览器中验证

## 📈 测试指标监控

- **测试执行时间**: 单元测试 < 30s，E2E测试 < 5min
- **测试稳定性**: 成功率 > 95%
- **测试维护成本**: 每个功能变更对应测试更新时间 < 20%

## 🔗 相关资源

- [Jest 文档](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright 文档](https://playwright.dev/docs/intro)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [axe-core](https://github.com/dequelabs/axe-core)

---

🎯 **测试目标**: 确保私人董事会系统的可靠性、性能和用户体验！