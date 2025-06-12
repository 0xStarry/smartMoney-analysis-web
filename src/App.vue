<template>
  <v-app>
    <!-- 头部导航 -->
    <v-app-bar :elevation="2" class="app-header"
      :color="theme.global.current.value.dark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'" height="80">
      <v-container class="d-flex align-center justify-space-between pa-0">
        <div class="d-flex align-center">
          <div class="logo-icon me-4">💎</div>
          <div>
            <h1 class="logo-title">Solana钱包分析</h1>
          </div>
        </div>
        <div class="d-flex align-center gap-2">
          <!-- 排行榜按钮 -->
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-trophy" @click="openRankingDialog"
            class="ranking-btn">
            <span class="btn-text">排行榜</span>
          </v-btn>

          <!-- 主题切换按钮 -->
          <v-btn :icon="theme.global.current.value.dark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'"
            variant="text" @click="toggleTheme" class="theme-btn"
            :title="theme.global.current.value.dark ? '切换到亮色模式' : '切换到暗色模式'" />
        </div>
      </v-container>
    </v-app-bar>

    <!-- 主内容区域 -->
    <v-main class="app-main">
      <v-container class="main-container">
        <!-- 搜索区域 -->
        <v-card class="search-card mb-8" elevation="8" rounded="xl">
          <v-card-title class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <v-icon icon="mdi-magnify" color="primary" class="me-2" />
              <span>合约地址查询</span>
            </div>
            <v-chip color="primary" size="small" variant="flat">Beta</v-chip>
          </v-card-title>

          <v-card-text>
            <v-form ref="searchFormRef" @submit.prevent="handleSearch">
              <div class="form-row">
                <v-text-field v-model="searchForm.contractAddress" label="合约地址"
                  placeholder="请输入合约地址，例如：4fJVpHzgaQ5F5BmFWpLrVf7zdmkYJccgcz6XMQo1pump" prepend-inner-icon="mdi-magnify"
                  variant="outlined" clearable :rules="contractAddressRules" class="address-input"
                  @keyup.enter="handleSearch" />

                <div class="form-controls">
                  <v-select v-model="searchForm.limit" label="显示条数" :items="limitOptions" variant="outlined"
                    class="limit-input" />

                  <v-btn color="primary" size="large" :loading="loading" @click="handleSearch" class="search-btn"
                    prepend-icon="mdi-magnify">
                    <span class="btn-text">查询</span>
                  </v-btn>
                </div>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- 结果区域 -->
        <v-card v-if="tableData.length > 0" class="result-card" elevation="8" rounded="xl">
          <v-card-title class="result-header">
            <div class="d-flex align-center flex-wrap">
              <div class="d-flex align-center me-4">
                <v-icon icon="mdi-trophy" color="warning" class="me-2" />
                <span>排行榜</span>
              </div>
              <v-chip color="success" size="small" variant="flat">
                共 {{ tableData.length }} 条数据
              </v-chip>
              <v-chip color="info" size="small" variant="flat" class="ml-2">
                已选择 {{ selectedItems.length }} 条
              </v-chip>
            </div>
            <v-spacer />
            <div class="d-flex gap-2">
              <v-btn v-if="!tokenExists" color="secondary" variant="outlined" prepend-icon="mdi-database-plus"
                @click="saveToDatabase" size="small" :disabled="selectedItems.length === 0">
                <span class="btn-text">保存到数据库</span>
              </v-btn>
              <v-chip v-else color="success" size="small" variant="flat" prepend-icon="mdi-check-circle">
                已保存到数据库
              </v-chip>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <!-- 桌面端表格 -->
            <div class="desktop-table">
              <v-data-table v-model="selectedItems" :headers="tableHeaders" :items="displayData" :loading="loading"
                class="data-table" :sort-by="[{ key: 'totalProfit', order: 'desc' }]" no-data-text="暂无数据"
                loading-text="加载中..." :items-per-page="-1" hide-default-footer show-select return-object>
                <template v-slot:[`item.rank`]="{ index }">
                  <div class="rank-cell">
                    <v-icon v-if="index === 0" icon="mdi-trophy" color="#FFD700" size="20" />
                    <v-icon v-else-if="index === 1" icon="mdi-trophy" color="#C0C0C0" size="18" />
                    <v-icon v-else-if="index === 2" icon="mdi-trophy" color="#CD7F32" size="16" />
                    <span v-else class="rank-number">{{ index + 1 }}</span>
                  </div>
                </template>

                <template v-slot:[`item.holderWalletAddress`]="{ item }">
                  <div class="address-container">
                    <span class="address-text" @click="copyAddress(item.holderWalletAddress)">
                      {{ formatAddress(item.holderWalletAddress) }}
                    </span>
                    <div class="address-actions">
                      <v-btn icon="mdi-content-copy" variant="text" size="small"
                        @click="copyAddress(item.holderWalletAddress)" class="action-btn" />
                      <v-btn icon="mdi-open-in-new" variant="text" size="small" :href="item.explorerUrl" target="_blank"
                        class="action-btn" />
                    </div>
                  </div>
                </template>

                <template v-slot:[`item.totalProfit`]="{ item }">
                  <div class="profit-cell">
                    <span :class="getProfitClass(item.totalProfit)" class="profit-amount">
                      ${{ formatProfit(item.totalProfit) }}
                    </span>
                  </div>
                </template>

                <template v-slot:[`item.totalProfitPercentage`]="{ item }">
                  <v-chip :color="getProfitChipColor(item.totalProfit)" size="small" variant="flat">
                    {{ item.totalProfitPercentage }}%
                  </v-chip>
                </template>

                <template v-slot:[`item.boughtAvgPrice`]="{ item }">
                  <span class="price-text">${{ formatPrice(item.boughtAvgPrice) }}</span>
                </template>

                <template v-slot:[`item.soldAvgPrice`]="{ item }">
                  <span class="price-text">${{ formatPrice(item.soldAvgPrice) }}</span>
                </template>
              </v-data-table>
            </div>

            <!-- 移动端卡片列表 -->
            <div class="mobile-cards">
              <v-card v-for="(item, index) in displayData" :key="item.holderWalletAddress" class="mobile-card ma-3"
                elevation="2" rounded="lg">
                <v-card-title class="mobile-card-header">
                  <div class="d-flex align-center">
                    <v-checkbox :model-value="isItemSelected(item)" @update:model-value="toggleItemSelection(item)"
                      hide-details density="compact" class="me-3" />
                    <div class="rank-badge">
                      <v-icon v-if="index === 0" icon="mdi-trophy" color="#FFD700" size="16" />
                      <v-icon v-else-if="index === 1" icon="mdi-trophy" color="#C0C0C0" size="14" />
                      <v-icon v-else-if="index === 2" icon="mdi-trophy" color="#CD7F32" size="12" />
                      <span v-else class="rank-text">#{{ index + 1 }}</span>
                    </div>
                  </div>
                  <div class="profit-badge">
                    <span :class="getProfitClass(item.totalProfit)" class="profit-value">
                      ${{ formatProfit(item.totalProfit) }}
                    </span>
                  </div>
                </v-card-title>

                <v-card-text class="mobile-card-content">
                  <div class="address-row mb-4">
                    <v-chip size="small" variant="outlined" class="mb-2">钱包地址</v-chip>
                    <div class="d-flex justify-space-between align-center">
                      <span class="address-short" @click="copyAddress(item.holderWalletAddress)">
                        {{ formatAddress(item.holderWalletAddress) }}
                      </span>
                      <div class="mobile-actions">
                        <v-btn icon="mdi-content-copy" variant="text" size="small"
                          @click="copyAddress(item.holderWalletAddress)" />
                        <v-btn icon="mdi-open-in-new" variant="text" size="small" :href="item.explorerUrl"
                          target="_blank" />
                      </div>
                    </div>
                  </div>

                  <v-row class="data-grid">
                    <v-col cols="6" class="data-item">
                      <v-chip size="small" variant="outlined" class="mb-1">盈利率</v-chip>
                      <v-chip :color="getProfitChipColor(item.totalProfit)" size="small" variant="flat">
                        {{ item.totalProfitPercentage }}%
                      </v-chip>
                    </v-col>
                    <v-col cols="6" class="data-item">
                      <v-chip size="small" variant="outlined" class="mb-1">买入均价</v-chip>
                      <div class="data-value">${{ formatPrice(item.boughtAvgPrice) }}</div>
                    </v-col>
                    <v-col cols="12" class="data-item">
                      <v-chip size="small" variant="outlined" class="mb-1">卖出均价</v-chip>
                      <div class="data-value">${{ formatPrice(item.soldAvgPrice) }}</div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>

        <!-- 空状态 -->
        <v-card v-else-if="!loading && searched" class="empty-section text-center pa-8" elevation="8" rounded="xl">
          <div class="empty-icon mb-4">📊</div>
          <h3 class="empty-text mb-2">未找到相关数据</h3>
          <p class="empty-subtext mb-6">请检查合约地址是否正确</p>
          <v-btn color="primary" @click="handleSearch" prepend-icon="mdi-refresh">
            重新查询
          </v-btn>
        </v-card>

        <!-- 欢迎页面 -->
        <v-card v-else-if="!loading && !searched" class="welcome-section text-center pa-8" elevation="8" rounded="xl">
          <div class="welcome-icon mb-4">🚀</div>
          <h2 class="welcome-title mb-4">欢迎十三老师回来上班</h2>
          <p class="welcome-desc mb-6">今天也是充满暴击的一天！</p>
          <v-row class="feature-list justify-center">
            <v-col cols="auto" class="feature-item">
              <v-icon icon="mdi-chart-line" color="success" size="24" class="mb-2" />
              <div>实时数据分析</div>
            </v-col>
            <v-col cols="auto" class="feature-item">
              <v-icon icon="mdi-wallet" color="info" size="24" class="mb-2" />
              <div>Solana钱包排行</div>
            </v-col>
            <v-col cols="auto" class="feature-item">
              <v-icon icon="mdi-database" color="warning" size="24" class="mb-2" />
              <div>数据库保存功能</div>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </v-main>

    <!-- 排行榜弹窗 -->
    <v-dialog v-model="rankingDialog" max-width="1200" scrollable>
      <v-card class="ranking-dialog">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon icon="mdi-trophy" color="warning" class="me-2" />
            <span>钱包排行榜</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="rankingDialog = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="d-flex justify-space-between align-center mb-4">
            <h3 class="ranking-title">排行榜</h3>
            <div class="d-flex align-center gap-2">
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
              <v-btn color="primary" variant="outlined" size="small" prepend-icon="mdi-refresh" @click="loadRankingData"
                :loading="rankingLoading">
                刷新
              </v-btn>
            </div>
          </div>

          <!-- 桌面端排行榜表格 -->
          <div class="desktop-ranking">
            <v-data-table :headers="rankingHeaders" :items="filteredRankingData" :loading="rankingLoading" class="ranking-table"
              :sort-by="[{ key: 'totalProfit', order: 'desc' }]" no-data-text="暂无排行榜数据" loading-text="加载中..."
              :items-per-page="20" :items-per-page-options="[10, 20, 50, 100]">
              <template v-slot:[`item.rank`]="{ index }">
                <div class="rank-cell">
                  <v-icon v-if="index === 0" icon="mdi-trophy" color="#FFD700" size="24" />
                  <v-icon v-else-if="index === 1" icon="mdi-trophy" color="#C0C0C0" size="22" />
                  <v-icon v-else-if="index === 2" icon="mdi-trophy" color="#CD7F32" size="20" />
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>
              </template>

              <template v-slot:[`item.chainType`]="{ item }">
                <div class="chain-cell">
                  <v-chip :color="getChainTypeColor(item.chainType)" size="small" variant="flat">
                    {{ getChainTypeText(item.chainType) }}
                  </v-chip>
                </div>
              </template>

              <template v-slot:[`item.walletAddress`]="{ item }">
                <div class="address-container">
                  <span class="address-text" @click="copyAddress(item.walletAddress)">
                    {{ formatAddress(item.walletAddress) }}
                  </span>
                  <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyAddress(item.walletAddress)"
                    class="action-btn" />
                </div>
              </template>

              <template v-slot:[`item.totalProfit`]="{ item }">
                <div class="profit-cell">
                  <span :class="getProfitClass(item.totalProfit)" class="profit-amount">
                    ${{ formatProfit(item.totalProfit) }}
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

              <template v-slot:[`item.remark`]="{ item }">
                <div class="remark-cell">
                  <v-chip v-if="!item.isEditingRemark" :color="item.remark ? 'primary' : 'default'" size="small"
                    variant="outlined" @click="startEditRemark(item)" class="remark-chip">
                    <v-icon :icon="item.remark ? 'mdi-note-text' : 'mdi-note-plus'" size="14" class="me-1" />
                    {{ item.remark || '添加备注' }}
                  </v-chip>

                  <div v-else class="remark-edit">
                    <v-text-field v-model="item.editingRemark" variant="outlined" density="compact" placeholder="输入备注信息"
                      hide-details :loading="item.savingRemark" :disabled="item.savingRemark"
                      @keyup.enter="saveRemark(item)" @keyup.esc="cancelEditRemark(item)" @blur="saveRemark(item)"
                      class="remark-input" autofocus />
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
          </div>

          <!-- 移动端排行榜卡片 -->
          <div class="mobile-ranking">
            <v-card v-for="(item, index) in filteredRankingData" :key="item.walletAddress" class="ranking-card ma-2"
              elevation="2" rounded="lg">
              <v-card-title class="ranking-card-header">
                <div class="d-flex align-center">
                  <div class="rank-badge me-3">
                    <v-icon v-if="index === 0" icon="mdi-trophy" color="#FFD700" size="20" />
                    <v-icon v-else-if="index === 1" icon="mdi-trophy" color="#C0C0C0" size="18" />
                    <v-icon v-else-if="index === 2" icon="mdi-trophy" color="#CD7F32" size="16" />
                    <span v-else class="rank-text">#{{ index + 1 }}</span>
                  </div>
                  <div class="address-info">
                    <span class="address-short" @click="copyAddress(item.walletAddress)">
                      {{ formatAddress(item.walletAddress) }}
                    </span>
                  </div>
                </div>
                <div class="profit-badge">
                  <span :class="getProfitClass(item.totalProfit)" class="profit-value">
                    ${{ formatProfit(item.totalProfit) }}
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
                      <v-text-field v-model="item.editingRemark" variant="outlined" density="compact"
                        placeholder="输入备注信息" hide-details :loading="item.savingRemark" :disabled="item.savingRemark"
                        @keyup.enter="saveRemark(item)" @keyup.esc="cancelEditRemark(item)" @blur="saveRemark(item)"
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
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 加载遮罩 -->
    <v-overlay v-model="loading" class="align-center justify-center">
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>

    <!-- 消息提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          关闭
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import { formatAddress, formatDate } from './utils'
import { contractAPI } from './api'
import { batchSaveWalletData, batchSaveSmartMoneyAddresses } from './api/database'
import { getRanking, updateWalletRemark, updateSmartMoneyAddress, deleteSmartMoneyAddress as deleteAddressAPI } from './api/ranking'
import { createToken, checkTokenExists } from './api/tokens'

