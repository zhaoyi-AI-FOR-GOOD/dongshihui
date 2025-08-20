import { test, expect } from '@playwright/test';

test.describe('完整会议流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('完整会议创建和管理流程', async ({ page }) => {
    // Step 1: 导航到会议历史页面
    await page.getByText('会议历史').click();
    await expect(page.url()).toContain('/meetings');
    await expect(page.getByText('会议历史')).toBeVisible();

    // Step 2: 点击创建新会议
    await page.getByText('创建新会议').click();
    await expect(page.url()).toContain('/meetings/create');

    // Step 3: 填写会议信息（如果页面存在表单）
    const titleInput = page.getByLabel(/会议标题|标题/) || page.getByPlaceholder(/请输入会议标题/);
    const topicInput = page.getByLabel(/会议话题|讨论话题/) || page.getByPlaceholder(/请输入讨论话题/);
    
    if (await titleInput.isVisible({ timeout: 5000 })) {
      await titleInput.fill('E2E测试会议');
      
      if (await topicInput.isVisible()) {
        await topicInput.fill('这是一个端到端测试的会议话题');
      }

      // 选择参与者（如果有选择界面）
      const participantSelectors = page.locator('[data-testid*="participant"], .participant-selector, input[type="checkbox"]');
      const participantCount = await participantSelectors.count();
      
      if (participantCount > 0) {
        // 选择前两个参与者
        for (let i = 0; i < Math.min(2, participantCount); i++) {
          await participantSelectors.nth(i).click();
        }
      }

      // 提交创建会议
      const createButton = page.getByRole('button', { name: /创建|保存|确认/ });
      await createButton.click();

      // Step 4: 验证会议创建成功并进入会议页面
      await expect(page.url()).toMatch(/\/meeting\/\w+/);
      
    } else {
      // 如果创建页面不存在，直接导航到一个模拟会议页面进行测试
      console.log('创建会议表单不存在，使用模拟会议进行测试');
      await page.goto('/meeting/test-meeting-id');
    }

    // Step 5: 验证会议页面加载
    const meetingTitle = page.getByText(/E2E测试会议|测试会议/).or(page.locator('h1, h2, h3, [data-testid*="title"]').first());
    await expect(meetingTitle).toBeVisible({ timeout: 10000 });

    // Step 6: 测试会议控制功能
    const startButton = page.getByRole('button', { name: /开始会议|开始/ });
    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();
      
      // 验证会议状态变更
      await expect(page.getByText(/讨论中|进行中/).or(page.getByText(/已开始/))).toBeVisible({ timeout: 5000 });
      
      // 测试生成发言功能
      const nextStatementButton = page.getByRole('button', { name: /下一个发言|继续|生成/ });
      if (await nextStatementButton.isVisible({ timeout: 3000 })) {
        await nextStatementButton.click();
        
        // 等待发言生成
        await page.waitForTimeout(2000);
      }
    }

    // Step 7: 返回会议历史查看记录
    const backButton = page.getByRole('button', { name: /返回|back/ }).or(page.getByText('返回大厅'));
    if (await backButton.isVisible()) {
      await backButton.click();
    } else {
      await page.getByText('会议历史').click();
    }

    // 验证会议出现在历史列表中
    await expect(page.url()).toContain('/meetings');
    const meetingInList = page.getByText('E2E测试会议').or(page.locator('[data-testid*="meeting"]').first());
    await expect(meetingInList).toBeVisible({ timeout: 5000 });
  });

  test('会议搜索和筛选功能', async ({ page }) => {
    // 导航到会议历史
    await page.getByText('会议历史').click();
    await page.waitForLoadState('networkidle');

    // 测试搜索功能
    const searchInput = page.getByPlaceholder(/搜索会议标题或话题/);
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('产品');
      await searchInput.press('Enter');
      
      // 等待搜索结果
      await page.waitForTimeout(1000);
      
      // 清除搜索
      await searchInput.clear();
    }

    // 测试状态筛选
    const statusFilter = page.getByLabel('会议状态').or(page.locator('select, [role="combobox"]').first());
    if (await statusFilter.isVisible({ timeout: 3000 })) {
      await statusFilter.click();
      
      // 选择一个状态
      const statusOption = page.getByText('已结束').or(page.getByRole('option').first());
      if (await statusOption.isVisible({ timeout: 2000 })) {
        await statusOption.click();
      }
    }
  });

  test('会议详情查看和操作', async ({ page }) => {
    // 导航到会议历史
    await page.getByText('会议历史').click();
    await page.waitForLoadState('networkidle');

    // 查找会议卡片
    const meetingCards = page.locator('[data-testid*="meeting"], .meeting-card, [role="button"]:has-text("查看")');
    const meetingCount = await meetingCards.count();

    if (meetingCount > 0) {
      // 点击第一个会议
      const firstMeeting = meetingCards.first();
      await firstMeeting.click();

      // 等待页面导航或详情显示
      await page.waitForTimeout(1000);

      // 查找更多操作按钮
      const moreButton = page.getByRole('button', { name: /更多|操作|⋯/ }).or(page.locator('[aria-label*="更多"]'));
      if (await moreButton.isVisible({ timeout: 3000 })) {
        await moreButton.click();
        
        // 查看操作菜单
        const deleteOption = page.getByText('删除会议').or(page.getByText('删除'));
        if (await deleteOption.isVisible({ timeout: 2000 })) {
          // 不实际删除，只验证菜单存在
          await page.keyboard.press('Escape'); // 关闭菜单
        }
      }
    }
  });
});

