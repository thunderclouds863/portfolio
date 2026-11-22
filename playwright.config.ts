import { defineConfig, devices } from "@playwright/test";

const PROD_PORT = 3000;
const DEV_PORT = 3001;
const prodURL = `http://localhost:${PROD_PORT}`;
const devURL = `http://localhost:${DEV_PORT}`;
// grep matches "project file describe title tags": the whole contact and smoke
// specs plus every test tagged @mobile.
const MOBILE_GREP = /@mobile|contact\.spec|smoke\.spec/;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // CI: inline annotations plus an HTML report uploaded as a workflow artifact.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { trace: "on-first-retry" },
  // PRD section 12: Chromium + WebKit, desktop + mobile viewport.
  // Desktop projects run the whole production suite. Mobile projects (real
  // device emulation: touch, mobile UA, DPR) run the tests tagged @mobile plus
  // the contact and smoke specs; the rest pin a desktop viewport and would only
  // repeat the desktop result.
  projects: [
    {
      // Production build: only Published content renders.
      name: "chromium",
      testIgnore: "dev/**",
      use: { ...devices["Desktop Chrome"], baseURL: prodURL },
    },
    {
      name: "webkit",
      testIgnore: "dev/**",
      use: { ...devices["Desktop Safari"], baseURL: prodURL },
    },
    {
      name: "mobile-chrome",
      testIgnore: "dev/**",
      grep: MOBILE_GREP,
      use: { ...devices["Pixel 7"], baseURL: prodURL },
    },
    {
      name: "mobile-safari",
      testIgnore: "dev/**",
      grep: MOBILE_GREP,
      use: { ...devices["iPhone 14"], baseURL: prodURL },
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
      env: {
        ENABLE_STYLEGUIDE: "1",
        // Contact form: dummy Turnstile token accepted, Resend simulated (lib/test-mode.ts).
        CONTACT_TEST_MODE: "1",
        // Cloudflare test sitekey (always passes); the browser script is faked in tests.
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      },
    },
    {
      command: `npx next dev -p ${DEV_PORT}`,
      url: devURL,
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
