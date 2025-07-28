<template>
  <!-- 排行榜弹窗 -->
  <v-dialog v-model="dialogVisible" max-width="1200" scrollable>
    <v-card class="ranking-dialog">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-trophy" color="warning" class="me-2" />
          <span>钱包排行榜</span>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="ranking-title">钱包排行榜</h3>
          <div class="d-flex align-center gap-2 flex-wrap">
            <!-- 链类型筛选 -->
            <v-chip-group v-model="selectedChainType" selected-class="text-primary" class="chain-filter">
              <v-chip filter variant="outlined" value="all" size="small">
                全部
              </v-chip>
              <v-chip filter variant="outlined" value="solana" size="small" color="purple">
                Solana
              </v-chip>
              <v-chip filter variant="outlined" value="bsc" size="small" color="orange">
                BSC
              </v-chip>
            </v-chip-group>
            
            <!-- 暴击倍数筛选 -->
            <div class="d-flex align-center gap-2">
              <v-text-field 
                v-model.number="minCountFilter" 
                label="最小暴击倍数" 
                type="number" 
                min="1" 
                step="1" 
                variant="outlined" 
                density="compact" 
                class="count-filter-input"
                hide-details
                prepend-inner-icon="mdi-flash"
                suffix="x"
              />
              <v-chip-group class="count-filter-chips">
                <v-chip 
                  v-for="count in [2, 5, 10]" 
                  :key="count"
                  variant="outlined" 
                  size="small" 
                  @click="minCountFilter = count"
                  :color="minCountFilter === count ? 'primary' : 'default'"
                >
                  {{ count }}x+
                </v-chip>
              </v-chip-group>
            </div>
            
            <v-btn v-if="selectedChainType !== 'all' || minCountFilter > 1" 
              color="warning" variant="outlined" size="small" prepend-icon="mdi-filter-off" 
              @click="resetFilters" class="reset-filter-btn">
              重置筛选
            </v-btn>
            
            <v-btn color="primary" variant="outlined" size="small" prepend-icon="mdi-refresh" @click="loadRankingData"
              :loading="rankingLoading">
              刷新
            </v-btn>
          </div>
        </div>

        <!-- 桌面端排行榜表格 -->
        <div class="desktop-ranking">
          <v-data-table 
            :headers="rankingHeaders" 
            :items="processedRankingData" 
            :loading="rankingLoading" 
            class="ranking-table"
            :sort-by="sortBy"
            :no-data-text="`暂无排行榜数据${minCountFilter > 1 ? ` (已过滤暴击倍数小于${minCountFilter}x的数据)` : ''}`" 
            loading-text="加载中..."
            :items-per-page="-1"
            hide-default-footer
            @update:options="handleOptionsUpdate"
          >
            <template v-slot:[`item.rank`]="{ item }">
              <div class="rank-cell">
                <v-icon v-if="item.rank === 1" icon="mdi-trophy" color="#FFD700" size="24" />
                <v-icon v-else-if="item.rank === 2" icon="mdi-trophy" color="#C0C0C0" size="22" />
                <v-icon v-else-if="item.rank === 3" icon="mdi-trophy" color="#CD7F32" size="20" />
                <span v-else class="rank-number">{{ item.rank }}</span>
              </div>
            </template>

            <template v-slot:[`item.chainType`]="{ item }">
              <div class="chain-cell">
                <v-chip :color="getChainTypeColor(item.chainType)" size="small" variant="flat">
                  {{ getChainTypeText(item.chainType) }}
                </v-chip>
              </div>
            </template>

            <template v-slot:[`item.address`]="{ item }">
              <div class="address-container">
                <span class="address-text" @click="copyAddress(item.address)">
                  {{ formatAddress(item.address) }}
                </span>
                <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyAddress(item.address)"
                  class="action-btn" />
              </div>
            </template>

            <template v-slot:[`item.total_profit`]="{ item }">
              <div class="profit-cell">
                <span :class="getProfitClass(item.total_profit)" class="profit-amount">
                  ${{ formatProfit(item.total_profit) }}
                </span>
              </div>
            </template>

            <template v-slot:[`item.count`]="{ item }">
              <div class="count-cell">
                <v-chip color="error" size="small" variant="flat" prepend-icon="mdi-flash">
                  {{ item.count || 0 }}x
                </v-chip>
              </div>
            </template>

            <template v-slot:[`item.percent`]="{ item }">
              <div class="profit-rate-cell">
                <v-chip color="info" size="small" variant="flat" prepend-icon="mdi-percent">
                  {{ parseFloat(item.percent || 0).toFixed(2) }}%
                </v-chip>
              </div>
            </template>

            <template v-slot:[`item.remark`]="{ item }">
              <div class="remark-cell">
                <v-chip v-if="!item.isEditingRemark" :color="item.remark ? 'primary' : 'default'" size="small"
                  variant="outlined" @click="startEditRemark(item)" class="remark-chip">
                  <v-icon :icon="item.remark ? 'mdi-note-text' : 'mdi-note-plus'" size="14" class="me-1" />
                  {{ item.remark || '添加备注' }}
                </v-chip>

                <div v-else class="remark-edit">
                  <v-text-field 
                    :model-value="getEditingRemark(item)" 
                    @update:model-value="updateEditingRemark(item, $event)"
                    variant="outlined" 
                    density="compact" 
                    placeholder="输入备注信息"
                    hide-details 
                    :loading="item.savingRemark" 
                    :disabled="item.savingRemark"
                    @keyup.enter="saveRemark(item)" 
                    @keyup.esc="cancelEditRemark(item)" 
                    @blur="saveRemark(item)"
                    class="remark-input" 
                    autofocus />
                  <div class="remark-actions">
                    <v-btn icon="mdi-check" variant="text" size="small" color="success" :loading="item.savingRemark"
                      :disabled="item.savingRemark" @mousedown.prevent @click="saveRemark(item)" />
                    <v-btn icon="mdi-close" variant="text" size="small" color="error" :disabled="item.savingRemark"
                      @mousedown.prevent @click="cancelEditRemark(item)" />
                  </div>
                </div>
              </div>
            </template>

            <template v-slot:[`item.actions`]="{ item }">
              <div class="actions-cell">
                <v-btn icon="mdi-delete" variant="text" size="small" color="error"
                  @click="deleteSmartMoneyAddress(item)" :loading="item.deleting" class="delete-btn" />
              </div>
            </template>
          </v-data-table>
          
          <!-- 桌面端分页器 -->
          <div class="desktop-pagination mt-4" v-if="pagination.total > 0">
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
          <v-card v-for="item in processedRankingData" :key="item.address" class="ranking-card ma-2"
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
                  <span class="address-short" @click="copyAddress(item.address)">
                    {{ formatAddress(item.address) }}
                  </span>
                </div>
              </div>
              <div class="profit-badge">
                <span :class="getProfitClass(item.total_profit)" class="profit-value">
                  ${{ formatProfit(item.total_profit) }}
                </span>
              </div>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="4">
                  <v-chip size="small" variant="outlined" class="mb-1">链类型</v-chip>
                  <v-chip :color="getChainTypeColor(item.chainType)" size="small" variant="flat">
                    {{ getChainTypeText(item.chainType) }}
                  </v-chip>
                </v-col>
                <v-col cols="4">
                  <v-chip size="small" variant="outlined" class="mb-1">暴击倍数</v-chip>
                  <v-chip color="error" size="small" variant="flat" prepend-icon="mdi-flash">
                    {{ item.count || 0 }}x
                  </v-chip>
                </v-col>
                <v-col cols="4">
                  <v-chip size="small" variant="outlined" class="mb-1">收益百分比</v-chip>
                  <v-chip color="info" size="small" variant="flat" prepend-icon="mdi-percent">
                    {{ parseFloat(item.percent || 0).toFixed(2) }}%
                  </v-chip>
                </v-col>
                <v-col cols="12">
                  <v-chip size="small" variant="outlined" class="mb-1">更新时间</v-chip>
                  <div class="data-value">{{ formatDate(item.updatedAt) }}</div>
                </v-col>
                <v-col cols="12">
                  <v-chip size="small" variant="outlined" class="mb-2">备注信息</v-chip>
                  <div v-if="!item.isEditingRemark" class="mobile-remark">
                    <v-chip :color="item.remark ? 'primary' : 'default'" size="small" variant="outlined"
                      @click="startEditRemark(item)" class="remark-chip">
                      <v-icon :icon="item.remark ? 'mdi-note-text' : 'mdi-note-plus'" size="14" class="me-1" />
                      {{ item.remark || '添加备注' }}
                    </v-chip>
                  </div>
                  <div v-else class="mobile-remark-edit">
                    <v-text-field 
                      :model-value="getEditingRemark(item)" 
                      @update:model-value="updateEditingRemark(item, $event)"
                      variant="outlined" 
                      density="compact"
                      placeholder="输入备注信息" 
                      hide-details 
                      :loading="item.savingRemark" 
                      :disabled="item.savingRemark"
                      @keyup.enter="saveRemark(item)" 
                      @keyup.esc="cancelEditRemark(item)" 
                      @blur="saveRemark(item)"
                      autofocus />
                    <div class="remark-actions mt-2">
                      <v-btn color="success" variant="outlined" size="small" prepend-icon="mdi-check"
                        :loading="item.savingRemark" :disabled="item.savingRemark" @mousedown.prevent
                        @click="saveRemark(item)" class="me-2">
                        保存
                      </v-btn>
                      <v-btn color="error" variant="outlined" size="small" prepend-icon="mdi-close"
                        :disabled="item.savingRemark" @mousedown.prevent @click="cancelEditRemark(item)">
                        取消
                      </v-btn>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" class="pt-2">
                  <v-divider class="mb-3"></v-divider>
                  <div class="d-flex justify-end">
                    <v-btn color="error" variant="outlined" size="small" prepend-icon="mdi-delete"
                      @click="deleteSmartMoneyAddress(item)" :loading="item.deleting">
                      删除
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          
          <!-- 移动端分页器 -->
          <div class="mobile-pagination mt-4" v-if="pagination.total > 0">
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
import { ref, reactive, computed, defineProps, defineEmits, watch, triggerRef } from 'vue'
import { formatAddress, formatDate } from '../utils'
import { getProfitRanking, getCountRanking, getPercentRanking, updateSmartMoneyAddress, deleteSmartMoneyAddress as deleteAddressAPI } from '../api/ranking'

