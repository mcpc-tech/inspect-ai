import { createUnplugin } from "unplugin";
import { setupMcpMiddleware } from "./middleware/mcproute-middleware";
import { setupInspectorMiddleware } from "./middleware/inspector-middleware";
import { setupAcpMiddleware } from "./middleware/acp-middleware";
import { transformJSX } from "./compiler/jsx-transform";
import { compileVue } from "./compiler/vue-transform";
import type { Agent } from "../client/constants/agents";

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

  /**
   * Custom agents configuration
   * If provided, these will be merged with or replace the default agents
   */
  agents?: Agent[];

  /**
   * Default agent name to use
   * @default "Claude Code"
   */
  defaultAgent?: string;
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
          console.log("\n✨ Dev Inspector Plugin enabled!");

          if (enableMcp) {
            const host = server.config.server.host;
            const serverContext = {
              // Normalize host: if true, use '0.0.0.0', otherwise use the string value or 'localhost'
              host: typeof host === 'string' ? host : (host === true ? '0.0.0.0' : 'localhost'),
              port: server.config.server.port || 5173,
            };

            // Display MCP connection instructions
            const displayHost = serverContext.host === '0.0.0.0' ? 'localhost' : serverContext.host;
            console.log(`📡 MCP: http://${displayHost}:${serverContext.port}/__mcp__/sse?puppetId=chrome\n`);

            await setupMcpMiddleware(server.middlewares, serverContext);
            setupAcpMiddleware(server.middlewares, serverContext);
          }
          setupInspectorMiddleware(server.middlewares, {
            agents: options.agents,
            defaultAgent: options.defaultAgent,
          });
        },

        handleHotUpdate() { },
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
