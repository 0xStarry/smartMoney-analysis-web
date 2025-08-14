<template>
  <!-- 开发者排行榜弹窗 -->
  <v-dialog v-model="visible" max-width="1200" scrollable transition="dialog-bottom-transition">
    <v-card class="dev-ranking-dialog" rounded="xl" elevation="0">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-account-star" color="warning" class="me-2" />
          <span>开发者排行榜</span>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="visible = false" />
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="ranking-title">开发者排行榜</h3>
          <div class="d-flex align-center gap-2 flex-wrap">
            <v-btn color="primary" variant="outlined" size="small" prepend-icon="mdi-refresh" @click="loadDevRankingData"
              :loading="loading">
              刷新
            </v-btn>
          </div>
        </div>

        <!-- 桌面端排行榜表格 -->
        <div class="desktop-ranking">
          <v-data-table 
            :headers="headers" 
            :items="devList" 
            :loading="loading" 
            class="ranking-table"
            :sort-by="sortBy"
            no-data-text="暂无开发者数据"
            loading-text="加载中..."
            :items-per-page="-1"
            hide-default-footer
            @update:options="handleOptionsUpdate"
          >
            <!-- 排名列 -->
            <template v-slot:[`item.rank`]="{ item }">
              <div class="rank-cell">
                <v-icon v-if="item.rank === 1" icon="mdi-trophy" color="#FFD700" size="24" />
                <v-icon v-else-if="item.rank === 2" icon="mdi-trophy" color="#C0C0C0" size="22" />
                <v-icon v-else-if="item.rank === 3" icon="mdi-trophy" color="#CD7F32" size="20" />
                <span v-else class="rank-number">{{ item.rank }}</span>
              </div>
            </template>

            <!-- 开发者地址列 -->
            <template v-slot:[`item.dev_address`]="{ item }">
              <div class="address-container">
                <span class="address-text" @click="copyAddress(item.dev_address)">
                  {{ formatAddress(item.dev_address) }}
                </span>
                <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyAddress(item.dev_address)"
                  class="action-btn" />
              </div>
            </template>

            <!-- 总利润列 -->
            <template v-slot:[`item.total_profit`]="{ item }">
              <div class="profit-cell">
                <span :class="getProfitClass(item.total_profit)" class="profit-amount">
                  ${{ formatNumber(item.total_profit) }}
                </span>
              </div>
            </template>

            <!-- 代币数量列 -->
            <template v-slot:[`item.token_count`]="{ item }">
              <div class="count-cell">
                <v-chip color="info" size="small" variant="flat">
                  {{ item.token_count }}
                </v-chip>
              </div>
            </template>
          </v-data-table>
          
          <!-- 桌面端分页器 -->
          <div class="desktop-pagination mt-4" v-if="!loading && devList.length > 0">
            <v-row class="align-center">
              <v-col cols="auto">
                <v-select
                  v-model="pagination.pageSize"
                  :items="[10, 20, 50, 100]"
                  label="每页条数"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="handlePageSizeChange"
                  style="width: 120px;"
                />
              </v-col>
              <v-col>
                <v-pagination
                  v-model="pagination.page"
                  :length="pagination.totalPages"
                  :total-visible="7"
                  @update:model-value="handlePageChange"
                  class="justify-center"
                />
              </v-col>
              <v-col cols="auto">
                <v-chip size="small" variant="outlined">
                  第 {{ pagination.page }} / {{ pagination.totalPages }} 页，共 {{ pagination.total }} 条
                </v-chip>
              </v-col>
            </v-row>
          </div>
        </div>

        <!-- 移动端排行榜卡片 -->
        <div class="mobile-ranking">
          <v-card v-for="item in devList" :key="item.dev_address" class="ranking-card ma-2"
            elevation="2" rounded="lg">
            <v-card-title class="ranking-card-header">
              <div class="d-flex align-center">
                <div class="rank-badge me-3">
                  <v-icon v-if="item.rank === 1" icon="mdi-trophy" color="#FFD700" size="20" />
                  <v-icon v-else-if="item.rank === 2" icon="mdi-trophy" color="#C0C0C0" size="18" />
                  <v-icon v-else-if="item.rank === 3" icon="mdi-trophy" color="#CD7F32" size="16" />
                  <span v-else class="rank-text">#{{ item.rank }}</span>
                </div>
                <div class="address-info">
                  <span class="address-short" @click="copyAddress(item.dev_address)">
                    {{ formatAddress(item.dev_address) }}
                  </span>
                </div>
              </div>
              <div class="profit-badge">
                <span :class="getProfitClass(item.total_profit)" class="profit-value">
                  ${{ formatNumber(item.total_profit) }}
                </span>
              </div>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <v-chip size="small" variant="outlined" class="mb-1">总利润</v-chip>
                  <div class="data-value">${{ formatNumber(item.total_profit) }}</div>
                </v-col>
                <v-col cols="6">
                  <v-chip size="small" variant="outlined" class="mb-1">代币数量</v-chip>
                  <v-chip color="info" size="small" variant="flat">
                    {{ item.token_count }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          
          <!-- 移动端分页器 -->
          <div class="mobile-pagination mt-4" v-if="!loading && devList.length > 0">
            <v-pagination
              v-model="pagination.page"
              :length="pagination.totalPages"
              :total-visible="5"
              @update:model-value="handlePageChange"
            />
            <div class="pagination-info text-center mt-2">
              <v-chip size="small" variant="outlined">
                第 {{ pagination.page }} / {{ pagination.totalPages }} 页，共 {{ pagination.total }} 条
              </v-chip>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import axios from 'axios'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible', 'show-message'])

// 响应式数据
const loading = ref(false)
const devList = ref([])

// 分页状态
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 排序状态
const sortBy = ref([{ key: 'total_profit', order: 'desc' }])

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 表格头部配置
const headers = [
  { title: '排名', key: 'rank', align: 'center', width: 80, sortable: false },
  { title: '开发者地址', key: 'dev_address', align: 'start', minWidth: 220, sortable: true },
  { title: '总利润 (USD)', key: 'total_profit', align: 'end', minWidth: 160, sortable: true },
  { title: '代币数量', key: 'token_count', align: 'center', width: 120, sortable: true }
]

// 监听对话框显示状态
watch(visible, (newVal) => {
  if (newVal) {
    // 重置分页到第一页
    pagination.page = 1
    loadDevRankingData()
  }
})

// 处理表格选项变化（排序）
const handleOptionsUpdate = (options) => {
  let shouldReload = false
  
  // 处理排序变化
  if (options.sortBy && JSON.stringify(options.sortBy) !== JSON.stringify(sortBy.value)) {
    sortBy.value = options.sortBy
    pagination.page = 1 // 重置到第一页
    shouldReload = true
  }
  
  if (shouldReload) {
    loadDevRankingData()
  }
}

// 分页事件处理
const handlePageChange = (newPage) => {
  pagination.page = newPage
  loadDevRankingData()
}

const handlePageSizeChange = (newSize) => {
  pagination.pageSize = newSize
  pagination.page = 1 // 重置到第一页
  loadDevRankingData()
}

// 加载开发者排行榜数据
const loadDevRankingData = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.page,
      limit: pagination.pageSize
    }

    // 处理排序参数
    if (sortBy.value && sortBy.value.length > 0) {
      const sort = sortBy.value[0]
      params.order_by = sort.key
      params.order_dir = sort.order.toUpperCase()
    }

    console.log('开发者排行榜请求参数:', params)
    const response = await axios.get('/api/tokens/dev/summary', { params })
    
    if (response.data.code === 0) {
      const responseData = response.data.data
      console.log('开发者排行榜响应数据:', responseData)
      
      // 处理数据并添加排名
      devList.value = (responseData.list || []).map((item, index) => ({
        ...item,
        rank: (pagination.page - 1) * pagination.pageSize + index + 1 // 计算全局排名
      }))
      
      // 更新分页信息（根据接口文档使用正确的字段）
      pagination.total = responseData.t || responseData.total || 0
      pagination.totalPages = responseData.totalPage || responseData.totalPages || Math.ceil(pagination.total / pagination.pageSize)
      
      // 确保至少有1页
      if (pagination.totalPages === 0 && devList.value.length > 0) {
        pagination.totalPages = 1
      }
      
      console.log('分页信息更新:', {
        total: pagination.total,
        totalPages: pagination.totalPages,
        currentPage: pagination.page,
        pageSize: pagination.pageSize,
        dataLength: devList.value.length
      })
      
      // 确保当前页不超过总页数
      if (pagination.page > pagination.totalPages && pagination.totalPages > 0) {
        pagination.page = pagination.totalPages
      }
      
      emit('show-message', `开发者排行榜加载成功，共 ${pagination.total} 条数据，当前第 ${pagination.page}/${pagination.totalPages} 页`, 'success')
    } else {
      throw new Error(response.data.msg || '获取数据失败')
    }
  } catch (error) {
    console.error('获取开发者排行榜失败:', error)
    emit('show-message', '获取开发者排行榜失败: ' + error.message, 'error')
    devList.value = []
    pagination.total = 0
    pagination.totalPages = 0
  } finally {
    loading.value = false
  }
}