// 定义 props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// 定义 emits
const emit = defineEmits(['update:visible', 'showMessage'])

// 排行榜表格头部配置
const rankingHeaders = [
  { title: '排名', key: 'rank', align: 'center', width: 80, sortable: false },
  { title: '链', key: 'chainType', align: 'center', width: 100, sortable: false },
  { title: '钱包地址', key: 'address', align: 'start', minWidth: 220, sortable: false },
  { title: '总盈利 (USD)', key: 'total_profit', align: 'end', minWidth: 160, sortable: true },
  { title: '暴击倍数', key: 'count', align: 'center', width: 120, sortable: true },
  { title: '收益百分比', key: 'percent', align: 'center', width: 130, sortable: true },
  { title: '备注', key: 'remark', align: 'start', minWidth: 200, sortable: false },
  { title: '操作', key: 'actions', align: 'center', width: 100, sortable: false },
]

// 排行榜数据和状态
const rankingData = ref([])
const rankingLoading = ref(false)
const editStates = ref(new Map()) // 维护编辑状态

// 分页状态
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 排序状态
const sortBy = ref([{ key: 'total_profit', order: 'desc' }])

// 筛选状态
const selectedChainType = ref('all') // 选中的链类型：all, solana, bsc
const minCountFilter = ref(1) // 最小暴击倍数筛选

