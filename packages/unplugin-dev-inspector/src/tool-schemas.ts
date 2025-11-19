/**
 * Shared tool schemas for MCP inspector tools
 * Used by both server and client implementations
 */

export const TOOL_SCHEMAS = {
  inspect_element: {
    name: "inspect_element",
    description: "Activate the visual element inspector to let the user select a UI element on the page. The user will click an element and provide feedback about what they want to change. Returns the source code location and user feedback.",
    inputSchema: {
      type: "object" as const,
      properties: {
        prompt: {
          type: "string",
          description: "Message to display to the user while they select an element (e.g., 'Please click the button you want to modify')",
        },
      },
    },
  },

  get_all_feedbacks: {
    name: "get_all_feedbacks",
    description: "Get a list of all current feedback items in the queue, including their status (pending/loading/success/error) and progress. Use this to see what tasks are already being worked on.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },

  update_feedback_status: {
    name: "update_feedback_status",
    description: "Update the status of the current feedback item in the user's queue. Use this to show progress or mark completion.",
    inputSchema: {
      type: "object" as const,
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
      required: ["status"] as string[],
    },
  },
} as const;
