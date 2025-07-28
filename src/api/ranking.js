import axios from 'axios'

// 排行榜API基础配置
const rankingAPI = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// 请求拦截器
rankingAPI.interceptors.request.use(
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
rankingAPI.interceptors.response.use(
  (response) => {
    const data = response.data
    // 检查响应是否成功
    if (data.code === 0) {
      return {
        success: true,
        data: data.data,
        message: data.msg,
        ...data
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
    console.error('排行榜API请求失败:', error)
    // 网络错误或HTTP错误
    if (error.response && error.response.data) {
      const errorData = error.response.data
      error.message = errorData.msg || errorData.error_message || error.message
    }
    return Promise.reject(error)
  }
)

/**
 * 获取收益排行榜（支持分页和排序）
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.pageSize - 每页条数，默认20
 * @param {string} params.sortBy - 排序字段
 * @param {string} params.sortOrder - 排序方向：DESC/ASC
 * @param {string} params.chainType - 链类型：all/solana/bsc
 * @param {number} params.minCount - 最小暴击次数
 * @returns {Promise} API响应
 */
export const getProfitRanking = async (params = {}) => {
  try {
    const response = await rankingAPI.get('/smart-money/ranking/profit', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        sortBy: params.sortBy || 'total_profit',
        sortOrder: params.sortOrder || 'DESC',
        chainType: params.chainType || 'all',
        minCount: params.minCount || 1,
        ...params
      }
    })
    return response
  } catch (error) {
    throw new Error(`获取收益排行榜失败: ${error.message}`)
  }
}

/**
 * 获取暴击次数排行榜（支持分页和排序）
 * @param {Object} params - 查询参数
 * @returns {Promise} API响应
 */
export const getCountRanking = async (params = {}) => {
  try {
    const response = await rankingAPI.get('/smart-money/ranking/count', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        sortBy: params.sortBy || 'count',
        sortOrder: params.sortOrder || 'DESC',
        chainType: params.chainType || 'all',
        minCount: params.minCount || 1,
        ...params
      }
    })
    return response
  } catch (error) {
    throw new Error(`获取暴击次数排行榜失败: ${error.message}`)
  }
}

/**
 * 获取收益百分比排行榜（支持分页和排序）
 * @param {Object} params - 查询参数
 * @returns {Promise} API响应
 */
export const getPercentRanking = async (params = {}) => {
  try {
    const response = await rankingAPI.get('/smart-money/ranking/percent', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        sortBy: params.sortBy || 'percent',
        sortOrder: params.sortOrder || 'DESC',
        chainType: params.chainType || 'all',
        minCount: params.minCount || 1,
        ...params
      }
    })
    return response
  } catch (error) {
    throw new Error(`获取收益百分比排行榜失败: ${error.message}`)
  }
}

/**
 * 通用排行榜获取方法
 * @param {string} type - 排行榜类型：profit/count/percent
 * @param {Object} params - 查询参数
 * @returns {Promise} API响应
 */
export const getRankingByType = async (type, params = {}) => {
  const apiMap = {
    profit: getProfitRanking,
    count: getCountRanking,
    percent: getPercentRanking
  }
  
  const apiFunction = apiMap[type]
  if (!apiFunction) {
    throw new Error(`不支持的排行榜类型: ${type}`)
  }
  
  return await apiFunction(params)
}

// 兼容旧接口（保持向后兼容）
export const getRanking = getProfitRanking

/**
 * 更新聪明钱地址记录
 * @param {number} id - 记录ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise} API响应
 */
export const updateSmartMoneyAddress = async (id, data) => {
  try {
    // 如果只是更新备注，使用新的PATCH接口
    if (data.remark !== undefined && Object.keys(data).length === 1) {
      const response = await rankingAPI.patch(`/smart-money/${id}/remark`, {
        remark: data.remark
      })
      return response
    } else {
      // 其他更新使用原来的PUT接口
      const response = await rankingAPI.put(`/smart-money/${id}`, data)
      return response
    }
  } catch (error) {
    throw new Error(`更新聪明钱地址失败: ${error.message}`)
  }
}

/**
 * 更新钱包备注（兼容方法）
 * @param {string} walletAddress - 钱包地址
 * @param {string} remark - 备注内容
 * @param {number} id - 记录ID
 * @returns {Promise} API响应
 */
