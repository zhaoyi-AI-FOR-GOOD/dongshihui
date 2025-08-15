const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 发言记录模型 - 存储董事们的每一次发言
const Statement = sequelize.define('statements', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  meeting_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'meetings',
      key: 'id'
    },
    comment: '所属会议ID'
  },
  
  director_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'directors',
      key: 'id'
    },
    comment: '发言董事ID'
  },
  
  // 发言内容
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '发言内容'
  },
  
  content_type: {
    type: DataTypes.ENUM('statement', 'response', 'question', 'summary', 'opening', 'closing'),
    defaultValue: 'statement',
    comment: '发言类型'
  },
  
  // 发言上下文
  round_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '第几轮发言'
  },
  
  sequence_in_round: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '本轮中的发言顺序'
  },
  
  response_to: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'statements',
      key: 'id'
    },
    comment: '回应的发言ID，用于追踪对话链'
  },
  
  // AI生成信息
  tokens_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '生成此发言消耗的tokens'
  },
  
  generation_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '生成耗时（毫秒）'
  },
  
  claude_model: {
    type: DataTypes.STRING(50),
    defaultValue: 'claude-3-sonnet-20240229',
    comment: '使用的Claude模型版本'
  },
  
  // 发言分析
  emotion_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '情绪激烈程度 (1-10)'
  },
  
  controversy_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '争议度评分 (1-10)'
  },
  
  topic_relevance: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '话题相关度 (1-10)'
  },
  
  // 发言特征
  keywords: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: '关键词数组'
  },
  
  mentioned_directors: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: '提及的其他董事ID数组'
  },
  
  sentiment: {
    type: DataTypes.ENUM('positive', 'neutral', 'negative'),
    allowNull: true,
    comment: '情感倾向'
  },
  
  // 元数据
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: '附加元数据，如生成参数等'
  },
  
  // 质量控制
  is_appropriate: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '内容是否合适'
  },
  
  flagged_reason: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '标记原因（如内容不当）'
  }
}, {
  // 模型选项
  indexes: [
    {
      fields: ['meeting_id', 'round_number', 'sequence_in_round']
    },
    {
      fields: ['director_id', 'created_at']
    },
    {
      fields: ['response_to']
    },
    {
      fields: ['created_at']
    }
  ]
});

// 实例方法
Statement.prototype.addResponse = async function(responseStatement) {
  responseStatement.response_to = this.id;
  await responseStatement.save();
};

Statement.prototype.getResponses = async function() {
  return await Statement.findAll({
    where: { response_to: this.id },
    order: [['created_at', 'ASC']]
  });
};

Statement.prototype.analyze = async function() {
  // 这里可以集成情感分析、关键词提取等功能
  // 暂时返回模拟数据
  this.emotion_level = Math.floor(Math.random() * 10) + 1;
  this.topic_relevance = Math.floor(Math.random() * 10) + 1;
  await this.save();
};

// 类方法
Statement.getByMeeting = async function(meetingId, options = {}) {
  const { round, limit, offset } = options;
  
  const whereClause = { meeting_id: meetingId };
  if (round) {
    whereClause.round_number = round;
  }
  
  return await this.findAll({
    where: whereClause,
    order: [['round_number', 'ASC'], ['sequence_in_round', 'ASC']],
    limit,
    offset,
    include: [
      {
        model: require('./Director'),
        attributes: ['id', 'name', 'title', 'avatar_url']
      }
    ]
  });
};

Statement.getByDirector = async function(directorId, options = {}) {
  const { meetingId, limit = 50, offset = 0 } = options;
  
  const whereClause = { director_id: directorId };
  if (meetingId) {
    whereClause.meeting_id = meetingId;
  }
  
  return await this.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
};

Statement.getConversationThread = async function(statementId) {
  // 获取完整的对话线程
  const threads = [];
  
  // 递归获取所有回应
  const getResponses = async (id) => {
    const responses = await this.findAll({
      where: { response_to: id },
      order: [['created_at', 'ASC']]
    });
    
    for (const response of responses) {
      threads.push(response);
      await getResponses(response.id);
    }
  };
  
  // 获取原始发言
  const originalStatement = await this.findByPk(statementId);
  if (originalStatement) {
    threads.push(originalStatement);
    await getResponses(statementId);
  }
  
  return threads;
};

module.exports = Statement;