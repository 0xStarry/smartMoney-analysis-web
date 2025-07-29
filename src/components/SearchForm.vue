<template>
  <v-card class="search-card mb-8" elevation="0" rounded="xl">
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
            <v-text-field v-model.number="searchForm.minBuyValue" label="最小买入金额" 
              placeholder="100" prepend-inner-icon="mdi-currency-usd" variant="outlined" 
              type="number" min="0" step="1" class="filter-input" suffix="USD" />

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
</template>

<script setup>
import { ref, reactive } from 'vue'

// 定义 props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

// 定义 emits
const emit = defineEmits(['search'])

// 表单数据
const searchForm = reactive({
  contractAddress: '',
  limit: 20,
  minBuyValue: 100
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

// 表单引用
const searchFormRef = ref()

// 搜索处理
const handleSearch = async () => {
  const { valid } = await searchFormRef.value.validate()
  if (!valid) return

  emit('search', {
    contractAddress: searchForm.contractAddress,
    limit: searchForm.limit,
    minBuyValue: searchForm.minBuyValue || 100
  })
}

// 暴露方法给父组件
defineExpose({
  searchForm
})
</script>

<style scoped>
/* 搜索区域 */
.search-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 102, 204, 0.2);
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 102, 204, 0.1);
}

.v-theme--dark .search-card {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.1);
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

.filter-input {
  width: 140px;
}

.limit-input {
  width: 120px;
}

.search-btn {
  background: linear-gradient(135deg, #0066cc 0%, #00aa44 100%);
  color: #ffffff;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 102, 204, 0.4);
}

.v-theme--dark .search-btn {
  background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
  color: #0a0a0a;
}

.v-theme--dark .search-btn:hover {
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 15px;
  }

  .form-controls {
    flex-direction: row;
    justify-content: space-between;
  }

  .filter-input {
    width: 120px;
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
}
</style> 