const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 会议模型 - 存储董事会会议信息
const Meeting = sequelize.define('meetings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: '会议唯一标识'
  },
  
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '会议标题'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '会议描述'
  },
  
  topic: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '讨论话题 - 核心讨论内容'
  },
  
  // 会议状态管理
  status: {
    type: DataTypes.ENUM('preparing', 'opening', 'discussing', 'debating', 'concluding', 'finished', 'paused'),
    defaultValue: 'preparing',
    comment: '会议状态'
  },
  
  // 会议配置
  max_rounds: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: '最大发言轮数'
  },
  
  current_round: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '当前轮数'
  },
  
  discussion_mode: {
    type: DataTypes.ENUM('round_robin', 'debate', 'focus', 'free'),
    defaultValue: 'round_robin',
    comment: '讨论模式：轮转/辩论/聚焦/自由'
  },
  
  max_participants: {
    type: DataTypes.INTEGER,
    defaultValue: 8,
    comment: '最大参与董事数量'
  },
  
  // 时间管理
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '会议开始时间'
  },
  
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '会议结束时间'
  },
  
  paused_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '会议暂停时间'
  },
  
  // 创建信息
  created_by: {
    type: DataTypes.STRING(50),
    defaultValue: 'user',
    comment: '会议发起人'
  },
  
  // 统计信息
  total_statements: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总发言数'
  },
  
  total_participants: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '参与董事总数'
  },
  
  // 会议设置
  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: '会议设置JSON，包含各种配置参数'
  },
  
  // 会议摘要和分析
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI生成的会议摘要'
  },
  
  key_points: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: '关键观点数组'
  },
  
  controversies: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: '争议点数组'
  },
  
  // 元数据
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: '附加元数据'
  }
}, {
  // 模型选项
  indexes: [
    {
      fields: ['status']  // 状态索引
    },
    {
      fields: ['created_at']  // 创建时间索引
    },
    {
      fields: ['started_at']  // 开始时间索引
    },
    {
      fields: ['created_by']  // 创建者索引
    }
  ],
  
  // 作用域定义
  scopes: {
    // 进行中的会议
    active: {
      where: {
        status: ['discussing', 'debating', 'opening']
      }
    },
    
    // 已完成的会议
    finished: {
      where: {
        status: 'finished'
      },
      order: [['ended_at', 'DESC']]
    },
    
    // 最近的会议
    recent: {
      order: [['created_at', 'DESC']],
      limit: 10
    }
  }
});

// 实例方法
Meeting.prototype.start = async function() {
  this.status = 'discussing';
  this.started_at = new Date();
  await this.save();
};

Meeting.prototype.pause = async function() {
  this.status = 'paused';
  this.paused_at = new Date();
  await this.save();
};

Meeting.prototype.finish = async function() {
  this.status = 'finished';
  this.ended_at = new Date();
  await this.save();
};

Meeting.prototype.nextRound = async function() {
  this.current_round += 1;
  await this.save();
  return this.current_round;
};

Meeting.prototype.changeMod = async function(newMode) {
  this.discussion_mode = newMode;
  await this.save();
};

Meeting.prototype.getDuration = function() {
  if (!this.started_at) return 0;
  const endTime = this.ended_at || new Date();
  return Math.floor((endTime - this.started_at) / 1000); // 返回秒数
};

// 类方法
Meeting.getActiveMeetings = async function() {
  return await this.scope('active').findAll();
};

Meeting.getRecentFinished = async function() {
  return await this.scope('finished').findAll();
};

module.exports = Meeting;