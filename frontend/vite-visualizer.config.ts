import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import react from '@vitejs/plugin-react-swc';
import { edgeCompatibilityPlugin } from './vite-edge-plugin';

export default defineConfig({
  plugins: [
    react(),
    edgeCompatibilityPlugin(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ]
});
