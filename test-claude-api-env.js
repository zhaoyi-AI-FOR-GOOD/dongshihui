const fetch = require('node-fetch');

async function testClaudeAPI() {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    console.log('请设置环境变量 CLAUDE_API_KEY');
    console.log('使用方法: CLAUDE_API_KEY=your_key_here node test-claude-api-env.js');
    return;
  }
  
  console.log('测试API密钥格式：');
  console.log('- 长度:', apiKey.length);
  console.log('- 前缀:', apiKey.substring(0, 17));
  console.log('- 是否包含空格:', apiKey.includes(' '));
  console.log('- 是否包含换行:', apiKey.includes('\n'));
  
  console.log('\n正在测试Claude API连接...');
  
  try {
    // 测试1: 使用x-api-key头部
    console.log('\n=== 测试1: x-api-key 认证 ===');
    const response1 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Hello, just say hi back' }]
      })
    });
    
    console.log('状态码:', response1.status);
    const text1 = await response1.text();
    console.log('响应:', text1.substring(0, 300));
    
    // 测试2: 使用Bearer认证
    console.log('\n=== 测试2: Bearer 认证 ===');
    const response2 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Hello, just say hi back' }]
      })
    });
    
    console.log('状态码:', response2.status);
    const text2 = await response2.text();
    console.log('响应:', text2.substring(0, 300));
    
    // 测试3: 董事创建测试
    if (response1.ok || response2.ok) {
      console.log('\n=== 测试3: 董事创建功能 ===');
      const authHeader = response1.ok ? 
        { 'x-api-key': apiKey.trim() } : 
        { 'Authorization': `Bearer ${apiKey.trim()}` };
      
      const response3 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Based on the following character prompt, extract and generate director information in JSON format:

Character prompt: 你是孙中山，中华民国的国父，民主革命的先驱者。

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
      
      console.log('董事创建测试状态码:', response3.status);
      const text3 = await response3.text();
      console.log('董事创建响应:', text3);
      
      if (response3.ok) {
        console.log('\n✅ Claude API在本地环境正常工作！');
        console.log('这说明问题可能在Cloudflare Workers环境中。');
      }
    } else {
      console.log('\n❌ Claude API在本地环境也无法工作');
      console.log('请检查API密钥是否正确');
    }
    
  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
  }
}

testClaudeAPI();