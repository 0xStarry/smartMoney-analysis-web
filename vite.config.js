import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fa } from 'vuetify/locale'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          vuetify: ['vuetify'],
          axios: ['axios']
        }
      }
    },
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  },
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
        secure: true
      }
    }
  }
})
