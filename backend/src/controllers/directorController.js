const express = require('express');
const { Director, PromptTemplate } = require('../models');
const claudeService = require('../services/claudeService');
const router = express.Router();

// 获取所有董事
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'active', 
      limit = 50, 
      offset = 0,
      search = '',
      sortBy = 'created_at',
      order = 'DESC'
    } = req.query;

    // 构建查询条件
    const whereClause = {};
    
    if (status !== 'all') {
      whereClause.status = status;
      whereClause.is_active = true;
    }
    
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { title: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    const directors = await Director.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order.toUpperCase()]],
      attributes: [
        'id', 'name', 'title', 'era', 'avatar_url', 
        'personality_traits', 'core_beliefs', 'speaking_style',
        'is_active', 'status', 'total_statements', 'total_meetings',
        'last_active_at', 'created_at'
      ]
    });

    res.json({
      success: true,
      data: {
        directors: directors.rows,
        total: directors.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('获取董事列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取董事列表失败',
      message: error.message
    });
  }
});

// 获取单个董事详情
router.get('/:id', async (req, res) => {
  try {
    const director = await Director.findByPk(req.params.id);
    
    if (!director) {
      return res.status(404).json({
        success: false,
        error: '董事不存在'
      });
    }

    res.json({
      success: true,
      data: director
    });
    
  } catch (error) {
    console.error('获取董事详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取董事详情失败',
      message: error.message
    });
  }
});

// 创建新董事
router.post('/', async (req, res) => {
  try {
    const {
      name,
      title,
      era,
      avatar_url,
      system_prompt,
      personality_traits = [],
      core_beliefs = [],
      speaking_style,
      expertise_areas = []
    } = req.body;

    // 基本验证
    if (!name || !title || !system_prompt) {
      return res.status(400).json({
        success: false,
        error: '缺少必要字段',
        required: ['name', 'title', 'system_prompt']
      });
    }

    // 检查董事名称是否重复
    const existingDirector = await Director.findOne({
      where: { name }
    });
    
    if (existingDirector) {
      return res.status(409).json({
        success: false,
        error: '董事姓名已存在',
        suggestion: '请使用不同的姓名或在姓名后添加标识符'
      });
    }

    // 创建董事
    const director = await Director.create({
      name,
      title,
      era,
      avatar_url,
      system_prompt,
      personality_traits,
      core_beliefs,
      speaking_style,
      expertise_areas,
      created_by: 'user' // 将来可以从JWT中获取用户信息
    });

    res.status(201).json({
      success: true,
      message: '董事创建成功',
      data: director
    });
    
  } catch (error) {
    console.error('创建董事失败:', error);
    res.status(500).json({
      success: false,
      error: '创建董事失败',
      message: error.message
    });
  }
});

// 更新董事信息
router.put('/:id', async (req, res) => {
  try {
    const director = await Director.findByPk(req.params.id);
    
    if (!director) {
      return res.status(404).json({
        success: false,
        error: '董事不存在'
      });
    }

    // 更新字段
    const updateFields = [
      'name', 'title', 'era', 'avatar_url', 'system_prompt',
      'personality_traits', 'core_beliefs', 'speaking_style', 
      'expertise_areas', 'is_active', 'status'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        director[field] = req.body[field];
      }
    });

    await director.save();

    res.json({
      success: true,
      message: '董事信息更新成功',
      data: director
    });
    
  } catch (error) {
    console.error('更新董事失败:', error);
    res.status(500).json({
      success: false,
      error: '更新董事失败',
      message: error.message
    });
  }
});

// 删除董事（软删除）
router.delete('/:id', async (req, res) => {
  try {
    const director = await Director.findByPk(req.params.id);
    
    if (!director) {
      return res.status(404).json({
        success: false,
        error: '董事不存在'
      });
    }

    // 软删除：设置为非活跃状态
    director.is_active = false;
    director.status = 'archived';
    await director.save();

    res.json({
      success: true,
      message: '董事已删除'
    });
    
  } catch (error) {
    console.error('删除董事失败:', error);
    res.status(500).json({
      success: false,
      error: '删除董事失败',
      message: error.message
    });
  }
});

// 批量操作董事状态
router.patch('/batch-status', async (req, res) => {
  try {
    const { director_ids, status, is_active } = req.body;
    
    if (!director_ids || !Array.isArray(director_ids) || director_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的董事ID列表'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (is_active !== undefined) updateData.is_active = is_active;

    const [updatedCount] = await Director.update(updateData, {
      where: {
        id: {
          [require('sequelize').Op.in]: director_ids
        }
      }
    });

    res.json({
      success: true,
      message: `成功更新 ${updatedCount} 个董事的状态`,
      updated_count: updatedCount
    });
    
  } catch (error) {
    console.error('批量更新董事状态失败:', error);
    res.status(500).json({
      success: false,
      error: '批量更新失败',
      message: error.message
    });
  }
});

// 获取董事统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const director = await Director.findByPk(req.params.id, {
      include: [
        {
          model: require('../models').Statement,
          as: 'statements',
          attributes: ['id', 'created_at', 'tokens_used'],
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    if (!director) {
      return res.status(404).json({
        success: false,
        error: '董事不存在'
      });
    }

    // 计算统计数据
    const totalTokens = director.statements.reduce((sum, stmt) => sum + stmt.tokens_used, 0);
    const avgTokensPerStatement = director.total_statements > 0 ? Math.round(totalTokens / director.total_statements) : 0;

    const stats = {
      basic_info: {
        name: director.name,
        title: director.title,
        status: director.status,
        created_at: director.created_at,
        last_active_at: director.last_active_at
      },
      activity_stats: {
        total_statements: director.total_statements,
        total_meetings: director.total_meetings,
        total_tokens_used: totalTokens,
        avg_tokens_per_statement: avgTokensPerStatement
      },
      recent_statements: director.statements
    };

    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('获取董事统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取董事统计失败',
      message: error.message
    });
  }
});

