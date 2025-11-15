import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { useEffect, useRef } from "react";
import { createClientExecClient } from "@mcpc-tech/cmcp";

const TIMEOUT_MS = 600_000;

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
  // Dispatch custom event to activate inspector (works across shadow DOM)
  window.dispatchEvent(new CustomEvent("activate-inspector"));
  return { success: true };
}

function formatResult(sourceInfo: any, feedback: string) {
  const { file, line, column, component } = sourceInfo;
  
  // Extract full path for display
  const fullPath = file.startsWith('examples/') ? file : `examples/demo/${file}`;
  
  return {
    content: [
      {
        type: "text",
        text: `# Element Inspection Result

## Source Location
- **File**: \`${fullPath}\`
- **Line**: ${line}
- **Column**: ${column}
- **Component**: ${component}

## User Feedback
${feedback}

## Instructions for AI
You must create a step-by-step plan and use the "report_plan_progress" tool to report progress for each step. When all steps are completed, you MUST provide the "result" field in the final report_plan_progress call.`,
      },
    ],
  };
}

function report_plan_progress(args: any) {
  const { plan, result } = args;

  console.log("📋 report_plan_progress called with plan:", plan);

  window.dispatchEvent(
    new CustomEvent("plan-progress-reported", {
      detail: { plan, result, timestamp: new Date().toISOString() },
    })
  );

  const completed = plan.steps.filter(
    (s: any) => s.status === "completed"
  ).length;
  const total = plan.steps.length;
  const isAllCompleted = completed === total;

  console.log(`✅ Plan progress: ${completed}/${total} steps completed`);

  const responseData: any = {
    success: true,
    completed,
    total,
  };

  if (isAllCompleted && result) {
    responseData.result = result;
    console.log("🎉 All tasks completed with result:", result);

    // Dispatch result event to update UI to success state
    window.dispatchEvent(
      new CustomEvent("feedback-result-received", {
        detail: {
          status: "success",
          result: { message: result },
        },
      })
    );
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(responseData, null, 2),
      },
    ],
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
      "use-mcp-react-client"
    );

    function handleElementInspected(event: CustomEvent) {
      console.log("📨 Element inspected event received", event.detail);

      if (!pendingResolve) {
        console.warn("⚠️ No pending MCP request - feedback ignored");
        return;
      }

      const { sourceInfo, feedback } = event.detail;
      const result = formatResult(sourceInfo, feedback);

      console.log("✅ Resolving MCP request with:", result);
      pendingResolve(result);
      clearPendingRequest();
    }

    function handleInspectorCancelled() {
      cancelPendingRequest("Inspector cancelled by user");
    }

    async function inspectElement(args: any) {
      const prompt = args.prompt || "Please select an element on the page";

      cancelPendingRequest("New inspect request started");

      activateInspector();

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

    window.addEventListener(
      "element-inspected",
      handleElementInspected as EventListener
    );
    window.addEventListener(
      "inspector-cancelled",
      handleInspectorCancelled as EventListener
    );

    client.registerTools([
      {
        name: "inspect_element",
        description: "Activate element inspector and wait for user selection.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Prompt to guide user selection",
              default: "Please select an element on the page",
            },
          },
        },
        implementation: inspectElement,
      },
      // {
      //   name: "report_plan_progress",
      //   description: "Report plan progress with step status updates.",
      //   inputSchema: {
      //     type: "object",
      //     properties: {
      //       plan: {
      //         type: "object",
      //         properties: {
      //           steps: {
      //             type: "array",
      //             items: {
      //               type: "object",
      //               properties: {
      //                 id: { type: "number" },
      //                 title: { type: "string" },
      //                 status: {
      //                   type: "string",
      //                   enum: ["pending", "in-progress", "completed", "failed"],
      //                 },
      //               },
      //               required: ["id", "title", "status"],
      //             },
      //           },
      //         },
      //         required: ["steps"],
      //       },
      //       result: {
      //         type: "string",
      //         description:
      //           "Result summary to be included when all tasks are completed",
      //       },
      //     },
      //     required: ["plan"],
      //   },
      //   implementation: report_plan_progress,
      // },
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
      window.removeEventListener(
        "element-inspected",
        handleElementInspected as EventListener
      );
      window.removeEventListener(
        "inspector-cancelled",
        handleInspectorCancelled as EventListener
      );
      transport.close?.();
    };
  }, []);

  return clientRef.current;
}
