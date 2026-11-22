import { defineConfig, devices } from "@playwright/test";

const PROD_PORT = 3000;
const DEV_PORT = 3001;
const prodURL = `http://localhost:${PROD_PORT}`;
const devURL = `http://localhost:${DEV_PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { trace: "on-first-retry" },
  // Phase 8 adds WebKit and the mobile projects (PRD section 12).
  projects: [
    {
      // Production build: only Published content renders.
      name: "chromium",
      testIgnore: "dev/**",
      use: { ...devices["Desktop Chrome"], baseURL: prodURL },
    },
    {
      // `next dev` with the Draft preview: exercises pages that only have draft
      // content so far (case studies). Never used for production guarantees.
      name: "chromium-draft-preview",
      testMatch: "dev/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"], baseURL: devURL },
    },
  ],
  webServer: [
    {
      command: "npm run build && npm run start",
      url: prodURL,
      // Always test a fresh production build; never silently reuse a running dev server.
      reuseExistingServer: false,
      timeout: 240_000,
      // Build the dev-only /styleguide route into the test build.
      env: { ENABLE_STYLEGUIDE: "1" },
    },
    {
      command: `npx next dev -p ${DEV_PORT}`,
      url: devURL,
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
