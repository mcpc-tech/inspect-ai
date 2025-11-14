import { createUnplugin } from "unplugin";
import fs from "fs";
import path from "path";
import type { Connect } from "vite";
import { setupMcpServer } from "./mcp-server.js";
import { setupInspectorMiddleware } from "./inspector-middleware.js";

export interface DevInspectorOptions {
  /**
   * Enable/disable the plugin
   * @default true in development, false in production
   */
  enabled?: boolean;

  /**
   * Enable MCP server for AI integration
   * @default true
   */
  enableMcp?: boolean;
}

function extractComponentName(code: string, id: string): string {
  let match = code.match(/export\s+default\s+function\s+(\w+)/);
  if (match) return match[1];

  match = code.match(/export\s+default\s+(\w+)/);
  if (match) return match[1];

  match = code.match(/function\s+(\w+)\s*\(/);
  if (match) return match[1];

  match = code.match(/const\s+(\w+)\s*=/);
  if (match) return match[1];

  return path.basename(id, path.extname(id));
}

function getLineAndColumn(
  code: string,
  componentName: string
): { line: number; column: number } {
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes(`function ${componentName}`) ||
      line.includes(`const ${componentName}`) ||
      (line.includes("export default") && line.includes(componentName))
    ) {
      const column = line.indexOf(componentName) + 1;
      return {
        line: i + 1,
        column: column,
      };
    }
  }

  return { line: 1, column: 1 };
}

export const unplugin = createUnplugin<DevInspectorOptions | undefined>(
  (options = {}) => {
    const enabled = options.enabled ?? process.env.NODE_ENV !== "production";
    const enableMcp = options.enableMcp ?? true;

    if (!enabled) {
      return {
        name: "unplugin-dev-inspector",
      };
    }

    return {
      name: "unplugin-dev-inspector",

      enforce: "pre",

      transform() {},

      // Vite-specific hooks
      vite: {
        apply: "serve",

        transformIndexHtml(html) {
          // Inject inspector CSS and client script
          const injectedHead = html.replace(
            "</head>",
            `<link rel="stylesheet" href="/__inspector__/inspector.css"></head>`
          );
          return injectedHead.replace(
            "</body>",
            `<script src="/__inspector__/inspector.iife.js"></script></body>`
          );
        },

        configureServer(server) {
          console.log("\n✨ Dev Inspector Plugin enabled!");
          console.log("👁️  Click the floating eye icon to inspect elements\n");

          if (enableMcp) {
            setupMcpServer(server.middlewares);
          }
          setupInspectorMiddleware(server.middlewares);
        },

        handleHotUpdate() {},
      },

      // Webpack-specific hooks
      webpack(compiler) {
        // Webpack implementation would go here
        console.log("⚠️  Webpack support coming soon");
      },

      // Rollup-specific hooks
      rollup: {
        // Rollup implementation
      },

      // esbuild-specific hooks
      esbuild: {
        setup(build) {
          // esbuild implementation
        },
      },
    };
  }
);

export default unplugin;
