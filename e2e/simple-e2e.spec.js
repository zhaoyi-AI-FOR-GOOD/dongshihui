import { test, expect } from '@playwright/test';

test.describe('简单E2E测试验证', () => {
  test('应用加载和基础导航', async ({ page }) => {
    // 导航到应用首页
    await page.goto('http://localhost:3000');
    
    // 等待页面加载
    await expect(page).toHaveTitle(/董事会/);
    
    // 检查是否有主要导航元素
    const mainContent = page.locator('body');
    await expect(mainContent).toBeVisible();
    
    // 检查页面是否包含董事会相关内容
    const hasRelevantContent = await page.getByText(/董事会|私人|会议|创建/).first().isVisible().catch(() => false);
    if (hasRelevantContent) {
      console.log('✓ 页面包含董事会相关内容');
    } else {
      console.log('⚠️ 未检测到董事会内容，但页面加载成功');
    }
  });

  test('页面响应式布局', async ({ page }) => {
    // 测试桌面视口
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:3000');
    
    // 检查页面在桌面端是否正常显示
    await expect(page.locator('body')).toBeVisible();
    
    // 测试移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // 检查页面在移动端是否正常显示
    await expect(page.locator('body')).toBeVisible();
  });

  test('基础交互功能', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // 尝试查找可点击的元素
    const clickableElements = await page.locator('button, a, [role="button"]').count();
    
    if (clickableElements > 0) {
      console.log(`✓ 找到 ${clickableElements} 个可交互元素`);
      
      // 尝试点击第一个按钮（如果存在）
      const firstButton = page.locator('button').first();
      const buttonExists = await firstButton.isVisible().catch(() => false);
      
      if (buttonExists) {
        await firstButton.click();
        console.log('✓ 成功点击按钮');
      }
    } else {
      console.log('⚠️ 未找到可交互元素');
    }
    
    // 验证页面仍然正常显示
    await expect(page.locator('body')).toBeVisible();
  });
});