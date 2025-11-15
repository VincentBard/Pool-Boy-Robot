import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test.local" });

export default defineConfig({
  testDir: "tests",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8080",
    reuseExistingServer: true,
  },
  use: {
    headless: false,
  },
});