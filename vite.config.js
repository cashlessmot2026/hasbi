import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages sirve el sitio en /hasbi/
const base = process.env.VITE_BASE ?? '/hasbi/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'images/*.webp'],
      manifest: {
        name: 'Hasbi · Cocina rápida libanesa',
        short_name: 'Hasbi',
        description: 'Menú digital de Hasbi. Arma tu pedido y envíalo por WhatsApp.',
        lang: 'es-CO',
        theme_color: '#171827',
        background_color: '#171827',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        categories: ['food', 'shopping'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2}'],
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            // Menú desde Supabase: red primero, caché si no hay conexión
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/rest\/v1\/(products|categories).*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'menu-api', networkTimeoutSeconds: 4, expiration: { maxEntries: 20, maxAgeSeconds: 604800 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
          },
        ],
      },
    }),
  ],
});
