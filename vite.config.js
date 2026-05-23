import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'gsap': ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'gsap/ScrambleTextPlugin', 'gsap/CustomEase'],
        },
      },
    },
  },
})
