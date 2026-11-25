import { expect, test } from "@playwright/test";

test.describe("Phase 4 — Stack taxonomy, icons & project evidence", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("#stack renders 6 evidence-backed categories with icons and working project links", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/#stack");
    const stack = page.locator("#stack");
    await expect(stack.locator("[data-stack-category]")).toHaveCount(6);
    await expect(stack.locator("[data-tech-icon]").first()).toBeVisible();

    // Verify a verified project evidence link navigates to its case study.
    const link = stack.getByRole("link", { name: "FPTK & Sourcing Database" }).first();
    await expect(link).toHaveAttribute("href", "/projects/fptk-sourcing-database");
    await link.click();
    await expect(page).toHaveURL(/\/projects\/fptk-sourcing-database$/);
    expect(errors).toEqual([]);
  });

  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    test(`/#stack has 0px horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/#stack");
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth, `/#stack at ${width}px`).toBeLessThanOrEqual(innerWidth);
    });
  }
});
