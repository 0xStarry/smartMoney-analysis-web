# 批量保存聪明钱地址功能说明

## 🎯 功能概述

根据后端提供的`batchUpsert`方法，已更新前端代码以支持批量保存聪明钱地址到数据库，实现了高效的数据存储和更新机制。

## 🔧 后端方法参考

### 后端batchUpsert控制器方法
```javascript
static async batchUpsert(req, res) {
  try {
    const { addresses } = req.body;
    
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json(ResponseFormatter.badRequest('地址数组不能为空'));
    }

    // 验证每个地址对象的格式
    const invalidAddresses = addresses.filter(item => {
      // 检查地址格式
      if (!item.address || item.address.length < 32 || item.address.length > 44 || 
          !/^[1-9A-HJ-NP-Za-km-z]+$/.test(item.address)) {
        return true;
      }
      // 检查收益是否为数字
      if (item.total_profit !== undefined && (isNaN(item.total_profit) || item.total_profit < 0)) {
        return true;
      }
      return false;
    });

    if (invalidAddresses.length > 0) {
      return res.status(400).json(ResponseFormatter.badRequest('存在格式不正确的地址或收益数据'));
    }

    const count = await SmartMoneyAddress.batchUpsert(addresses);
    
    res.json(ResponseFormatter.success({ count }, `成功处理 ${count} 个聪明钱地址记录`));
  } catch (error) {
    console.error('批量操作聪明钱地址错误:', error);
    res.status(500).json(ResponseFormatter.serverError(error.message));
  }
}
```

## 📋 前端实现

### 1. 新增API方法和验证逻辑
在`src/api/database.js`中新增：

```javascript
/**
 * 验证钱包地址格式
 * @param {string} address - 钱包地址
 * @returns {boolean} 是否有效
 */
const validateWalletAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return false
  }
  
  // 检查长度：32-44个字符
  if (address.length < 32 || address.length > 44) {
    return false
  }
  
  // 检查字符格式：Base58编码（排除0、O、I、l）
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
  return base58Regex.test(address)
}

/**
 * 验证总盈利数据
 * @param {any} totalProfit - 总盈利数据
 * @returns {boolean} 是否有效
 */
const validateTotalProfit = (totalProfit) => {
  if (totalProfit === undefined || totalProfit === null) {
    return true // 允许为空
  }
  
  const profit = parseFloat(totalProfit)
  return !isNaN(profit) && profit >= 0
}

/**
 * 批量保存聪明钱地址到数据库
 * @param {Array} addresses - 地址数据数组
 * @returns {Promise} API响应
 */
export const batchSaveSmartMoneyAddresses = async (addresses) => {
  try {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('地址数组不能为空')
    }

    // 格式化地址数据，确保符合后端期望的格式
    const formattedAddresses = addresses.map(addr => {
      const walletAddress = addr.walletAddress || addr.address
      const totalProfit = addr.total_profit !== undefined ? addr.total_profit : (addr.totalProfit || 0)
      
      return {
        address: walletAddress,
        total_profit: parseFloat(totalProfit) || 0,
        count: parseInt(addr.count) || 1,
        remark: addr.remark || null
      }
    })

    // 前端验证数据格式
    const invalidAddresses = formattedAddresses.filter(item => {
      // 验证地址格式
      if (!validateWalletAddress(item.address)) {
        console.warn('无效地址格式:', item.address)
        return true
      }
      
      // 验证总盈利数据
      if (!validateTotalProfit(item.total_profit)) {
        console.warn('无效盈利数据:', item.total_profit)
        return true
      }
      
      return false
    })

    if (invalidAddresses.length > 0) {
      throw new Error(`存在 ${invalidAddresses.length} 个格式不正确的地址或收益数据`)
    }

    const response = await databaseAPI.post('/smart-money-addresses/batch-upsert', {
      addresses: formattedAddresses
    })
    
    return response
  } catch (error) {
    throw new Error(`批量保存聪明钱地址失败: ${error.message}`)
  }
}
```

### 2. 更新保存逻辑
在`src/App.vue`中的`saveToDatabase`方法：

```javascript
// 格式化数据用于保存聪明钱地址
const addressesToSave = selectedItems.value.map((item) => ({
  address: item.holderWalletAddress,
  total_profit: parseFloat(item.totalProfit) || 0,
  count: 1, // 默认计数为1
  remark: null // 默认备注为空
}))

// 调用API批量保存聪明钱地址
await batchSaveSmartMoneyAddresses(addressesToSave)
```

## 📡 API接口规范

### 请求接口
**URL**: `POST /api/smart-money/batch`

**请求体格式**:
```json
{
  "addresses": [
    {
      "address": "4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump",
      "total_profit": 125000.50,
      "count": 1,
      "remark": null
    },
    {
      "address": "7xKXtg2CW9UwX8kmRNke6KwA4KQY5RrBkBvA9nrpump",
      "total_profit": 98750.25,
      "count": 1,
      "remark": "优质地址"
    }
  ]
}
```

### 响应格式

**成功响应**:
```json
{
  "code": 0,
  "data": {
    "count": 10
  },
  "detailMsg": "",
  "error_code": "0",
  "error_message": "",
  "msg": "成功处理 10 个聪明钱地址记录"
}
```

