import { expect, test } from "@playwright/test";

test.describe("Latest Project Discovery System", () => {
  test("homepage renders Latest Project Spotlight and links cleanly to the project case study", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const spotlight = page.locator("[data-latest-project-spotlight]");
    await expect(spotlight).toBeVisible();
    const slug = await spotlight.getAttribute("data-latest-project-spotlight");
    expect(slug).toBeTruthy();

    await expect(spotlight).toContainText(/Latest project/i);
    const cta = spotlight.getByRole("link", { name: /Explore project/i });
    await expect(cta).toHaveAttribute("href", `/projects/${slug}`);

    const title = (await spotlight.locator("#latest-project-title").textContent())?.trim() ?? "";
    expect(title.length).toBeGreaterThan(0);

    await cta.click();
    await expect(page).toHaveURL(new RegExp(`/projects/${slug}$`));
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  });

  test("no false NEW badges or nav indicators appear when no project has a recent publishedAt", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.locator("[data-projects-new-indicator]")).toHaveCount(0);

    await page.goto("/projects");
    await expect(page.locator("[data-new-badge]")).toHaveCount(0);
    await expect(page.locator("[data-projects-new-indicator]")).toHaveCount(0);
  });

  for (const vp of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 440, height: 956 },
    { width: 390, height: 844 },
    { width: 375, height: 812 },
    { width: 360, height: 800 },
    { width: 320, height: 568 },
  ]) {
    test(`spotlight and nav have 0px horizontal overflow at ${vp.width}x${vp.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(vp);
      await page.goto("/");
      const spotlight = page.locator("[data-latest-project-spotlight]");
      await expect(spotlight).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
