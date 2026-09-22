import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: path.resolve(process.cwd(), 'client'),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(process.cwd(), 'client/src') } },
  build: { outDir: path.resolve(process.cwd(), 'dist'), emptyOutDir: true },
  server: { host: '0.0.0.0', port: 3000, hmr: process.env.DISABLE_HMR !== 'true' },
});
