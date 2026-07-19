import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true },
      '/filters': { target: 'http://127.0.0.1:8787', changeOrigin: true },
    },
  },
})
