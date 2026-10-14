import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredApiBaseUrl = (env.VITE_API_BASE_URL || env.BACKEND_URL || 'http://127.0.0.1:5000').trim();
  const proxyTarget = (() => {
    try {
      return new URL(configuredApiBaseUrl).origin;
    } catch {
      return configuredApiBaseUrl.replace(/\/+$/, '');
    }
  })();

  const apiProxy = {
    target: proxyTarget,
    changeOrigin: true,
    secure: false,
    configure(proxy) {
      proxy.on('error', (_error, _request, response) => {
        if (!('writeHead' in response) || response.headersSent) return;
        response.writeHead(503, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          success: false,
          message: `The Kinetiq API is unavailable at ${proxyTarget}. Start the backend and verify its MongoDB Atlas connection and server environment.`,
        }));
      });
    },
  };

  return {
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
  };
});