export const updateWalletRemark = async (walletAddress, remark, id = null) => {
  try {
    if (id) {
      // 使用新的更新接口
      return await updateSmartMoneyAddress(id, { remark })
    } else {
      // 兼容旧的接口（如果需要）
      const response = await rankingAPI.put(`/smart-money/${walletAddress}/remark`, {
        remark: remark
      })
      return response
    }
  } catch (error) {
    throw new Error(`更新钱包备注失败: ${error.message}`)
  }
}

/**
 * 删除聪明钱地址记录
 * @param {number} id - 记录ID
 * @returns {Promise} API响应
 */
export const deleteSmartMoneyAddress = async (id) => {
  try {
    const response = await rankingAPI.delete(`/smart-money/${id}`)
    return response
  } catch (error) {
    throw new Error(`删除聪明钱地址失败: ${error.message}`)
  }
}

/**
 * 获取钱包详细信息
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise} API响应
 */
export const getWalletDetails = async (walletAddress) => {
  try {
    const response = await rankingAPI.get(`/wallet/${walletAddress}`)
    return response
  } catch (error) {
    throw new Error(`获取钱包详情失败: ${error.message}`)
  }
}

/**
 * 获取排行榜统计信息
 * @returns {Promise} API响应
 */
export const getRankingStats = async () => {
  try {
    const response = await rankingAPI.get('/ranking/stats')
    return response
  } catch (error) {
    throw new Error(`获取排行榜统计失败: ${error.message}`)
  }
}

// 导出默认API实例
export default rankingAPI

/* 
API接口数据格式说明：

1. 聪明钱地址排行榜接口 (GET /smart-money)
请求参数：
{
  "limit": 50,           // 返回条数，最大100
  "page": 1,             // 页码
  "sortBy": "total_profit", // 排序字段
  "sortOrder": "DESC"    // 排序方向：DESC, ASC
}

响应格式：
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,                                      // 记录ID
        "address": "4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump", // 钱包地址
        "total_profit": 125000.50,                    // 总盈利 (USD)
        "count": 156,                                 // 交易次数
        "remark": "优质钱包，长期关注",                  // 备注信息
        "created_at": "2024-01-01T00:00:00Z",         // 创建时间
        "updated_at": "2024-01-20T10:30:00Z"          // 更新时间
      }
    ],
    "pagination": {
      "pageNum": 1,       // 当前页码
      "pageSize": 50,     // 每页条数
      "total": 1000       // 总条数
    }
  },
  "msg": "查询成功"
}

2. 更新聪明钱地址接口 (PUT /smart-money/{id})
请求参数：
{
  "remark": "优质钱包，长期关注",     // 备注内容（可选）
  "address": "新地址",              // 钱包地址（可选）
  "total_profit": 150000.00,        // 总盈利（可选）
  "count": 200                      // 暴击倍数（可选）
}

响应格式：
{
  "code": 0,
  "data": null,
  "msg": "聪明钱地址更新成功"
}

3. 删除聪明钱地址接口 (DELETE /smart-money/{id})
响应格式：
{
  "code": 0,
  "data": null,
  "msg": "删除成功"
}

4. 钱包详情接口 (GET /wallet/{address})
响应格式：
{
  "success": true,
  "data": {
    "walletAddress": "...",
    "totalProfit": 125000.50,
    "criticalMultiplier": 150.5,
    "remark": "优质钱包，长期关注",
    "totalTrades": 156,
    "winRate": 78.5,
    "bestTrade": {
      "profit": 25000.00,
      "multiplier": 50.2,
      "tokenSymbol": "PUMP"
    },
    "recentTrades": [...],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-20T10:30:00Z"
  }
}

5. 排行榜统计接口 (GET /ranking/stats)
响应格式：
{
  "success": true,
  "data": {
    "totalWallets": 10000,        // 总钱包数
    "totalProfit": 50000000.00,   // 总盈利
    "avgProfit": 5000.00,         // 平均盈利
    "topMultiplier": 500.5,       // 最高暴击倍数
    "lastUpdated": "2024-01-20T10:30:00Z"
  }
}
*/ 