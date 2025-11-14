import { createUnplugin } from "unplugin";
import { setupMcpMiddleware } from "./middleware/mcp-middleware";
import { setupInspectorMiddleware } from "./middleware/inspector-middleware";

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

        async configureServer(server) {
          console.log("\n✨ Dev Inspector Plugin enabled!");
          console.log("👁️  Click the floating eye icon to inspect elements\n");

          if (enableMcp) {
            await setupMcpMiddleware(server.middlewares);
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
