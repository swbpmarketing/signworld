import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/sign-company-dashboard/' : '/',
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: true,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url, '→', options.target + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Bundle all React-related libraries together to prevent multiple instances
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom',
            'recharts',
            '@tanstack/react-query',
            'react-hook-form',
            'react-hot-toast',
            '@headlessui/react',
            '@heroicons/react',
            'lucide-react',
            'framer-motion'
          ],
          // Map libraries
          'vendor-maps': [
            'leaflet',
            'react-leaflet',
            '@react-google-maps/api'
          ],
          // Calendar libraries
          'vendor-calendar': [
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction',
            '@fullcalendar/react',
            '@fullcalendar/timegrid',
            'date-fns'
          ],
          // Document generation
          'vendor-documents': [
            'jspdf',
            'jspdf-autotable',
            'html2canvas',
            'xlsx'
          ],
          // Editor
          'vendor-editor': [
            'react-quill'
          ]
        }
      }
    }
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  optimizeDeps: {
    include: ['leaflet', 'react', 'react-dom', 'recharts']
  }
})