const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 董事模型 - 存储历史人物董事的信息
const Director = sequelize.define('directors', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: '董事唯一标识'
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '董事姓名，如：阿尔伯特·爱因斯坦'
  },
  
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '董事头衔/身份，如：理论物理学家'
  },
  
  era: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '历史时代，如：20世纪 (1879-1955)'
  },
  
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '头像图片URL'
  },
  
  system_prompt: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '董事人设提示词 - 核心字段，定义AI角色行为'
  },
  
  personality_traits: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: '性格特征数组，如：["好奇心强", "独立思考"]'
  },
  
  core_beliefs: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: '核心信念数组，如：["科学理性", "质疑精神"]'
  },
  
  speaking_style: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '说话风格描述，如：幽默风趣、善于用比喻'
  },
  
  expertise_areas: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: '专业领域数组，如：["理论物理", "数学", "哲学"]'
  },
  
  // 董事状态管理
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用状态'
  },
  
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'retired', 'suspended', 'archived'),
    defaultValue: 'active',
    comment: '董事状态：活跃/非活跃/退休/暂停/归档'
  },
  
  // 使用统计
  total_statements: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总发言次数'
  },
  
  total_meetings: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '参与会议总数'
  },
  
  last_active_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后活跃时间'
  },
  
  // 创建信息
  created_by: {
    type: DataTypes.STRING(50),
    defaultValue: 'system',
    comment: '创建者'
  },
  
  // 元数据
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: '附加元数据，如导入来源等'
  }
}, {
  // 模型选项
  indexes: [
    {
      fields: ['name']  // 姓名索引
    },
    {
      fields: ['is_active', 'status']  // 状态索引
    },
    {
      fields: ['created_at']  // 创建时间索引
    },
    {
      fields: ['last_active_at']  // 最后活跃时间索引
    }
  ],
  
  // 作用域定义
  scopes: {
    // 只获取活跃董事
    active: {
      where: {
        is_active: true,
        status: 'active'
      }
    },
    
    // 获取最近活跃的董事
    recentlyActive: {
      where: {
        last_active_at: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天内
        }
      },
      order: [['last_active_at', 'DESC']]
    }
  }
});

// 实例方法
Director.prototype.updateActivity = async function() {
  this.last_active_at = new Date();
  await this.save();
};

Director.prototype.incrementStats = async function(type = 'statement') {
  if (type === 'statement') {
    this.total_statements += 1;
  } else if (type === 'meeting') {
    this.total_meetings += 1;
  }
  await this.updateActivity();
};

// 类方法
Director.getActiveDirectors = async function() {
  return await this.scope('active').findAll();
};

Director.findByName = async function(name) {
  return await this.findOne({
    where: { name: { [require('sequelize').Op.iLike]: `%${name}%` } }
  });
};

module.exports = Director;