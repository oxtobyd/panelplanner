import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3006,
    host: true,
    proxy: {
      '/api': {
        target: 'http://192.168.1.181:3001',
        changeOrigin: true,
      },
    },
  },
});
