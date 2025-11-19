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
        
        // Write the processed CSS as a JS module
        const cssJs = `export default ${JSON.stringify(result.css)};`;
        fs.writeFileSync('client/dist/inspector-styles.js', cssJs);
        
        // Also write the CSS file for reference
        fs.writeFileSync('client/dist/inspector.css', result.css);
      },
      resolveId(id) {
        // Redirect CSS imports to our generated JS module
        if (id.endsWith('styles.css')) {
          return { id: '\0virtual:styles', moduleSideEffects: false };
        }
        return null;
      },
      load(id) {
        // Return the CSS as a JS module
        if (id === '\0virtual:styles') {
          const cssPath = 'client/dist/inspector-styles.js';
          if (fs.existsSync(cssPath)) {
            return fs.readFileSync(cssPath, 'utf-8');
          }
          return 'export default "";';
        }
        return null;
      },
    },
  ],
});
