# Vercel 部署指南

## 概述

本项目已配置为可以部署到Vercel，这样可以获得：
- 🚀 **自动部署** - 推送代码即可自动部署
- 🌍 **全球CDN** - Vercel全球边缘网络
- 🔄 **API代理** - 内置代理配置
- 🔒 **自动HTTPS** - 免费SSL证书
- ⚡ **高性能** - 边缘缓存和优化

## 部署方式

### GitHub 集成部署（推荐）

1. **连接GitHub仓库**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择你的GitHub仓库
   - 点击 "Import"

2. **配置项目**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **部署**
   - 点击 "Deploy"
   - 等待构建完成（通常1-2分钟）

### 自动部署

配置完成后，每次推送代码到GitHub都会自动触发部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
# Vercel会自动构建和部署
```

## 项目配置

### vercel.json 配置

项目已包含 `vercel.json` 配置文件，提供以下功能：

1. **API代理**
   ```json
   {
     "source": "/api/(.*)",
     "destination": "https://api.young13.club/$1"
   },
   {
     "source": "/priapi/(.*)",
     "destination": "https://web3.okx.com/$1"
   }
   ```

2. **SPA路由支持**
   ```json
   {
     "source": "/(.*)",
     "destination": "/index.html"
   }
   ```

3. **CORS头部**
   - 自动为API请求添加CORS头部
   - 支持跨域访问

4. **安全头部**
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block

### Vite配置

```javascript
// vite.config.js
export default defineConfig({
  base: '/',  // 绝对路径，适合Vercel
  build: {
    target: 'es2015',
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

# 3. Vercel自动部署（通常1-2分钟）
```

### 查看部署状态

在Vercel Dashboard中：
1. 进入你的项目
2. 查看 **Deployments** 标签页
3. 可以看到部署历史和状态
4. 点击部署可以查看详细日志

## 环境配置

### 环境变量

在Vercel Dashboard中设置环境变量：

1. 进入项目设置
2. 点击 **Environment Variables**
3. 添加变量：
   ```
   NODE_VERSION=18
   ENVIRONMENT=production
   ```

### 自定义域名

1. 在项目设置中点击 **Domains**
2. 添加你的自定义域名
3. 配置DNS记录
4. Vercel会自动配置SSL证书

## 监控和调试

### 实时日志

在Vercel Dashboard中：
1. 进入你的项目
2. 点击 **Functions** 标签页（如果有）
3. 查看实时日志

### 性能监控

- **Analytics** - 查看访问统计
- **Speed Insights** - 查看性能指标
- **Web Vitals** - 查看用户体验指标

## 故障排除

### 常见问题

1. **构建失败**
   - 检查package.json中的依赖版本
   - 确保Node.js版本兼容（推荐18+）
   - 查看构建日志中的错误信息

2. **API请求404**
   - 确认 `vercel.json` 中的代理配置正确
   - 检查目标API地址是否可访问
   - 查看Network标签页中的请求详情

3. **静态资源404**
   - 确认 `base: '/'` 在vite.config.js中设置
   - 检查构建输出的文件路径
   - 验证资源引用路径

4. **SPA路由问题**
   - 确认 `vercel.json` 中的重写规则正确
   - 检查路由配置是否正确

### 调试技巧

1. **本地测试**
   ```bash
   # 构建项目
   npm run build
   
   # 本地预览
   npm run preview
   ```

2. **查看构建日志**
   - 在Vercel Dashboard中查看详细的构建日志
   - 检查是否有警告或错误

3. **测试API代理**
   ```bash
   # 测试API是否可访问
   curl https://your-app.vercel.app/api/test
   ```

## 性能优化

### 构建优化

- 代码分割和懒加载
- 压缩图片和资源
- 使用CDN加速

### 缓存策略

Vercel自动提供：
- 静态资源缓存
- 边缘缓存
- 智能预取

### 边缘函数

如果需要更复杂的API处理，可以使用Vercel Edge Functions：

```javascript
// api/hello.js
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello from Vercel!' })
}
```

## 成本说明

### 免费套餐

Vercel免费套餐包括：
- 每月100GB带宽
- 无限静态部署
- 自动HTTPS
- 全球CDN

### 付费套餐

如果需要更多资源：
- **Pro** - $20/月/用户
- 更多带宽和构建时间
- 高级分析功能

## 高级功能

### 多环境部署

- `main` 分支 → 生产环境
- `develop` 分支 → 预览环境
- Pull Request → 预览部署

### A/B测试

使用Vercel的Edge Config进行A/B测试：

```javascript
import { get } from '@vercel/edge-config'

export default async function handler(req) {
  const showFeature = await get('show_new_feature')
  // 根据配置返回不同内容
}
```

### 分析和监控

- **Real User Monitoring** - 真实用户体验监控
- **Core Web Vitals** - 网站性能指标
- **Custom Analytics** - 自定义分析

## 最佳实践

1. **代码质量**
   - 使用TypeScript提高代码质量
   - 配置ESLint和Prettier
   - 编写单元测试

2. **性能优化**
   - 优化图片大小和格式
   - 使用懒加载
   - 减少包体积

3. **SEO优化**
   - 配置正确的meta标签
   - 使用语义化HTML
   - 优化页面加载速度

4. **安全考虑**
   - 不要在前端暴露敏感信息
   - 使用环境变量存储配置
   - 定期更新依赖

## 支持和帮助

如果遇到问题：
1. 查看 [Vercel文档](https://vercel.com/docs)
2. 检查项目的GitHub Issues
3. 在Vercel社区寻求帮助
4. 联系Vercel支持

---

通过Vercel部署，你可以享受到现代化的部署体验和全球高性能访问！🚀 