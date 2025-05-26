import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#667eea',
          secondary: '#764ba2',
          accent: '#67c23a',
          error: '#f56c6c',
          warning: '#e6a23c',
          info: '#409eff',
          success: '#67c23a',
          background: '#ffffff',
          surface: '#ffffff',
          'on-primary': '#ffffff',
          'on-secondary': '#ffffff',
          'on-background': '#000000',
          'on-surface': '#000000',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#667eea',
          secondary: '#764ba2',
          accent: '#67c23a',
          error: '#f56c6c',
          warning: '#e6a23c',
          info: '#409eff',
          success: '#67c23a',
          background: '#121212',
          surface: '#1e1e1e',
          'on-primary': '#ffffff',
          'on-secondary': '#ffffff',
          'on-background': '#ffffff',
          'on-surface': '#ffffff',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(vuetify)
app.mount('#app')