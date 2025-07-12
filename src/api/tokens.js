import axios from 'axios'

// 代币API基础配置
const tokenAPI = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// 请求拦截器
tokenAPI.interceptors.request.use(
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
tokenAPI.interceptors.response.use(
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
    console.error('代币API请求失败:', error)
    // 网络错误或HTTP错误
    if (error.response && error.response.data) {
      const errorData = error.response.data
      error.message = errorData.msg || errorData.error_message || error.message
    }
    return Promise.reject(error)
  }
)

/**
 * 创建代币地址
 * @param {string} contractAddress - 合约地址
 * @returns {Promise} API响应
 */
export const createToken = async (contractAddress) => {
  try {
    const response = await tokenAPI.post('/tokens', {
      contract_address: contractAddress
    })
    return response
  } catch (error) {
    throw new Error(`创建代币地址失败: ${error.message}`)
  }
}

/**
 * 检查代币是否存在
 * @param {string} contractAddress - 合约地址
 * @returns {Promise} API响应
 */
export const checkTokenExists = async (contractAddress) => {
  try {
    const response = await tokenAPI.get(`/tokens/address/${contractAddress}`)
    
    // 根据data字段的内容来判断代币是否存在
    const hasData = response.data && 
                   (Array.isArray(response.data) ? response.data.length > 0 : 
                    (typeof response.data === 'object' && Object.keys(response.data).length > 0))
    
    if (hasData) {
      return { 
        success: true,
        data: { exists: true, ...response.data },
        message: response.message || "代币地址存在"
      }
    } else {
      return { 
        success: false,
        data: { exists: false },
        message: "代币地址不存在"
      }
    }
  } catch (error) {
    // 网络错误或其他异常
    throw new Error(`检查代币是否存在失败: ${error.message}`)
  }
}

/**
 * 获取代币详情
 * @param {string} contractAddress - 合约地址
 * @returns {Promise} API响应
 */
export const getTokenDetails = async (contractAddress) => {
  try {
    const response = await tokenAPI.get(`/tokens/${contractAddress}`)
    return response
  } catch (error) {
    throw new Error(`获取代币详情失败: ${error.message}`)
  }
}

/**
 * 获取所有已保存的代币列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码，默认1
 * @param {number} params.pageSize - 每页条数，默认20
 * @returns {Promise} API响应
 */
export const getTokenList = async (params = {}) => {
  try {
    const response = await tokenAPI.get('/tokens', {
      params: {
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 20,
        ...params
      }
    })
    return response
  } catch (error) {
    throw new Error(`获取代币列表失败: ${error.message}`)
  }
}

// 导出默认API实例
export default tokenAPI

/* 
API接口数据格式说明：

1. 创建代币地址接口 (POST /tokens)
请求参数：
{
  "contract_address": "4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump"
}

成功响应格式：
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

2. 检查代币是否存在接口 (GET /tokens/address/{address})
成功响应格式（代币存在时）：
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

错误响应格式（代币不存在时）：
{
  "code": 400,
  "data": null,
  "detailMsg": "代币地址不存在",
  "error_code": "400",
  "error_message": "代币地址不存在",
  "msg": "代币地址不存在"
}

3. 获取代币列表接口 (GET /tokens)
请求参数：
{
  "pageNum": 1,     // 页码
  "pageSize": 20    // 每页条数
}

分页响应格式：
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
*/ 