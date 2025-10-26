import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "crypto";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode,
  type ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { Connect } from "vite";

import { bindPuppet, createClientExecServer } from "@mcpc-tech/cmcp";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

interface SourceMetadata {
  file: string;
  component: string;
  apis: string[];
  line: number;
  column: number;
}

/**
 * Create and configure the MCP server for source inspection
 */
function createSourceInspectorMcpServer(
  sourceMapCache: Map<string, SourceMetadata>
) {
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

  // List resources handler
  mcpServer.setRequestHandler(ListResourcesRequestSchema, () => {
    return {
      resources: [
        {
          uri: "inspector://source-map",
          name: "Source Map",
          description: "Complete source map cache data",
          mimeType: "application/json",
        },
      ],
    };
  });

  // Read resource handler
  mcpServer.setRequestHandler(
    ReadResourceRequestSchema,
    (request, _extra): ReadResourceResult => {
      if (request.params.uri === "inspector://source-map") {
        const sourceMapData: Record<string, SourceMetadata> = {};
        for (const [key, value] of sourceMapCache.entries()) {
          sourceMapData[key] = value;
        }

        return {
          contents: [
            {
              uri: "inspector://source-map",
              mimeType: "application/json",
              text: JSON.stringify(sourceMapData, null, 2),
            },
          ],
        };
      }
      throw new McpError(ErrorCode.InvalidRequest, "Resource not found");
    }
  );

  return mcpServer;
}

/**
 * Setup MCP server endpoints in Vite dev server
 */
export function setupMcpServer(
  sourceMapCache: Map<string, SourceMetadata>,
  middlewares: Connect.Server
) {
  const mcpServer = createSourceInspectorMcpServer(sourceMapCache);

  // Store transports by session ID
  const transports: Record<
    string,
    StreamableHTTPServerTransport | SSEServerTransport
  > = {};

  console.log("\n🔌 MCP Server enabled!");
  console.log("📡 Streamable HTTP: POST/GET/DELETE to /__mcp__");
  console.log(
    "📡 SSE (deprecated): GET /__mcp__/sse, POST /__mcp__/messages\n"
  );

  // Middleware to handle MCP requests
  middlewares.use(
    async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const url = req.url || "";

      // Streamable HTTP endpoint - supports both new and old protocol
      if (
        url.startsWith("/__mcp__") &&
        !url.startsWith("/__mcp__/sse") &&
        !url.startsWith("/__mcp__/messages")
      ) {
        if (req.method === "POST") {
          await handleStreamableHttpPost(req, res, mcpServer, transports);
        } else if (req.method === "GET") {
          await handleStreamableHttpGet(req, res, transports);
        } else if (req.method === "DELETE") {
          await handleStreamableHttpDelete(req, res, transports);
        } else {
          res.writeHead(405).end("Method Not Allowed");
        }
        return;
      }

      // SSE endpoint (deprecated, for backwards compatibility)
      if (url.startsWith("/__mcp__/sse") && req.method === "GET") {
        await handleSseConnection(req, res, sourceMapCache, transports);
        return;
      }

      // SSE messages endpoint (deprecated)
      if (url.startsWith("/__mcp__/messages") && req.method === "POST") {
        await handleSseMessage(req, res, transports);
        return;
      }

      next();
    }
  );
}

/**
 * Handle Streamable HTTP POST requests
 */
async function handleStreamableHttpPost(
  req: IncomingMessage,
  res: ServerResponse,
  mcpServer: Server,
  transports: Record<string, StreamableHTTPServerTransport | SSEServerTransport>
) {
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    // Read request body
    const body = await readRequestBody(req);
    const parsedBody = JSON.parse(body);

    if (sessionId && transports[sessionId]) {
      const existingTransport = transports[sessionId];
      if (existingTransport instanceof StreamableHTTPServerTransport) {
        transport = existingTransport;
      } else {
        res.writeHead(400, { "Content-Type": "application/json" }).end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Session exists but uses a different transport protocol",
            },
            id: null,
          })
        );
        return;
      }
    } else if (!sessionId && isInitializeRequest(parsedBody)) {
      // New session
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
        },
        enableJsonResponse: false,
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      await mcpServer.connect(transport);
    } else {
      res.writeHead(400, { "Content-Type": "application/json" }).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Invalid session ID or not an initialize request",
          },
          id: null,
        })
      );
      return;
    }

    await transport.handleRequest(req, res, parsedBody);
  } catch (error) {
    console.error("Error handling Streamable HTTP POST:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" }).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        })
      );
    }
  }
}

