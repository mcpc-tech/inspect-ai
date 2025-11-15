import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { useEffect, useRef } from "react";
import { createClientExecClient } from "@mcpc-tech/cmcp";

const STORAGE_KEY = 'inspector-feedback-items';
const FEEDBACK_ID_KEY = 'inspector-current-feedback-id';
const TIMEOUT_MS = 600_000;

let pendingResolve: ((value: any) => void) | null = null;
let pendingReject: ((reason: any) => void) | null = null;

function clearPendingRequest() {
  pendingResolve = null;
  pendingReject = null;
}

function cancelPendingRequest(reason: string) {
  if (pendingReject) {
    pendingReject(new Error(reason));
    clearPendingRequest();
  }
}

function activateInspector() {
  window.dispatchEvent(new CustomEvent("activate-inspector"));
  return { success: true };
}

function createTextContent(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function formatElementInfo(elementInfo: any) {
  if (!elementInfo) return '';
  
  const { tagName, textContent, className, id: elemId, styles } = elementInfo;
  return `
**DOM Element**:
\`\`\`
Tag: <${tagName}${elemId ? ` id="${elemId}"` : ''}${className ? ` class="${className}"` : ''}>
Text: ${textContent || '(empty)'}
\`\`\`

**Key Styles**:
- display: ${styles.display}
- color: ${styles.color}
- background: ${styles.backgroundColor}
- font-size: ${styles.fontSize}
`;
}

function getAllFeedbacks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const items = saved ? JSON.parse(saved) : [];
    
    if (items.length === 0) {
      return createTextContent("# No Feedback Items\n\nThe queue is empty. Use 'inspect_element' to add tasks.");
    }
    
    const feedbackList = items.map((item: any, index: number) => {
      const { id, sourceInfo, feedback, status, progress, result } = item;
      const statusText = status === 'loading' && progress 
        ? `LOADING (${progress.completed}/${progress.total} steps)`
        : status.toUpperCase();
      
      return `## ${index + 1}. Feedback ID: \`${id}\`

**Status**: ${statusText}
**File**: ${sourceInfo.file}
**Line**: ${sourceInfo.line}
**Component**: ${sourceInfo.component}
${formatElementInfo(sourceInfo.elementInfo)}
**User Request**:
${feedback}

${result ? `**Result**: ${result}\n` : ''}---`;
    }).join('\n\n');
    
    const hint = `\n\n## How to Update\n\nUse \`update_feedback_status\` tool to update any feedback:\n\n\`\`\`\nupdate_feedback_status({\n  feedbackId: "feedback-xxx",  // Copy from above\n  status: "completed",\n  message: "Your summary here"\n})\n\`\`\``;
    
    return createTextContent(`# Feedback Queue (${items.length} items)\n\n${feedbackList}${hint}`);
  } catch (e) {
    return createTextContent("# Error\n\nFailed to load feedback items.");
  }
}

function formatResult(sourceInfo: any, feedback: string) {
  const { file, line, component, elementInfo } = sourceInfo;
  const fullPath = file.startsWith('examples/') ? file : `examples/demo/${file}`;
  
  const domInfo = elementInfo ? `
## DOM Element
\`\`\`
Tag: <${elementInfo.tagName}${elementInfo.id ? ` id="${elementInfo.id}"` : ''}${elementInfo.className ? ` class="${elementInfo.className}"` : ''}>
Text: ${elementInfo.textContent || '(empty)'}
\`\`\`

### Key Styles
\`\`\`css
display: ${elementInfo.styles.display}
color: ${elementInfo.styles.color}
background: ${elementInfo.styles.backgroundColor}
font-size: ${elementInfo.styles.fontSize}
padding: ${elementInfo.styles.padding}
margin: ${elementInfo.styles.margin}
\`\`\`
` : '';
  
  return createTextContent(`# Element Inspection Result

## Source Code
- **File**: ${fullPath}
- **Line**: ${line}
- **Component**: ${component}
${domInfo}
## User Request
${feedback}

## Your Task
1. Use 'read_file' to see the current code
2. Make the necessary changes based on the user's request
3. Call 'update_feedback_status' to update progress:
   - Use status="in-progress" with progress details while working
   - Use status="completed" with a message summary when done
   - Use status="failed" with error message if something goes wrong`);
}