// 主题管理
const theme = useTheme()

// 表单数据
const searchForm = reactive({
  contractAddress: '',
  limit: 20
})

// 显示条数选项
const limitOptions = [
  { title: '10条', value: 10 },
  { title: '20条', value: 20 },
  { title: '30条', value: 30 },
  { title: '40条', value: 40 },
  { title: '50条', value: 50 },
  { title: '60条', value: 60 },
  { title: '70条', value: 70 },
  { title: '80条', value: 80 },
  { title: '90条', value: 90 },
  { title: '100条', value: 100 },
]

// 表单验证规则
const contractAddressRules = [
  v => !!v || '请输入合约地址',
]

// 表格头部配置
const tableHeaders = [
  { title: '排名', key: 'rank', align: 'center', width: 80, sortable: false },
  { title: '钱包地址', key: 'holderWalletAddress', align: 'start', minWidth: 220 },
  { title: '总盈利 (USD)', key: 'totalProfit', align: 'end', minWidth: 160 },
  { title: '盈利率', key: 'totalProfitPercentage', align: 'center', width: 120 },
  { title: '买入均价', key: 'boughtAvgPrice', align: 'end', width: 140 },
  { title: '卖出均价', key: 'soldAvgPrice', align: 'end', width: 140 },
]

// 排行榜表格头部配置
const rankingHeaders = [
  { title: '排名', key: 'rank', align: 'center', width: 80, sortable: false },
  { title: '链', key: 'chainType', align: 'center', width: 100, sortable: true },
  { title: '钱包地址', key: 'walletAddress', align: 'start', minWidth: 220, sortable: false },
  { title: '总盈利 (USD)', key: 'totalProfit', align: 'end', minWidth: 160, sortable: true },
  { title: '暴击倍数', key: 'count', align: 'center', width: 120, sortable: true },
  { title: '备注', key: 'remark', align: 'start', minWidth: 200, sortable: false },
  { title: '操作', key: 'actions', align: 'center', width: 100, sortable: false },
]

