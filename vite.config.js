import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.png'],
      manifest: {
        name: 'Santa-Blanca TCG',
        short_name: 'SB-TCG',
        description: 'Sammle, tausche und öffne Booster im Santa-Blanca TCG',
        theme_color: '#0d0d1a',
        background_color: '#0d0d1a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // GitHub Pages: Repository-Name als Base-Path
  // Ändere 'SB-Sammelkartenspiel' zu deinem Repository-Namen falls abweichend
  base: '/SB-Sammelkartenspiel/',
})
