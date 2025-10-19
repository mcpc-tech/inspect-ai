import { defineConfig } from 'tsdown'

export default defineConfig({
  // Define NODE_ENV for production
  define: {
    'process.env.NODE_ENV': '"production"',
    'production': 'true',
  },
  // Bundle all dependencies inline for IIFE format
  external: [],
  noExternal: [/.*/],
  // Provide name for IIFE
  format: ['iife'],
  globalName: 'InspectorAPI',
} as any)