/**
 * Handle Streamable HTTP GET requests (SSE stream)
 */
async function handleStreamableHttpGet(
  req: IncomingMessage,
  res: ServerResponse,
  transports: Record<string, StreamableHTTPServerTransport | SSEServerTransport>
) {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.writeHead(400).end("Invalid or missing session ID");
    return;
  }

  const transport = transports[sessionId];
  if (!(transport instanceof StreamableHTTPServerTransport)) {
    res.writeHead(400).end("Session uses different transport");
    return;
  }

  await transport.handleRequest(req, res);
}

/**
 * Handle Streamable HTTP DELETE requests
 */
async function handleStreamableHttpDelete(
  req: IncomingMessage,
  res: ServerResponse,
  transports: Record<string, StreamableHTTPServerTransport | SSEServerTransport>
) {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.writeHead(404).end("Session not found");
    return;
  }

  const transport = transports[sessionId];
  if (!(transport instanceof StreamableHTTPServerTransport)) {
    res.writeHead(400).end("Session uses different transport");
    return;
  }

  await transport.handleRequest(req, res);
}

/**
 * Handle SSE connection (deprecated)
 */
async function handleSseConnection(
  req: IncomingMessage,
  res: ServerResponse,
  sourceMapCache: Map<string, SourceMetadata>,
  transports: Record<string, StreamableHTTPServerTransport | SSEServerTransport>
) {
  try {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const transport = new SSEServerTransport("/__mcp__/messages", res);
    const sessionId = transport.sessionId;
    const aliasSessionId = url.searchParams.get("sessionId") || sessionId;
    const puppetId = url.searchParams.get("puppetId");

    const runningHostTransport = Object.values(transports).find(
      // @ts-expect-error -
      (t) => t.__puppetId === sessionId || t.__puppetId === aliasSessionId
    );
    // Reconnect puppet transport if found
    if (runningHostTransport) {
      bindPuppet(runningHostTransport, transport);
      console.log(`Reconnected puppet transport: ${aliasSessionId}`);
    }
    if (puppetId) {
      bindPuppet(transport, transports[puppetId]);
      // @ts-expect-error -
      transport.__puppetId = puppetId;
    }

    transports[sessionId] = transport;
    if (aliasSessionId) {
      transports[aliasSessionId] = transport;
    }

    transport.onclose = () => {
      console.log(`SSE transport closed: ${aliasSessionId}`);
      delete transports[sessionId];
      delete transports[aliasSessionId];
    };

    const server = createClientExecServer(
      createSourceInspectorMcpServer(sourceMapCache),
      "source-inspector-controller"
    );
    await server.connect(transport);
  } catch (error) {
    console.error("Error establishing SSE connection:", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Error establishing SSE stream");
    }
  }
}

/**
 * Handle SSE message (deprecated)
 */
async function handleSseMessage(
  req: IncomingMessage,
  res: ServerResponse,
  transports: Record<string, StreamableHTTPServerTransport | SSEServerTransport>
) {
  try {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      res.writeHead(400).end("Missing sessionId parameter");
      return;
    }

    const transport = transports[sessionId];
    if (!transport || !(transport instanceof SSEServerTransport)) {
      res.writeHead(404).end("Session not found or wrong transport type");
      return;
    }

    const body = await readRequestBody(req);
    const parsedBody = JSON.parse(body);

    await transport.handlePostMessage(req, res, parsedBody);
  } catch (error) {
    console.error("Error handling SSE message:", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Internal server error");
    }
  }
}

/**
 * Helper to read request body
 */
function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", reject);
  });
}

/**
 * Helper to check if request is an initialize request
 */
function isInitializeRequest(body: any): boolean {
  return body && body.method === "initialize" && body.jsonrpc === "2.0";
}
