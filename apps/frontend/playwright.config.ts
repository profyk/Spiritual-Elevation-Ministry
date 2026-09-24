import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { config } from "dotenv";

// Loads .env.local into process.env for the test runner process itself —
// each app's own `npm run dev` (below, via webServer) gets its env from
// Next.js automatically, but Playwright's own process (where spec files
// read NEXT_PUBLIC_SUPABASE_URL, E2E_SUPABASE_SERVICE_ROLE_KEY, etc.)
// doesn't unless it's loaded explicitly.
config({ path: ".env.local" });

const REPO_ROOT = path.resolve(__dirname, "../..");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    // The public frontend — most tests start here.
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],
  // The acceptance/admin-mfa specs span all three services — the backend
  // has to actually be up for either app to do anything.
  webServer: [
    { command: "npm run dev:backend", url: "http://localhost:3002/health", cwd: REPO_ROOT, reuseExistingServer: !process.env.CI },
    { command: "npm run dev:frontend", url: "http://localhost:3000", cwd: REPO_ROOT, reuseExistingServer: !process.env.CI },
    { command: "npm run dev:admin", url: "http://localhost:3001", cwd: REPO_ROOT, reuseExistingServer: !process.env.CI },
  ],
});
