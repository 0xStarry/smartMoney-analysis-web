<template>
  <v-card class="empty-section text-center pa-8" elevation="0" rounded="xl">
    <div class="empty-icon mb-4">📊</div>
    <h3 class="empty-text mb-2">未找到相关数据</h3>
    <p class="empty-subtext mb-6">请检查合约地址是否正确</p>
    <v-btn color="primary" @click="retry" prepend-icon="mdi-refresh">
      重新查询
    </v-btn>
  </v-card>
</template>

<script setup>
// defineEmits 是编译器宏，无需导入

// 定义 emits
const emit = defineEmits(['retry'])

// 重试处理
const retry = () => {
  emit('retry')
}
</script>

<style scoped>
.empty-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 102, 204, 0.2);
  animation: fadeIn 0.5s ease-out;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 102, 204, 0.1);
}

.v-theme--dark .empty-section {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.1);
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