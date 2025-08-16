/**
 * Cloudflare Workers 入口文件
 * 私人董事会系统API
 */

import { createCors, error, json, Router } from 'itty-router';

// 创建路由器
const router = Router();

// CORS 配置
const { preflight, corsify } = createCors({
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  origins: ['*'], // 生产环境应该限制为具体域名
  maxAge: 86400,
});

// 预检请求处理
router.all('*', preflight);

// 健康检查
router.get('/health', () => 
  json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: '私人董事会系统API'
  })
);

// 董事相关API
router.get('/api/directors', async (request, env) => {
  try {
    // 从D1数据库获取董事列表
    const { results } = await env.DB.prepare(
      'SELECT * FROM directors WHERE is_active = 1 ORDER BY created_at DESC'
    ).all();
    
    return json({ success: true, data: results });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

router.post('/api/directors', async (request, env) => {
  try {
    const director = await request.json();
    
    // 基本验证
    if (!director.name || !director.system_prompt) {
      return json({ success: false, error: '董事姓名和系统提示词不能为空' }, { status: 400 });
    }
    
    // 插入新董事
    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO directors (id, name, title, era, system_prompt, personality_traits, 
                           core_beliefs, speaking_style, expertise_areas, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      director.name,
      director.title || '',
      director.era || '',
      director.system_prompt,
      JSON.stringify(director.personality_traits || []),
      JSON.stringify(director.core_beliefs || []),
      director.speaking_style || '',
      JSON.stringify(director.expertise_areas || [])
    ).run();
    
    return json({ success: true, data: { id, ...director } });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

// 会议相关API
router.get('/api/meetings', async (request, env) => {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM meetings ORDER BY created_at DESC LIMIT 50'
    ).all();
    
    return json({ success: true, data: results });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

router.post('/api/meetings', async (request, env) => {
  try {
    const meeting = await request.json();
    
    if (!meeting.title || !meeting.topic) {
      return json({ success: false, error: '会议标题和主题不能为空' }, { status: 400 });
    }
    
    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO meetings (id, title, description, topic, status, max_rounds,
                          discussion_mode, max_participants, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      meeting.title,
      meeting.description || '',
      meeting.topic,
      'preparing',
      meeting.max_rounds || 10,
      meeting.discussion_mode || 'round_robin',
      meeting.max_participants || 8
    ).run();
    
    return json({ success: true, data: { id, ...meeting } });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

// Claude AI集成 (模拟版本)
router.post('/api/claude/generate', async (request, env) => {
  try {
    const { prompt, director_id } = await request.json();
    
    // 这里应该集成真实的Claude API
    // 目前返回模拟响应
    const mockResponse = {
      content: `作为${director_id}的回应：这是一个模拟的AI回应。请配置Claude API密钥以获得真实的AI对话功能。`,
      tokens_used: 50,
      model: 'claude-3-sonnet-20240229'
    };
    
    return json({ success: true, data: mockResponse });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

// 404处理
router.all('*', () => 
  json({ success: false, error: 'API endpoint not found' }, { status: 404 })
);

// Workers主函数
export default {
  fetch: (request, env, ctx) => router
    .handle(request, env, ctx)
    .then(corsify)
    .catch(err => 
      json({ success: false, error: err.message }, { status: 500 })
    )
};