# Cloudflare 部署指南

## 部署步骤

### 1. 安装Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 2. 创建D1数据库
```bash
# 生产环境
wrangler d1 create dongshihui-db

# 开发环境  
wrangler d1 create dongshihui-db-dev
```

### 3. 创建KV命名空间
```bash
# 生产环境
wrangler kv:namespace create "dongshihui-kv"

# 开发环境
wrangler kv:namespace create "dongshihui-kv" --preview
```

### 4. 更新wrangler.toml
将步骤2和3中获得的ID填入 `wrangler.toml` 文件对应位置。

### 5. 初始化数据库
```bash
# 生产环境
wrangler d1 execute dongshihui-db --file=./workers/schema.sql

# 开发环境
wrangler d1 execute dongshihui-db-dev --local --file=./workers/schema.sql
```

### 6. 部署Workers API
```bash
# 开发环境测试
wrangler dev

# 生产环境部署
wrangler deploy
```

### 7. 部署Pages前端
```bash
# 构建前端
cd frontend && npm run build

# 部署到Cloudflare Pages
wrangler pages deploy build --project-name dongshihui-frontend
```

### 8. 配置域名和环境变量

在Cloudflare Dashboard中：
1. 设置自定义域名
2. 配置环境变量：
   - `CLAUDE_API_KEY`: 你的Claude API密钥
   - `JWT_SECRET`: JWT签名密钥

## 故障排除

### 常见问题

1. **网站打不开**
   - 检查Cloudflare Pages部署状态
   - 验证自定义域名DNS设置
   - 查看部署日志中的错误信息

2. **API请求失败**
   - 确认Workers已正确部署
   - 检查`_redirects`文件中的API路由配置
   - 验证D1数据库连接

3. **数据库连接问题**
   - 确认D1数据库已创建并初始化
   - 检查`wrangler.toml`中的database_id配置

### 调试命令

```bash
# 查看部署状态
wrangler deployments list

# 查看实时日志
wrangler tail

# 本地开发测试
wrangler dev --local

# 测试D1数据库
wrangler d1 execute dongshihui-db --command="SELECT * FROM directors LIMIT 5"
```

## 注意事项

- Cloudflare Workers有执行时间限制（CPU时间10ms-30s）
- D1数据库在免费层有读写限制
- 确保在生产环境配置正确的CORS域名
- Claude API调用需要配置正确的API密钥