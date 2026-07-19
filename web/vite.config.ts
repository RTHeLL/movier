import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveBase(): string {
  let base = process.env.VITE_BASE || '/'
  // Git Bash на Windows превращает "/movier/" в путь вида "C:/.../Git/movier"
  if (/^[A-Za-z]:[\\/]/.test(base)) {
    const normalized = base.replace(/\\/g, '/')
    const idx = normalized.lastIndexOf('/movier')
    base = idx >= 0 ? normalized.slice(idx) : '/movier/'
  }
  if (!base.startsWith('/')) base = `/${base}`
  if (!base.endsWith('/')) base = `${base}/`
  return base
}

export default defineConfig({
  base: resolveBase(),
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
