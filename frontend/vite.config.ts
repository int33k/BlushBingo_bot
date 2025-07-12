import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { edgeCompatibilityPlugin } from './vite-edge-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    edgeCompatibilityPlugin()
  ],
  server: {
    open: true,
    cors: true,
    host: true
  },
  resolve: {
    alias: {
      '@b3/shared': '../shared'
    }
  },
  optimizeDeps: {
    include: ['@b3/shared']
  },
  build: {
    commonjsOptions: {
      include: [/shared/, /node_modules/]
    },
    rollupOptions: {
      output: {
        // Ensure proper file extensions for content-type detection
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash].css'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  esbuild: {
    // Ensure proper JavaScript output for Edge
    target: 'es2020',
    format: 'esm'
  }
})
