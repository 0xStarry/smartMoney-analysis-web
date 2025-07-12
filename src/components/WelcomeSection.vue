<template>
  <v-card class="welcome-section text-center pa-8" elevation="8" rounded="xl">
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
</template>

<script setup>
// 欢迎页面组件，无需额外逻辑
</script>

<style scoped>
.welcome-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  animation: fadeIn 0.5s ease-out;
  transition: all 0.3s ease;
}

.v-theme--dark .welcome-section {
  background: rgba(30, 30, 30, 0.95);
}

.welcome-icon {
  font-size: 64px;
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
</style> 