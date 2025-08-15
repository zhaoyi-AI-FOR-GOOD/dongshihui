// 模型索引文件 - 统一管理所有模型和关联关系
const { sequelize } = require('../config/database');

// 导入所有模型
const Director = require('./Director');
const Meeting = require('./Meeting');
const MeetingParticipant = require('./MeetingParticipant');
const Statement = require('./Statement');
const PromptTemplate = require('./PromptTemplate');

// 定义模型之间的关联关系

// 1. Meeting 和 Director 的多对多关系（通过 MeetingParticipant）
Meeting.belongsToMany(Director, {
  through: MeetingParticipant,
  foreignKey: 'meeting_id',
  otherKey: 'director_id',
  as: 'directors'
});

Director.belongsToMany(Meeting, {
  through: MeetingParticipant,
  foreignKey: 'director_id',
  otherKey: 'meeting_id',
  as: 'meetings'
});

// 2. MeetingParticipant 的关联
MeetingParticipant.belongsTo(Meeting, {
  foreignKey: 'meeting_id',
  as: 'meeting'
});

MeetingParticipant.belongsTo(Director, {
  foreignKey: 'director_id',
  as: 'director'
});

Meeting.hasMany(MeetingParticipant, {
  foreignKey: 'meeting_id',
  as: 'participants'
});

Director.hasMany(MeetingParticipant, {
  foreignKey: 'director_id',
  as: 'participationRecords'
});

// 3. Statement 的关联
Statement.belongsTo(Meeting, {
  foreignKey: 'meeting_id',
  as: 'meeting'
});

Statement.belongsTo(Director, {
  foreignKey: 'director_id',
  as: 'Director'  // 保持大写以匹配Statement模型中的使用
});

Meeting.hasMany(Statement, {
  foreignKey: 'meeting_id',
  as: 'statements'
});

Director.hasMany(Statement, {
  foreignKey: 'director_id',
  as: 'statements'
});

// 4. Statement 的自关联（回应关系）
Statement.belongsTo(Statement, {
  foreignKey: 'response_to',
  as: 'originalStatement'
});

Statement.hasMany(Statement, {
  foreignKey: 'response_to',
  as: 'responses'
});

// 导出所有模型和sequelize实例
module.exports = {
  sequelize,
  Director,
  Meeting,
  MeetingParticipant,
  Statement,
  PromptTemplate
};

// 同步数据库（仅在开发环境）
if (process.env.NODE_ENV === 'development') {
  const syncDatabase = async () => {
    try {
      // 同步所有模型到数据库
      await sequelize.sync({ alter: true });
      console.log('✅ 数据库模型同步完成');
    } catch (error) {
      console.error('❌ 数据库同步失败:', error);
    }
  };
  
  // 只有在直接运行此文件时才同步
  if (require.main === module) {
    syncDatabase();
  }
}