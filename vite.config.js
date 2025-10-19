// vite.config.js
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sourceInspectorPlugin } from './vite-plugins/source-inspector-plugin.ts';

export default defineConfig({
  plugins: [
    sourceInspectorPlugin(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
