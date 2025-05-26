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
    
    console.log('Proxying request to:', targetUrl)
    
    // 构建请求选项
    const requestOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...req.headers
      }
    }
    
    // 如果有请求体，添加到选项中
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      requestOptions.body = JSON.stringify(req.body)
    }
    
    // 发起请求
    const response = await fetch(targetUrl, requestOptions)
    const data = await response.text()
    
    // 设置响应头部
    response.headers.forEach((value, key) => {
      if (key !== 'content-encoding' && key !== 'content-length') {
        res.setHeader(key, value)
      }
    })
    
    // 返回响应
    res.status(response.status)
    res.send(data)
    
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message 
    })
  }
} 