import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "on-first-retry" },
  // Phase 8 adds WebKit and the mobile projects (PRD section 12).
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start",
    url: baseURL,
    // Always test a fresh production build; never silently reuse a running dev server.
    reuseExistingServer: false,
    timeout: 240_000,
    // Build the dev-only /styleguide route into the test build (app/styleguide/page.tsx).
    env: { ENABLE_STYLEGUIDE: "1" },
  },
});