// 弹窗可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 计算属性：处理排行榜数据，添加排名和链类型
const processedRankingData = computed(() => {
  return rankingData.value.map((item, index) => {
    const walletAddress = item.address || item.walletAddress
    const chainType = getChainType(walletAddress)
    
    // 计算全局排名（考虑分页）
    const globalRank = (pagination.page - 1) * pagination.pageSize + index + 1
    
    // 获取或创建编辑状态
    const itemId = item.id || walletAddress
    const existingState = editStates.value.get(itemId) || {
      isEditingRemark: false,
      editingRemark: '',
      savingRemark: false,
      deleting: false
    }
    
    const processedItem = {
      ...item,
      // 统一字段名
      walletAddress: walletAddress,
      address: walletAddress,
      totalProfit: item.total_profit || item.totalProfit,
      percent: item.percent || 0,
      count: item.count || 0,
      remark: item.remark || '',
      updatedAt: item.updated_at || item.updatedAt,
      // 添加链类型和排名
      chainType: chainType,
      rank: globalRank,
      // 使用持久化的编辑状态
      ...existingState
    }
    
    return processedItem
  })
})

// 监听筛选条件变化
watch([selectedChainType, minCountFilter], () => {
  pagination.page = 1 // 重置到第一页
  loadRankingData()
})

// 显示消息
const showMessage = (text, color = 'success') => {
  emit('showMessage', text, color)
}

