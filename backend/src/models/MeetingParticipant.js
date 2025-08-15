const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 会议参与者模型 - 记录每次会议的参与董事
const MeetingParticipant = sequelize.define('meeting_participants', {
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
    comment: '会议ID'
  },
  
  director_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'directors',
      key: 'id'
    },
    comment: '董事ID'
  },
  
  // 参与状态
  join_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '加入顺序，决定发言顺序'
  },
  
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否参与发言'
  },
  
  status: {
    type: DataTypes.ENUM('invited', 'joined', 'speaking', 'finished', 'left'),
    defaultValue: 'joined',
    comment: '参与状态'
  },
  
  // 参与统计
  statements_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '发言次数'
  },
  
  total_tokens_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总计使用的tokens'
  },
  
  // 时间记录
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '加入时间'
  },
  
  left_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '离开时间'
  },
  
  last_statement_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后发言时间'
  },
  
  // 参与设置
  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: '参与者个人设置'
  }
}, {
  // 模型选项
  indexes: [
    {
      fields: ['meeting_id', 'director_id'],
      unique: true  // 确保同一董事在同一会议中只能有一条记录
    },
    {
      fields: ['meeting_id', 'join_order']
    },
    {
      fields: ['director_id']
    }
  ]
});

// 实例方法
MeetingParticipant.prototype.incrementStatement = async function(tokensUsed = 0) {
  this.statements_count += 1;
  this.total_tokens_used += tokensUsed;
  this.last_statement_at = new Date();
  await this.save();
};

MeetingParticipant.prototype.leave = async function() {
  this.status = 'left';
  this.is_active = false;
  this.left_at = new Date();
  await this.save();
};

// 类方法
MeetingParticipant.getByMeeting = async function(meetingId) {
  return await this.findAll({
    where: { meeting_id: meetingId },
    order: [['join_order', 'ASC']]
  });
};

MeetingParticipant.getActiveByMeeting = async function(meetingId) {
  return await this.findAll({
    where: { 
      meeting_id: meetingId,
      is_active: true 
    },
    order: [['join_order', 'ASC']]
  });
};

module.exports = MeetingParticipant;