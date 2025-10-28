import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Process CSS with Tailwind
const cssSource = readFileSync(resolve(__dirname, 'client/styles.css'), 'utf-8');
const result = await postcss([tailwindcss]).process(cssSource, {
  from: resolve(__dirname, 'client/styles.css'),
});
writeFileSync(resolve(__dirname, 'client/dist/inspector.css'), result.css);

// Build JS bundle
await build({
  entryPoints: [resolve(__dirname, 'client/inspector.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  outfile: resolve(__dirname, 'client/dist/inspector.iife.js'),
  define: { 'process.env.NODE_ENV': '"production"' },
  jsx: 'automatic',
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'empty' },
  alias: { '@': resolve(__dirname, 'client') },
  external: [],
});

console.log('✅ Client built successfully!');