// 判断链类型
const getChainType = (address) => {
  if (address.startsWith('0x')) {
    return 'bsc'
  }
  return 'solana'
}

// 获取链类型显示文字
const getChainTypeText = (chainType) => {
  switch (chainType) {
    case 'bsc':
      return 'BSC'
    case 'solana':
      return 'Solana'
    default:
      return '未知'
  }
}

// 获取链类型颜色
const getChainTypeColor = (chainType) => {
  switch (chainType) {
    case 'bsc':
      return 'orange'
    case 'solana':
      return 'purple'
    default:
      return 'default'
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

// 获取盈利样式类
const getProfitClass = (profit) => {
  const num = parseFloat(profit)
  return num >= 0 ? 'profit-positive' : 'profit-negative'
}

// 复制地址
const copyAddress = async (address) => {
  try {
    await navigator.clipboard.writeText(address)
    showMessage('地址已复制到剪贴板', 'success')
  } catch (err) {
    showMessage('复制失败，请手动复制', 'error')
  }
}

// 关闭弹窗
const closeDialog = () => {
  dialogVisible.value = false
}

// 重置筛选条件
const resetFilters = () => {
  selectedChainType.value = 'all'
  minCountFilter.value = 1
  pagination.page = 1
  loadRankingData()
  showMessage('筛选条件已重置', 'info')
}

// 处理表格选项变化（主要用于排序）
const handleOptionsUpdate = (options) => {
  let shouldReload = false
  
  // 处理排序变化
  if (options.sortBy && JSON.stringify(options.sortBy) !== JSON.stringify(sortBy.value)) {
    sortBy.value = options.sortBy
    pagination.page = 1 // 重置到第一页
    shouldReload = true
  }
  
  if (shouldReload) {
    loadRankingData()
  }
}

// 处理移动端分页变化
const handlePageChange = (newPage) => {
  pagination.page = newPage
  loadRankingData()
}

// 处理每页条数变化
const handlePageSizeChange = (newSize) => {
  pagination.pageSize = newSize
  pagination.page = 1 // 重置到第一页
  loadRankingData()
}

// 固定使用收益排行榜API
const getRankingAPI = () => {
  return getProfitRanking
}

// 加载排行榜数据
const loadRankingData = async () => {
  rankingLoading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      chainType: selectedChainType.value,
      minCount: minCountFilter.value
    }

    // 处理排序参数
    if (sortBy.value && sortBy.value.length > 0) {
      const sort = sortBy.value[0]
      params.sortBy = sort.key
      params.sortOrder = sort.order.toUpperCase()
    }

    // 调用对应的API
    const apiMethod = getRankingAPI()
    const response = await apiMethod(params)

    if (response.success && response.data) {
      rankingData.value = response.data.list || []
      

      
      // 更新分页信息
      pagination.page = response.data.pageNum || params.page
      pagination.pageSize = response.data.pageSize || params.pageSize
      pagination.total = response.data.t || 0
      pagination.totalPages = response.data.totalPage || 0

      // 显示成功消息
      showMessage(`排行榜加载成功，共 ${pagination.total} 条数据，当前第 ${pagination.page}/${pagination.totalPages} 页`, 'success')
    } else {
      rankingData.value = []
      showMessage('未获取到排行榜数据', 'warning')
    }
  } catch (error) {
    console.error('加载排行榜失败:', error)
    rankingData.value = []
    showMessage(`排行榜加载失败: ${error.message}`, 'error')
  } finally {
    rankingLoading.value = false
  }
}

// 编辑备注
const startEditRemark = (item) => {
  console.log('🖊️ 开始编辑备注:')
  console.log('- item对象:', item)
  console.log('- item.id:', item.id)
  console.log('- item.address:', item.address)
  console.log('- item.remark:', item.remark)
  
  const itemId = item.id || item.address
  console.log('- 使用的itemId:', itemId)
  
  const state = editStates.value.get(itemId) || {}
  console.log('- 编辑前state:', state)
  
  state.isEditingRemark = true
  state.editingRemark = item.remark || ''
  editStates.value.set(itemId, state)
  
  console.log('- 编辑后state:', state)
  console.log('- editStates当前状态:', Object.fromEntries(editStates.value))
  
  // 强制触发响应式更新
  triggerRef(editStates)
}

const getEditingRemark = (item) => {
  const itemId = item.id || item.address
  const state = editStates.value.get(itemId)
  return state?.editingRemark || item.remark || ''
}

