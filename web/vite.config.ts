import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Имя репозитория на GitHub Pages (project site). Для user site задайте base: '/' */
export default defineConfig({
  base: '/movier/',
  build: {
    outDir: path.resolve(__dirname, '../docs'),
    emptyOutDir: true,
  },
})
