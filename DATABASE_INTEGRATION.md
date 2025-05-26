# 数据库集成使用说明

本文档说明如何将SmartMoney分析平台的数据保存到您自己的数据库中。

## 🎯 功能特性

### 1. 智能数据选择
- ✅ 表格中每条数据都有选择框
- ✅ **智能默认选择**：查询后只自动选择页面显示的数据
- ✅ **实时同步**：切换显示条数时自动更新选中状态
- ✅ 可以单独选择/取消选择每条数据
- ✅ 移动端卡片也支持选择功能
- ✅ 实时显示已选择的数据条数

### 2. 显示条数优化
- ✅ 下拉选择框替代输入框
- ✅ 提供10的倍数选项：10, 20, 30, ..., 100
- ✅ 默认显示20条数据
- ✅ 切换条数时智能更新选中状态

### 3. 数据库保存功能
- ✅ "保存到数据库"按钮
- ✅ 只有选中数据时按钮才可用
- ✅ 支持批量保存选中的数据
- ✅ 完整的错误处理和用户反馈

### 4. 主题系统
- ✅ **完整明暗主题切换**：支持亮色/暗色模式
- ✅ **动画效果**：主题切换按钮旋转动画
- ✅ **实时反馈**：切换时显示提示消息
- ✅ **界面适配**：所有组件完美适配两种主题

## 🔧 API接口配置

### 1. 更新API地址

编辑 `src/api/database.js` 文件，将API地址替换为您的实际地址：

```javascript
const databaseAPI = axios.create({
  baseURL: 'http://your-api-server.com/api', // 替换为您的API地址
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})
```

### 2. 添加认证信息

如果您的API需要认证，请在请求拦截器中添加：

```javascript
databaseAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

## 📡 API接口规范

### 批量保存接口

**接口地址：** `POST /wallet-data/batch-save`

**请求格式：**
```json
{
  "data": [
    {
      "rank": 1,
      "walletAddress": "4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump",
      "totalProfit": 12345.67,
      "profitPercentage": 25.5,
      "boughtAvgPrice": 0.000123,
      "soldAvgPrice": 0.000154,
      "explorerUrl": "https://explorer.example.com/address/...",
      "contractAddress": "输入的合约地址",
      "createdAt": "2024-01-20T10:30:00.000Z"
    }
  ],
  "options": {
    "overwrite": true,
    "validateData": true
  },
  "metadata": {
    "timestamp": "2024-01-20T10:30:00.000Z",
    "source": "smartmoney-analysis",
    "version": "1.0.0",
    "totalCount": 10
  }
}
```

**响应格式：**
```json
{
  "success": true,
  "message": "数据保存成功",
  "data": {
    "savedCount": 10,
    "skippedCount": 0,
    "errors": []
  }
}
```

### 数据库健康检查接口

**接口地址：** `GET /health/database`

**响应格式：**
```json
{
  "success": true,
  "status": "connected",
  "message": "数据库连接正常"
}
```

## 🗄️ 数据库表结构建议

### wallet_data 表

```sql
CREATE TABLE wallet_data (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rank INT NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  total_profit DECIMAL(20, 8) NOT NULL,
  profit_percentage DECIMAL(10, 4) NOT NULL,
  bought_avg_price DECIMAL(20, 8) NOT NULL,
  sold_avg_price DECIMAL(20, 8) NOT NULL,
  explorer_url TEXT,
  contract_address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_wallet_address (wallet_address),
  INDEX idx_contract_address (contract_address),
  INDEX idx_total_profit (total_profit),
  INDEX idx_created_at (created_at),
  
  UNIQUE KEY unique_wallet_contract (wallet_address, contract_address)
);
```

## 🚀 使用流程

### 1. 查询数据
1. 输入合约地址
2. 选择显示条数（默认20条）
3. 点击"查询"按钮
4. **智能选择**：系统自动选择当前页面显示的数据

### 2. 数据选择管理
1. 查看查询结果和已选择的数据条数
2. 根据需要手动取消/选择特定数据
3. **智能同步**：切换显示条数时自动更新选中状态
4. 界面实时显示已选择的数据条数

### 3. 主题切换
1. 点击右上角的主题切换按钮（太阳/月亮图标）
2. 支持亮色/暗色模式一键切换
3. 切换时有旋转动画效果和提示消息
4. 所有界面元素自动适配新主题

### 4. 保存到数据库
1. 确认选择的数据（按钮显示选中数量）
2. 点击"保存到数据库"按钮
3. 系统显示保存进度和状态
4. 保存完成后显示成功消息和详细信息

## 🔧 自定义配置

### 修改数据格式

如果您需要不同的数据格式，可以修改 `App.vue` 中的 `saveToDatabase` 方法：

```javascript
const dataToSave = selectedItems.value.map((item, index) => ({
  // 根据您的需求调整字段映射
  id: item.holderWalletAddress,
  profit: item.totalProfit,
  percentage: item.totalProfitPercentage,
  // ... 其他字段
}))
```

### 添加额外字段

您可以在保存时添加额外的元数据：

```javascript
const dataToSave = selectedItems.value.map((item, index) => ({
  ...item,
  userId: getCurrentUserId(), // 当前用户ID
  source: 'web-app',
  tags: ['smartmoney', 'analysis'],
  // ... 其他自定义字段
}))
```

## ⚠️ 注意事项

1. **API地址配置**：请确保将 `src/api/database.js` 中的API地址替换为您的实际地址
2. **认证配置**：如果需要认证，请配置相应的token或API key
3. **错误处理**：建议在您的API中实现完善的错误处理和验证
4. **数据验证**：建议在后端对接收的数据进行验证
5. **重复数据**：建议在数据库中设置唯一约束避免重复数据

## 🐛 故障排除

### 常见问题

1. **保存失败**
   - 检查API地址是否正确
   - 检查网络连接
   - 查看浏览器控制台错误信息

2. **认证失败**
   - 检查token是否有效
   - 检查API权限配置

3. **数据格式错误**
   - 检查后端接口是否按照规范实现
   - 检查数据类型转换是否正确

### 调试方法

1. 打开浏览器开发者工具
2. 查看Network标签页的API请求
3. 查看Console标签页的错误信息
4. 检查保存的数据格式是否正确

---

*如有问题，请检查浏览器控制台的详细错误信息，或联系技术支持。* 