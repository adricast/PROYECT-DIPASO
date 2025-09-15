import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      filename: 'sw.ts', 
      registerType: 'autoUpdate', // La PWA se actualizará automáticamente
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'], 
      manifest: {
        name: 'Mi App React',
        short_name: 'ReactPWA',
        description: 'Mi aplicación convertida en PWA con Vite',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/mi-api\.com\/.*$/, // si tienes API
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
            },
          },
        ],
      },
    }),
  ],
});
