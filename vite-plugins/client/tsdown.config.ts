import { defineConfig } from 'tsdown'

export default defineConfig({
  // Define NODE_ENV for production
  define: {
    'process.env.NODE_ENV': '"production"',
    'production': 'true',
  },
} as any)

