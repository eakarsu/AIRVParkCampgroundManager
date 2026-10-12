import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const demo = loadEnv(mode, '..', 'DEMO_');
  return {
  plugins: [react()],
  define: {
    'import.meta.env.VITE_DEMO_EMAIL': JSON.stringify(demo.DEMO_EMAIL || ''),
    'import.meta.env.VITE_DEMO_PASSWORD': JSON.stringify(demo.DEMO_PASSWORD || ''),
  },
  server: {
    port: Number(process.env.FRONTEND_PORT || 3001),
    proxy: {
      '/api': process.env.VITE_API_URL || 'http://localhost:4004'
    }
  }
  };
});