**错误响应**:
```json
{
  "code": 400,
  "data": null,
  "detailMsg": "存在格式不正确的地址或收益数据",
  "error_code": "400",
  "error_message": "存在格式不正确的地址或收益数据",
  "msg": "存在格式不正确的地址或收益数据"
}
```

## ✅ 数据验证机制

### 前端验证
1. **地址格式验证**
   - 长度检查：32-44个字符
   - 字符格式：Base58编码（排除0、O、I、l）
   - 正则表达式：`/^[1-9A-HJ-NP-Za-km-z]+$/`

2. **盈利数据验证**
   - 允许为空（undefined/null）
   - 必须为非负数
   - 自动转换为浮点数

3. **数组验证**
   - 必须为数组类型
   - 不能为空数组
   - 过滤无效记录

### 后端验证
1. **请求体验证**
   - 检查addresses字段存在
   - 验证为数组且非空

2. **地址格式验证**
   - 长度：32-44字符
   - 格式：Base58编码
   - 正则：`/^[1-9A-HJ-NP-Za-km-z]+$/`

3. **数据类型验证**
   - total_profit必须为数字且非负
   - 自动过滤无效记录

### 验证流程
```
前端数据 → 格式化 → 前端验证 → API请求 → 后端验证 → 数据库操作
```

## 🗄️ 数据库表结构

### 建议的表结构
```sql
CREATE TABLE smart_money_addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  address VARCHAR(255) UNIQUE NOT NULL,
  total_profit DECIMAL(20,8) DEFAULT 0,
  count INT DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_address (address),
  INDEX idx_total_profit (total_profit),
  INDEX idx_updated_at (updated_at)
);
```

### 字段说明
- `id`: 主键，自增
- `address`: 钱包地址，唯一索引
- `total_profit`: 总盈利金额，支持高精度小数
- `count`: 计数，记录该地址出现次数
- `remark`: 备注信息，可为空
- `created_at`: 创建时间
- `updated_at`: 更新时间，自动更新

## 🔄 UPSERT机制

### 插入或更新逻辑
```sql
INSERT INTO smart_money_addresses (address, total_profit, count, remark) 
VALUES ? 
ON DUPLICATE KEY UPDATE 
  total_profit = VALUES(total_profit),
  count = VALUES(count),
  remark = VALUES(remark),
  updated_at = CURRENT_TIMESTAMP
```

### 机制说明
- **新地址**: 直接插入新记录
- **已存在地址**: 更新`total_profit`、`count`、`remark`和`updated_at`
- **唯一约束**: 基于`address`字段的唯一索引
- **原子操作**: 整个批量操作在一个事务中完成

## 🎯 数据流程

### 1. 前端数据准备
```javascript
// 从查询结果中提取地址信息
const addressesToSave = selectedItems.value.map((item) => ({
  address: item.holderWalletAddress,        // 钱包地址
  total_profit: parseFloat(item.totalProfit) || 0,  // 总盈利
  count: 1,                                 // 计数
  remark: null                              // 备注
}))
```

### 2. API调用
```javascript
// 调用批量保存接口
const response = await batchSaveSmartMoneyAddresses(addressesToSave)
```

### 3. 后端处理
```javascript
// 后端执行UPSERT操作
const result = await SmartMoneyAddress.batchUpsert(addresses)
```

### 4. 响应处理
```javascript
// 前端处理响应
if (response.success) {
  showMessage(`成功保存 ${addressesToSave.length} 条聪明钱地址`, 'success')
}
```

## 🚀 优势特性

### 1. 高效批量操作
- 单次API调用处理多条记录
- 数据库层面的批量UPSERT
- 减少网络请求次数

### 2. 数据一致性
- 原子操作保证数据一致性
- 自动处理重复地址
- 统一的错误处理机制

### 3. 灵活的更新策略
- 新地址自动插入
- 已存在地址智能更新
- 保留历史创建时间

### 4. 完整的错误处理
- 前端数据验证
- 后端业务逻辑验证
- 详细的错误信息返回

## 🧪 测试场景

### 1. 正常场景
- 批量保存新地址
- 更新已存在地址
- 混合新增和更新

### 2. 边界条件
- 空数组处理
- 单条记录保存
- 大批量数据处理

### 3. 错误场景
- 无效地址格式
- 数据库连接失败
- 网络超时处理

## 📊 性能优化

### 1. 批量处理
- 单次处理多条记录
- 减少数据库连接开销
- 提升整体性能

### 2. 索引优化
- 地址字段唯一索引
- 盈利金额索引
- 更新时间索引

### 3. 数据格式化
- 前端预处理数据
- 减少后端计算负担
- 统一数据格式

## 🔧 配置说明

### API配置
```javascript
const databaseAPI = axios.create({
  baseURL: '/api',  // 通过Vite代理访问
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})
```

### 响应拦截器
```javascript
// 统一处理新的响应格式
if (data.code === 0) {
  return { success: true, data: data.data, message: data.msg }
} else {
  throw new Error(data.msg || data.error_message)
}
```

---

**批量保存聪明钱地址** - 高效存储，智能更新！ 💾 