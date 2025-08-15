const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 导入数据库连接
const { testConnection, syncDatabase } = require('./config/database');

// 导入路由
const directorRoutes = require('./controllers/directorController');
const meetingRoutes = require('./routes/meetings');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors({
  origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined')); // 请求日志
app.use(express.json({ limit: '10mb' })); // 解析JSON请求体
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API路由
app.use('/api/v1/directors', directorRoutes);
app.use('/api/v1/meetings', meetingRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: '私人董事会系统API'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用私人董事会系统API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API端点不存在',
    path: req.originalUrl,
    method: req.method
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  // Sequelize错误处理
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: '数据验证失败',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: '数据重复',
      message: '该记录已存在'
    });
  }
  
  // 默认错误响应
  res.status(err.status || 500).json({
    error: err.message || '内部服务器错误',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器启动中止');
      process.exit(1);
    }
    
    // 同步数据库模型
    if (process.env.NODE_ENV === 'development') {
      await syncDatabase({ alter: true });
    }
    
    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      console.log(`🚀 私人董事会系统API服务启动成功`);
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log(`🌟 环境模式: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 健康检查: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });
    
    // 优雅关闭处理
    const gracefulShutdown = (signal) => {
      console.log(`\n收到 ${signal} 信号，开始优雅关闭服务器...`);
      server.close(async () => {
        console.log('✅ HTTP服务器已关闭');
        
        // 关闭数据库连接
        const { sequelize } = require('./config/database');
        await sequelize.close();
        console.log('✅ 数据库连接已关闭');
        
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

module.exports = app;