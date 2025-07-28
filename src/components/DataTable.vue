<template>
  <v-data-table v-model="selectedItemsLocal" :headers="tableHeaders" :items="filteredItems" :loading="loading"
    class="data-table" :sort-by="[{ key: 'totalProfit', order: 'desc' }]" :no-data-text="`暂无数据（已过滤买入金额小于$${props.minBuyValue}的数据）`"
    loading-text="加载中..." :items-per-page="-1" hide-default-footer show-select return-object>
    
    <template v-slot:[`item.rank`]="{ item }">
      <div class="rank-cell">
        <v-icon v-if="item.rank === 1" icon="mdi-trophy" color="#FFD700" size="20" />
        <v-icon v-else-if="item.rank === 2" icon="mdi-trophy" color="#C0C0C0" size="18" />
        <v-icon v-else-if="item.rank === 3" icon="mdi-trophy" color="#CD7F32" size="16" />
        <span v-else class="rank-number">{{ item.rank }}</span>
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

    <template v-slot:[`item.buyValue`]="{ item }">
      <div class="value-cell">
        <span class="value-amount">
          ${{ formatProfit(item.buyValue) }}
        </span>
      </div>
    </template>

    <template v-slot:[`item.sellValue`]="{ item }">
      <div class="value-cell">
        <span class="value-amount">
          ${{ formatProfit(item.sellValue) }}
        </span>
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
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
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
  loading: {
    type: Boolean,
    default: false
  },
  minBuyValue: {
    type: Number,
    default: 100
  }
})

// 定义 emits
const emit = defineEmits(['update:selectedItems', 'copyAddress'])

// 表格头部配置
const tableHeaders = [
  { title: '排名', key: 'rank', align: 'center', width: 80, sortable: false },
  { title: '钱包地址', key: 'holderWalletAddress', align: 'start', minWidth: 200 },
  { title: '买入金额', key: 'buyValue', align: 'end', minWidth: 120 },
  { title: '卖出金额', key: 'sellValue', align: 'end', minWidth: 120 },
  { title: '总盈利', key: 'totalProfit', align: 'end', minWidth: 120 },
  { title: '盈利率', key: 'totalProfitPercentage', align: 'center', width: 120 },
]

// 处理数据，添加排名
const filteredItems = computed(() => {
  return props.items.map((item, index) => ({
    ...item,
    rank: index + 1 // 添加排名字段
  }))
})

// 本地选中项，用于双向绑定
const selectedItemsLocal = computed({
  get: () => props.selectedItems,
  set: (value) => emit('update:selectedItems', value)
})

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
.data-table {
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

.value-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.value-amount {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
  font-size: 14px;
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
</style> 