import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { useEffect, useRef } from "react";

export function useMcp() {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (clientRef.current) return;

    const client = new Client(
      { name: "use-mcp-react-client", version: "0.1.0" },
      { capabilities: { tools: {} } }
    );

    const transport = new SSEClientTransport(
      new URL("/__mcp__/sse", window.location.origin)
    );

    client.connect(transport).then(() => {
      clientRef.current = client;
      console.log("MCP client connected:", client);
    }).catch((err) => {
      console.error("MCP connection error:", err);
    });

    return () => {
      transport.close?.();
    };
  }, []);

  return clientRef.current;
}
