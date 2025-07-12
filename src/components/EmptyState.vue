<template>
  <v-card class="empty-section text-center pa-8" elevation="8" rounded="xl">
    <div class="empty-icon mb-4">📊</div>
    <h3 class="empty-text mb-2">未找到相关数据</h3>
    <p class="empty-subtext mb-6">请检查合约地址是否正确</p>
    <v-btn color="primary" @click="retry" prepend-icon="mdi-refresh">
      重新查询
    </v-btn>
  </v-card>
</template>

<script setup>
import { defineEmits } from 'vue'

// 定义 emits
const emit = defineEmits(['retry'])

// 重试处理
const retry = () => {
  emit('retry')
}
</script>

<style scoped>
.empty-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  animation: fadeIn 0.5s ease-out;
  transition: all 0.3s ease;
}

.v-theme--dark .empty-section {
  background: rgba(30, 30, 30, 0.95);
}

.empty-icon {
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style> 