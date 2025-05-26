# Vercel API 代理修复方案

## 🔧 问题描述

在Vercel部署时，使用`vercel.json`的`rewrites`配置代理API请求可能会遇到问题，特别是对于复杂的API路径。

## ✅ 解决方案

使用Vercel的API Functions来处理代理请求，这样可以获得更好的控制和调试能力。

### 1. API函数代理

创建了 `api/priapi.js` 文件来处理所有的priapi请求：

```javascript
// api/priapi.js
export default async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  try {
    // 获取原始URL路径
    const { url } = req
    const targetPath = url.replace('/api/priapi', '/priapi')
    const targetUrl = `https://web3.okx.com${targetPath}`
    
    // 发起代理请求
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    })
    
    const data = await response.text()
    res.status(response.status).send(data)
    
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message 
    })
  }
}
```

### 2. 前端API调用更新

修改前端API调用，使用新的代理端点：

```javascript
// src/api/index.js
export const contractAPI = {
  getSmartMoneyRanking: (tokenContractAddress) => {
    return service({
      url: '/api/priapi/v1/dx/market/v2/pnl/top-trader/ranking-list', // 新路径
      method: 'get',
      params: {
        chainId: '501',
        tokenContractAddress: tokenContractAddress
      }
    })
  }
}
```

### 3. 简化的vercel.json配置

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## 🚀 部署步骤

1. **推送代码到GitHub**：
   ```bash
   git add .
   git commit -m "修复Vercel API代理"
   git push origin main
   ```

2. **Vercel自动部署**：
   - Vercel会自动检测到API函数
   - 部署完成后，API代理应该正常工作

## 🔍 测试API

部署完成后，可以通过以下方式测试：

1. **测试基础API**：
   ```
   https://your-app.vercel.app/api/test
   ```

2. **测试代理API**：
   ```
   https://your-app.vercel.app/api/priapi/v1/dx/market/v2/pnl/top-trader/ranking-list?chainId=501&tokenContractAddress=YOUR_TOKEN_ADDRESS
   ```

## 🐛 调试技巧

1. **查看函数日志**：
   - 在Vercel Dashboard中进入项目
   - 点击 **Functions** 标签页
   - 查看实时日志

2. **本地测试**：
   ```bash
   # 安装Vercel CLI
   npm i -g vercel
   
   # 本地运行
   vercel dev
   ```

3. **检查网络请求**：
   - 打开浏览器开发者工具
   - 查看Network标签页
   - 检查API请求的状态和响应

## 💡 优势

使用API Functions代理的优势：

- ✅ **更好的控制**：可以自定义请求头、处理错误等
- ✅ **调试友好**：可以添加日志，查看详细的错误信息
- ✅ **CORS处理**：完全控制CORS头部设置
- ✅ **错误处理**：可以提供更友好的错误信息
- ✅ **性能监控**：Vercel提供详细的函数性能指标

## 🔄 回滚方案

如果遇到问题，可以快速回滚到之前的配置：

1. 删除 `api/` 目录
2. 恢复 `vercel.json` 中的 `rewrites` 配置
3. 修改前端API调用路径

---

这个解决方案应该能彻底解决Vercel部署时的API代理问题！🎉 