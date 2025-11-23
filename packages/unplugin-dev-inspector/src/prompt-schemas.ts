/**
 * Shared prompt schemas for MCP inspector prompts
 * Used by both server and client implementations
 */

export const PROMPT_SCHEMAS = {
  capture_element: {
    name: "capture_element",
    title: "Capture Element Context",
    description:
      "Capture context about a UI element for troubleshooting and investigation.",
    arguments: [],
  },

  view_inspections: {
    name: "view-inspections",
    title: "View All Inspections",
    description:
      "View all element inspections in the queue with their status.",
    arguments: [],
  },

  launch_chrome_devtools: {
    name: "launch_chrome_devtools",
    title: "Launch Chrome DevTools",
    description:
      "Launch Chrome DevTools and navigate to a specified URL for debugging and inspection.",
    arguments: [
      {
        name: "url",
        description: "The URL to navigate to (e.g., http://localhost:3000)",
        required: true,
      },
    ],
  },

  refresh_chrome_state: {
    name: "refresh_chrome_state",
    title: "Refresh Chrome State",
    description:
      "Refresh the state of the Chrome DevTools for the specified URL.",
    arguments: [],
  },

  get_network_requests: {
    name: "get_network_requests",
    title: "Get Network Requests",
    description:
      "Get all network requests for the specified URL.",
    // Arguments will be dynamically populated based on available requests
    arguments: [],
  },
} as const;