// 工具函数
const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

const formatNumber = (num) => {
  const number = parseFloat(num)
  if (isNaN(number)) return '0.00'

  if (number >= 1000000) {
    return (number / 1000000).toFixed(2) + 'M'
  } else if (number >= 1000) {
    return (number / 1000).toFixed(2) + 'K'
  } else {
    return number.toFixed(2)
  }
}

const getProfitClass = (profit) => {
  const num = parseFloat(profit)
  return num >= 0 ? 'profit-positive' : 'profit-negative'
}

// 复制地址
const copyAddress = async (address) => {
  try {
    await navigator.clipboard.writeText(address)
    emit('show-message', '地址已复制到剪贴板', 'success')
  } catch (err) {
    emit('show-message', '复制失败，请手动复制', 'error')
  }
}

// 暴露方法给父组件
defineExpose({
  loadDevRankingData
})
</script>

<style scoped>
/* 排行榜样式 */
.dev-ranking-dialog {
  background: rgb(var(--v-theme-surface));
  max-height: 90vh;
}

.ranking-title {
  font-size: 20px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.ranking-table {
  background: transparent;
}

.rank-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.rank-number {
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.7;
  font-weight: 600;
}

.address-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.address-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  cursor: pointer;
  color: #409eff;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 13px;
}

