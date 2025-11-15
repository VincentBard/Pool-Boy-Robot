import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({

  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared", "./"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react()],
  test: {
    environment: "jsdom",      // required for React component tests
    globals: true,             // allows using describe/it/expect without import
    setupFiles: "./client/setupTest.ts", // optional but recommended
    css: false,                // speed up tests (no CSS processing needed)
    exclude: ["tests/**", "**/node_modules/**"],
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

