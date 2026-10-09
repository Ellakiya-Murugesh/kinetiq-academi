import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxy = {
  target: 'http://127.0.0.1:5000',
  changeOrigin: true,
  secure: false,
  configure(proxy) {
    proxy.on('error', (_error, _request, response) => {
      if (!('writeHead' in response) || response.headersSent) return;
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        success: false,
        message: 'The Kinetiq API is unavailable on port 5000. Start the backend and verify its MongoDB Atlas connection and server environment.',
      }));
    });
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: '/',
    proxy: {
      '/api': apiProxy,
    },
  },
  preview: {
    proxy: {
      '/api': apiProxy,
    },
  },
});
