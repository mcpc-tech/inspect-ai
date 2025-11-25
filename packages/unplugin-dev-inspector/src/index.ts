// Main entry point for the unplugin
export { unplugin as default } from "./core";

export type { DevInspectorOptions } from "./core";

// Declare virtual module so TypeScript recognizes it (no user config needed)
declare module 'virtual:dev-inspector-mcp' { }