---
title: Inspect Web Mcp
emoji: 😻
colorFrom: purple
colorTo: red
sdk: gradio
sdk_version: 5.49.1
app_file: app.py
pinned: false
short_description: AI-powered web debugging with visual element inspection
tags:
  - building-mcp-track-creative
---

# @mcpc-tech/unplugin-dev-inspector-mcp

**AI-powered visual debugging for React and Vue via MCP (Model Context Protocol).** Works with any MCP-compatible AI client. 

Click any UI element to let AI diagnose issues, inspect source code, analyze network requests, and provide intelligent fixes—all through natural conversation.

## Quick Start

```bash
npm i @mcpc-tech/unplugin-dev-inspector-mcp@beta
```

```typescript
// vite.config.ts
import DevInspector from '@mcpc-tech/unplugin-dev-inspector-mcp';
import react from '@vitejs/plugin-react'; // or vue()

export default {
  plugins: [
    react(), // or vue()
    DevInspector.vite({
      enabled: true,
      enableMcp: true,
    }),
  ],
};
```

Currently supports **Vite**. Webpack, Rollup, esbuild, and Rspack support coming soon.

## Configuration

### Custom Agents

This plugin uses the [Agent Client Protocol (ACP)](https://agentclientprotocol.com) to connect with AI agents. 

⏱️ **Note:** Initial connection may be slow as agents are launched via `npx` (downloads packages on first run).

Default agents: [View configuration →](https://github.com/mcpc-tech/dev-inspector-mcp/blob/main/packages/unplugin-dev-inspector/client/constants/agents.ts)


You can customize available AI agents and set a default agent:

```typescript
// vite.config.ts
export default {
  plugins: [
    DevInspector.vite({
      enabled: true,
      enableMcp: true,
      // Custom agents (will be merged with default properties)
      agents: [
        {
          name: "Claude Code", // Matches default - auto-fills icon and env
          command: "npx",
          args: ["-y", "@zed-industries/claude-code-acp"],
        },
        {
          name: "My Custom Agent",
          command: "my-agent-cli",
          args: ["--mode", "acp"],
          env: [{ key: "MY_API_KEY", required: true }],
          meta: { icon: "https://example.com/icon.svg" }
        }
      ],
      // Set default agent to show on startup
      defaultAgent: "Claude Code"
    }),
  ],
};
```

**Key Features:**
- Custom agents with the **same name** as [default agents](https://agentclientprotocol.com/overview/agents) automatically inherit missing properties (icons, env)
- You can override just the command/args while keeping default icons
- If no custom agents provided, defaults are: Claude Code, Codex CLI, Gemini CLI, Kimi CLI, Goose, OpenCode


## What It Does

**Click element → AI analyzes → Get fix**

1. Click any UI element to capture context (source, styles, DOM)
2. AI diagnoses using Chrome DevTools integration
3. Get intelligent solutions through natural conversation

**Examples:**
- "Why is this button not clickable?" → AI checks `pointer-events`, z-index, overlays
- "This API call is failing" → AI analyzes network requests, timing, responses
- "Where is this component?" → Jump to source file and line number

## MCP Tools

### `capture_element_context`
Activates visual selector. Returns source location, DOM hierarchy, styles, dimensions, and user notes.

### `list_inspections`
Shows all inspections with ID, element details, notes, and status (pending/in-progress/completed/failed).

### `update_inspection_status`
Updates inspection status with optional progress steps.

**Parameters:** `status`, `message` (required for completed/failed), `progress`, `inspectionId` (optional)

### `execute_page_script`
Executes JavaScript in browser context. Access to window, document, React/Vue instances, localStorage.

## MCP Prompts

### `capture_element`
Capture and analyze UI element context.

### `view_inspections`
View all pending, in-progress, and completed inspections.

### `launch_chrome_devtools`
Opens Chrome with DevTools API. Unlocks network analysis, console logs, performance metrics.

**Parameter:** `url` (defaults to dev server)

⚠️ Must call before using Chrome DevTools capabilities.

### `refresh_chrome_state`
Updates list of available network requests.

### `get_network_requests`
Get detailed info for a specific request (headers, payload, response, timing).

**Parameter:** `reqid` from refresh list

## Usage with AI

```bash
pnpm dev
```

Connect MCP-compatible AI (Claude Desktop, Cline) and ask:

```
"Use launch_chrome_devtools to navigate to my app, then capture_element on the broken button"
```

AI automatically launches Chrome, activates selector, waits for your click, analyzes source/styles/DOM, and suggests fixes.

## Development

```bash
cd packages/unplugin-dev-inspector
pnpm build           # Build plugin
pnpm build:client    # Build UI
pnpm dev:demo        # Run demo
```

## License

MIT