// 表格数据
const tableData = ref([])
const selectedItems = ref([])

// 排行榜数据
const rankingData = ref([])

// 状态
const loading = ref(false)
const searched = ref(false)
const searchFormRef = ref()
const tokenExists = ref(false) // 代币是否已存在

// 排行榜状态
const rankingDialog = ref(false)
const rankingLoading = ref(false)
const selectedChainType = ref('all') // 选中的链类型：all, solana, bsc

// 消息提示
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
})

// 计算属性：根据limit显示数据
const displayData = computed(() => {
  return tableData.value.slice(0, searchForm.limit)
})

// 计算属性：根据链类型筛选排行榜数据
const filteredRankingData = computed(() => {
  if (selectedChainType.value === 'all') {
    return rankingData.value
  }
  return rankingData.value.filter(item => item.chainType === selectedChainType.value)
})

// 监听displayData变化，自动更新选中项
watch(displayData, (newDisplayData) => {
  // 只保留仍在显示列表中的选中项
  selectedItems.value = selectedItems.value.filter(selected =>
    newDisplayData.some(item => item.holderWalletAddress === selected.holderWalletAddress)
  )
}, { deep: true })

// 显示消息
const showMessage = (text, color = 'success') => {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

// 主题切换
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  showMessage(`已切换到${theme.global.current.value.dark ? '暗色' : '亮色'}模式`, 'success')
}

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
const handleSearch = async () => {
  const { valid } = await searchFormRef.value.validate()
  if (!valid) return

  loading.value = true
  searched.value = true
  // 重置代币存在状态
  tokenExists.value = false

  try {
    // 并行执行查询和代币检查
    const [response] = await Promise.all([
      contractAPI.getSmartMoneyRanking(searchForm.contractAddress),
      checkToken(searchForm.contractAddress)
    ])

    if (response.data && response.data.list) {
      // 过滤掉负盈利的地址，只保留盈利的聪明钱地址
      const profitableAddresses = response.data.list.filter(item => {
        const profit = parseFloat(item.totalProfit) || 0
        return profit > 0
      })

      tableData.value = profitableAddresses
      // 默认全选显示在页面上的数据
      selectedItems.value = [...displayData.value]

      const originalCount = response.data.list.length
      const filteredCount = profitableAddresses.length
      const removedCount = originalCount - filteredCount

      if (removedCount > 0) {
        showMessage(`查询成功，共获取到 ${originalCount} 条数据，过滤掉 ${removedCount} 条负盈利地址，显示 ${filteredCount} 条盈利地址，已自动选择前 ${displayData.value.length} 条`, 'success')
      } else {
        showMessage(`查询成功，共获取到 ${filteredCount} 条盈利地址，已自动选择前 ${displayData.value.length} 条`, 'success')
      }
    } else {
      tableData.value = []
      selectedItems.value = []
      showMessage('未查询到数据', 'warning')
    }
  } catch (error) {
    tableData.value = []
    selectedItems.value = []
    console.error('查询失败:', error)
    showMessage('查询失败，请检查网络连接或稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 选择相关方法
const isItemSelected = (item) => {
  return selectedItems.value.some(selected => selected.holderWalletAddress === item.holderWalletAddress)
}

const toggleItemSelection = (item) => {
  const index = selectedItems.value.findIndex(selected => selected.holderWalletAddress === item.holderWalletAddress)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(item)
  }
}

// 保存到数据库
const saveToDatabase = async () => {
  if (selectedItems.value.length === 0) {
    showMessage('请选择要保存的数据', 'warning')
    return
  }

  try {
    loading.value = true
    showMessage(`正在保存 ${selectedItems.value.length} 条数据到数据库...`, 'info')

    // 格式化数据用于保存聪明钱地址，再次过滤确保只保存盈利地址
    const addressesToSave = selectedItems.value
      .filter(item => {
        const profit = parseFloat(item.totalProfit) || 0
        return profit > 0
      })
      .map((item) => ({
        address: item.holderWalletAddress,
        total_profit: parseFloat(item.totalProfit) || 0,
        count: 1, // 默认计数为1
        remark: null // 默认备注为空
      }))

    // 检查是否有有效的盈利地址
    if (addressesToSave.length === 0) {
      showMessage('没有盈利地址可以保存', 'warning')
      return
    }

    // 先保存聪明钱地址
    const response = await batchSaveSmartMoneyAddresses(addressesToSave)

    // 聪明钱地址保存成功后，再保存代币信息
    await createToken(searchForm.contractAddress)

    // 更新代币存在状态
    tokenExists.value = true

    const processedCount = response.data?.count || selectedItems.value.length
    showMessage(`成功保存 ${processedCount} 条聪明钱地址和代币信息`, 'success')
    console.log('保存的地址数据:', addressesToSave)
    console.log('后端处理结果:', response.data)

  } catch (error) {
    console.error('保存数据失败:', error)
    showMessage(`保存失败: ${error.message}`, 'error')
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

// 获取盈利芯片颜色
const getProfitChipColor = (profit) => {
  const num = parseFloat(profit)
  return num >= 0 ? 'success' : 'error'
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

// 复制地址
const copyAddress = async (address) => {
  try {
    await navigator.clipboard.writeText(address)
    showMessage('地址已复制到剪贴板', 'success')
  } catch (err) {
    showMessage('复制失败，请手动复制', 'error')
  }
}

// 排行榜相关方法
const openRankingDialog = () => {
  rankingDialog.value = true
  // 打开弹窗时自动加载排行榜数据
  if (rankingData.value.length === 0) {
    loadRankingData()
  }
}

// 加载排行榜数据
const loadRankingData = async () => {
  rankingLoading.value = true
  try {
    // 调用真实API接口
    const response = await getRanking({
      limit: 9999,
      page: 1,
      sortBy: 'total_profit',
      sortOrder: 'DESC'
    })

    if (response.success && response.data) {
      // 处理返回的数据，添加编辑状态字段
      const processedData = (response.data.list || response.data).map(item => {
        const walletAddress = item.address || item.walletAddress
        const chainType = getChainType(walletAddress)
        
        return {
          ...item,
          // 统一字段名
          walletAddress: walletAddress,
          totalProfit: item.total_profit || item.totalProfit,
          count: item.count || 0,
          remark: item.remark || '',
          updatedAt: item.updated_at || item.updatedAt,
          // 添加链类型
          chainType: chainType,
          // 添加编辑状态
          isEditingRemark: false,
          editingRemark: '',
          // 添加保存和删除状态
          savingRemark: false,
          deleting: false
        }
      })

      rankingData.value = processedData

      // 显示成功消息
      const total = response.data.total || response.data.pagination?.total || processedData.length
      showMessage(`排行榜加载成功，共 ${processedData.length} 条数据${total ? ` (总计 ${total} 条)` : ''}`, 'success')
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
  item.isEditingRemark = true
  item.editingRemark = item.remark || ''
}

const saveRemark = async (item) => {
  // 如果正在保存中，避免重复保存
  if (item.savingRemark) {
    return
  }

  const newRemark = item.editingRemark.trim()

  // 如果备注没有变化，直接退出编辑模式
  if (newRemark === (item.remark || '')) {
    item.isEditingRemark = false
    return
  }

  try {
    // 设置保存状态
    item.savingRemark = true

    // 调用API更新备注
    await updateSmartMoneyAddress(item.id, { remark: newRemark })

    item.remark = newRemark
    item.isEditingRemark = false
    showMessage('备注更新成功', 'success')
  } catch (error) {
    console.error('更新备注失败:', error)
    // API失败时显示错误，但保留编辑状态
    showMessage(`备注更新失败: ${error.message}`, 'error')
    // 保持编辑状态，让用户可以重试
  } finally {
    // 延迟重置保存状态，避免快速连续操作
    setTimeout(() => {
      item.savingRemark = false
    }, 100)
  }
}

const cancelEditRemark = (item) => {
  // 恢复原始备注内容
  item.editingRemark = item.remark || ''
  item.isEditingRemark = false
  item.savingRemark = false
}

// 删除聪明钱地址
const deleteSmartMoneyAddress = async (item) => {
  if (!confirm(`确定要删除地址 ${formatAddress(item.walletAddress)} 吗？`)) {
    return
  }

  try {
    // 设置删除状态
    item.deleting = true

    // 调用删除API
    await deleteAddressAPI(item.id)

    // 从列表中移除
    const index = rankingData.value.findIndex(data => data.id === item.id)
    if (index > -1) {
      rankingData.value.splice(index, 1)
    }

    showMessage('地址删除成功', 'success')
  } catch (error) {
    console.error('删除地址失败:', error)
    showMessage(`删除失败: ${error.message}`, 'error')
  } finally {
    item.deleting = false
  }
}
</script>

<style scoped>
/* 基础样式 */
.app-header {
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.v-theme--dark .app-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-subtitle {
  margin: 0;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.7;
  font-weight: 500;
}

.theme-btn {
  color: rgb(var(--v-theme-on-surface));
  transition: all 0.3s ease;
}

.theme-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  transform: rotate(180deg);
}

/* 主内容区域 */
.app-main {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: calc(100vh - 80px);
  transition: all 0.3s ease;
}

.v-theme--dark .app-main {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.main-container {
  max-width: 1200px;
  padding: 30px 20px;
}

/* 搜索区域 */
.search-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.v-theme--dark .search-card {
  background: rgba(30, 30, 30, 0.95);
}

.form-row {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.address-input {
  flex: 1;
}

.form-controls {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.limit-input {
  width: 120px;
}

.search-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 结果区域 */
.result-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  animation: fadeInUp 0.6s ease-out;
  transition: all 0.3s ease;
}

.v-theme--dark .result-card {
  background: rgba(30, 30, 30, 0.95);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

/* 桌面端表格 */
.desktop-table {
  display: block;
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

.price-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.8;
  font-size: 13px;
  font-weight: 500;
}

/* 移动端卡片 */
.mobile-cards {
  display: none;
}

.mobile-card {
  background: rgb(var(--v-theme-surface));
  transition: all 0.3s ease;
}

.mobile-card:hover {
  transform: translateY(-2px);
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
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

.profit-badge .profit-value {
  font-weight: 700;
  font-size: 18px;
}

.mobile-card-content {
  padding-top: 16px;
}

.address-short {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
}

.mobile-actions {
  display: flex;
  gap: 5px;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
}

/* 空状态和欢迎页面 */
.empty-section,
.welcome-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  animation: fadeIn 0.5s ease-out;
  transition: all 0.3s ease;
}

.v-theme--dark .empty-section,
.v-theme--dark .welcome-section {
  background: rgba(30, 30, 30, 0.95);
}

.empty-icon,
.welcome-icon {
  font-size: 64px;
}

.empty-text {
  font-size: 18px;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
}

.empty-subtext {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.7;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-desc {
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.8;
  line-height: 1.6;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.8;
  font-weight: 500;
}

/* 动画 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .logo-title {
    font-size: 20px;
  }

  .logo-subtitle {
    display: none;
  }

  .main-container {
    padding: 20px 15px;
  }

  .form-row {
    flex-direction: column;
    gap: 15px;
  }

  .form-controls {
    flex-direction: row;
    justify-content: space-between;
  }

  .limit-input {
    width: 100px;
  }

  .search-btn {
    flex: 1;
    min-width: 120px;
  }

  .btn-text {
    display: none;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .desktop-table {
    display: none;
  }

  .mobile-cards {
    display: block;
  }

  .feature-list {
    flex-direction: column;
    gap: 20px;
  }

  .feature-item {
    flex-direction: row;
    justify-content: center;
  }

  .welcome-title {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .logo-icon {
    font-size: 24px;
  }

  .logo-title {
    font-size: 18px;
  }

  .data-grid {
    gap: 10px;
  }
}

/* 排行榜样式 */
.ranking-btn {
  transition: all 0.3s ease;
}

.ranking-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

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

.count-cell {
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

.address-info {
  flex: 1;
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

/* 排行榜响应式设计 */
@media (max-width: 768px) {
  .ranking-btn .btn-text {
    display: none;
  }

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