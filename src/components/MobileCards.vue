<template>
  <div class="mobile-cards">
    <v-card v-for="(item, index) in filteredItems" :key="item.holderWalletAddress" class="mobile-card ma-3"
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
            <v-chip size="small" variant="outlined" class="mb-1">买入金额</v-chip>
            <div class="data-value">${{ formatProfit(item.buyValue) }}</div>
          </v-col>
          <v-col cols="6" class="data-item">
            <v-chip size="small" variant="outlined" class="mb-1">卖出金额</v-chip>
            <div class="data-value">${{ formatProfit(item.sellValue) }}</div>
          </v-col>
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
</template>

<script setup>
import { computed } from 'vue'
import { formatAddress } from '../utils'

// 定义 props
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  selectedItems: {
    type: Array,
    default: () => []
  },
  minBuyValue: {
    type: Number,
    default: 100
  }
})

// 定义 emits
const emit = defineEmits(['update:selectedItems', 'copyAddress'])

// 不需要在这里过滤，数据已经在 composable 中过滤过了
const filteredItems = computed(() => {
  return props.items
})

// 检查项目是否选中
const isItemSelected = (item) => {
  return props.selectedItems.some(selected => selected.holderWalletAddress === item.holderWalletAddress)
}

// 切换项目选中状态
const toggleItemSelection = (item) => {
  const currentSelected = [...props.selectedItems]
  const index = currentSelected.findIndex(selected => selected.holderWalletAddress === item.holderWalletAddress)
  
  if (index > -1) {
    currentSelected.splice(index, 1)
  } else {
    currentSelected.push(item)
  }
  
  emit('update:selectedItems', currentSelected)
}

// 复制地址
const copyAddress = (address) => {
  emit('copyAddress', address)
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

// 暴露过滤后的数据给父组件
defineExpose({
  filteredItems
})
</script>

<style scoped>
.mobile-cards {
  display: block;
}

.mobile-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 102, 204, 0.2);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.mobile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 102, 204, 0.2);
}

.v-theme--dark .mobile-card {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.v-theme--dark .mobile-card:hover {
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.2);
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

.profit-positive {
  color: #198754;
}

.profit-negative {
  color: #dc3545;
}

.v-theme--dark .profit-positive {
  color: #00ff88;
  text-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
}

.v-theme--dark .profit-negative {
  color: #ff4757;
  text-shadow: 0 0 5px rgba(255, 71, 87, 0.3);
}

.mobile-card-content {
  padding-top: 16px;
}

.address-short {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #0066cc;
  font-size: 12px;
  cursor: pointer;
}

.v-theme--dark .address-short {
  color: #00d4ff;
  text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
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

/* 隐藏在桌面端 */
@media (min-width: 769px) {
  .mobile-cards {
    display: none;
  }
}
</style> 