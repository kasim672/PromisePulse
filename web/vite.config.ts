import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * In local development, /api/ask is always proxied to a *separate loopback-only*
 * Node server started by 'npm run dev'. This avoids relying on Vite's SPA
 * fallback and prevents a missing middleware route from silently returning 404.
 *
 * The backend reads web/.env privately; nothing in this config exposes Gemini
 * credentials through VITE_* or a browser bundle. Production Vercel deploys
 * web/api/ask.js directly as a server function.
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true, // never silently open 5174 while the old app serves 5173
    proxy: {
      '/api/ask': {
        target: 'http://127.0.0.1:' + (process.env.PP_LOCAL_GEMINI_PORT || '8787'),
        changeOrigin: false,
      },
    },
  },
  build: { target: 'es2022' },
})
