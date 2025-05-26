# API响应格式更新说明

## 🔄 更新概述

根据后端API的新响应格式，已更新前端代码以适配新的数据结构。

## 📋 新的响应格式

### ✅ 成功响应格式
```json
{
  "code": 0,
  "data": {},
  "detailMsg": "",
  "error_code": "0",
  "error_message": "",
  "msg": "操作成功"
}
```

### 📄 分页响应格式
```json
{
  "code": 0,
  "data": {
    "list": [],
    "pageNum": 1,
    "pageSize": 10,
    "total": 100,
    "totalPage": 10
  },
  "detailMsg": "",
  "error_code": "0",
  "error_message": "",
  "msg": "查询成功"
}
```

### ❌ 错误响应格式
```json
{
  "code": 400,
  "data": null,
  "detailMsg": "参数错误",
  "error_code": "400",
  "error_message": "参数错误",
  "msg": "参数错误"
}
```

## 🔧 前端适配更新

### 1. 响应拦截器更新
```javascript
tokenAPI.interceptors.response.use(
  (response) => {
    const data = response.data
    // 检查响应是否成功
    if (data.code === 0) {
      return {
        success: true,
        data: data.data,
        message: data.msg,
        code: data.code
      }
    } else {
      // 业务错误
      const error = new Error(data.msg || data.error_message || '请求失败')
      error.code = data.code
      error.response = response
      return Promise.reject(error)
    }
  },
  (error) => {
    // 网络错误处理
    if (error.response && error.response.data) {
      const errorData = error.response.data
      error.message = errorData.msg || errorData.error_message || error.message
    }
    return Promise.reject(error)
  }
)
```

### 2. 错误处理逻辑
- **成功判断**：`code === 0`
- **错误处理**：`code !== 0` 时抛出异常
- **消息提取**：优先使用 `msg`，其次 `error_message`

### 3. 分页参数更新
- **旧参数**：`page`, `limit`
- **新参数**：`pageNum`, `pageSize`

## 📡 具体接口更新

### 代币检查接口
**URL**: `GET /api/tokens/address/{address}`

**成功响应（代币存在）**：
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "contract_address": "4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump",
    "created_at": "2024-01-20T10:30:00Z"
  },
  "detailMsg": "",
  "error_code": "0",
  "error_message": "",
  "msg": "查询成功"
}
```

**错误响应（代币不存在）**：
```json
{
  "code": 400,
  "data": null,
  "detailMsg": "代币地址不存在",
  "error_code": "400",
  "error_message": "代币地址不存在",
  "msg": "代币地址不存在"
}
```

### 代币创建接口
**URL**: `POST /api/tokens`

**请求体**：
```json
{
  "contract_address": "4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump"
}
```

**成功响应**：
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "contract_address": "4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump",
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z"
  },
  "detailMsg": "",
  "error_code": "0",
  "error_message": "",
  "msg": "操作成功"
}
```

### 代币列表接口
**URL**: `GET /api/tokens`

**请求参数**：
```json
{
  "pageNum": 1,
  "pageSize": 20
}
```

**分页响应**：
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "contract_address": "4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump",
        "created_at": "2024-01-20T10:30:00Z"
      }
    ],
    "pageNum": 1,
    "pageSize": 20,
    "total": 100,
    "totalPage": 5
  },
  "detailMsg": "",
  "error_code": "0",
  "error_message": "",
  "msg": "查询成功"
}
```

## 🎯 前端逻辑适配

### 代币存在检查
```javascript
export const checkTokenExists = async (contractAddress) => {
  try {
    const response = await tokenAPI.get(`/tokens/address/${contractAddress}`)
    return { 
      success: true,
      data: { exists: true, ...response.data },
      message: response.message
    }
  } catch (error) {
    // code !== 0 或 404 错误表示代币不存在
    if (error.response && (error.response.status === 404 || 
        (error.response.data && error.response.data.code !== 0))) {
      return { 
        success: false,
        data: { exists: false },
        message: error.message || "代币地址不存在"
      }
    }
    throw new Error(`检查代币是否存在失败: ${error.message}`)
  }
}
```

## 🚀 优势特性

### 1. 统一的响应格式
- 所有接口使用相同的响应结构
- 便于前端统一处理
- 减少代码重复

### 2. 详细的错误信息
- `msg`: 用户友好的错误消息
- `error_message`: 详细的错误描述
- `detailMsg`: 额外的错误详情
- `error_code`: 错误代码

### 3. 完善的分页支持
- `pageNum`: 当前页码
- `pageSize`: 每页条数
- `total`: 总记录数
- `totalPage`: 总页数

## 🔧 配置说明

### Vite代理配置
已在 `vite.config.js` 中配置代理：
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false
    }
  }
}
```

### API基础配置
```javascript
const tokenAPI = axios.create({
  baseURL: '/api',  // 使用相对路径，通过代理访问
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})
```

## 🧪 测试建议

### 1. 成功场景测试
- 代币存在时的查询
- 代币创建成功
- 分页数据获取

### 2. 错误场景测试
- 代币不存在时的查询
- 无效参数的处理
- 网络错误的处理

### 3. 边界条件测试
- 空数据的处理
- 大数据量的分页
- 超时情况的处理

---

**API响应格式更新** - 统一规范，提升体验！ 🔄 