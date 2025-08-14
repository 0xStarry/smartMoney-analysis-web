<template>
  <v-card class="welcome-section text-center pa-8" elevation="0" rounded="xl">
    <div class="welcome-icon mb-4">🚀</div>
    <h2 class="welcome-title mb-4">欢迎十三老师和洋爹回来上班</h2>
    <p class="welcome-desc mb-6">今天也是充满暴击的一天！</p>
    <p class="welcome-desc mb-6">苟富贵！勿相忘！</p>
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 102, 204, 0.2);
  animation: fadeIn 0.5s ease-out;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 102, 204, 0.1);
}

.v-theme--dark .welcome-section {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.1);
}

.welcome-icon {
  font-size: 64px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  background: linear-gradient(135deg, #0066cc 0%, #00aa44 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.v-theme--dark .welcome-title {
  background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
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