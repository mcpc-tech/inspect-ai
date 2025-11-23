import { createUnplugin } from "unplugin";
import { setupMcpMiddleware } from "./middleware/mcproute-middleware";
import { setupInspectorMiddleware } from "./middleware/inspector-middleware";
import { setupAcpMiddleware } from "./middleware/acp-middleware";
import { transformJSX } from "./compiler/jsx-transform";
import { compileVue } from "./compiler/vue-transform";

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

      async transform(code, id) {
        if (id.includes('node_modules')) return null;

        if (id.match(/\.(jsx|tsx)$/)) {
          try {
            return await transformJSX({ code, id });
          } catch (error) {
            console.error(`[dev-inspector] Failed to transform ${id}:`, error);
            return null;
          }
        }

        if (id.match(/\.vue$/)) {
          try {
            return await compileVue({ code, id });
          } catch (error) {
            console.error(`[dev-inspector] Failed to transform ${id}:`, error);
            return null;
          }
        }

        return null;
      },

      // Vite-specific hooks
      vite: {
        apply: "serve",

        transformIndexHtml(html) {
          // Inject inspector client script and element
          return html.replace(
            "</body>",
            `<dev-inspector></dev-inspector><script src="/__inspector__/inspector.iife.js"></script></body>`
          );
        },

        async configureServer(server) {
          console.log("\n\u2728 Dev Inspector Plugin enabled!");

          if (enableMcp) {
            await setupMcpMiddleware(server.middlewares);
            setupAcpMiddleware(server.middlewares);
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
