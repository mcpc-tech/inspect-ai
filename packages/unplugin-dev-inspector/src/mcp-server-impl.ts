import { Server } from "@modelcontextprotocol/sdk/server/index.js";
/**
 * Create and configure the MCP server for source inspection
 */
export function createSourceInspectorMcpServer() {
  const mcpServer = new Server(
    {
      name: "source-inspector-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  return mcpServer;
}
