# SmartMoney 分析平台

一个基于 Vue 3 + Vuetify 3 的现代化智能钱包数据分析平台，提供美观的界面和完整的移动端适配。

## ✨ 最新改进 (v2.1.0)

### 🎯 核心功能优化
- ✅ **智能选择逻辑**：默认全选仅限于页面显示的数据，不包括隐藏数据
- ✅ **简化功能**：移除Excel导出功能，专注于数据库保存
- ✅ **完善主题切换**：实现完整的明暗色主题切换，支持动画效果

### 🌙 主题系统
- **亮色模式**：清新的白色背景配合渐变色设计
- **暗色模式**：深色背景，护眼舒适
- **智能切换**：一键切换，实时反馈
- **动画效果**：主题切换按钮旋转动画

### 📱 数据选择功能
- **智能默认选择**：查询后自动选择当前页面显示的数据
- **实时同步**：切换显示条数时自动更新选中状态
- **状态显示**：实时显示已选择的数据条数
- **移动端支持**：卡片式布局也支持选择功能

## 🚀 功能特性

### 📊 数据分析
- 智能钱包排行榜显示
- 实时盈利数据分析
- 多维度数据展示
- 响应式数据表格

### 🎨 界面设计
- Material Design 设计语言
- 毛玻璃效果和渐变背景
- 完整的明暗主题支持
- 流畅的动画效果

### 📱 移动端适配
- 响应式布局设计
- 移动端卡片式展示
- 触摸友好的交互
- 完整功能支持

### 💾 数据管理
- 数据库批量保存功能
- 智能数据选择
- 错误处理和用户反馈
- 数据格式化和验证

## 🛠️ 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI 组件库**: Vuetify 3
- **构建工具**: Vite
- **图标库**: Material Design Icons
- **样式**: CSS3 + Vuetify主题系统

## 📦 安装和运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 🔧 配置说明

### API 配置
编辑 `src/api/index.js` 配置API地址：
```javascript
const API_BASE_URL = 'your-api-endpoint'
```

### 数据库配置
编辑 `src/api/database.js` 配置数据库API：
```javascript
const databaseAPI = axios.create({
  baseURL: 'http://your-database-api.com/api',
  // ... 其他配置
})
```

## 🎯 使用指南

### 1. 查询数据
1. 输入合约地址
2. 选择显示条数（10-100条）
3. 点击查询按钮
4. 系统自动选择当前页面显示的数据

### 2. 数据选择
- 查询后自动选择显示的数据
- 可以手动取消/选择特定数据
- 切换显示条数会自动更新选中状态
- 实时显示已选择的数据条数

### 3. 主题切换
- 点击右上角的主题切换按钮
- 支持亮色/暗色模式切换
- 切换时有动画效果和提示

### 4. 保存数据
1. 确认选择的数据
2. 点击"保存到数据库"按钮
3. 等待保存完成提示

## 📱 响应式设计

### 桌面端 (>768px)
- 完整的数据表格显示
- 丰富的交互功能
- 悬停效果和动画

### 移动端 (≤768px)
- 卡片式数据展示
- 触摸友好的操作
- 简化的界面布局

## 🎨 主题定制

### 亮色主题
```javascript
light: {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#ffffff',
    surface: '#ffffff',
    // ...
  }
}
```

### 暗色主题
```javascript
dark: {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#121212',
    surface: '#1e1e1e',
    // ...
  }
}
```

## 📄 项目结构

```
src/
├── api/                 # API接口
│   ├── index.js        # 主要API
│   └── database.js     # 数据库API
├── utils/              # 工具函数
│   └── index.js        # 通用工具
├── App.vue             # 主应用组件
├── main.js             # 应用入口
└── style.css           # 全局样式
```

## 🔄 更新日志

