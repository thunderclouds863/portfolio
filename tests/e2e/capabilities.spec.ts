import { expect, test } from "@playwright/test";

test.describe("Phase 9 — Capabilities editorial layout & responsiveness", () => {
  test("renders 3 balanced pillars with bounded evidence and archive overflow link", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/#capabilities");

    const section = page.locator("#capabilities");
    const pillars = section.locator("[data-capabilities-list] > li");
    await expect(pillars).toHaveCount(3);
    await expect(pillars.nth(0)).toContainText("Pillar 01 // Lead Focus");
    await expect(pillars.nth(0)).toContainText("System Analyst");
    await expect(pillars.nth(1)).toContainText("Business Process Improvement");
    await expect(pillars.nth(2)).toContainText("System Development");

    // Verify bounded inline evidence + filter archive link for System Development.
    const devMore = pillars.nth(2).getByRole("link", { name: /\+\d+ more/ });
    await expect(devMore).toHaveAttribute("href", "/projects?capability=development");

    // Verify System Analyst band is proportional (not an oversized 2-row box).
    const heights = await pillars.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().height),
    );
    expect(heights[0]!).toBeLessThan(heights[1]! * 1.45);
  });

  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    test(`/#capabilities has 0px horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/#capabilities");
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth, `/#capabilities at ${width}px`).toBeLessThanOrEqual(innerWidth);
    });
  }
});
