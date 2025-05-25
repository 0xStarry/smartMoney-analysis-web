<template>
  <div id="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>🔍 代币分析</h1>
        </div>
      </el-header>
      
      <el-main>
        <div class="search-container">
          <el-card class="search-card">
            <template #header>
              <div class="card-header">
                <span>📊 合约地址查询</span>
              </div>
            </template>
            
            <el-form :model="searchForm" ref="searchFormRef" :rules="rules" label-width="100px">
              <el-row :gutter="20">
                <el-col :span="16">
                  <el-form-item label="合约地址" prop="contractAddress">
                    <el-input 
                      v-model="searchForm.contractAddress" 
                      placeholder="请输入合约地址，例如：4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump"
                      clearable
                      @keyup.enter="handleSearch"
                      size="large"
                    >
                      <template #prepend>
                        <el-icon><Search /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="显示条数" prop="limit">
                    <el-input-number
                      v-model="searchForm.limit"
                      :min="1"
                      :max="100"
                      size="large"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label=" ">
                    <el-button 
                      type="primary" 
                      @click="handleSearch"
                      :loading="loading"
                      size="large"
                      style="width: 100%"
                    >
                      <Search /> 查询
                    </el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </div>

        <div class="result-container" v-if="tableData.length > 0">
          <el-card class="result-card">
            <template #header>
              <div class="card-header">
                <div class="result-title">
                  <span>🏆 智能钱包排行榜</span>
                  <el-tag type="info" size="small">共 {{ tableData.length }} 条数据</el-tag>
                </div>
                <el-button type="primary" plain @click="exportData" :icon="Download">
                  导出数据
                </el-button>
              </div>
            </template>
            
            <el-table 
              :data="displayData" 
              stripe 
              border
              v-loading="loading"
              max-height="600"
              class="data-table"
              :default-sort="{ prop: 'totalProfit', order: 'descending' }"
            >
              <el-table-column
                type="index"
                label="排名"
                width="80"
                align="center"
              >
                <template #default="{ $index }">
                  <div class="rank-cell">
                    <el-icon v-if="$index === 0" color="#FFD700"><Trophy /></el-icon>
                    <el-icon v-else-if="$index === 1" color="#C0C0C0"><Trophy /></el-icon>
                    <el-icon v-else-if="$index === 2" color="#CD7F32"><Trophy /></el-icon>
                    <span v-else class="rank-number">{{ $index + 1 }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column 
                prop="holderWalletAddress" 
                label="钱包地址" 
                min-width="220"
              >
                <template #default="{ row }">
                  <div class="address-container">
                    <el-tooltip :content="row.holderWalletAddress" placement="top">
                      <span class="address-text">{{ formatAddress(row.holderWalletAddress) }}</span>
                    </el-tooltip>
                    <div class="address-actions">
                      <el-button
                        type="text"
                        :icon="CopyDocument"
                        size="small"
                        @click="copyAddress(row.holderWalletAddress)"
                        class="action-btn"
                      />
                      <el-link
                        :href="row.explorerUrl"
                        target="_blank"
                        :underline="false"
                        class="action-btn"
                      >
                        <el-icon><Link /></el-icon>
                      </el-link>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column 
                prop="totalProfit" 
                label="总盈利 (USD)" 
                min-width="160" 
                sortable
              >
                <template #default="{ row }">
                  <div class="profit-cell">
                    <span :class="getProfitClass(row.totalProfit)" class="profit-amount">
                      ${{ formatProfit(row.totalProfit) }}
                    </span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column 
                prop="totalProfitPercentage" 
                label="盈利率" 
                width="120"
                sortable
              >
                <template #default="{ row }">
                  <el-tag 
                    :type="getProfitTagType(row.totalProfit)"
                    class="profit-tag"
                  >
                    {{ row.totalProfitPercentage }}%
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column 
                prop="boughtAvgPrice" 
                label="买入均价" 
                width="140"
              >
                <template #default="{ row }">
                  <span class="price-text">${{ formatPrice(row.boughtAvgPrice) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column 
                prop="soldAvgPrice" 
                label="卖出均价" 
                width="140"
              >
                <template #default="{ row }">
                  <span class="price-text">${{ formatPrice(row.soldAvgPrice) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <div class="empty-container" v-else-if="!loading && searched">
          <el-empty description="暂无数据">
            <template #image>
              <div class="empty-icon">📊</div>
            </template>
            <el-button type="primary" @click="handleSearch">重新查询</el-button>
          </el-empty>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, CopyDocument, Link, Trophy } from '@element-plus/icons-vue'
import { formatAddress, formatNumber, exportToCSV } from './utils'
import { contractAPI } from './api'

// 表单数据
const searchForm = reactive({
  contractAddress: '',
  limit: 10
})

// 表单验证规则
const rules = reactive({
  contractAddress: [
    { required: true, message: '请输入合约地址', trigger: 'blur' }
  ],
  limit: [
    { required: true, message: '请输入显示条数', trigger: 'blur' }
  ]
})

// 表格数据
const tableData = ref([])

// 状态
const loading = ref(false)
const searched = ref(false)
const searchFormRef = ref()

// 计算属性：根据limit显示数据
const displayData = computed(() => {
  return tableData.value.slice(0, searchForm.limit)
})

// 查询处理
const handleSearch = async () => {
  const valid = await searchFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  searched.value = true
  
  try {
    const response = await contractAPI.getSmartMoneyRanking(searchForm.contractAddress)
    
    if (response.data && response.data.list) {
      tableData.value = response.data.list
      ElMessage.success(`查询成功，共获取到 ${response.data.list.length} 条数据`)
    } else {
      tableData.value = []
      ElMessage.warning('未查询到数据')
    }
  } catch (error) {
    tableData.value = []
    console.error('查询失败:', error)
    ElMessage.error('查询失败，请检查网络连接或稍后重试')
  } finally {
    loading.value = false
  }
}

// 格式化盈利数字
const formatProfit = (profit) => {
  const num = parseFloat(profit)
  if (isNaN(num)) return '0.00'
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  } else {
    return num.toFixed(2)
  }
}

// 格式化价格
const formatPrice = (price) => {
  const num = parseFloat(price)
  if (isNaN(num)) return '0.00'
  return num.toFixed(6)
}

// 获取盈利样式类
const getProfitClass = (profit) => {
  const num = parseFloat(profit)
  return num >= 0 ? 'profit-positive' : 'profit-negative'
}

// 获取盈利标签类型
const getProfitTagType = (profit) => {
  const num = parseFloat(profit)
  return num >= 0 ? 'success' : 'danger'
}

// 复制地址
const copyAddress = async (address) => {
  try {
    await navigator.clipboard.writeText(address)
    ElMessage.success('地址已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 导出数据
const exportData = () => {
  if (displayData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  
  const exportData = displayData.value.map((item, index) => ({
    '排名': index + 1,
    '钱包地址': item.holderWalletAddress,
    '总盈利(USD)': item.totalProfit,
    '盈利率': item.totalProfitPercentage + '%',
    '买入均价': item.boughtAvgPrice,
    '卖出均价': item.soldAvgPrice,
    '浏览器链接': item.explorerUrl
  }))
  
  const filename = `智能钱包数据_${searchForm.contractAddress}_${new Date().getTime()}.csv`
  exportToCSV(exportData, filename)
  ElMessage.success('数据导出成功')
}
</script>

<style scoped>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.el-container {
  min-height: 100vh;
}

.el-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.header-content h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.header-content p {
  margin: 5px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.el-main {
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 60px);
}

.search-container {
  margin-bottom: 30px;
}

.search-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: none;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
}

.result-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: none;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-container {
  animation: fadeInUp 0.6s ease-out;
}

.empty-container {
  margin-top: 50px;
  animation: fadeIn 0.5s ease-out;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.data-table {
  border-radius: 12px;
  overflow: hidden;
}

.rank-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.rank-number {
  font-size: 16px;
  color: #666;
}

.address-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.address-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  cursor: pointer;
  color: #409eff;
  font-weight: 500;
  transition: all 0.3s ease;
}

.address-text:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.address-actions {
  display: flex;
  gap: 5px;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.address-container:hover .address-actions {
  opacity: 1;
}

.action-btn {
  color: #909399;
  transition: color 0.3s ease;
}

.action-btn:hover {
  color: #409eff;
}

.profit-cell {
  display: flex;
  align-items: center;
}

.profit-amount {
  font-weight: 600;
  font-size: 16px;
}

.profit-positive {
  color: #67c23a;
}

.profit-negative {
  color: #f56c6c;
}

.profit-tag {
  font-weight: 600;
}

.price-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #606266;
  font-size: 13px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

:deep(.el-card__header) {
  background: rgba(255,255,255,0.8);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #2c3e50;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #2c3e50;
  font-weight: 600;
  border: none;
}

:deep(.el-table td) {
  border: none;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: rgba(102, 126, 234, 0.02);
}

:deep(.el-table__body tr:hover td) {
  background: rgba(102, 126, 234, 0.05) !important;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 8px;
}
</style>