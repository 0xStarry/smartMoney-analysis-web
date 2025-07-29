# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**Solana钱包分析工具** - 基于Vue 3 + Vuetify构建的应用，用于分析Solana和BSC链上的聪明钱钱包。该工具通过OKX API查询盈利钱包排名，并提供数据库存储功能。

## 开发命令

```bash
# 开发环境
npm run dev          # 启动开发服务器 (http://localhost:5173)
npm run build        # 构建生产版本
npm run preview      # 预览生产构建

# 开发服务器API代理配置：
# - /api/* -> https://api.young13.club/api/
# - /priapi/* -> https://web3.okx.com/priapi/
```

## 架构设计

### 技术栈
- **前端**: Vue 3 + Composition API
- **UI框架**: Vuetify 3 + Material Design
- **构建工具**: Vite 6
- **HTTP客户端**: 带拦截器的Axios
- **部署平台**: Vercel

### 核心功能
- 聪明钱钱包排名分析
- 多链支持（Solana & BSC）
- 钱包地址数据库存储
- 响应式设计（移动/桌面适配）
- 暗黑/明亮主题切换
- 批量数据管理
- 开发者排行榜功能

## 项目结构

```
src/
├── api/                    # API层
│   ├── index.js           # OKX API客户端
│   ├── database.js        # 数据库API客户端
│   ├── tokens.js          # 代币管理API
│   └── ranking.js         # 排名数据API
├── components/            # Vue组件
│   ├── SearchForm.vue    # 合约地址搜索
│   ├── DataTable.vue     # 桌面数据表格
│   ├── MobileCards.vue   # 移动端卡片布局
│   ├── RankingDialog.vue # 排名弹窗
│   ├── DevRankingDialog.vue # 开发者排行榜弹窗
│   ├── WelcomeSection.vue # 欢迎页面
│   └── EmptyState.vue    # 空状态提示
├── composables/          # 组合式工具
│   └── useSmartMoneyApp.js # 主应用逻辑
└── utils/               # 辅助函数
```

## 核心架构

### 主应用逻辑 (useSmartMoneyApp.js)
中心化状态管理和业务逻辑：
- 钱包数据获取与过滤
- 数据库操作
- 选择管理
- 加载状态
- 数据映射和验证

### API架构
- **OKX API**: `/priapi/v1/dx/market/v2/pnl/top-trader/ranking-list`
- **数据库API**: 位于`/api/*`下的多个端点
- **链检测**: 自动识别BSC(chainId:56)与Solana(chainId:501)

### 数据流
1. 用户在SearchForm输入合约地址
2. 应用查询OKX API获取盈利钱包
3. 根据正收益和用户条件过滤钱包
4. 在表格/移动卡片中展示数据
5. 支持批量操作保存到数据库

## 关键API端点

### 外部API
- **OKX聪明钱排名**: GET `/priapi/v1/dx/market/v2/pnl/top-trader/ranking-list`
- **OKX开发者分析**: GET `/priapi/v1/dx/market/v2/dev/analysis-list`
- **OKX交易统计**: GET `/priapi/v1/dx/market/v2/trading-history/statistics`

### 内部API
- **聪明钱**: POST `/api/smart-money/batch` - 保存钱包地址
- **代币管理**: POST `/api/tokens` - 创建代币记录
- **排名数据**: GET `/api/smart-money` - 获取保存的排名
- **钱包统计**: GET `/api/ranking/stats` - 获取统计数据

## 配置

### Vite配置 (vite.config.js)
- 开发环境代理配置
- Vue/Vuetify/Axios的代码分割
- 构建优化配置

### Vercel配置 (vercel.json)
- 生产环境API路由
- 安全头设置
- SPA路由回退

## 数据格式

### 钱包记录结构
```javascript
{
  address: "4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump",
  total_profit: 125000.50,
  percent: 250.75,
  count: 1,
  remark: null
}
```

### 数据映射逻辑
应用需要将OKX API的不同字段名映射到统一的内部格式：
- `holderWalletAddress`/`walletAddress`/`address` → `holderWalletAddress`
- `buyValue`/`buy_value`/`buyAmount` → `buyValue`
- `totalProfit`/`total_profit`/`profit` → `totalProfit`

## 部署

应用配置支持Vercel部署：
- 从`main`分支自动构建
- 生产环境API重写规则
- 安全头设置(XSS, CSP等)
- SPA路由支持

## 开发说明

### 环境搭建
1. 安装依赖: `npm install`
2. 启动开发服务器: `npm run dev`
3. 访问 http://localhost:5173

### 常规任务
- **添加新API端点**: 在`src/api/`目录创建
- **样式定制**: 按需使用Vuetify组件和自定义CSS
- **状态管理**: 采用`useSmartMoneyApp.js`中的组合模式
- **响应式设计**: 组件使用`v-if`/`v-show`进行移动/桌面切换

### 重要特性
- **链检测**: 根据合约地址前缀自动识别链类型（0x开头为BSC，其他为Solana）
- **数据验证**: 前端对钱包地址格式和盈利数据进行验证
- **批量操作**: 支持批量选择和保存钱包地址
- **主题系统**: 支持暗黑/明亮主题切换，状态持久化

## 错误处理

应用具有完善的错误处理机制：
- API请求失败时的友好提示
- 数据验证失败的详细错误信息
- 网络错误的自动重试逻辑
- 数据库连接状态检查