import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        ws: true,
      },
      '/health': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
      },
    },
  },
});
