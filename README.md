# 私人董事会系统 - 前端

基于React的私人董事会系统前端界面，让历史人物通过AI参与现代讨论。

## 功能特性

- 🎭 智能董事创建和管理
- 🏛️ 会议系统（创建、管理、实时讨论）
- 💬 AI驱动的历史人物对话
- 📱 响应式设计，支持移动端

## 技术栈

- **React 18** + **Material-UI** 
- **React Query** 数据管理
- **React Router** 路由
- **Axios** API调用
- **React Hot Toast** 消息提示

## 本地开发

```bash
npm install
npm start
```

访问 http://localhost:3000

## 部署

自动部署到 Cloudflare Pages，连接GitHub仓库。

## API配置

后端API仓库：https://github.com/zhaoyi-AI-FOR-GOOD/dongshihui-api

生产环境API：https://dongshihui-api.jieshu2023.workers.dev

## 项目结构

```
src/
├── components/        # 可复用组件
│   └── Navbar.js     # 导航栏
├── pages/            # 页面组件
│   ├── BoardHall.js      # 董事会大厅
│   ├── CreateDirector.js # 创建董事
│   ├── CreateMeeting.js  # 创建会议
│   ├── DirectorManager.js # 董事管理
│   ├── MeetingRoom.js    # 会议室
│   └── ...
├── services/         # API服务
│   └── api.js       # API接口封装
├── App.js           # 主应用组件
└── index.js         # 应用入口
```

## 使用说明

1. 访问首页，查看董事会大厅
2. 创建AI董事（输入历史人物描述）
3. 发起新会议，选择参与董事
4. 开始会议，观看AI董事自动讨论

## 相关仓库

- 后端API：[dongshihui-api](https://github.com/zhaoyi-AI-FOR-GOOD/dongshihui-api)
- 前端界面：[dongshihui](https://github.com/zhaoyi-AI-FOR-GOOD/dongshihui)（当前仓库）

---

**让历史伟人的智慧照亮现代讨论！** ✨