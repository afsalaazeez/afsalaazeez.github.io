import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // Three.js is an intentional ~512 kB async vendor chunk (off the critical
    // path), so raise the limit above it to avoid a misleading size warning.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep Three.js in its own async, long-cacheable chunk separate
          // from the (more frequently changing) scene code in src/webgl.
          three: [
            'three',
            'three/examples/jsm/controls/OrbitControls.js',
            'three/examples/jsm/geometries/RoundedBoxGeometry.js',
          ],
        },
      },
    },
  },
})
