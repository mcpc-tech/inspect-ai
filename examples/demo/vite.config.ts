import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import DevInspector from "@mcpc-tech/unplugin-dev-inspector-mcp";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    DevInspector.vite({
      enabled: true,
      enableMcp: true,
    }),
  ],
});
