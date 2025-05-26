# Cloudflare Pages 部署指南

## 问题解决

### 模块解析错误修复

如果在Cloudflare Pages上遇到 `Failed to resolve module specifier "vue"` 错误，已通过以下方式修复：

1. **Vite配置优化** - 更新了 `vite.config.js`
2. **构建目标调整** - 使用 `es2015` 目标以提高兼容性
3. **模块分块** - 手动分离Vue、Vuetify和Axios模块
4. **Vue编译选项** - 明确定义Vue编译标志

## 部署步骤

### 方法一：使用Cloudflare Pages Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Pages 部分
3. 连接你的 GitHub 仓库
4. 配置构建设置：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist`
   - **Node.js版本**: `18` 或更高

### 方法二：使用Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 构建项目
npm run build

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=smartmoney-analysis
```

### 方法三：使用构建脚本

```bash
# 使用专用构建脚本
./build-cf.sh

# 然后手动上传 dist 目录到 Cloudflare Pages
```

## 环境变量配置

在Cloudflare Pages中设置以下环境变量：

```
NODE_VERSION=18
NPM_VERSION=8
```

## 自定义域名配置

1. 在Cloudflare Pages项目设置中添加自定义域名
2. 确保DNS记录指向Cloudflare
3. 启用HTTPS（自动）

## 性能优化

构建配置已包含以下优化：

- **代码分割**: 自动分离第三方库
- **资源压缩**: 使用esbuild压缩
- **缓存策略**: 通过_headers文件配置
- **SPA路由**: 通过_redirects文件支持

## 故障排除

### 白屏问题
- 检查浏览器控制台错误
- 确认所有资源路径正确
- 验证构建输出完整

### 模块解析错误
- 确保使用正确的Vite配置
- 检查package.json中的依赖版本
- 验证构建目标兼容性

### API代理问题
- Cloudflare Pages不支持开发时的代理配置
- 需要配置Cloudflare Workers或直接调用API
- 考虑使用环境变量区分开发和生产环境

## 监控和日志

- 使用Cloudflare Analytics监控访问情况
- 通过Cloudflare Logs查看错误日志
- 设置Real User Monitoring (RUM)

## 更新部署

每次推送到主分支会自动触发重新部署（如果配置了自动部署）。

手动重新部署：
```bash
npm run build
wrangler pages deploy dist
``` 