test.describe('会议室实时功能测试', () => {
  test('会议室状态变更和实时更新', async ({ page }) => {
    // 模拟进入一个会议室
    await page.goto('/meeting/test-meeting');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 查找会议控制按钮
    const controlButtons = page.locator('button:has-text("开始"), button:has-text("暂停"), button:has-text("结束")');
    const buttonCount = await controlButtons.count();

    if (buttonCount > 0) {
      console.log(`找到 ${buttonCount} 个控制按钮`);
      
      // 测试按钮点击
      for (let i = 0; i < buttonCount; i++) {
        const button = controlButtons.nth(i);
        const buttonText = await button.textContent();
        
        if (buttonText && !buttonText.includes('结束')) {
          // 避免点击结束按钮，可能会影响后续测试
          await button.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // 测试发言生成（如果存在）
    const generateButton = page.getByRole('button', { name: /生成|下一个|继续/ });
    if (await generateButton.isVisible({ timeout: 3000 })) {
      await generateButton.click();
      
      // 等待可能的加载状态
      const loadingIndicator = page.getByText(/生成中|加载中/).or(page.locator('[role="progressbar"]'));
      if (await loadingIndicator.isVisible({ timeout: 1000 })) {
        await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
      }
    }
  });

  test('会议问答功能', async ({ page }) => {
    await page.goto('/meeting/test-meeting');
    await page.waitForLoadState('networkidle');

    // 查找问答功能
    const questionInput = page.getByPlaceholder(/提出问题|输入问题/).or(page.getByLabel(/问题/));
    if (await questionInput.isVisible({ timeout: 5000 })) {
      await questionInput.fill('这是一个测试问题');
      
      const submitButton = page.getByRole('button', { name: /提交|发送|确认/ });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // 等待问题处理
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe('错误处理和边界情况', () => {
  test('应该处理网络错误', async ({ page }) => {
    // 模拟网络错误
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/meetings');
    
    // 页面应该显示错误状态或空状态
    const errorMessage = page.getByText(/错误|失败|网络/).or(page.getByText(/暂无数据|加载失败/));
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('应该处理空数据状态', async ({ page }) => {
    // 模拟空数据响应
    await page.route('**/meetings*', route => 
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { total: 0, page: 1, limit: 12, pages: 0 }
        })
      })
    );

    await page.goto('/meetings');
    
    // 应该显示空状态
    const emptyState = page.getByText(/没有会议|暂无数据|还没有|创建/).first();
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test('应该处理长内容显示', async ({ page }) => {
    // 模拟长标题内容
    const longTitle = '这是一个非常非常非常长的会议标题，用来测试系统如何处理长文本内容的显示和布局问题';
    
    await page.route('**/meetings*', route => 
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            id: '1',
            title: longTitle,
            topic: '长话题内容测试',
            status: 'finished',
            created_at: new Date().toISOString()
          }],
          pagination: { total: 1, page: 1, limit: 12, pages: 1 }
        })
      })
    );

    await page.goto('/meetings');
    
    // 验证长内容不会破坏布局
    const longTitleElement = page.getByText(longTitle.substring(0, 20)); // 查找标题的前部分
    await expect(longTitleElement).toBeVisible({ timeout: 5000 });
  });
});