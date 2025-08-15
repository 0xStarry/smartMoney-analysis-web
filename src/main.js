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
          primary: '#0066cc',
          secondary: '#00aa44',
          accent: '#ff0066',
          error: '#dc3545',
          warning: '#fd7e14',
          info: '#0d6efd',
          success: '#198754',
          background: '#f8f9fa',
          surface: '#ffffff',
          'on-primary': '#ffffff',
          'on-secondary': '#ffffff',
          'on-background': '#212529',
          'on-surface': '#212529',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#00d4ff',
          secondary: '#00ff88',
          accent: '#ff006e',
          error: '#ff4757',
          warning: '#ffa502',
          info: '#3742fa',
          success: '#2ed573',
          background: '#0a0a0a',
          surface: '#1a1a2e',
          'on-primary': '#ffffff',
          'on-secondary': '#0a0a0a',
          'on-background': '#ffffff',
          'on-surface': '#ffffff',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
      elevation: 0,
      class: 'text-none font-weight-bold',
    },
    VTextField: {
      density: 'comfortable',
      variant: 'outlined',
      hideDetails: 'auto',
      rounded: 'lg',
    },
    VSelect: {
      density: 'comfortable',
      variant: 'outlined',
      hideDetails: 'auto',
      rounded: 'lg',
      menuProps: { maxHeight: 320 },
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
    VChip: {
      rounded: 'lg',
    },
    VDataTable: {
      density: 'comfortable',
      hover: true,
    },
  },
})

const app = createApp(App)

app.use(vuetify)
app.mount('#app')