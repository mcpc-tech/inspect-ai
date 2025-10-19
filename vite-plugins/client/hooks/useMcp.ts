import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { useEffect, useRef } from "react";
import { createClientExecClient } from "@mcpc-tech/cmcp";

const INSPECTOR_BUTTON_ID = 'source-inspector-btn';
const TIMEOUT_MS = 30000;

let pendingResolve: ((value: any) => void) | null = null;
let pendingReject: ((reason: any) => void) | null = null;

function cancelPendingRequest(reason: string) {
  if (pendingReject) {
    pendingReject(new Error(reason));
    pendingResolve = null;
    pendingReject = null;
  }
}

function clearPendingRequest() {
  pendingResolve = null;
  pendingReject = null;
}

function activateInspector() {
  const button = document.getElementById(INSPECTOR_BUTTON_ID) as HTMLButtonElement;
  
  if (!button) {
    return { error: "Inspector button not found" };
  }

  if (!button.classList.contains('active')) {
    button.click();
  }

  return { success: true };
}

function formatResult(sourceInfo: any, feedback: string) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        file: sourceInfo.file,
        component: sourceInfo.component,
        apis: sourceInfo.apis,
        line: sourceInfo.line,
        column: sourceInfo.column,
        feedback,
        timestamp: new Date().toISOString()
      }, null, 2)
    }]
  };
}

export function useMcp() {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (clientRef.current) return;

    const client = createClientExecClient(
      new Client(
        { name: "use-mcp-react-client", version: "0.1.0" },
        { capabilities: { tools: {} } }
      ), 
      'use-mcp-react-client'
    );

    function handleElementInspected(event: CustomEvent) {
      if (!pendingResolve) return;

      const { sourceInfo, feedback } = event.detail;
      const result = formatResult(sourceInfo, feedback);
      
      pendingResolve(result);
      clearPendingRequest();
    }

    function handleInspectorCancelled() {
      cancelPendingRequest("Inspector cancelled by user");
    }

    async function inspectElement(args: any) {
      const prompt = args.prompt || "Please select an element on the page";
      
      cancelPendingRequest("New inspect request started");

      const activation = activateInspector();
      if (activation.error) {
        return {
          content: [{ type: "text", text: `Error: ${activation.error}` }],
          isError: true
        };
      }

      console.log(`🔍 Inspector: ${prompt}`);

      return new Promise((resolve, reject) => {
        pendingResolve = resolve;
        pendingReject = reject;

        setTimeout(() => {
          if (pendingReject === reject) {
            clearPendingRequest();
            reject(new Error("Timeout: No element selected within 30 seconds"));
          }
        }, TIMEOUT_MS);
      });
    }

    window.addEventListener('element-inspected', handleElementInspected as EventListener);
    window.addEventListener('inspector-cancelled', handleInspectorCancelled as EventListener);

    client.registerTools([{
      name: "inspect_element",
      description: "Activate the element inspector and wait for user to select and submit an element. Returns source location, component info, APIs used, and user feedback.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Optional prompt to guide user selection",
            default: "Please select an element on the page"
          }
        }
      },
      implementation: inspectElement
    }]);

    const transport = new SSEClientTransport(
      new URL("/__mcp__/sse?sessionId=chrome", window.location.origin)
    );

    client.connect(transport).then(() => {
      clientRef.current = client;
      console.log("MCP client connected");
    }).catch((err) => {
      console.error("MCP connection error:", err);
    });

    return () => {
      window.removeEventListener('element-inspected', handleElementInspected as EventListener);
      window.removeEventListener('inspector-cancelled', handleInspectorCancelled as EventListener);
      transport.close?.();
    };
  }, []);

  return clientRef.current;
}
