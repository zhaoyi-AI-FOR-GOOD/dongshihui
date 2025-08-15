const Anthropic = require('@anthropic-ai/sdk');

// Claude API服务类
class ClaudeService {
  constructor() {
    // 初始化Anthropic客户端
    try {
      if (this.isConfigured()) {
        this.client = new Anthropic({
          apiKey: process.env.CLAUDE_API_KEY,
        });
        console.log('✅ Claude API客户端初始化成功');
      } else {
        this.client = null;
        console.log('⚠️ Claude API密钥未配置，将使用模拟模式');
      }
    } catch (error) {
      console.error('❌ Claude API客户端初始化失败:', error);
      this.client = null;
    }
    
    // 配置参数
    this.config = {
      model: 'claude-3-sonnet-20240229',
      maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS_PER_REQUEST) || 1000,
      temperature: 0.7,
      timeout: parseInt(process.env.CLAUDE_REQUEST_TIMEOUT) || 30000
    };
    
    // 使用统计
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      dailyTokens: 0,
      lastResetDate: new Date().toDateString()
    };
  }

  // 检查API密钥是否配置
  isConfigured() {
    return !!process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'your_claude_api_key_here';
  }

  // 检查今日token使用限制
  checkDailyLimit(estimatedTokens = 0) {
    const today = new Date().toDateString();
    
    // 重置每日统计
    if (this.usageStats.lastResetDate !== today) {
      this.usageStats.dailyTokens = 0;
      this.usageStats.lastResetDate = today;
    }
    
    const dailyLimit = parseInt(process.env.CLAUDE_DAILY_TOKEN_LIMIT) || 100000;
    const projectedUsage = this.usageStats.dailyTokens + estimatedTokens;
    
    return {
      canProceed: projectedUsage <= dailyLimit,
      currentUsage: this.usageStats.dailyTokens,
      dailyLimit,
      remaining: Math.max(0, dailyLimit - this.usageStats.dailyTokens)
    };
  }

  // 记录token使用情况
  recordUsage(tokensUsed) {
    this.usageStats.totalRequests += 1;
    this.usageStats.totalTokens += tokensUsed;
    this.usageStats.dailyTokens += tokensUsed;
    
    console.log(`📊 Claude API使用统计 - 本次: ${tokensUsed} tokens, 今日总计: ${this.usageStats.dailyTokens} tokens`);
  }

  // 解析人设提示词，提取董事基本信息
  async parseDirectorPrompt(systemPrompt) {
    if (!this.isConfigured() || !this.client) {
      // 如果没有配置API密钥或客户端初始化失败，返回模拟数据
      return {
        success: false,
        fallbackData: this.generateMockParsedInfo(systemPrompt),
        confidence: 0.3
      };
    }

    const limitCheck = this.checkDailyLimit(500); // 估计500 tokens
    if (!limitCheck.canProceed) {
      throw new Error(`今日Claude API token使用已达限制 (${limitCheck.dailyLimit})`);
    }

    try {
      const parsePrompt = `请分析以下人设提示词，提取出这个历史人物的关键信息：

人设提示词：
"""
${systemPrompt}
"""

请以JSON格式返回以下信息，不要包含任何其他文字，只返回JSON：
{
  "name": "人物姓名（如果能识别的话）",
  "title": "身份/职业", 
  "era": "历史时代（包含年份更好）",
  "core_beliefs": ["核心观点1", "核心观点2", "核心观点3"],
  "speaking_style": "说话风格描述",
  "personality_traits": ["性格特征1", "性格特征2", "性格特征3"],
  "expertise_areas": ["专业领域1", "专业领域2"],
  "historical_significance": "历史重要性简述"
}

要求：
1. 信息要准确，基于历史事实
2. 核心观点不超过5个
3. 性格特征用形容词，不超过5个
4. 如果无法识别具体人物，name字段返回"未知人物"
5. 必须返回有效的JSON格式`;

      console.log('🤖 正在调用Claude API解析人设提示词...');
      
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: "你是一个专业的历史人物分析专家，能够准确识别和分析历史人物的特征。请严格按照要求返回JSON格式的数据。",
        messages: [{
          role: "user",
          content: parsePrompt
        }]
      });

      // 记录使用情况
      const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
      this.recordUsage(tokensUsed);

      // 解析响应
      const content = response.content[0].text.trim();
      console.log('🔍 Claude API响应内容:', content);
      
      // 尝试解析JSON
      let parsedInfo;
      try {
        parsedInfo = JSON.parse(content);
      } catch (jsonError) {
        console.warn('⚠️ 无法解析Claude API返回的JSON，使用正则表达式提取');
        parsedInfo = this.extractInfoFromText(content);
      }

      return {
        success: true,
        data: parsedInfo,
        tokensUsed,
        confidence: 0.9 // Claude解析的置信度较高
      };

    } catch (error) {
      console.error('❌ Claude API调用失败:', error);
      
      // 如果API调用失败，返回基于关键词的简单解析
      return {
        success: false,
        error: error.message,
        fallbackData: this.generateMockParsedInfo(systemPrompt),
        confidence: 0.3
      };
    }
  }

  // 从文本中提取信息（正则表达式备用方案）
  extractInfoFromText(text) {
    const info = {
      name: "未知人物",
      title: "",
      era: "",
      core_beliefs: [],
      speaking_style: "",
      personality_traits: [],
      expertise_areas: [],
      historical_significance: ""
    };

    // 简单的关键词提取逻辑
    const nameMatch = text.match(/name["\s]*:\s*["\s]*([^"]+)["\s]*/i);
    if (nameMatch) info.name = nameMatch[1].trim();

    const titleMatch = text.match(/title["\s]*:\s*["\s]*([^"]+)["\s]*/i);
    if (titleMatch) info.title = titleMatch[1].trim();

    return info;
  }

  // 生成模拟解析数据（当没有API密钥时使用）
  generateMockParsedInfo(systemPrompt) {
    console.log('🎭 使用模拟数据解析人设提示词（未配置Claude API密钥）');
    
    // 基于提示词内容的简单关键词匹配
    const prompt = systemPrompt.toLowerCase();
    
    let mockInfo = {
      name: "未知历史人物",
      title: "思想家",
      era: "历史时期",
      core_beliefs: ["理性思考", "追求真理"],
      speaking_style: "深思熟虑，有条理",
      personality_traits: ["智慧", "深沉"],
      expertise_areas: ["哲学"],
      historical_significance: "重要的历史思想家"
    };

    // 简单的关键词识别
    if (prompt.includes('爱因斯坦') || prompt.includes('einstein')) {
      mockInfo = {
        name: "阿尔伯特·爱因斯坦",
        title: "理论物理学家",
        era: "20世纪 (1879-1955)",
        core_beliefs: ["科学理性", "宇宙和谐", "追求真理"],
        speaking_style: "幽默风趣、善于用比喻",
        personality_traits: ["好奇心强", "独立思考", "富有想象力"],
        expertise_areas: ["理论物理", "数学", "哲学"],
        historical_significance: "提出相对论，现代物理学奠基人"
      };
    } else if (prompt.includes('牛顿') || prompt.includes('newton')) {
      mockInfo = {
        name: "艾萨克·牛顿",
        title: "物理学家、数学家",
        era: "17-18世纪 (1643-1727)",
        core_beliefs: ["数学证明", "实验验证", "自然法则"],
        speaking_style: "严谨精确、逻辑清晰",
        personality_traits: ["严谨", "专注", "坚持"],
        expertise_areas: ["物理学", "数学", "天文学"],
        historical_significance: "经典力学奠基人，科学革命的关键人物"
      };
    } else if (prompt.includes('达尔文') || prompt.includes('darwin')) {
      mockInfo = {
        name: "查尔斯·达尔文",
        title: "生物学家、自然学家",
        era: "19世纪 (1809-1882)",
        core_beliefs: ["进化论", "自然选择", "科学观察"],
        speaking_style: "谨慎细致、基于证据",
        personality_traits: ["观察细致", "谨慎", "坚持"],
        expertise_areas: ["生物学", "地质学", "自然史"],
        historical_significance: "进化论创立者，现代生物学奠基人"
      };
    }

    return mockInfo;
  }

  // 生成董事发言（用于会议讨论）
  async generateDirectorStatement(director, meetingContext) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Claude API未配置',
        mockResponse: `[${director.name}]: 这是一个模拟发言，因为Claude API尚未配置。${meetingContext.topic}确实是个值得深思的话题。`
      };
    }

    const limitCheck = this.checkDailyLimit(800); // 估计800 tokens
    if (!limitCheck.canProceed) {
      throw new Error(`今日Claude API token使用已达限制`);
    }

    try {
      const discussionPrompt = `会议话题：${meetingContext.topic}

当前讨论轮次：第${meetingContext.round}轮

${meetingContext.previousStatements ? `之前的发言：\n${meetingContext.previousStatements}` : ''}

请根据你的身份和观点对此话题发表看法。保持你的历史人物特色和说话风格。
如果之前有董事的发言你不认同，可以礼貌地表达不同观点。
发言长度控制在100-300字内。`;

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: 500,
        temperature: 0.8, // 稍高的温度让发言更有个性
        system: director.system_prompt,
        messages: [{
          role: "user",
          content: discussionPrompt
        }]
      });

      const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
      this.recordUsage(tokensUsed);

      return {
        success: true,
        content: response.content[0].text.trim(),
        tokensUsed,
        model: this.config.model,
        generationTime: Date.now() // 简化的生成时间
      };

    } catch (error) {
      console.error('❌ 生成董事发言失败:', error);
      throw error;
    }
  }

  // 生成回应内容（用于会议发言）
  async generateResponse(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // 检查API是否可用
      if (!this.isConfigured() || !this.client) {
        return {
          success: false,
          content: this.getFallbackResponse(prompt),
          message: 'Claude API未配置，使用fallback内容'
        };
      }

      const maxTokens = options.maxTokens || this.config.maxTokens;

      // 检查token限制
      if (!this.checkDailyLimit(maxTokens)) {
        return {
          success: false,
          content: this.getFallbackResponse(prompt),
          message: '今日token使用量已达限制'
        };
      }

      // 调用Claude API
      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: maxTokens,
        temperature: options.temperature || this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = message.content[0].text;
      const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;
      const generationTime = Date.now() - startTime;

      // 更新使用统计
      this.updateUsageStats(tokensUsed);

      return {
        success: true,
        content: content.trim(),
        tokensUsed,
        generationTime,
        model: this.config.model
      };

    } catch (error) {
      console.error('❌ Claude API调用失败:', error);
      
      return {
        success: false,
        content: this.getFallbackResponse(prompt),
        error: error.message,
        generationTime: Date.now() - startTime
      };
    }
  }

  // 获取备用响应
  getFallbackResponse(prompt) {
    // 基于提示词类型返回合适的fallback内容
    if (prompt.includes('开场发言')) {
      return '各位同事，很高兴能参与今天的讨论。这个话题确实值得我们深入探讨。';
    } else if (prompt.includes('总结性发言') || prompt.includes('结束')) {
      return '经过这次富有成效的讨论，我认为我们对这个问题有了更深入的理解。感谢各位的精彩发言。';
    } else {
      return '基于我的观察和经验，我认为这个问题需要从多个角度来考虑。让我们继续深入讨论。';
    }
  }

  // 获取使用统计
  getUsageStats() {
    return {
      ...this.usageStats,
      isConfigured: this.isConfigured(),
      dailyLimit: parseInt(process.env.CLAUDE_DAILY_TOKEN_LIMIT) || 100000,
      remaining: Math.max(0, (parseInt(process.env.CLAUDE_DAILY_TOKEN_LIMIT) || 100000) - this.usageStats.dailyTokens)
    };
  }
}

// 导出单例
const claudeService = new ClaudeService();
module.exports = claudeService;