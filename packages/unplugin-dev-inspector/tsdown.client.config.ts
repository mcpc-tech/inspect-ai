import { defineConfig } from "tsdown";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import fs from "fs";
import path from "path";

export default defineConfig({
  entry: ["client/inspector.tsx"],
  format: ["iife"],
  outDir: "client/dist",
  clean: true,
  dts: false,
  external: [], // Don't externalize anything
  noExternal: [/@mcpc-tech\/cmcp/, /.*/], // Bundle everything including @mcpc-tech/cmcp
  platform: "browser",
  globalName: "DevInspector",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  minify: true,
  treeshake: true,
  plugins: [
    {
      name: "css-handler",
      resolveId(id) {
        // Redirect CSS imports to our virtual module
        if (id.endsWith("styles.css")) {
          return "\0virtual:styles";
        }
        return null;
      },
      async load(id) {
        if (id === "\0virtual:styles") {
          const cssInput = fs.readFileSync("client/styles.css", "utf-8");
          
          const clientDir = path.resolve(process.cwd(), "client");
          const result = await postcss([
            tailwindcss({
              base: clientDir,
              optimize: {
                minify: false,
              },
            }),
          ]).process(cssInput, {
            from: path.join(clientDir, "styles.css"),
            to: undefined,
          });

          // Ensure dist directory exists for reference file
          if (!fs.existsSync("client/dist")) {
            fs.mkdirSync("client/dist", { recursive: true });
          }

          // Write the processed CSS file for reference
          fs.writeFileSync("client/dist/inspector.css", result.css);

          // Return the processed CSS as a default export
          return `export default ${JSON.stringify(result.css)};`;
        }
        return null;
      },
    },
  ],
});
