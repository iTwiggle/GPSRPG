import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["src/lib/marker-a11y.test.ts", "happy-dom"],
      ["src/components/encounter-modal.test.ts", "happy-dom"],
      ["src/hooks/use-game-state.test.ts", "happy-dom"],
    ],
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
