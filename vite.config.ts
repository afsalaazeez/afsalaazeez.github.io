import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// GitHub Pages serves 404.html for unknown paths. Copy the built index.html to
// 404.html so client-side routes (e.g. /rideit) resolve to the SPA on hard
// loads / refreshes instead of returning a real 404.
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      const index = path.join(dist, 'index.html')
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, path.join(dist, '404.html'))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  base: '/',
})
