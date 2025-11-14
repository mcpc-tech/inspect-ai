import { mcpc } from "@mcpc-tech/core";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Get Chrome DevTools binary path from npm package, then use node to run it, faster/stabler than npx
 */
function getChromeDevToolsBinPath(): string {
  const resolver = (import.meta as { resolve?: (specifier: string) => string })
    .resolve;
  if (!resolver) throw new Error("Cannot resolve chrome-devtools-mcp package");

  const pkgUrl = resolver("chrome-devtools-mcp/package.json");
  const chromeDevTools = path.dirname(fileURLToPath(pkgUrl));
  return path.join(chromeDevTools, "./build/src/index.js");
}

/**
 * Create and configure the MCP server for source inspection
 */
export async function createInspectorMcpServer() {
  const mcpServer = await mcpc(
    [
      {
        name: "dev-inspector",
        version: "1.0.0",
        title:
          "A tool for inspecting and interacting with the development environment.",
      },
      { capabilities: { tools: {}, sampling: {} } },
    ],
    [
      {
        name: "inspector",
        description: "Inspector",
        options: {
          refs: ['<tool name="chrome.__ALL__"/>'],
        },
        deps: {
          mcpServers: {
            chrome: {
              transportType: "stdio",
              command: "node",
              args: [getChromeDevToolsBinPath()],
            },
          },
        },
      },
    ]
  );

  return mcpServer;
}
