import { defineConfig } from 'tsdown';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import fs from 'fs';

export default defineConfig({
  entry: ['client/inspector.tsx'],
  format: ['iife'],
  outDir: 'client/dist',
  clean: true,
  dts: false,
  external: [], // Don't externalize anything
  noExternal: [/@mcpc-tech\/cmcp/, /.*/], // Bundle everything including @mcpc-tech/cmcp
  platform: 'browser',
  globalName: 'DevInspector',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  minify: true,
  treeshake: true,
  plugins: [
    {
      name: 'css-handler',
      async buildStart() {
        // Process CSS with Tailwind during build
        const cssInput = fs.readFileSync('client/styles.css', 'utf-8');
        const result = await postcss([tailwindcss]).process(cssInput, {
          from: 'client/styles.css',
          to: 'client/dist/inspector.css',
        });
        
        // Ensure dist directory exists
        if (!fs.existsSync('client/dist')) {
          fs.mkdirSync('client/dist', { recursive: true });
        }
        
        // Write the processed CSS
        fs.writeFileSync('client/dist/inspector.css', result.css);
      },
      resolveId(id) {
        // Stub out CSS imports
        if (id.endsWith('.css')) {
          return { id: '\0css-stub', moduleSideEffects: false };
        }
        return null;
      },
      load(id) {
        // Return empty module for CSS stubs
        if (id === '\0css-stub') {
          return '// CSS processed separately';
        }
        return null;
      },
    },
  ],
});
