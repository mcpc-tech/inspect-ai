# unplugin-dev-inspector

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
import DevInspector from 'unplugin-dev-inspector/vite';

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
