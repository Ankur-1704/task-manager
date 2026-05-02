import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev + preview forward /api → FastAPI. `vite preview` does NOT inherit `server.proxy` unless duplicated here.
const apiProxy = {
  '/api': {
    target: process.env.VITE_API_PROXY ?? 'http://127.0.0.1:8001',
    changeOrigin: true,
  },
} satisfies Record<string, import('vite').ProxyOptions>

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: apiProxy,
  },
  preview: {
    port: 5173,
    proxy: apiProxy,
  },
  build: {
    outDir: 'dist',
  },
})
