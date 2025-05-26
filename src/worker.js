/**
 * Cloudflare Workers 脚本
 * 用于服务静态资源和处理API代理
 */

// 调试模式
const DEBUG = false

// 静态资源MIME类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
}

// 获取文件扩展名
function getFileExtension(path) {
  const lastDot = path.lastIndexOf('.')
  return lastDot !== -1 ? path.substring(lastDot) : ''
}

// 获取MIME类型
function getMimeType(path) {
  const ext = getFileExtension(path)
  return MIME_TYPES[ext] || 'application/octet-stream'
}

// 主事件监听器
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const url = new URL(request.url)
    
    // 处理API代理
    if (url.pathname.startsWith('/api/')) {
      return handleApiProxy(request)
    }
    
    if (url.pathname.startsWith('/priapi/')) {
      return handlePriApiProxy(request)
    }
    
    // 处理静态资源
    return handleStaticAsset(request)
    
  } catch (error) {
    console.error('Worker error:', error)
    
    if (DEBUG) {
      return new Response(`Error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    return new Response('Internal Server Error', { status: 500 })
  }
}

async function handleStaticAsset(request) {
  const url = new URL(request.url)
  let pathname = url.pathname
  
  // 处理根路径
  if (pathname === '/') {
    pathname = '/index.html'
  }
  
  // 处理SPA路由 - 如果不是静态资源文件，返回index.html
  if (!pathname.includes('.') && pathname !== '/index.html') {
    pathname = '/index.html'
  }
  
  try {
    // 尝试获取静态资源
    const assetResponse = await fetch(`${url.origin}${pathname}`)
    
    if (assetResponse.ok) {
      const response = new Response(assetResponse.body, assetResponse)
      
      // 设置MIME类型
      const mimeType = getMimeType(pathname)
      response.headers.set('Content-Type', mimeType)
      
      // 设置缓存头部
      if (pathname.includes('/assets/') || pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      } else if (pathname.endsWith('.html')) {
        response.headers.set('Cache-Control', 'no-cache')
      }
      
      // 设置安全头部
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      
      return response
    }
    
    // 如果资源不存在，返回404页面
    return handle404()
    
  } catch (error) {
    console.error('Asset fetch error:', error)
    return handle404()
  }
}

async function handle404() {
  try {
    // 尝试返回自定义404页面
    const notFoundResponse = await fetch(`${new URL(request.url).origin}/404.html`)
    
    if (notFoundResponse.ok) {
      return new Response(notFoundResponse.body, {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      })
    }
  } catch (error) {
    console.error('404 page fetch error:', error)
  }
  
  // 返回简单的404响应
  return new Response('404 Not Found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  })
}

/**
 * 处理API代理请求
 */
async function handleApiProxy(request) {
  const url = new URL(request.url)
  const targetUrl = url.pathname.replace('/api', 'https://api.young13.club') + url.search
  
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  })
  
  try {
    const response = await fetch(modifiedRequest)
    
    // 创建新的响应并添加CORS头部
    const modifiedResponse = new Response(response.body, response)
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*')
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return modifiedResponse
    
  } catch (error) {
    console.error('API proxy error:', error)
    return new Response('API request failed', { 
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      }
    })
  }
}

/**
 * 处理PriAPI代理请求
 */
async function handlePriApiProxy(request) {
  const url = new URL(request.url)
  const targetUrl = url.pathname.replace('/priapi', 'https://web3.okx.com') + url.search
  
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  })
  
  try {
    const response = await fetch(modifiedRequest)
    
    // 创建新的响应并添加CORS头部
    const modifiedResponse = new Response(response.body, response)
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*')
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return modifiedResponse
    
  } catch (error) {
    console.error('PriAPI proxy error:', error)
    return new Response('PriAPI request failed', { 
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      }
    })
  }
} 