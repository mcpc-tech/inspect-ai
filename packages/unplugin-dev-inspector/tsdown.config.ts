import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],  // ESM only - dependencies use import.meta which breaks CJS
  clean: true,
  dts: true,
  hash: false,
  external: [
    // Bundler integrations - provided by user's project
    "vite",
    "webpack",
    "rollup",
    "esbuild",
    "rspack",
    "unplugin",
    // Node built-ins
    "fs",
    "path",
    "http",
    "crypto",
    "url",
    // Vue compiler - optional peer dependency
    "@vue/compiler-sfc",
    "@vue/compiler-core",
    "@vue/shared",
    // React/Vue - provided by user's project
    "react",
    "react-dom",
    "vue",
    // All runtime dependencies - keep external
    "@modelcontextprotocol/sdk",
    "@agentclientprotocol/sdk",
    "@mcpc-tech/cmcp",
    "@mcpc-tech/core",
    "@mcpc-tech/acp-ai-provider",
    "chrome-devtools-mcp",
    "mcp-remote",
    "ai",
    "zod",
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
