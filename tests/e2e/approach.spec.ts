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

  test("triggers viewport entrance reveal on scroll and updates progress rail across stages", async ({
    page,
  }) => {
    await page.goto("/");
    const story = page.locator("#approach [data-approach-story]");
    await expect(story).toHaveAttribute("data-approach-revealed", "pending");

    await story.scrollIntoViewIfNeeded();
    await expect(story).toHaveAttribute("data-approach-revealed", "revealed");

    const rail = story.locator("[data-approach-rail]");
    await expect
      .poll(async () => rail.evaluate((el) => getComputedStyle(el).transform))
      .toContain("matrix(1, 0, 0, 1");

    const progress = story.locator("[data-story-progress]");
    await story.getByRole("tab").nth(2).click();
    await expect
      .poll(async () => progress.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe("matrix(0, 0, 0, 1, 0, 0)");
  });

  test("animates System View SVG flow paths and nodes across all 6 stages without clipping", async ({
    page,
  }) => {
    await page.goto("/#approach");
    const section = page.locator("#approach");
    const tabs = section.getByRole("tab");

    // Stage 01 (Understand): verify live stroke-dashoffset motion on dashed & pulse connectors.
    const svg = section.locator("[data-approach-visual]");
    await expect(svg).toBeVisible();

    const dashPath = svg.locator("[data-sv-dash]").first();
    await expect(dashPath).toBeVisible();
    const initialDashOffset = await dashPath.evaluate(
      (el) => getComputedStyle(el).strokeDashoffset,
    );
    await expect
      .poll(async () => dashPath.evaluate((el) => getComputedStyle(el).strokeDashoffset), {
        timeout: 2000,
      })
      .not.toBe(initialDashOffset);

    // Cycle through all 6 stages and verify each has active SVG flow animations and no clipping.
    for (let i = 0; i < 6; i++) {
      if (i > 0) await tabs.nth(i).click();
      const stageSvg = section.locator("[data-approach-visual]");
      await expect(stageSvg).toBeVisible();

      const flowCount = await stageSvg.locator("[data-sv-flow]").count();
      const nodeCount = await stageSvg.locator("[data-sv-node]").count();
      expect(flowCount, `stage ${i + 1} flow paths`).toBeGreaterThan(0);
      expect(nodeCount, `stage ${i + 1} animated nodes`).toBeGreaterThan(0);

      const flowAnim = await stageSvg
        .locator("[data-sv-flow]")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName);
      expect(flowAnim).toBe("sv-signal-flow");

      // Ensure every node stays within the SVG viewport bounds (no clipping).
      const clipped = await stageSvg.evaluate((el) => {
        const svgBox = el.getBoundingClientRect();
        const items = el.querySelectorAll("[data-sv-node], [data-sv-bar]");
        for (const item of items) {
          const r = item.getBoundingClientRect();
          if (
            r.left < svgBox.left - 2 ||
            r.right > svgBox.right + 2 ||
            r.top < svgBox.top - 2 ||
            r.bottom > svgBox.bottom + 2
          ) {
            return true;
          }
        }
        return false;
      });
      expect(clipped, `stage ${i + 1} SVG clipping`).toBe(false);
    }
  });

  test("@mobile renders animated System View SVG cleanly at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/#approach");
    const svg = page.locator("#approach [data-approach-visual]");
    await expect(svg).toBeVisible();

    const dashPath = svg.locator("[data-sv-dash]").first();
    const initialDashOffset = await dashPath.evaluate(
      (el) => getComputedStyle(el).strokeDashoffset,
    );
    await expect
      .poll(async () => dashPath.evaluate((el) => getComputedStyle(el).strokeDashoffset), {
        timeout: 2000,
      })
      .not.toBe(initialDashOffset);
  });

  test("works cleanly under prefers-reduced-motion: reduce", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#approach");
    const section = page.locator("#approach");
    await expect(section.locator("[data-approach-story]")).toHaveAttribute(
      "data-approach-revealed",
      "reduced",
    );

    // SVG animations are disabled and pulse overlays are hidden under reduced motion.
    const reducedState = await section.locator("[data-approach-visual]").evaluate((svg) => {
      const node = svg.querySelector("[data-sv-node]");
      const dash = svg.querySelector("[data-sv-dash]");
      const pulse = svg.querySelector("[data-sv-flow]");
      return {
        nodeAnim: node ? getComputedStyle(node).animationName : null,
        nodeOpacity: node ? getComputedStyle(node).opacity : null,
        dashAnim: dash ? getComputedStyle(dash).animationName : null,
        pulseDisplay: pulse ? getComputedStyle(pulse).display : null,
      };
    });
    expect(reducedState.nodeAnim).toBe("none");
    expect(reducedState.nodeOpacity).toBe("1");
    expect(reducedState.dashAnim).toBe("none");
    expect(reducedState.pulseDisplay).toBe("none");

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
