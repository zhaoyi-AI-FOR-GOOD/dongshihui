import { test, expect } from '@playwright/test';

test.describe('董事会大厅页面', () => {
  test.beforeEach(async ({ page }) => {
    // 访问主页
    await page.goto('/');
  });

  test('应该显示页面标题和基本元素', async ({ page }) => {
    // 检查页面标题
    await expect(page.getByText('私人董事会')).toBeVisible();
    await expect(page.getByText('汇聚智慧，共创未来')).toBeVisible();

    // 检查导航栏
    await expect(page.getByText('董事会大厅')).toBeVisible();
    await expect(page.getByText('董事管理')).toBeVisible();
    await expect(page.getByText('会议历史')).toBeVisible();
  });

  test('应该能够导航到不同页面', async ({ page }) => {
    // 点击董事管理
    await page.getByText('董事管理').click();
    await expect(page.url()).toContain('/directors');

    // 返回首页
    await page.getByText('董事会大厅').click();
    await expect(page.url()).toMatch(/\/(hall)?$/);

    // 点击会议历史
    await page.getByText('会议历史').click();
    await expect(page.url()).toContain('/meetings');
  });

  test('应该显示董事卡片（如果有数据）', async ({ page }) => {
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');

    // 检查是否有董事卡片或空状态
    const directorCards = page.locator('[data-testid*="director"], .director-card, [role="button"]:has-text("查看详情")');
    const emptyState = page.getByText(/暂无董事|还没有董事|添加董事/);
    
    // 应该至少显示其中一种状态
    await expect(directorCards.first().or(emptyState)).toBeVisible();
  });

  test('应该有创建会议的功能入口', async ({ page }) => {
    // 查找创建会议相关的按钮
    const createButton = page.getByRole('button', { name: /创建.*会议|新建.*会议|开始.*会议/ });
    const createLink = page.getByText(/创建.*会议|新建.*会议/);
    
    await expect(createButton.or(createLink)).toBeVisible();
  });

  test('移动端布局应该正确显示', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 重新加载页面
    await page.reload();
    
    // 检查移动端布局
    await expect(page.getByText('私人董事会')).toBeVisible();
    
    // 移动端可能有汉堡菜单或不同的布局
    const mobileMenu = page.getByRole('button', { name: /menu|菜单/ });
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.getByText('董事管理')).toBeVisible();
    }
  });
});

test.describe('董事会大厅交互功能', () => {
  test('应该能够搜索和筛选董事（如果有相关功能）', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找搜索框
    const searchInput = page.getByPlaceholder(/搜索|查找/);
    if (await searchInput.isVisible()) {
      await searchInput.fill('测试');
      await searchInput.press('Enter');
      
      // 验证搜索执行
      await page.waitForTimeout(1000);
    }
  });

  test('应该处理加载状态', async ({ page }) => {
    // 拦截API请求以测试加载状态
    await page.route('**/directors/**', async route => {
      await page.waitForTimeout(2000); // 模拟慢网络
      route.continue();
    });

    await page.goto('/');
    
    // 检查加载状态
    const loadingIndicator = page.getByText(/加载中|Loading/).or(page.locator('.loading, [role="progressbar"]'));
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      // 等待加载完成
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
    }
  });
});

test.describe('响应式设计测试', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`${name}视口下应该正确显示`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      // 检查基本元素在不同视口下都能正确显示
      await expect(page.getByText('私人董事会')).toBeVisible();
      
      // 检查导航是否适配
      if (width < 768) {
        // 移动端可能有不同的导航方式
        const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-menu, [role="button"]:has-text("菜单")');
        if (await mobileNav.count() > 0) {
          await expect(mobileNav.first()).toBeVisible();
        }
      } else {
        // 桌面端应该显示完整导航
        await expect(page.getByText('董事管理')).toBeVisible();
        await expect(page.getByText('会议历史')).toBeVisible();
      }
    });
  });
});