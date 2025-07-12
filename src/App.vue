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
        <SearchForm 
          :loading="loading" 
          @search="handleSearch" 
          ref="searchFormRef"
        />

        <!-- 结果区域 -->
        <v-card v-if="displayData.length > 0" class="result-card" elevation="8" rounded="xl">
          <v-card-title class="result-header">
            <div class="d-flex align-center flex-wrap">
              <div class="d-flex align-center me-4">
                <v-icon icon="mdi-trophy" color="warning" class="me-2" />
                <span>排行榜</span>
              </div>
              <v-chip color="success" size="small" variant="flat">
                共 {{ displayData.length }} 条数据
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
              <DataTable 
                :items="displayData" 
                v-model:selected-items="selectedItems" 
                :loading="loading"
                :min-buy-value="minBuyValue"
                @copy-address="handleCopyAddress"
              />
            </div>

            <!-- 移动端卡片列表 -->
            <div class="mobile-cards">
              <MobileCards 
                :items="displayData" 
                v-model:selected-items="selectedItems"
                :min-buy-value="minBuyValue"
                @copy-address="handleCopyAddress"
              />
            </div>
          </v-card-text>
        </v-card>

        <!-- 空状态 -->
        <EmptyState 
          v-else-if="!loading && searched"
          @retry="handleRetry"
        />

        <!-- 欢迎页面 -->
        <WelcomeSection v-else-if="!loading && !searched" />
      </v-container>
    </v-main>

    <!-- 排行榜弹窗 -->
    <RankingDialog 
      v-model:visible="rankingDialog" 
      @show-message="showMessage"
      ref="rankingDialogRef"
    />

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
import { ref, reactive } from 'vue'
import { useTheme } from 'vuetify'
import { useSmartMoneyApp } from './composables/useSmartMoneyApp'

// 组件导入
import SearchForm from './components/SearchForm.vue'
import DataTable from './components/DataTable.vue'
import MobileCards from './components/MobileCards.vue'
import WelcomeSection from './components/WelcomeSection.vue'
import EmptyState from './components/EmptyState.vue'
import RankingDialog from './components/RankingDialog.vue'

// 主题管理
const theme = useTheme()

// 使用 composable
const {
  loading,
  searched,
  tokenExists,
  displayData,
  selectedItems,
  minBuyValue,
  handleSearch: searchHandler,
  saveToDatabase: saveHandler,
  copyAddress: copyHandler,
  updateSelectedItems
} = useSmartMoneyApp()

// 组件引用
const searchFormRef = ref()
const rankingDialogRef = ref()

// 排行榜状态
const rankingDialog = ref(false)

// 消息提示
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
})

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

// 搜索处理
const handleSearch = async (searchParams) => {
  const result = await searchHandler(searchParams)
  showMessage(result.message, result.success ? 'success' : result.success === false ? 'warning' : 'error')
}

// 保存到数据库
const saveToDatabase = async () => {
  const contractAddress = searchFormRef.value?.searchForm?.contractAddress
  if (!contractAddress) {
    showMessage('请先进行搜索', 'warning')
    return
  }

  showMessage(`正在保存 ${selectedItems.value.length} 条数据到数据库...`, 'info')
  const result = await saveHandler(contractAddress)
  showMessage(result.message, result.success ? 'success' : 'error')
}

// 复制地址处理
const handleCopyAddress = async (address) => {
  const result = await copyHandler(address)
  showMessage(result.message, result.success ? 'success' : 'error')
}

// 重试处理
const handleRetry = () => {
  if (searchFormRef.value) {
    const searchForm = searchFormRef.value.searchForm
    handleSearch({
      contractAddress: searchForm.contractAddress,
      limit: searchForm.limit
    })
  }
}

// 排行榜相关方法
const openRankingDialog = () => {
  rankingDialog.value = true
  if (rankingDialogRef.value) {
    rankingDialogRef.value.loadRankingData()
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

/* 移动端卡片 */
.mobile-cards {
  display: none;
}

/* 排行榜样式 */
.ranking-btn {
  transition: all 0.3s ease;
}

.ranking-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .logo-title {
    font-size: 20px;
  }

  .main-container {
    padding: 20px 15px;
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

  .ranking-btn .btn-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .logo-icon {
    font-size: 24px;
  }

  .logo-title {
    font-size: 18px;
  }
}
</style>