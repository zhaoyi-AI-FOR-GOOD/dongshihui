const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 提示词模板模型 - 存储可复用的人设模板
const PromptTemplate = sequelize.define('prompt_templates', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '模板名称，如：科学家模板'
  },
  
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '分类：scientist/philosopher/religious_leader/politician等'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '模板描述'
  },
  
  base_template: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '基础提示词模板，包含变量占位符'
  },
  
  // 模板变量定义
  variables: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: '变量定义JSON，包含字段类型、标签、验证规则等'
  },
  
  // 使用统计
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用次数'
  },
  
  // 模板状态
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用'
  },
  
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为系统内置模板'
  },
  
  // 标签和元数据
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: '标签数组，用于搜索和分类'
  },
  
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: '附加元数据'
  },
  
  // 创建信息
  created_by: {
    type: DataTypes.STRING(50),
    defaultValue: 'system',
    comment: '创建者'
  },
  
  // 版本管理
  version: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0.0',
    comment: '模板版本'
  }
}, {
  // 模型选项
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['usage_count']
    },
    {
      fields: ['name'],
      unique: true  // 模板名称唯一
    }
  ],
  
  scopes: {
    active: {
      where: { is_active: true }
    },
    
    byCategory: (category) => ({
      where: { 
        category,
        is_active: true 
      }
    }),
    
    popular: {
      where: { is_active: true },
      order: [['usage_count', 'DESC']]
    }
  }
});

// 实例方法
PromptTemplate.prototype.generatePrompt = function(variables) {
  let prompt = this.base_template;
  
  // 替换模板变量
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`;
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    prompt = prompt.replace(regex, variables[key] || '');
  });
  
  return prompt;
};

PromptTemplate.prototype.validateVariables = function(variables) {
  const errors = [];
  const templateVars = this.variables;
  
  // 检查必填字段
  Object.keys(templateVars).forEach(key => {
    const varDef = templateVars[key];
    if (varDef.required && (!variables[key] || variables[key].trim() === '')) {
      errors.push(`${varDef.label || key} 是必填字段`);
    }
    
    // 长度验证
    if (variables[key] && varDef.maxLength && variables[key].length > varDef.maxLength) {
      errors.push(`${varDef.label || key} 长度不能超过 ${varDef.maxLength} 字符`);
    }
    
    // 类型验证
    if (variables[key] && varDef.type === 'number' && isNaN(variables[key])) {
      errors.push(`${varDef.label || key} 必须是数字`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

PromptTemplate.prototype.incrementUsage = async function() {
  this.usage_count += 1;
  await this.save();
};

// 类方法
PromptTemplate.getByCategory = async function(category) {
  return await this.scope({ method: ['byCategory', category] }).findAll();
};

PromptTemplate.getPopular = async function(limit = 10) {
  return await this.scope('popular').findAll({ limit });
};

PromptTemplate.search = async function(query, options = {}) {
  const { category, limit = 20 } = options;
  
  const whereClause = {
    is_active: true,
    [require('sequelize').Op.or]: [
      { name: { [require('sequelize').Op.iLike]: `%${query}%` } },
      { description: { [require('sequelize').Op.iLike]: `%${query}%` } },
      { tags: { [require('sequelize').Op.contains]: [query] } }
    ]
  };
  
  if (category) {
    whereClause.category = category;
  }
  
  return await this.findAll({
    where: whereClause,
    limit,
    order: [['usage_count', 'DESC']]
  });
};

module.exports = PromptTemplate;