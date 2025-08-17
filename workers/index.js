export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };
    
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      if (path === '/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          service: 'Private Board System API'
        }), { headers: corsHeaders });
      }
      
      if (path === '/test/claude' && method === 'GET') {
        if (!env.CLAUDE_API_KEY) {
          return new Response(JSON.stringify({ error: 'No API key' }), { headers: corsHeaders });
        }
        
        const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });
        
        const status = testResponse.status;
        const responseText = await testResponse.text();
        
        return new Response(JSON.stringify({ 
          status, 
          response: responseText.substring(0, 200)
        }), { headers: corsHeaders });
      }
      
      // 调试端点 - 检查环境变量
      if (path === '/debug/env' && method === 'GET') {
        return new Response(JSON.stringify({
          hasClaudeKey: !!env.CLAUDE_API_KEY,
          keyLength: env.CLAUDE_API_KEY ? env.CLAUDE_API_KEY.length : 0,
          keyPrefix: env.CLAUDE_API_KEY ? env.CLAUDE_API_KEY.substring(0, 17) : null
        }), { headers: corsHeaders });
      }
      
      // 测试Claude API连接
      if (path === '/test/claude' && method === 'GET') {
        if (!env.CLAUDE_API_KEY) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No API key configured' 
          }), { headers: corsHeaders });
        }
        
        try {
          const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.CLAUDE_API_KEY}`,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'Hi' }]
            })
          });
          
          const status = testResponse.status;
          const responseText = await testResponse.text();
          
          return new Response(JSON.stringify({ 
            success: testResponse.ok,
            status, 
            response: responseText.substring(0, 300),
            keyInfo: {
              length: env.CLAUDE_API_KEY.length,
              prefix: env.CLAUDE_API_KEY.substring(0, 17)
            }
          }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
          }), { headers: corsHeaders });
        }
      }

      if (path === '/directors/active/list' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM directors WHERE is_active = 1 ORDER BY created_at DESC'
        ).all();
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: results 
        }), { headers: corsHeaders });
      }
      
      if (path === '/directors/create-from-prompt' && method === 'POST') {
        const { system_prompt, avatar_url } = await request.json();
        
        if (!system_prompt) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'System prompt is required' 
          }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }
        
        if (!env.CLAUDE_API_KEY) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Claude API key not configured' 
          }), { 
            status: 500, 
            headers: corsHeaders 
          });
        }
        
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.CLAUDE_API_KEY}`,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: `Based on the following character prompt, extract and generate director information in JSON format:

Character prompt: ${system_prompt}

Please return JSON in this format:
{
  "name": "Character name",
  "title": "Title or profession", 
  "era": "Time period",
  "personality_traits": ["trait1", "trait2", "trait3"],
  "core_beliefs": ["belief1", "belief2", "belief3"],
  "speaking_style": "Speaking style description",
  "expertise_areas": ["area1", "area2"]
}

Return only JSON, no other text.`
            }]
          })
        });
        
        if (!claudeResponse.ok) {
          const errorText = await claudeResponse.text();
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Claude API failed: ${claudeResponse.status} - ${errorText}` 
          }), { 
            status: 500, 
            headers: corsHeaders 
          });
        }
        
        const claudeData = await claudeResponse.json();
        let parsedDirector;
        
        try {
          const content = claudeData.content[0].text;
          parsedDirector = JSON.parse(content);
        } catch (parseError) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to parse Claude API response' 
          }), { 
            status: 500, 
            headers: corsHeaders 
          });
        }
        
        const id = crypto.randomUUID();
        const director = {
          id,
          name: parsedDirector.name || 'Unknown Director',
          title: parsedDirector.title || 'Historical Figure',
          era: parsedDirector.era || 'Unknown Era',
          system_prompt,
          avatar_url: avatar_url || null,
          personality_traits: JSON.stringify(parsedDirector.personality_traits || []),
          core_beliefs: JSON.stringify(parsedDirector.core_beliefs || []),
          speaking_style: parsedDirector.speaking_style || 'Unknown Style',
          expertise_areas: JSON.stringify(parsedDirector.expertise_areas || []),
          is_active: 1,
          status: 'active',
          total_statements: 0,
          total_meetings: 0,
          created_by: 'claude_ai',
          metadata: JSON.stringify({ claude_tokens: claudeData.usage?.output_tokens || 0 }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
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