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
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Sangrah',
        short_name: 'Sangrah',
        description: 'A modern note App built with react and appwrite',
        theme_color: '#000000',
        icons: [
          {
            src: 'Logo.jpg',
            sizes: '192x192',
            type: 'image/jpg',
          },
          {
            src: 'Logo.jpg',
            sizes: '512x512',
            type: 'image/jpg',
          },
          {
            src: 'Logo.jpg',
            sizes: '512x512',
            type: 'image/jpg',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