const updateEditingRemark = (item, value) => {
  const itemId = item.id || item.address
  const state = editStates.value.get(itemId) || {}
  state.editingRemark = value
  editStates.value.set(itemId, state)
  triggerRef(editStates)
}

const saveRemark = async (item) => {
  const itemId = item.id || item.address
  const state = editStates.value.get(itemId)
  

  
  // 如果正在保存中，避免重复保存
  if (state?.savingRemark) {
    return
  }

  const newRemark = (state?.editingRemark || '').trim()

  // 如果备注没有变化，直接退出编辑模式
  if (newRemark === (item.remark || '')) {
    if (state) {
      state.isEditingRemark = false
      editStates.value.set(itemId, state)
      triggerRef(editStates)
    }
    return
  }

  try {
    // 设置保存状态
    if (state) {
      state.savingRemark = true
      editStates.value.set(itemId, state)
      triggerRef(editStates)
    }

    console.log('🚀 调用API更新备注 - ID:', item.id, '新备注:', newRemark)
    
    // 调用API更新备注
    const response = await updateSmartMoneyAddress(item.id, { remark: newRemark })

    // 更新原始数据中的备注
    const originalItem = rankingData.value.find(data => (data.id || data.address) === itemId)
    if (originalItem) {
      originalItem.remark = newRemark
    }

    // 退出编辑模式
    if (state) {
      state.isEditingRemark = false
      editStates.value.set(itemId, state)
      triggerRef(editStates)
    }
    
    showMessage('备注更新成功', 'success')
  } catch (error) {
    console.error('更新备注失败:', error)
    // API失败时显示错误，但保留编辑状态
    showMessage(`备注更新失败: ${error.message}`, 'error')
    // 保持编辑状态，让用户可以重试
  } finally {
    // 延迟重置保存状态，避免快速连续操作
    setTimeout(() => {
      if (state) {
        state.savingRemark = false
        editStates.value.set(itemId, state)
        triggerRef(editStates)
      }
    }, 100)
  }
}

const cancelEditRemark = (item) => {
  const itemId = item.id || item.address
  const state = editStates.value.get(itemId)
  
  if (state) {
    // 恢复原始备注内容
    state.editingRemark = item.remark || ''
    state.isEditingRemark = false
    state.savingRemark = false
    editStates.value.set(itemId, state)
    triggerRef(editStates)
  }
}

// 删除聪明钱地址
const deleteSmartMoneyAddress = async (item) => {
  if (!confirm(`确定要删除地址 ${formatAddress(item.address)} 吗？`)) {
    return
  }

  const itemId = item.id || item.address
  const state = editStates.value.get(itemId) || {}

  try {
    // 设置删除状态
    state.deleting = true
    editStates.value.set(itemId, state)
    triggerRef(editStates)

    // 调用删除API
    await deleteAddressAPI(item.id)

    // 清除编辑状态
    editStates.value.delete(itemId)

    // 重新加载当前页数据
    await loadRankingData()

    showMessage('地址删除成功', 'success')
  } catch (error) {
    console.error('删除地址失败:', error)
    showMessage(`删除失败: ${error.message}`, 'error')
  } finally {
    state.deleting = false
    editStates.value.set(itemId, state)
    triggerRef(editStates)
  }
}

// 暴露方法给父组件
defineExpose({
  loadRankingData
})
</script>

<style scoped>
/* 排行榜样式 */
.ranking-dialog {
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

.profit-rate-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn {
  opacity: 0.7;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* 链类型筛选器 */
.chain-filter {
  margin: 0;
}

/* 暴击倍数筛选器 */
.count-filter-input {
  width: 140px;
}

.count-filter-chips {
  margin: 0;
}

.chain-cell {
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

.remark-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.remark-chip {
  cursor: pointer;
  transition: all 0.3s ease;
}

.remark-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.remark-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.remark-input {
  flex: 1;
  min-width: 150px;
}

.mobile-remark {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-remark-edit {
  display: block;
  width: 100%;
}

.remark-actions {
  display: flex;
  gap: 5px;
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

/* 桌面端分页器 */
.desktop-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

/* 排行榜响应式设计 */
@media (max-width: 768px) {
  .ranking-dialog {
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

  .chain-filter {
    flex-wrap: wrap;
  }

  .count-filter-input {
    width: 120px;
  }

  .count-filter-chips {
    flex-wrap: wrap;
  }

  .remark-edit {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .remark-input {
    flex: 1;
  }

  .mobile-remark-edit {
    display: block;
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