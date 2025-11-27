// Main entry point for the unplugin
export { unplugin as default } from "./core";

export type { DevInspectorOptions } from "./core";
export type { McpConfigOptions, CustomEditorConfig, EditorId } from "./utils/config-updater";

// Declare virtual module so TypeScript recognizes it (no user config needed)
declare module 'virtual:dev-inspector-mcp' { }