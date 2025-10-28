import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import DevInspector from '@mcpc-tech/unplugin-dev-inspector-mcp/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    DevInspector({
      enabled: true,
      enableMcp: true,
    }),
    react(),
  ],
});
