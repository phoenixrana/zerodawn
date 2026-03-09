import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'gsap': ['gsap', 'gsap/ScrollTrigger', 'gsap/ScrollSmoother', 'gsap/SplitText', 'gsap/DrawSVGPlugin', 'gsap/ScrambleTextPlugin', 'gsap/CustomEase'],
        },
      },
    },
  },
})
