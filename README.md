# 私人董事会系统 (Private Board System)

一个创新的AI驱动的虚拟董事会系统，让历史人物通过Claude AI"复活"参与现代讨论。

## 项目概述

通过输入历史人物的人设提示词，系统可以：
- 自动生成董事的基本信息和特征
- 创建智能的会议讨论系统
- 支持多个历史人物同时参与辩论
- 实时展示讨论过程和结果

## 技术架构

- **后端**: Node.js + Express + PostgreSQL
- **前端**: React + Modern UI Components  
- **AI集成**: Claude API (Anthropic)
- **实时通信**: WebSocket
- **数据库**: PostgreSQL

## 功能特性

### 核心功能
- 🎭 **智能董事创建**: 通过提示词自动生成历史人物特征
- 🏛️ **虚拟董事会**: 创建和管理虚拟董事会会议
- 💬 **智能讨论引擎**: AI驱动的多轮对话和辩论系统
- 📊 **实时会议室**: WebSocket实现的实时讨论界面
- 📁 **会议记录**: 完整的讨论历史和导出功能

### 高级功能
- 🔄 **动态董事管理**: 随时添加、替换、停用董事
- 📝 **提示词模板**: 预设的历史人物类型模板
- 🎯 **讨论模式切换**: 轮转、辩论、聚焦模式智能切换
- 📈 **使用分析**: 董事参与度和讨论质量分析

## 开发计划

1. [x] 项目架构设计
2. [ ] 数据库设计和连接
3. [ ] 董事管理API开发
4. [ ] Claude API集成
5. [ ] 前端界面开发
6. [ ] 会议系统开发
7. [ ] 实时通信集成
8. [ ] 测试和部署

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 13+
- Claude API Key

### 安装依赖
```bash
# 后端依赖
cd backend && npm install

# 前端依赖  
cd frontend && npm install
```

### 环境配置
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 配置必要的环境变量
CLAUDE_API_KEY=your_claude_api_key_here
DATABASE_URL=postgresql://username:password@localhost:5432/private_board
```

### 运行项目
```bash
# 启动后端服务 (端口 3001)
cd backend && npm run dev

# 启动前端开发服务器 (端口 3000)
cd frontend && npm start
```

## 贡献指南

欢迎提交 Issues 和 Pull Requests！

## 许可证

MIT License

---

**让历史伟人的智慧照亮现代讨论！** ✨