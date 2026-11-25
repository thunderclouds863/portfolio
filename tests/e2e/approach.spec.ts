import { expect, test } from "@playwright/test";

test.describe("Phase 6 / 7C — Approach CMS-driven interactive visual storytelling", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("renders all 6 CMS stages, switches by pointer and keyboard, updates SVG visual and project links", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/#approach");
    const section = page.locator("#approach");
    const tabs = section.getByRole("tab");
    await expect(tabs).toHaveCount(6);

    // Stage 01 (Understand) is active by default with CMS description.
    await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
    await expect(section.locator('[data-approach-visual="understand"]')).toBeVisible();
    await expect(section.getByRole("tabpanel")).toContainText(
      "Understand the business context, stakeholder expectations, and actual problems before defining a solution.",
    );

    // Pointer click selects Stage 04 (Design to-be).
    await tabs.nth(3).click();
    await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(0)).toHaveAttribute("data-stage-state", "completed");
    await expect(section.locator('[data-approach-visual="design-to-be"]')).toBeVisible();
    await expect(section.getByRole("tabpanel")).toContainText("Design to-be");

    // Keyboard ArrowRight advances to Stage 05 (Build), End jumps to Stage 06 (Verify).
    await tabs.nth(3).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(4)).toBeFocused();
    await expect(tabs.nth(4)).toHaveAttribute("aria-selected", "true");
    await expect(section.locator('[data-approach-visual="build"]')).toBeVisible();

    await page.keyboard.press("End");
    await expect(tabs.nth(5)).toBeFocused();
    await expect(section.locator('[data-approach-visual="verify"]')).toBeVisible();
    await expect(section.getByRole("tabpanel")).toContainText("Verify");

    // Verified project evidence link navigates cleanly.
    const projectLink = section
      .getByRole("tabpanel")
      .getByRole("link", { name: "Overtime Management System" });
    await expect(projectLink).toHaveAttribute("href", "/projects/overtime-management-system");
    await projectLink.click();
    await expect(page).toHaveURL(/\/projects\/overtime-management-system$/);

    expect(errors).toEqual([]);
  });

  test("works cleanly under prefers-reduced-motion: reduce", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#approach");
    const section = page.locator("#approach");
    await section.getByRole("tab").nth(1).click();
    await expect(section.locator('[data-approach-visual="map-as-is"]')).toBeVisible();
    await expect(section.getByRole("tabpanel")).toContainText("Map as-is");
  });

  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    test(`/#approach has 0px horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/#approach");
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth, `/#approach at ${width}px`).toBeLessThanOrEqual(innerWidth);
    });
  }
});
