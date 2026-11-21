import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { revealAll } from "./helpers";

test("home responds with security headers and one h1", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();

  await expect(page.locator("h1")).toHaveCount(1);
});

test("home has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/");
  await revealAll(page);
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious).toEqual([]);
});
