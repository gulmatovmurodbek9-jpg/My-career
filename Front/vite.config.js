import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function packageName(id) {
  const tail = id.split('node_modules/').pop()
  return tail.startsWith('@') ? tail.split('/').slice(0, 2).join('/') : tail.split('/')[0]
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          const name = packageName(id)

          if (name === 'three' || name.startsWith('@react-three')) return 'vendor-three'
          if (name === 'leaflet' || name === 'react-leaflet' || name.startsWith('@react-leaflet')) {
            return 'vendor-map'
          }
          if (name === 'maplibre-gl' || name.startsWith('@maplibre')) {
            return 'vendor-maplibre'
          }
          if (name === 'jspdf' || name === 'jspdf-autotable' || name === 'fflate' ||
              name === 'fast-png' || name === 'iobuffer' || name === 'pako' ||
              name === 'canvg' || name === 'html2canvas' || name === 'dompurify') {
            return 'vendor-pdf'
          }
          if (name === 'recharts' || name.startsWith('d3-') || name === 'victory-vendor' ||
              name === 'internmap' || name === 'decimal.js-light') {
            return 'vendor-charts'
          }
          if (name === 'framer-motion' || name === 'motion' || name.startsWith('motion-')) {
            return 'vendor-motion'
          }
          if (name.includes('i18next')) return 'vendor-i18n'

          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
