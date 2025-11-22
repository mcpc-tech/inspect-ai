/**
 * Shared tool schemas for MCP inspector tools
 * Used by both server and client implementations
 */

export const TOOL_SCHEMAS = {
  inspect_element: {
    name: "inspect_element",
    description:
      "Activate the visual element inspector to let the user select a UI element on the page. The user will click an element and provide feedback about what they want to change. Returns the source code location and user feedback.\n\n**Usage Workflow**:\n1. Call this tool to activate the inspector\n2. User clicks an element on the page\n3. User provides feedback describing desired changes\n4. Tool returns comprehensive context including:\n   - Source file location (file, line, column)\n   - Component name\n   - DOM structure and hierarchy\n   - Complete computed styles (categorized)\n   - Element bounding box and position\n   - User's feedback text\n\n**Returned Data Structure**:\n- **Source Code**: File path, line number, component name\n- **DOM Element**: Tag, ID, classes, attributes, text content, DOM path\n- **Styles**: Categorized styles (layout, typography, spacing, background, border, effects, flexbox, grid)\n- **Position**: Bounding box with coordinates and dimensions\n- **User Request**: The user's feedback describing what to change",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },

  get_all_feedbacks: {
    name: "get_all_feedbacks",
    description:
      "Get a list of all current feedback items in the queue, including their status (pending/loading/success/error) and progress. Use this to see what tasks are already being worked on.\n\n**Feedback Status Lifecycle**:\n- **pending**: New feedback, not yet started\n- **loading**: Currently being processed by an agent\n- **success**: Successfully completed\n- **error**: Failed with an error\n\n**When to Use**:\n- Before starting new work to check existing queue\n- To find feedback IDs for status updates\n- To batch process multiple related feedback items\n- To check status of ongoing work\n\n**Processing Best Practices**:\n1. Review all pending items before starting\n2. Group related feedback items together\n3. Process in order of priority/dependency\n4. Use update_feedback_status to track progress\n5. Handle dependencies between items carefully",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },

  update_feedback_status: {
    name: "update_feedback_status",
    description:
      "Update the status of the current feedback item in the user's queue. Use this to show progress or mark completion.\n\n**Status Transitions**:\n1. **in-progress**: Call when starting work or making progress\n   - Include progress.steps array to show detailed progress\n   - Update periodically as you complete steps\n   \n2. **completed**: Call when work is successfully finished\n   - REQUIRED: Include message with completion summary\n   - Describe what was changed/accomplished\n   \n3. **failed**: Call if unable to complete the task\n   - REQUIRED: Include message with error explanation\n   - Suggest next steps or alternatives if possible\n\n**Progress Reporting**:\n- Provide step-by-step progress updates\n- Keep steps concise and descriptive\n- Update as each major step completes\n- Helps user understand what's happening\n\n**Examples**:\n```javascript\n// Starting work\nupdate_feedback_status({\n  status: 'in-progress',\n  progress: {\n    steps: [\n      { id: 1, title: 'Reading source file', status: 'completed' },\n      { id: 2, title: 'Modifying styles', status: 'in-progress' },\n      { id: 3, title: 'Testing changes', status: 'pending' }\n    ]\n  }\n});\n\n// Completing work\nupdate_feedback_status({\n  status: 'completed',\n  message: 'Updated button color to blue and increased padding by 8px'\n});\n```",
    inputSchema: {
      type: "object" as const,
      properties: {
        feedbackId: {
          type: "string",
          description:
            "Optional feedback ID. If not provided, will use the most recent loading feedback or the one from session.",
        },
        status: {
          type: "string",
          enum: ["in-progress", "completed", "failed"],
          description:
            "Current status: 'in-progress' for updates, 'completed' when done, 'failed' on error",
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
          description:
            "Status message or completion summary. REQUIRED when status is 'completed' or 'failed'",
        },
      },
      required: ["status"] as string[],
    },
  },

  patch_context: {
    name: "patch_context",
    description:
      "Retrieve additional runtime context for a previously inspected element. This tool queries the live DOM to get fresh data about an element from a feedback item.\n\n**When to Use**:\n- Need updated styles after making changes\n- Want to verify current DOM state\n- Need additional context not in original inspection\n- Debugging style/layout issues\n\n**Context Types**:\n- **styles**: Fresh computed styles (all categories)\n- **dom**: Current DOM state (attributes, position, hierarchy)\n- **events**: Event listeners attached to element (if available)\n- **all**: Complete context (default)\n\n**Returns**: Fresh snapshot of element's current runtime state",
    inputSchema: {
      type: "object" as const,
      properties: {
        feedbackId: {
          type: "string",
          description: "The feedback item ID to get context for",
        },
        contextType: {
          type: "string",
          enum: ["styles", "dom", "events", "all"],
          description: "Type of context to retrieve (default: 'all')",
        },
      },
      required: ["feedbackId"] as string[],
    },
  },
} as const;

