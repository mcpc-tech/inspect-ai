import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/vite.ts',
    'src/webpack.ts',
    'src/rollup.ts',
    'src/esbuild.ts',
    'src/rspack.ts',
  ],
  format: ['esm', 'cjs'],
  clean: true,
  dts: true,
  external: [
    'vite',
    'webpack',
    'rollup',
    'esbuild',
    'rspack',
    'unplugin',
    'fs',
    'path',
    'http',
    'crypto',
    'url',
      ],
  noExternal: ['@mcpc-tech/cmcp'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
