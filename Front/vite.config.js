import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // manualChunks бардошта шуд: тақсими дастӣ бо пакетҳои CommonJS (React, three,
    // drei) давраҳои chunk месохт ва сайти production сиёҳ мемонд
    // («reading 'useLayoutEffect'», «setting 'Children'»). Rollup худаш аз рӯи
    // lazy()-ҳо тақсим мекунад — харита, 3D ва PDF алоҳида бор мешаванд.
    chunkSizeWarningLimit: 700,
  },
})