function updateFeedbackStatus(args: any) {
  const { feedbackId: providedId, status, progress, message } = args;
  let feedbackId = providedId || sessionStorage.getItem(FEEDBACK_ID_KEY) || '';

  if (!feedbackId) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const items = saved ? JSON.parse(saved) : [];
      const loadingItem = items.find((item: any) => item.status === 'loading');
      
      if (loadingItem) {
        feedbackId = loadingItem.id;
        sessionStorage.setItem(FEEDBACK_ID_KEY, feedbackId);
      } else {
        return createTextContent("Error: No active feedback item found. Please use 'get_all_feedbacks' to see the queue, then provide the feedbackId parameter.");
      }
    } catch {
      return createTextContent("Error: No active feedback item");
    }
  }

  if (progress) {
    window.dispatchEvent(new CustomEvent("plan-progress-reported", {
      detail: { plan: { steps: progress.steps }, feedbackId, timestamp: new Date().toISOString() },
    }));
  }

  if (status === 'completed' || status === 'failed') {
    sessionStorage.removeItem(FEEDBACK_ID_KEY);
    window.dispatchEvent(new CustomEvent("feedback-result-received", {
      detail: {
        status: status === 'completed' ? "success" : "error",
        result: { message: message || (status === 'completed' ? 'Task completed' : 'Task failed') },
        feedbackId,
      },
    }));
    return createTextContent(`Feedback marked as ${status}.`);
  }

  return createTextContent("Status updated");
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
      "use-mcp-react-client"
    );

    // Tool implementations
    async function inspectElement(args: any) {
      cancelPendingRequest("New inspect request started");
      activateInspector();

      return new Promise((resolve, reject) => {
        pendingResolve = resolve;
        pendingReject = reject;

        setTimeout(() => {
          if (pendingReject === reject) {
            clearPendingRequest();
            reject(new Error("Timeout: No element selected"));
          }
        }, TIMEOUT_MS);
      });
    }

    // Event handlers
    function handleElementInspected(event: CustomEvent) {
      if (!pendingResolve) return;

      const { sourceInfo, feedback, feedbackId } = event.detail;
      sessionStorage.setItem(FEEDBACK_ID_KEY, feedbackId);
      
      pendingResolve(formatResult(sourceInfo, feedback));
      clearPendingRequest();
    }

    function handleInspectorCancelled() {
      sessionStorage.removeItem(FEEDBACK_ID_KEY);
      cancelPendingRequest("Inspector cancelled by user");
    }

    // Register all event listeners
    const eventHandlers = [
      { event: "element-inspected", handler: handleElementInspected },
      { event: "inspector-cancelled", handler: handleInspectorCancelled },
    ];

    eventHandlers.forEach(({ event, handler }) => {
      window.addEventListener(event, handler as EventListener);
    });

    // Register all tools
    client.registerTools([
      {
        name: "get_all_feedbacks",
        description: "Get a list of all current feedback items in the queue, including their status (pending/loading/success/error) and progress. Use this to see what tasks are already being worked on.",
        inputSchema: {
          type: "object",
          properties: {},
        },
        implementation: getAllFeedbacks,
      },
      {
        name: "inspect_element",
        description: "Activate the visual element inspector to let the user select a UI element on the page. The user will click an element and provide feedback about what they want to change. Returns the source code location and user feedback.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Message to display to the user while they select an element (e.g., 'Please click the button you want to modify')",
              default: "Please select an element on the page",
            },
          },
        },
        implementation: inspectElement,
      },
      {
        name: "update_feedback_status",
        description: "Update the status of the current feedback item in the user's queue. Use this to show progress or mark completion.",
        inputSchema: {
          type: "object",
          properties: {
            feedbackId: {
              type: "string",
              description: "Optional feedback ID. If not provided, will use the most recent loading feedback or the one from session.",
            },
            status: {
              type: "string",
              enum: ["in-progress", "completed", "failed"],
              description: "Current status: 'in-progress' for updates, 'completed' when done, 'failed' on error",
            },
            progress: {
              type: "object",
              properties: {
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      title: { type: "string" },
                      status: {
                        type: "string",
                        enum: ["pending", "in-progress", "completed", "failed"],
                      },
                    },
                    required: ["id", "title", "status"],
                  },
                },
              },
              description: "Optional progress info with step-by-step details",
            },
            message: {
              type: "string",
              description: "Status message or completion summary. REQUIRED when status is 'completed' or 'failed'",
            },
          },
          required: ["status"],
        },
        implementation: updateFeedbackStatus,
      },
    ]);

    const transport = new SSEClientTransport(
      new URL("/__mcp__/sse?sessionId=chrome", window.location.origin)
    );

    client
      .connect(transport)
      .then(() => {
        clientRef.current = client;
        console.log("MCP client connected");
      })
      .catch((err) => {
        console.error("MCP connection error:", err);
      });

    return () => {
      eventHandlers.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler as EventListener);
      });
      transport.close?.();
    };
  }, []);

  return clientRef.current;
}