### v2.1.0 (最新)
- ✅ 优化默认选择逻辑，只选择页面显示的数据
- ✅ 移除Excel导出功能，简化界面
- ✅ 完善明暗主题切换功能
- ✅ 修复linter错误，提升代码质量
- ✅ 优化用户体验和交互反馈

### v2.0.0
- ✅ 从Element Plus迁移到Vuetify 3
- ✅ 实现Material Design设计语言
- ✅ 添加数据库保存功能
- ✅ 完整的移动端适配

### v1.0.0
- ✅ 基础功能实现
- ✅ Element Plus UI框架
- ✅ 响应式设计

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

---

**SmartMoney 分析平台** - 让数据分析更简单、更美观、更高效！ 🚀

## 功能特性

- 🔍 **代币地址查询** - 输入合约地址查询持有者信息
- 📊 **盈利分析** - 显示钱包总盈利、盈利率等数据
- 🏆 **排行榜** - 聪明钱地址排行榜，支持备注编辑
- 💾 **数据保存** - 批量保存聪明钱地址到数据库
- 📱 **响应式设计** - 支持桌面端和移动端
- 🌙 **主题切换** - 支持明暗主题切换

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **UI组件库**: Vuetify 3 + Material Design
- **构建工具**: Vite
- **HTTP客户端**: Axios
- **部署平台**: Cloudflare Workers

## 本地开发

### 环境要求

- Node.js 18+
- npm 8+

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5174

### 构建项目

```bash
npm run build
```

## 部署

### Cloudflare Workers 部署

本项目已配置为通过GitHub集成自动部署到Cloudflare Workers，获得全球边缘计算能力。

#### 自动部署

```bash
# 推送代码即可自动部署
git add .
git commit -m "更新功能"
git push origin main

# Cloudflare会自动构建和部署
```

#### 详细部署指南

查看 [WORKERS_DEPLOYMENT.md](./WORKERS_DEPLOYMENT.md) 获取完整的部署指南。

### Cloudflare Pages 部署（备选）

如果你更喜欢使用Pages，查看 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## API配置

项目支持以下API代理：

- `/api/*` → 后端API服务器
- `/priapi/*` → OKX Web3 API

在开发环境中，这些请求会通过Vite代理转发。
在生产环境中，Cloudflare Workers会处理这些代理。

## 项目结构

```
src/
├── api/           # API接口封装
├── components/    # Vue组件
├── utils/         # 工具函数
├── worker.js      # Cloudflare Workers脚本
├── App.vue        # 主应用组件
└── main.js        # 应用入口

public/
├── _headers       # HTTP头部配置
├── _redirects     # SPA路由重定向
└── 404.html       # 错误页面

dist/              # 构建输出目录
```

## 开发指南

### 添加新功能

1. 在 `src/api/` 中添加API接口
2. 在 `src/App.vue` 中添加UI组件
3. 更新相关的类型定义和文档

### 样式定制

项目使用Vuetify主题系统，可以在 `src/main.js` 中自定义主题颜色。

### API代理配置

- 开发环境：修改 `vite.config.js` 中的proxy配置
- 生产环境：修改 `src/worker.js` 中的代理逻辑

## 监控和日志

### 查看实时日志

在Cloudflare Dashboard中：
1. 进入 **Workers & Pages**
2. 选择你的项目
3. 点击 **Logs** 标签页

### 查看部署状态

在Cloudflare Dashboard中：
1. 进入 **Workers & Pages**
2. 选择你的项目
3. 查看 **Deployments** 标签页

## 故障排除

### 常见问题

1. **模块解析错误**
   - 确保使用相对路径 (`base: './'`)
   - 检查构建输出是否正确

2. **API请求失败**
   - 检查代理配置
   - 查看Cloudflare Dashboard中的日志

3. **静态资源404**
   - 确认构建输出完整
   - 检查资源路径

### 获取帮助

- 查看 [Issues](../../issues)
- 阅读 [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- 查看Cloudflare Dashboard中的部署日志

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
