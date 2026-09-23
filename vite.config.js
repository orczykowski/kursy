import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/kursy/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icons/icon-32.png'],
      manifest: {
        name: 'Kursy walut',
        short_name: 'Kursy',
        description: 'USD/PLN, BTC/PLN i BTC/USD z dzienną zmianą kursu',
        start_url: '/kursy/',
        scope: '/kursy/',
        display: 'standalone',
        background_color: '#16171d',
        theme_color: '#aa3bff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
