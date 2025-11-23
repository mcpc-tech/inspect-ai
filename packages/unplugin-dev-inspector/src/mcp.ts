import { createClientExecServer } from "@mcpc-tech/cmcp";
import { mcpc } from "@mcpc-tech/core";
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  type CallToolResult,
  type GetPromptResult,
  type JSONRPCMessage,
} from "@modelcontextprotocol/sdk/types.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOOL_SCHEMAS } from "./tool-schemas.js";

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
 * Call MCP server method and wait for response
 * @param mcpServer - The MCP server instance
 * @param method - The method name to call
 * @param params - Optional parameters for the method
 * @returns Promise that resolves with the method result
 */
function callMcpMethod(
  mcpServer: Awaited<ReturnType<typeof mcpc>>,
  method: string,
  params?: unknown
): Promise<unknown> {
  const messageId = Date.now();
  const message = {
    method,
    params: params as Record<string, unknown>,
    jsonrpc: "2.0" as const,
    id: messageId,
  };

  return new Promise((resolve) => {
    if (!mcpServer.transport) {
      throw new Error("MCP server transport not initialized");
    }
    mcpServer.transport.onmessage?.(message as JSONRPCMessage);

    const originalSend = mcpServer.transport.send;
    mcpServer.transport.send = function (payload: JSONRPCMessage) {
      const payloadObj = payload as { id: number; result: unknown };
      if (payloadObj.id === messageId) {
        resolve(payloadObj.result);
        if (!mcpServer.transport) {
          throw new Error("MCP server transport not initialized");
        }
        mcpServer.transport.send = originalSend;
      }
      return originalSend.call(this, payload);
    };
  });
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
      { capabilities: { tools: {}, sampling: {}, prompts: {} } },
    ],
    [
      {
        name: "chrome-devtools",
        description: `Access Chrome DevTools for browser diagnostics. Provides tools for inspecting network requests, console logs, performance metrics, and debugging the development environment.`,
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

  const mcpClientExecServer = createClientExecServer(mcpServer, "inspector");

  mcpClientExecServer.registerClientToolSchemas([
    {
      ...TOOL_SCHEMAS.capture_element_context,
    },
    {
      ...TOOL_SCHEMAS.list_inspections,
    },
    {
      ...TOOL_SCHEMAS.update_inspection_status,
    },
    {
      ...TOOL_SCHEMAS.execute_page_script,
    },
  ])

  // Prompts
  mcpServer.setRequestHandler(ListPromptsRequestSchema, async (request) => {
    return {
      prompts: [
        {
          name: "capture-element",
          title: "Capture Element Context",
          description:
            "Capture context about a UI element for troubleshooting and investigation.",
          arguments: [],
        },
        {
          name: "view-inspections",
          title: "View All Inspections",
          description:
            "View all element inspections in the queue with their status.",
          arguments: [],
        },
      ],
    };
  });

  mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name === "capture-element") {
      const element = (await callMcpMethod(mcpServer, "tools/call", {
        name: "capture_element_context",
        arguments: { },
      })) as CallToolResult;

      return {
        messages:
          element?.content.map((item) => ({
            role: "user",
            content: item,
          })) || [],
      } as GetPromptResult;
    } else if (request.params.name === "view-inspections") {
      const inspections = (await callMcpMethod(mcpServer, "tools/call", {
        name: "list_inspections",
        arguments: {},
      })) as CallToolResult;

      return {
        messages:
          inspections?.content.map((item) => ({
            role: "user",
            content: item,
          })) || [],
      } as GetPromptResult;
    } else {
      throw new Error(`Unknown promptId: ${request.params.name}`);
    }
  });

  return mcpClientExecServer;
}
