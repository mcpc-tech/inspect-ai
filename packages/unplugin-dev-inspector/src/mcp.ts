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
import { PROMPT_SCHEMAS } from "./prompt-schemas.js";
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
      {
        capabilities: {
          tools: {
            listChanged: true
          },
          sampling: {},
          prompts: {
            listChanged: true
          }
        }
      },
    ],
    [
      {
        name: "chrome_devtools",
        description: `Access Chrome DevTools for browser diagnostics. Provides tools for inspecting network requests, console logs, and performance metrics. Must first call chrome_navigate_page to launch Chrome before using these capabilities.`,
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
    ],
  );

  const mcpClientExecServer = createClientExecServer(mcpServer, "inspector");

  // Client tools
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
          ...PROMPT_SCHEMAS.capture_element,
        },
        {
          ...PROMPT_SCHEMAS.view_inspections,
        },
        {
          ...PROMPT_SCHEMAS.launch_chrome_devtools,
        },
        {
          ...PROMPT_SCHEMAS.refresh_chrome_state,
        }
      ],
    };
  });

  mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const promptName = request.params.name as keyof typeof PROMPT_SCHEMAS;

    switch (promptName) {
      case "capture_element": {
        const element = (await callMcpMethod(mcpServer, "tools/call", {
          name: "capture_element_context",
          arguments: {},
        })) as CallToolResult;

        return {
          messages:
            element?.content.map((item) => ({
              role: "user",
              content: item,
            })) || [],
        } as GetPromptResult;
      }

      case "view_inspections": {
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
      }

      case "launch_chrome_devtools": {
        const url = request.params.arguments?.url as string | undefined;

        if (!url) {
          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: "Error: URL is required. Please provide a URL to navigate to (e.g., http://localhost:5173)",
                },
              },
            ],
          } as GetPromptResult;
        }

        try {
          new URL(url);
        } catch (error) {
          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Error: Invalid URL format: "${url}". Please provide a valid URL (e.g., http://localhost:5173)`,
                },
              },
            ],
          } as GetPromptResult;
        }

        try {
          const result = (await callMcpMethod(mcpServer, "tools/call", {
            name: "chrome_devtools",
            arguments: {
              useTool: 'chrome_navigate_page',
              hasDefinitions: [
                'chrome_navigate_page'
              ],
              chrome_navigate_page: {
                url,
              }
            },
          })) as CallToolResult;



          return {
            messages: [
              ...(result?.content || []).map((item) => ({
                role: "user" as const,
                content: item,
              })),
            ],
          } as GetPromptResult;
        } catch (error) {
          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Error launching Chrome DevTools: ${error instanceof Error ? error.message : String(error)}`,
                },
              },
            ],
          } as GetPromptResult;
        }
      }

      case 'refresh_chrome_state':
        try {
          const result = (await callMcpMethod(mcpServer, "tools/call", {
            name: "chrome_devtools",
            arguments: {
              useTool: 'chrome_list_network_requests',
              hasDefinitions: [
                'chrome_list_network_requests'
              ],
              chrome_list_network_requests: {}
            },
          })) as CallToolResult;
          // Extract reqIds from the network requests text
          const requestsText = result?.content?.map((item) => item.text).join('\n') || '';
          const reqIdMatches = requestsText.matchAll(/reqid=(\d+)\s+(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)\s+\[([^\]]+)\]/g);
          const requestOptions = Array.from(reqIdMatches)
            .map(match => {
              const [, reqId, method, url, status] = match;
              // Truncate long URLs to 60 characters with ellipsis
              const truncatedUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
              return `  ${reqId}: ${method} ${truncatedUrl} [${status}]`;
            })
            .reverse() // Show newest requests first
            .join('\n');

          // Dynamically update the prompts arguments
          mcpServer.setRequestHandler(ListPromptsRequestSchema, async (request) => {
            return {
              prompts: [
                {
                  ...PROMPT_SCHEMAS.capture_element,
                },
                {
                  ...PROMPT_SCHEMAS.view_inspections,
                },
                {
                  ...PROMPT_SCHEMAS.launch_chrome_devtools,
                },
                {
                  ...PROMPT_SCHEMAS.refresh_chrome_state,
                },
                {
                  ...PROMPT_SCHEMAS.get_network_requests,
                  // TODO: currently, MCP prompt arguments are not typed, and can only be strings,
                  // see https://github.com/modelcontextprotocol/modelcontextprotocol/issues/136
                  arguments: [
                    {
                      name: "reqid",
                      description: `The request ID to get details for. Available requests:\n\n${requestOptions || 'No requests available'}`,
                      required: true,
                    }
                  ]
                }
              ],
            };
          });

          await mcpServer.sendPromptListChanged()

          return {
            messages: [
              ...(result?.content || []).map((item) => ({
                role: "user" as const,
                content: item,
              })),
            ],
          } as GetPromptResult;
        } catch (error) {
          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Error launching Chrome DevTools: ${error instanceof Error ? error.message : String(error)}`,
                },
              },
            ],
          } as GetPromptResult;
        }

      case 'get_network_requests':
        const reqid = parseInt(request.params.arguments?.reqid as string);
        try {
          const result = (await callMcpMethod(mcpServer, "tools/call", {
            name: "chrome_devtools",
            arguments: {
              useTool: 'chrome_get_network_request',
              hasDefinitions: [
                'chrome_get_network_request'
              ],
              chrome_get_network_request: {
                reqid
              }
            },
          })) as CallToolResult;



          return {
            messages: [
              ...(result?.content || []).map((item) => ({
                role: "user" as const,
                content: item,
              })),
            ],
          } as GetPromptResult;
        } catch (error) {
          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Error launching Chrome DevTools: ${error instanceof Error ? error.message : String(error)}`,
                },
              },
            ],
          } as GetPromptResult;
        }


      default:
        throw new Error(`Unknown promptId: ${promptName}`);
    }
  });

  return mcpClientExecServer;
}
