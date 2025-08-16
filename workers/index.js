/**
 * Cloudflare Workers 入口文件 - 私人董事会系统API
 */

// 简单的路由处理器
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // CORS处理
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };
    
    // 预检请求
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // 健康检查
      if (path === '/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          service: '私人董事会系统API'
        }), { headers: corsHeaders });
      }
      
      // 获取董事列表 - v1版本
      if (path === '/api/v1/directors' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM directors WHERE is_active = 1 ORDER BY created_at DESC'
        ).all();
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: results 
        }), { headers: corsHeaders });
      }
      
      // 智能创建董事 - v1版本
      if (path === '/api/v1/directors/create-from-prompt' && method === 'POST') {
        const { system_prompt, avatar_url } = await request.json();
        
        if (!system_prompt) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: '系统提示词不能为空' 
          }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }
        
        // 简单的AI提示词解析（模拟）
        const id = crypto.randomUUID();
        const parsedName = system_prompt.includes('孔子') ? '孔子' :
                          system_prompt.includes('老子') ? '老子' :
                          system_prompt.includes('苏格拉底') ? '苏格拉底' :
                          system_prompt.includes('亚里士多德') ? '亚里士多德' :
                          '智能创建的董事';
        
        const director = {
          id,
          name: parsedName,
          title: '历史哲学家',
          era: '古代',
          system_prompt,
          avatar_url: avatar_url || null,
          personality_traits: JSON.stringify(['智慧', '哲理']),
          core_beliefs: JSON.stringify(['追求真理', '教化民众']),
          speaking_style: '深刻而富有启发性',
          expertise_areas: JSON.stringify(['哲学', '教育']),
          is_active: 1,
          status: 'active',
          total_statements: 0,
          total_meetings: 0,
          created_by: 'system',
          metadata: JSON.stringify({}),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // 插入数据库
        await env.DB.prepare(`
          INSERT INTO directors (id, name, title, era, system_prompt, avatar_url, personality_traits, 
                               core_beliefs, speaking_style, expertise_areas, is_active, status, 
                               total_statements, total_meetings, created_by, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          director.id, director.name, director.title, director.era, director.system_prompt,
          director.avatar_url, director.personality_traits, director.core_beliefs,
          director.speaking_style, director.expertise_areas, director.is_active,
          director.status, director.total_statements, director.total_meetings,
          director.created_by, director.metadata, director.created_at, director.updated_at
        ).run();
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: director 
        }), { headers: corsHeaders });
      }
      
      // 获取会议列表 - v1版本
      if (path === '/api/v1/meetings' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM meetings ORDER BY created_at DESC LIMIT 50'
        ).all();
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: results 
        }), { headers: corsHeaders });
      }
      
      // 创建会议 - v1版本
      if (path === '/api/v1/meetings' && method === 'POST') {
        const meeting = await request.json();
        
        if (!meeting.title || !meeting.topic) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: '会议标题和主题不能为空' 
          }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }
        
        const id = crypto.randomUUID();
        const newMeeting = {
          id,
          title: meeting.title,
          description: meeting.description || '',
          topic: meeting.topic,
          status: 'preparing',
          max_rounds: meeting.max_rounds || 10,
          current_round: 0,
          discussion_mode: meeting.discussion_mode || 'round_robin',
          max_participants: meeting.max_participants || 8,
          created_by: 'user',
          total_statements: 0,
          total_participants: 0,
          settings: JSON.stringify({}),
          key_points: JSON.stringify([]),
          controversies: JSON.stringify([]),
          metadata: JSON.stringify({}),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await env.DB.prepare(`
          INSERT INTO meetings (id, title, description, topic, status, max_rounds, current_round,
                              discussion_mode, max_participants, created_by, total_statements,
                              total_participants, settings, key_points, controversies, metadata,
                              created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newMeeting.id, newMeeting.title, newMeeting.description, newMeeting.topic,
          newMeeting.status, newMeeting.max_rounds, newMeeting.current_round,
          newMeeting.discussion_mode, newMeeting.max_participants, newMeeting.created_by,
          newMeeting.total_statements, newMeeting.total_participants, newMeeting.settings,
          newMeeting.key_points, newMeeting.controversies, newMeeting.metadata,
          newMeeting.created_at, newMeeting.updated_at
        ).run();
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: newMeeting 
        }), { headers: corsHeaders });
      }
      
      // 404处理
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'API endpoint not found',
        path: path,
        method: method
      }), { 
        status: 404, 
        headers: corsHeaders 
      });
      
    } catch (err) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: err.message 
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};