import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/',
  server: {
    proxy: {
      '/priapi': {
        target: 'https://web3.okx.com',
        changeOrigin: true,
        secure: true
      },
      '/api': {
        target: 'https://api.young13.club',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
