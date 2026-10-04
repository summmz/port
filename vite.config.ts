import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Vite 8 uses Rolldown; the legacy `manualChunks` object form is gone.
        advancedChunks: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three/ },
            { name: 'r3f', test: /node_modules[\\/]@react-three[\\/]/ },
            { name: 'post', test: /node_modules[\\/](postprocessing|gsap)/ },
          ],
        },
      },
    },
  },
})