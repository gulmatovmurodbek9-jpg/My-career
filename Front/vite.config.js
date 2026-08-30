import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Номи пакетро аз роҳи модул мегирад: .../node_modules/<name>/... */
function packageName(id) {
  const tail = id.split('node_modules/').pop()
  return tail.startsWith('@') ? tail.split('/').slice(0, 2).join('/') : tail.split('/')[0]
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Китобхонаҳои вазнинро аз коди сафҳа ҷудо мекунад, то онҳо танҳо дар
    // саҳифае, ки воқеан истифодашон мебарад, бор шаванд ва байни деплойҳо дар
    // кеши браузер боқӣ монанд.
    rollupOptions: {
      output: {
        // Шакли функсионалӣ, на объектӣ: шакли объектӣ ҳар китобхонаи
        // номбаршударо ҳамчун нуқтаи вуруди мустақил ба bundle медарорад, ҳатто
        // агар ҳеҷ код онро истифода набарад.
        //
        // Муқоиса бо номи ДАҚИҚИ пакет меравад, на бо substring: ҳангоми
        // муқоисаи қисмӣ `react-is` ба ҳеҷ гурӯҳ намеафтод, Rollup онро ба
        // vendor-charts мепартофт, ва сафҳаи асосӣ 364 КБ recharts-ро мекашид.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          const name = packageName(id)

          if (name === 'three' || name.startsWith('@react-three')) return 'vendor-three'
          if (name === 'leaflet' || name === 'react-leaflet' || name.startsWith('@react-leaflet')) {
            return 'vendor-map'
          }
          if (name === 'recharts' || name.startsWith('d3-') || name === 'victory-vendor' ||
              name === 'internmap' || name === 'decimal.js-light') {
            return 'vendor-charts'
          }
          if (name === 'framer-motion' || name === 'motion' || name.startsWith('motion-')) {
            return 'vendor-motion'
          }
          if (name.includes('i18next')) return 'vendor-i18n'

          // Ҳамаи бақия — як гурӯҳи муштарак. Бе ин, модулҳои тақсимнашуда
          // тасодуфан ба гурӯҳи вазнин меафтоданд ва онро ба сафҳаи асосӣ
          // мекашиданд.
          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
