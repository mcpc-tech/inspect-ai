---
title: Inspect Web Mcp
emoji: 😻
colorFrom: purple
colorTo: red
sdk: gradio
sdk_version: 5.49.1
app_file: app.py
pinned: false
short_description: Debugging your web project using MCP with inspecting UI
tags:
  - building-mcp-track-creative
---

# @mcpc-tech/unplugin-dev-inspector-mcp

Universal dev inspector plugin for React - inspect component sources and API calls in any bundler.

## Monorepo Structure

```
packages/
  unplugin-dev-inspector/  # Main plugin package
examples/
  demo/                    # Demo app for testing
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run demo
pnpm dev:demo
```

## Plugin Usage

Works with Vite, Webpack, Rollup, esbuild, and Rspack.

```typescript
// vite.config.ts
import DevInspector from '@mcpc-tech/unplugin-dev-inspector-mcp/vite';

export default {
  plugins: [DevInspector(), react()],
};
```

## Development

```bash
# Build plugin
cd packages/unplugin-dev-inspector
pnpm build

# Build client UI
pnpm build:client
```

## License

MIT
