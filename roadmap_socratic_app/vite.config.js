import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages: https://shettynvy60-commits.github.io/Astria/
  base: process.env.GITHUB_PAGES === 'true' ? '/Astria/' : '/',
  build: {
    // Suppress chunk size warnings (recharts + jspdf are large but tree-shaken)
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-is'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf'],
          'vendor-lucide': ['lucide-react'],
        }
      }
    }
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
