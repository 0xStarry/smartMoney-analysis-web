import { ref, reactive, computed, watch } from 'vue'
import { contractAPI} from '../api'
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
        // 调试：打印原始API数据结构
        console.log('OKX API原始数据结构:', response.data.list[0])
        
        // 数据映射：将OKX API字段映射到前端期望的字段
        const mappedData = response.data.list.map(item => {
          // 获取钱包地址
          const walletAddress = item.holderWalletAddress || item.walletAddress || item.address || item.holder || ''
          
          // 尝试不同的字段名映射
          return {
            // 钱包地址映射
            holderWalletAddress: walletAddress,
            
            // 买入金额映射  
            buyValue: item.buyValue || item.buy_value || item.buyAmount || item.totalBuyValue || 0,
            
            // 卖出金额映射
            sellValue: item.sellValue || item.sell_value || item.sellAmount || item.totalSellValue || 0,
            
            // 总盈利映射
            totalProfit: item.totalProfit || item.total_profit || item.profit || item.pnl || item.realizedPnl || 0,
            
            // 盈利率映射
            totalProfitPercentage: item.totalProfitPercentage || item.profitPercentage || item.profit_percentage || item.pnlPercentage || item.roiPercentage || 0,
            
            // 买入均价映射
            boughtAvgPrice: item.boughtAvgPrice || item.avgBuyPrice || item.buy_avg_price || item.avgCost || 0,
            
            // 卖出均价映射
            soldAvgPrice: item.soldAvgPrice || item.avgSellPrice || item.sell_avg_price || item.avgSellPx || 0,
            
            // 浏览器链接映射
            explorerUrl: item.explorerUrl || item.explorer_url || (walletAddress ? `https://solscan.io/account/${walletAddress}` : ''),
            
            // 保留原始数据
            ...item
          }
        })
        
        console.log('映射后的数据结构:', mappedData[0])
        
        const profitableAddresses = mappedData.filter(item => {
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

      // 获取开发者地址
      const devResponse = await contractAPI.getDevAddress(contractAddress)
      const devAddress = devResponse.data?.devAnalysisSummaryVO?.creatorAddress || ''

      // 获取开发者利润数据
      let devProfit = 0
      if (devAddress) {
        try {
          const devProfitResponse = await contractAPI.getDevProfit(contractAddress, devAddress)
          devProfit = parseFloat(devProfitResponse.data?.totalProfit) || 0
          console.log('开发者利润金额:', devProfit)
        } catch (error) {
          console.error('获取开发者利润失败:', error)
          // 继续执行保存流程，即使获取利润失败
        }
      }

      const response = await batchSaveSmartMoneyAddresses(addressesToSave)
      await createToken(contractAddress, devAddress, devProfit)
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