// 获取活跃董事（用于会议创建）
router.get('/active/list', async (req, res) => {
  try {
    const activeDirectors = await Director.scope('active').findAll({
      attributes: ['id', 'name', 'title', 'avatar_url', 'expertise_areas'],
      order: [['last_active_at', 'DESC NULLS LAST'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: activeDirectors
    });
    
  } catch (error) {
    console.error('获取活跃董事失败:', error);
    res.status(500).json({
      success: false,
      error: '获取活跃董事失败',
      message: error.message
    });
  }
});

// 解析人设提示词 - 核心AI功能
router.post('/parse-prompt', async (req, res) => {
  try {
    const { system_prompt } = req.body;
    
    if (!system_prompt || system_prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供人设提示词内容'
      });
    }
    
    if (system_prompt.length > 5000) {
      return res.status(400).json({
        success: false,
        error: '提示词内容过长，请控制在5000字符以内'
      });
    }

    console.log(`🔍 开始解析人设提示词 (${system_prompt.length} 字符)`);
    
    // 调用Claude服务解析
    const parseResult = await claudeService.parseDirectorPrompt(system_prompt);
    
    if (parseResult.success) {
      res.json({
        success: true,
        message: 'AI解析成功',
        data: {
          parsed_info: parseResult.data,
          tokens_used: parseResult.tokensUsed || 0,
          confidence_score: parseResult.confidence || 0.9,
          is_ai_generated: true
        }
      });
    } else {
      // API调用失败，但提供备用数据
      res.json({
        success: true,
        message: 'AI服务不可用，使用基础解析',
        data: {
          parsed_info: parseResult.fallbackData,
          tokens_used: 0,
          confidence_score: parseResult.confidence || 0.3,
          is_ai_generated: false,
          warning: 'Claude API未配置或调用失败，使用基础关键词匹配'
        }
      });
    }
    
  } catch (error) {
    console.error('解析人设提示词失败:', error);
    res.status(500).json({
      success: false,
      error: '解析失败',
      message: error.message,
      suggestion: '请检查提示词格式是否正确，或稍后重试'
    });
  }
});

// 获取Claude API使用统计
router.get('/claude-stats', async (req, res) => {
  try {
    const stats = claudeService.getUsageStats();
    
    res.json({
      success: true,
      data: {
        usage_stats: stats,
        api_status: stats.isConfigured ? 'configured' : 'not_configured',
        daily_usage_percentage: stats.dailyLimit > 0 ? Math.round((stats.dailyTokens / stats.dailyLimit) * 100) : 0
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取统计信息失败',
      message: error.message
    });
  }
});

// 智能创建董事 - 结合解析和创建
router.post('/create-from-prompt', async (req, res) => {
  try {
    const { system_prompt, avatar_url } = req.body;
    
    if (!system_prompt) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的system_prompt字段'
      });
    }

    console.log('🤖 智能创建董事流程启动');
    
    // 第一步：解析提示词
    const parseResult = await claudeService.parseDirectorPrompt(system_prompt);
    let parsedInfo;
    
    if (parseResult.success) {
      parsedInfo = parseResult.data;
    } else if (parseResult.fallbackData) {
      parsedInfo = parseResult.fallbackData;
    } else {
      throw new Error('提示词解析失败');
    }

    // 第二步：检查重名
    if (parsedInfo.name && parsedInfo.name !== "未知人物") {
      const existingDirector = await Director.findOne({
        where: { name: parsedInfo.name }
      });
      
      if (existingDirector) {
        return res.status(409).json({
          success: false,
          error: '同名董事已存在',
          existing_director: {
            id: existingDirector.id,
            name: existingDirector.name,
            title: existingDirector.title
          },
          parsed_info: parsedInfo,
          suggestion: '请修改姓名或查看现有董事'
        });
      }
    }

    // 第三步：创建董事
    const director = await Director.create({
      name: parsedInfo.name || '新建董事',
      title: parsedInfo.title || '未知身份',
      era: parsedInfo.era || '',
      avatar_url: avatar_url || null,
      system_prompt,
      personality_traits: parsedInfo.personality_traits || [],
      core_beliefs: parsedInfo.core_beliefs || [],
      speaking_style: parsedInfo.speaking_style || '',
      expertise_areas: parsedInfo.expertise_areas || [],
      created_by: 'ai_assisted',
      metadata: {
        ai_generated: parseResult.success,
        tokens_used: parseResult.tokensUsed || 0,
        confidence_score: parseResult.confidence || 0.5,
        created_method: 'smart_create'
      }
    });

    res.status(201).json({
      success: true,
      message: '智能创建董事成功',
      data: {
        director,
        ai_analysis: {
          tokens_used: parseResult.tokensUsed || 0,
          confidence_score: parseResult.confidence || 0.5,
          is_ai_generated: parseResult.success
        }
      }
    });
    
  } catch (error) {
    console.error('智能创建董事失败:', error);
    res.status(500).json({
      success: false,
      error: '智能创建失败',
      message: error.message
    });
  }
});

module.exports = router;