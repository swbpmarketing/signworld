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
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable sourcemaps for debugging production errors
    minify: 'terser',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }

          // Router and state management
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/zustand')) {
            return 'vendor-router';
          }

          // Data fetching and forms
          if (id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/axios') ||
              id.includes('node_modules/react-hook-form')) {
            return 'vendor-data';
          }

          // Map libraries - large bundle
          if (id.includes('node_modules/leaflet') ||
              id.includes('node_modules/react-leaflet') ||
              id.includes('node_modules/@react-google-maps')) {
            return 'vendor-maps';
          }

          // Calendar libraries - large bundle
          if (id.includes('node_modules/@fullcalendar') ||
              id.includes('node_modules/date-fns')) {
            return 'vendor-calendar';
          }

          // Chart libraries - large bundle
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }

          // Document generation - large bundle
          if (id.includes('node_modules/jspdf') ||
              id.includes('node_modules/html2canvas') ||
              id.includes('node_modules/xlsx')) {
            return 'vendor-documents';
          }

          // Rich text editor - large bundle
          if (id.includes('node_modules/react-quill') ||
              id.includes('node_modules/quill')) {
            return 'vendor-editor';
          }

          // Animation libraries
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-animation';
          }

          // UI libraries
          if (id.includes('node_modules/@headlessui') ||
              id.includes('node_modules/@heroicons') ||
              id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }

          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        }
      }
    }
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  optimizeDeps: {
    include: ['leaflet']
  }
})