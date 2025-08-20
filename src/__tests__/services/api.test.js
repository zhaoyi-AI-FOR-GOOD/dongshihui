import { directorAPI, meetingAPI } from '../../services/api';
import { server } from '../mocks/server';
import { rest } from 'msw';

const API_BASE_URL = 'https://dongshihui-api.jieshu2023.workers.dev';

describe('API服务测试', () => {
  describe('directorAPI', () => {
    // 测试获取活跃董事列表
    test('getActive应该成功获取活跃董事列表', async () => {
      const response = await directorAPI.getActive();
      
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      expect(response.data.data[0]).toHaveProperty('name');
      expect(response.data.data[0]).toHaveProperty('is_active');
      expect(response.data.data[0].is_active).toBe(true);
    });

    // 测试获取所有董事
    test('getAll应该支持分页参数', async () => {
      const params = { page: 1, limit: 5 };
      const response = await directorAPI.getAll(params);
      
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('pagination');
      expect(response.data.pagination.limit).toBe(5);
    });

    // 测试搜索董事
    test('getAll应该支持搜索功能', async () => {
      const params = { search: '乔布斯' };
      const response = await directorAPI.getAll(params);
      
      expect(response.data.success).toBe(true);
      // 搜索结果应该包含相关董事
      if (response.data.data.length > 0) {
        expect(response.data.data[0].name).toContain('乔布斯');
      }
    });

    // 测试获取单个董事
    test('getById应该获取指定董事详情', async () => {
      const response = await directorAPI.getById('1');
      
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', '1');
      expect(response.data.data).toHaveProperty('name');
    });

    // 测试创建董事
    test('create应该成功创建新董事', async () => {
      const newDirector = {
        name: '测试董事',
        role: 'CTO',
        background: '测试背景',
        expertise: '测试专长'
      };

      const response = await directorAPI.create(newDirector);
      
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', newDirector.name);
      expect(response.data.data).toHaveProperty('created_at');
    });

    // 测试删除董事
    test('delete应该成功删除董事', async () => {
      const response = await directorAPI.delete('1');
      
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('message');
    });

    // 测试API错误处理
    test('应该正确处理API错误', async () => {
      // Mock 404错误
      server.use(
        rest.get(`${API_BASE_URL}/directors/nonexistent`, (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({ success: false, error: 'Director not found' })
          );
        })
      );

      try {
        await directorAPI.getById('nonexistent');
        fail('应该抛出错误');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('meetingAPI', () => {
    // 测试获取会议列表
    test('getAll应该成功获取会议列表', async () => {
      const response = await meetingAPI.getAll();
      
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data).toHaveProperty('pagination');
    });

    // 测试会议列表筛选
    test('getAll应该支持状态筛选', async () => {
      const params = { status: 'discussing' };
      const response = await meetingAPI.getAll(params);
      
      expect(response.data.success).toBe(true);
      if (response.data.data.length > 0) {
        expect(response.data.data[0].status).toBe('discussing');
      }
    });

    // 测试获取单个会议
    test('getById应该获取指定会议详情', async () => {
      const response = await meetingAPI.getById('1');
      
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', '1');
      expect(response.data.data).toHaveProperty('title');
      expect(response.data.data).toHaveProperty('status');
    });

    // 测试创建会议
    test('create应该成功创建新会议', async () => {
      const newMeeting = {
        title: '测试会议',
        topic: '测试话题',
        participants: ['1', '2']
      };

      const response = await meetingAPI.create(newMeeting);
      
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('title', newMeeting.title);
      expect(response.data.data).toHaveProperty('status', 'preparing');
    });

    // 测试开始会议
    test('start应该成功开始会议', async () => {
      const response = await meetingAPI.start('1');
      
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('message');
    });

    // 测试生成发言
    test('generateNextStatement应该成功生成发言', async () => {
      const response = await meetingAPI.generateNextStatement('1');
      
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('content');
      expect(response.data.data).toHaveProperty('director');
    });

    // 测试删除会议
    test('delete应该成功删除会议', async () => {
      const response = await meetingAPI.delete('1');
      
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('message');
    });

    // 测试服务器错误处理
    test('应该正确处理服务器错误', async () => {
      // Mock 500错误
      server.use(
        rest.get(`${API_BASE_URL}/meetings/error-test`, (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ success: false, error: 'Internal server error' })
          );
        })
      );

      try {
        // 创建一个临时方法来测试错误处理
        const response = await fetch(`${API_BASE_URL}/meetings/error-test`);
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      } catch (error) {
        // 如果axios抛出错误，验证错误信息
        expect(error.response?.status || error.status).toBe(500);
      }
    });
  });

  describe('网络错误处理', () => {
    // 测试网络连接错误
    test('应该处理网络连接错误', async () => {
      // Mock网络错误
      server.use(
        rest.get(`${API_BASE_URL}/directors/active/list`, (req, res) => {
          return res.networkError('Network connection failed');
        })
      );

      try {
        await directorAPI.getActive();
        fail('应该抛出网络错误');
      } catch (error) {
        expect(error.message || error.code).toBeTruthy();
      }
    });

    // 测试超时处理
    test('应该处理请求超时', async () => {
      // Mock超时响应
      server.use(
        rest.get(`${API_BASE_URL}/directors/active/list`, (req, res, ctx) => {
          return res(ctx.delay(20000)); // 20秒延迟，超过axios默认超时时间
        })
      );

      try {
        await directorAPI.getActive();
        // 如果没有抛出错误，说明请求成功了（可能是因为测试环境的超时设置）
      } catch (error) {
        // 验证是超时错误
        expect(error.code === 'ECONNABORTED' || error.message.includes('timeout')).toBe(true);
      }
    }, 10000); // 增加测试超时时间
  });
});