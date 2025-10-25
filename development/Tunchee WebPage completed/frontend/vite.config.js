import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize build for performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'react-icons', 'swiper'],
          utils: ['axios', 'react-hook-form', 'react-helmet-async']
        }
      }
    },
    // Enable source maps for production debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    // Enable HMR for better development experience
    hmr: {
      overlay: true
    },
    // Proxy API calls to backend
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'axios',
      'react-router-dom',
      'react-icons'
    ]
  }
})
