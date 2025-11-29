import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import DevInspector from "@mcpc-tech/unplugin-dev-inspector-mcp";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // DevInspector must come BEFORE react() to inject source locations
    DevInspector.vite({
      enabled: true,
      enableMcp: true,
    }),
    react(),
    tailwindcss(),
  ],
});
