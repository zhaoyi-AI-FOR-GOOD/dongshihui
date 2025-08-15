const { Sequelize } = require('sequelize');
require('dotenv').config();

// 数据库连接配置
let sequelize;

if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite:')) {
  // 开发环境使用SQLite
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    storage: './database.sqlite'
  });
} else {
  // 生产环境使用PostgreSQL
  sequelize = new Sequelize(process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'private_board',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  }, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
    // 连接池配置
    pool: {
      max: 10,        // 最大连接数
      min: 0,         // 最小连接数
      acquire: 30000, // 获取连接的超时时间
      idle: 10000     // 空闲连接超时时间
    },
    
    // 其他配置
    define: {
      timestamps: true,           // 自动添加 createdAt 和 updatedAt
      underscored: true,         // 使用下划线命名 created_at, updated_at
      freezeTableName: true,     // 不自动复数化表名
      charset: 'utf8mb4',        // 字符集
      dialectOptions: {
        collate: 'utf8mb4_general_ci'
      }
    }
  });
}

// 通用配置
if (sequelize) {
  sequelize.options.define = {
    ...sequelize.options.define,
    timestamps: true,           // 自动添加 createdAt 和 updatedAt
    underscored: true,         // 使用下划线命名 created_at, updated_at
    freezeTableName: true      // 不自动复数化表名
  };
}

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 同步数据库模型
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ 数据库模型同步成功');
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};