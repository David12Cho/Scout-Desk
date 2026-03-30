import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ScoutDesk',
        short_name: 'ScoutDesk',
        description: 'NHL Front Office Scouting Tool',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.nhle\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nhle-stats-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 4 }, // 4 hours
            },
          },
          {
            urlPattern: /^https:\/\/api-web\.nhle\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nhle-web-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 4 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api/nhle-stats': {
        target: 'https://api.nhle.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nhle-stats/, '/stats/rest'),
      },
      '/api/nhle-web': {
        target: 'https://api-web.nhle.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nhle-web/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
