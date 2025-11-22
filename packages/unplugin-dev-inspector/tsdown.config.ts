import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  clean: true,
  dts: true,
  hash: false,
  external: [
    "vite",
    "webpack",
    "rollup",
    "esbuild",
    "rspack",
    "unplugin",
    "fs",
    "path",
    "http",
    "crypto",
    "url",
  ],
  noExternal: ["@mcpc-tech/cmcp"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
