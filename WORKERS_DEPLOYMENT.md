# Cloudflare Workers GitHub 集成部署指南

## 概述

本项目已配置为通过GitHub集成自动部署到Cloudflare Workers，这样可以获得：
- 🚀 **自动部署** - 推送代码即可自动部署
- 🌍 **全球边缘计算** - Cloudflare全球网络
- 🔄 **内置API代理** - 无需额外配置
- 🔒 **自动HTTPS** - 免费SSL证书
- ⚡ **高性能** - 边缘缓存和优化

## 部署方式

### GitHub 集成部署（推荐）

你已经通过GitHub将项目托管到Cloudflare Workers，部署非常简单：

1. **推送代码到GitHub**
   ```bash
   git add .
   git commit -m "更新代码"
   git push origin main
   ```

2. **自动部署**
   - Cloudflare会自动检测到代码变更
   - 自动构建和部署到Workers
   - 无需手动操作

## 项目配置

### Worker脚本功能

`src/worker.js` 提供以下功能：

1. **静态资源服务**
   - 自动服务构建后的静态文件
   - 支持SPA路由（所有路由都返回index.html）
   - 智能MIME类型检测
   - 自动缓存优化

2. **API代理**
   - `/api/*` → `https://api.young13.club/*`
   - `/priapi/*` → `https://web3.okx.com/*`
   - 自动添加CORS头部
   - 错误处理和重试机制

3. **安全头部**
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin

### 构建配置

项目使用Vite构建，配置已优化：

```javascript
// vite.config.js
export default defineConfig({
  base: './',  // 相对路径，适合Workers
  build: {
    target: 'es2015',  // 兼容性目标
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          vuetify: ['vuetify'],
          axios: ['axios']
        }
      }
    }
  }
})
```

## 开发流程

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5174
```

### 部署流程

```bash
# 1. 开发完成后提交代码
git add .
git commit -m "功能更新"

# 2. 推送到GitHub
git push origin main

# 3. 等待自动部署完成（通常1-2分钟）
```

### 查看部署状态

在Cloudflare Dashboard中：
1. 进入 **Workers & Pages**
2. 选择你的项目
3. 查看 **Deployments** 标签页
4. 可以看到部署历史和状态

## 环境配置

### Cloudflare Dashboard 设置

在项目设置中可以配置：

1. **环境变量**
   ```
   NODE_VERSION=18
   ENVIRONMENT=production
   ```

2. **自定义域名**
   - 在 **Custom domains** 中添加域名
   - 自动配置SSL证书

3. **构建设置**
   - 构建命令：`npm run build`
   - 输出目录：`dist`

## 监控和调试

### 实时日志

在Cloudflare Dashboard中：
1. 进入你的Worker项目
2. 点击 **Logs** 标签页
3. 查看实时请求日志

### 性能监控

- **Analytics** - 查看请求统计
- **Speed** - 查看响应时间
- **Reliability** - 查看错误率

## 故障排除

### 常见问题

1. **构建失败**
   - 检查package.json中的依赖版本
   - 确保Node.js版本兼容（推荐18+）
   - 查看构建日志中的错误信息

2. **静态资源404**
   - 确认`base: './'`在vite.config.js中设置
   - 检查构建输出的文件路径
   - 验证Worker脚本的路由逻辑

3. **API代理失败**
   - 检查Worker脚本中的代理配置
   - 确认目标API地址正确
   - 查看Workers日志中的错误信息

4. **SPA路由问题**
   - 确认Worker正确处理非文件路径
   - 检查index.html是否正确返回

### 调试技巧

1. **启用调试模式**
   ```javascript
   // 在 src/worker.js 中
   const DEBUG = true
   ```

2. **查看详细错误**
   - 调试模式下会返回详细错误信息
   - 生产环境建议关闭调试模式

3. **本地测试**
   ```bash
   # 构建项目
   npm run build
   
   # 本地预览
   npm run preview
   ```

## 性能优化

### 缓存策略

Worker自动设置缓存头部：
- **静态资源**：1年缓存（CSS、JS、字体等）
- **HTML文件**：不缓存
- **API响应**：根据后端设置

### 压缩优化

Cloudflare自动提供：
- Gzip/Brotli压缩
- 图片优化
- 代码压缩

### 边缘缓存

- 静态资源在全球边缘节点缓存
- 减少源站请求
- 提高访问速度

## 成本说明

### 免费套餐限制

Cloudflare Workers免费套餐：
- 每天100,000个请求
- 每个请求最多10ms CPU时间
- 对于大多数应用完全够用

### 付费套餐

如果需要更多资源：
- **Workers Paid** - $5/月
- 每月1000万个请求
- 每个请求最多50ms CPU时间

## 高级功能

### 多环境部署

可以配置多个分支对应不同环境：
- `main` 分支 → 生产环境
- `develop` 分支 → 测试环境

### 自定义Worker逻辑

编辑`src/worker.js`添加功能：
- 身份验证中间件
- 请求限制和防护
- 自定义API端点
- A/B测试逻辑

### Webhook集成

可以配置Webhook在部署完成时通知：
- Slack通知
- 邮件通知
- 自定义API调用

## 最佳实践

1. **代码质量**
   - 使用ESLint和Prettier
   - 编写单元测试
   - 代码审查

2. **安全考虑**
   - 不要在代码中硬编码敏感信息
   - 使用环境变量存储配置
   - 定期更新依赖

3. **性能优化**
   - 优化构建输出大小
   - 使用代码分割
   - 压缩图片资源

4. **监控告警**
   - 设置错误率告警
   - 监控响应时间
   - 定期检查日志

## 支持和帮助

如果遇到问题：
1. 查看Cloudflare Workers文档
2. 检查项目的GitHub Issues
3. 在Cloudflare社区寻求帮助
4. 联系技术支持

---

通过GitHub集成部署，你只需要专注于代码开发，部署过程完全自动化！🚀 