import { ref, reactive, computed, watch } from 'vue'
import { contractAPI } from '../api'
import { batchSaveSmartMoneyAddresses } from '../api/database'
import { createToken, checkTokenExists } from '../api/tokens'

export function useSmartMoneyApp() {
  // 状态管理
  const loading = ref(false)
  const searched = ref(false)
  const tokenExists = ref(false)
  const tableData = ref([])
  const selectedItems = ref([])
  const searchLimit = ref(20)
  const minBuyValue = ref(100)

  // 计算属性：根据limit和minBuyValue过滤显示数据
  const displayData = computed(() => {
    // 先过滤买入金额，再应用数量限制
    const filtered = tableData.value.filter(item => {
      const buyValue = parseFloat(item.buyValue) || 0
      return buyValue >= minBuyValue.value
    })
    return filtered.slice(0, searchLimit.value)
  })

  // 监听displayData变化，自动更新选中项
  watch(displayData, (newDisplayData) => {
    selectedItems.value = selectedItems.value.filter(selected =>
      newDisplayData.some(item => item.holderWalletAddress === selected.holderWalletAddress)
    )
  }, { deep: true })

  // 检查代币是否存在
  const checkToken = async (contractAddress) => {
    try {
      const response = await checkTokenExists(contractAddress)
      tokenExists.value = response.data?.exists || false
    } catch (error) {
      console.error('检查代币失败:', error)
      tokenExists.value = false
    }
  }

  // 查询处理
  const handleSearch = async (searchParams) => {
    loading.value = true
    searched.value = true
    tokenExists.value = false
    searchLimit.value = searchParams.limit
    minBuyValue.value = searchParams.minBuyValue || 100

    try {
      const [response] = await Promise.all([
        contractAPI.getSmartMoneyRanking(searchParams.contractAddress),
        checkToken(searchParams.contractAddress)
      ])

      if (response.data && response.data.list) {
        const profitableAddresses = response.data.list.filter(item => {
          const profit = parseFloat(item.totalProfit) || 0
          return profit > 0
        })

        tableData.value = profitableAddresses
        selectedItems.value = [...displayData.value]

        const originalCount = response.data.list.length
        const filteredCount = profitableAddresses.length
        const removedCount = originalCount - filteredCount

        const message = removedCount > 0 
          ? `查询成功，共获取到 ${originalCount} 条数据，过滤掉 ${removedCount} 条负盈利地址，显示 ${filteredCount} 条盈利地址，已自动选择前 ${displayData.value.length} 条`
          : `查询成功，共获取到 ${filteredCount} 条盈利地址，已自动选择前 ${displayData.value.length} 条`

        return { success: true, message }
      } else {
        tableData.value = []
        selectedItems.value = []
        return { success: false, message: '未查询到数据' }
      }
    } catch (error) {
      tableData.value = []
      selectedItems.value = []
      console.error('查询失败:', error)
      return { success: false, message: '查询失败，请检查网络连接或稍后重试' }
    } finally {
      loading.value = false
    }
  }

  // 保存到数据库
  const saveToDatabase = async (contractAddress) => {
    if (selectedItems.value.length === 0) {
      return { success: false, message: '请选择要保存的数据' }
    }

    try {
      loading.value = true
      
      const addressesToSave = selectedItems.value
        .filter(item => {
          const profit = parseFloat(item.totalProfit) || 0
          return profit > 0
        })
        .map((item) => ({
          address: item.holderWalletAddress,
          total_profit: parseFloat(item.totalProfit) || 0,
          percent: parseFloat(item.totalProfitPercentage) || 0,
          count: 1,
          remark: null
        }))

      if (addressesToSave.length === 0) {
        return { success: false, message: '没有盈利地址可以保存' }
      }

      const response = await batchSaveSmartMoneyAddresses(addressesToSave)
      await createToken(contractAddress)
      tokenExists.value = true

      const processedCount = response.data?.count || selectedItems.value.length
      
      return { 
        success: true, 
        message: `成功保存 ${processedCount} 条聪明钱地址和代币信息` 
      }
    } catch (error) {
      console.error('保存数据失败:', error)
      return { success: false, message: `保存失败: ${error.message}` }
    } finally {
      loading.value = false
    }
  }

  // 复制地址
  const copyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address)
      return { success: true, message: '地址已复制到剪贴板' }
    } catch (err) {
      return { success: false, message: '复制失败，请手动复制' }
    }
  }

  // 更新选中项
  const updateSelectedItems = (newSelectedItems) => {
    selectedItems.value = newSelectedItems
  }

  return {
    // 状态
    loading,
    searched,
    tokenExists,
    tableData,
    selectedItems,
    displayData,
    minBuyValue,
    
    // 方法
    handleSearch,
    saveToDatabase,
    copyAddress,
    updateSelectedItems
  }
} 