import axios from 'axios'

// 数据库API基础配置
const databaseAPI = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// 请求拦截器
databaseAPI.interceptors.request.use(
  (config) => {
    // TODO: 添加认证token等
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
databaseAPI.interceptors.response.use(
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
    console.error('数据库API请求失败:', error)
    // 网络错误处理
    if (error.response && error.response.data) {
      const errorData = error.response.data
      error.message = errorData.msg || errorData.error_message || error.message
    }
    return Promise.reject(error)
  }
)

/**
 * 保存智能钱包数据到数据库
 * @param {Array} walletData - 钱包数据数组
 * @returns {Promise} API响应
 */
export const saveWalletData = async (walletData) => {
  try {
    const response = await databaseAPI.post('/wallet-data/save', {
      data: walletData,
      timestamp: new Date().toISOString(),
      source: 'smartmoney-analysis'
    })
    return response
  } catch (error) {
    throw new Error(`保存数据失败: ${error.message}`)
  }
}

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

    console.log('发送到后端的数据:', { addresses: formattedAddresses })

    const response = await databaseAPI.post('/smart-money/batch', {
      addresses: formattedAddresses
    })
    
    return response
  } catch (error) {
    throw new Error(`批量保存聪明钱地址失败: ${error.message}`)
  }
}

/**
 * 批量保存智能钱包数据（保留原有方法以兼容）
 * @param {Array} walletDataList - 钱包数据数组
 * @param {Object} options - 保存选项
 * @returns {Promise} API响应
 */
export const batchSaveWalletData = async (walletDataList, options = {}) => {
  try {
    // 转换为聪明钱地址格式并调用新方法
    const addresses = walletDataList.map(wallet => ({
      address: wallet.walletAddress || wallet.holderWalletAddress,
      total_profit: parseFloat(wallet.totalProfit) || 0,
      count: 1,
      remark: wallet.remark || null
    }))

    return await batchSaveSmartMoneyAddresses(addresses)
  } catch (error) {
    throw new Error(`批量保存数据失败: ${error.message}`)
  }
}

/**
 * 检查数据库连接状态
 * @returns {Promise} 连接状态
 */
export const checkDatabaseConnection = async () => {
  try {
    const response = await databaseAPI.get('/health/database')
    return response
  } catch (error) {
    throw new Error(`数据库连接检查失败: ${error.message}`)
  }
}

/**
 * 获取已保存的钱包数据
 * @param {Object} filters - 过滤条件
 * @returns {Promise} 钱包数据列表
 */
export const getSavedWalletData = async (filters = {}) => {
  try {
    const response = await databaseAPI.get('/wallet-data/list', {
      params: filters
    })
    return response
  } catch (error) {
    throw new Error(`获取数据失败: ${error.message}`)
  }
}

/**
 * 删除钱包数据
 * @param {Array} walletAddresses - 要删除的钱包地址数组
 * @returns {Promise} API响应
 */
export const deleteWalletData = async (walletAddresses) => {
  try {
    const response = await databaseAPI.delete('/wallet-data/delete', {
      data: { addresses: walletAddresses }
    })
    return response
  } catch (error) {
    throw new Error(`删除数据失败: ${error.message}`)
  }
}

// 导出默认API实例
export default databaseAPI

/* 
API接口数据格式说明：

1. 批量保存聪明钱地址接口 (POST /smart-money/batch)
请求参数：
{
  "addresses": [
    {
      "address": "4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump",
      "total_profit": 125000.50,
      "count": 1,
      "remark": null
    }
  ]
}

成功响应格式：
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

错误响应格式：
{
  "code": 400,
  "data": null,
  "detailMsg": "存在格式不正确的地址或收益数据",
  "error_code": "400",
  "error_message": "存在格式不正确的地址或收益数据",
  "msg": "存在格式不正确的地址或收益数据"
}

数据库表结构建议：
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
*/ 