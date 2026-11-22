import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { revealAll } from "../helpers";

// JSON-LD and axe on pages that only have draft content so far (draft preview).
test.describe.configure({ timeout: 90_000 });

const jsonLd = (page: import("@playwright/test").Page) =>
  page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) =>
      els.map((e) => JSON.parse(e.textContent ?? "null") as Record<string, unknown>),
    );

test("home has a JSON-LD Person built from the profile", async ({ page }) => {
  await page.goto("/");
  const [person] = await jsonLd(page);
  expect(person).toMatchObject({
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Desi Armanda Sari",
    jobTitle: "System Analyst",
    address: { addressLocality: "West Jakarta, Indonesia" },
    alumniOf: [{ name: "Diponegoro University" }],
  });
  expect(person!.sameAs).toEqual([
    "https://www.linkedin.com/in/desi-armanda-sari/",
    "https://github.com/thunderclouds863",
  ]);
});

test("draft case studies are noindex and carry no CreativeWork yet", async ({ page }) => {
  await page.goto("/projects/overtime-management-system");
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  expect(await jsonLd(page)).toEqual([]);
});

test("a published case study is indexable and has a CreativeWork", async ({ page }) => {
  await page.goto("/projects/fptk-sourcing-database");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  const [work] = await jsonLd(page);
  expect(work).toMatchObject({
    "@type": "CreativeWork",
    name: "FPTK & Sourcing Database",
    author: { "@type": "Person", name: "Desi Armanda Sari" },
  });
});

test("a case study has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/projects/overtime-management-system");
  await revealAll(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
  ).toEqual([]);
});
