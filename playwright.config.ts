import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Loads .env.local into process.env for the test runner process itself —
// `npm run dev` (below, via webServer) gets it automatically from Next.js,
// but Playwright's own process (where spec files read
// NEXT_PUBLIC_SUPABASE_URL, E2E_SUPABASE_SERVICE_ROLE_KEY, etc.) doesn't
// unless it's loaded explicitly.
config({ path: ".env.local" });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