.address-text:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.action-btn {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.6;
  transition: all 0.3s ease;
}

.action-btn:hover {
  color: #409eff;
  opacity: 1;
}

.profit-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.profit-amount {
  font-weight: 700;
  font-size: 16px;
}

.profit-positive {
  color: #67c23a;
}

.profit-negative {
  color: #f56c6c;
}

.count-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 桌面端排行榜 */
.desktop-ranking {
  display: block;
}

/* 移动端排行榜 */
.mobile-ranking {
  display: none;
}

.ranking-card {
  background: rgb(var(--v-theme-surface));
  transition: all 0.3s ease;
}

.ranking-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ranking-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 5px;
}

.rank-text {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.7;
  font-size: 14px;
}

.address-info {
  flex: 1;
}

.address-short {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
}

.profit-badge .profit-value {
  font-weight: 700;
  font-size: 18px;
}

.data-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
}

/* 桌面端分页器 */
.desktop-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

/* 移动端分页器 */
.mobile-pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pagination-info {
  opacity: 0.7;
}

/* 排行榜响应式设计 */
@media (max-width: 768px) {
  .dev-ranking-dialog {
    margin: 10px;
    max-width: calc(100vw - 20px);
  }

  .desktop-ranking {
    display: none;
  }

  .mobile-ranking {
    display: block;
  }

  .ranking-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .ranking-card {
    margin: 8px;
  }

  .ranking-title {
    font-size: 16px;
  }
}
</style> 