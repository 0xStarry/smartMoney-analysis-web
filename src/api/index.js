import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: '', // 使用相对路径，让Vite代理处理
  timeout: 30000, // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    // 可以在这里添加token等
    return config
  },
  error => {
    // 对请求错误做些什么
    console.log(error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // OKX API返回格式处理
    if (res.code !== 0) {
      ElMessage({
        message: res.msg || res.detailMsg || '请求失败',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(new Error(res.msg || '请求失败'))
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error)
    ElMessage({
      message: error.message || '网络错误',
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

// API方法
export const contractAPI = {
  // 获取智能钱包排行榜数据
  getSmartMoneyRanking: (tokenContractAddress) => {
    // 根据合约地址前缀判断链类型
    const chainId = tokenContractAddress.startsWith('0x') ? '56' : '501' // BSC链ID: 56, Solana链ID: 501
    
    return service({
      url: '/priapi/v1/dx/market/v2/pnl/top-trader/ranking-list',
      method: 'get',
      params: {
        chainId: chainId,
        tokenContractAddress: tokenContractAddress
      }
    })
  }
}

export default service