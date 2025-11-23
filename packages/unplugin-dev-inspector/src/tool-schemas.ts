/**
 * Shared tool schemas for MCP inspector tools
 * Used by both server and client implementations
 */

export const TOOL_SCHEMAS = {
  capture_element_context: {
    name: "capture_element_context",
    description:
      "Capture comprehensive context about a page element for troubleshooting.\n\n**Workflow**:\n1. Activates visual element selector overlay\n2. User clicks on element they want to investigate\n3. User provides notes/questions about the element\n4. Returns complete context package\n\n**Returned Context**:\n- Source code location (file, line, component)\n- DOM structure and hierarchy\n- All computed styles (categorized by: layout, typography, spacing, background, border, effects, flexbox, grid)\n- Element position and dimensions\n- User's notes/questions\n\n**Use Cases**:\n- \"Why isn't this button clickable?\"\n- \"Where is this component defined?\"\n- \"What styles are applied to this element?\"\n- \"Why does this layout look broken?\"\n\n**Working with chrome-devtools**:\nFor deeper browser diagnostics, combine with Chrome DevTools MCP:\n- Use chrome.Network.* tools to inspect network requests related to this element\n- Use chrome.Console.* tools to check for JavaScript errors\n- Use chrome.Performance.* tools to measure rendering performance\n- Use chrome.DOM.* tools to inspect live DOM modifications",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },

  list_inspections: {
    name: "list_inspections",
    description:
      "List all captured element inspections in the work queue.\n\n**Returns for each inspection**:\n- Inspection ID (use with update_inspection_status)\n- Element details (tag, classes, text content)\n- Source location (file, line, component)\n- User's notes/questions\n- Current status (pending/in-progress/completed/failed)\n- Progress details (if available)\n\n**Inspection Status Lifecycle**:\n- **pending**: Not started yet, awaiting investigation\n- **in-progress**: Currently being investigated/debugged\n- **completed**: Issue resolved or question answered\n- **failed**: Unable to resolve or need more information\n\n**Use Cases**:\n- Review what user has marked for investigation\n- Find inspection IDs for status updates\n- Batch process related diagnostic issues\n- Track multiple troubleshooting sessions\n\n**Best Practices**:\n1. Check queue before starting new investigations\n2. Group related inspections together\n3. Process in order of priority\n4. Update status as you make progress\n\n**Working with chrome-devtools**:\nFor each inspection, you can use Chrome DevTools to gather additional context:\n- Check console logs: chrome.Console.getMessages()\n- Inspect network traffic: chrome.Network.getHAR()\n- Profile performance: chrome.Performance.getMetrics()",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },

  update_inspection_status: {
    name: "update_inspection_status",
    description:
      "Update the status of an element inspection to track investigation progress.\n\n**Parameters**:\n- **inspectionId**: Which inspection (optional - auto-detects current)\n- **status**: 'in-progress' | 'completed' | 'failed'\n- **progress**: Optional step-by-step progress details\n- **message**: Summary (REQUIRED for completed/failed)\n\n**Status Transitions**:\n\n1. **in-progress**: Starting or continuing investigation\n   - Include progress.steps to show detailed diagnostic steps\n   - Update as you discover information\n\n2. **completed**: Investigation finished, issue resolved or question answered\n   - REQUIRED: Include message with findings/solution\n   - Example: \"Root cause: z-index conflict. Fixed by updating CSS.\"\n\n3. **failed**: Cannot resolve or need more user information\n   - REQUIRED: Include message explaining why\n   - Example: \"Cannot reproduce issue. Need user to provide steps.\"\n\n**Examples**:\n```javascript\n// Starting investigation\nupdate_inspection_status({\n  status: 'in-progress',\n  progress: {\n    steps: [\n      { id: 1, title: 'Checking computed styles', status: 'completed' },\n      { id: 2, title: 'Testing interactivity', status: 'in-progress' },\n      { id: 3, title: 'Finding root cause', status: 'pending' }\n    ]\n  }\n});\n\n// Completing investigation\nupdate_inspection_status({\n  status: 'completed',\n  message: 'Found issue: pointer-events: none style blocking clicks. Removed the style.'\n});\n\n// Unable to resolve\nupdate_inspection_status({\n  status: 'failed',\n  message: 'Element not found in DOM. May be conditionally rendered. Need reproduction steps.'\n});\n```",
    inputSchema: {
      type: "object" as const,
      properties: {
        inspectionId: {
          type: "string",
          description:
            "Optional inspection ID. If not provided, uses the current active inspection.",
        },
        status: {
          type: "string",
          enum: ["in-progress", "completed", "failed"],
          description:
            "Current status: 'in-progress' for updates, 'completed' when resolved, 'failed' if unresolvable",
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
          description: "Optional step-by-step progress tracking",
        },
        message: {
          type: "string",
          description:
            "Summary of findings or resolution. REQUIRED when status is 'completed' or 'failed'",
        },
      },
      required: ["status"] as string[],
    },
  },

  execute_page_script: {
    name: "execute_page_script",
    description:
      "Execute JavaScript in the browser to extract runtime data. Code must return a value (synchronous only).\n\n**Access**: window, document, DOM APIs, React/Vue instances, localStorage, etc.\n\n**Examples**:\n```javascript\n// Check interactivity\nexecute_page_script({ code: `\n  const el = document.querySelector('.btn');\n  return { exists: !!el, visible: el?.offsetParent !== null };\n` })\n\n// Find hidden elements\nexecute_page_script({ code: `\n  return Array.from(document.querySelectorAll('*'))\n    .filter(el => !el.offsetParent)\n    .slice(0, 20).map(el => el.tagName);\n` })\n```\n\n**chrome-devtools Integration**:\nFor deeper diagnostics beyond quick queries:\n- Network: chrome.Network.getHAR() - inspect requests/timing\n- Console: chrome.Console.getMessages() - retrieve errors\n- Performance: chrome.Performance.getMetrics() - measure impact\n- Debugger: chrome.Debugger.* - set breakpoints\n- Memory: chrome.HeapProfiler.* - detect leaks",
    inputSchema: {
      type: "object" as const,
      properties: {
        code: {
          type: "string",
          description:
            "JavaScript code to execute in page context. Must return a value for diagnostic output.",
        },
      },
      required: ["code"] as string[],
    },
  },
} as const;
