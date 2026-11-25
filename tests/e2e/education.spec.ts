import { expect, test } from "@playwright/test";

test.describe("Phase 5 — Education & Intellectual Property Recognition", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("#education renders verified DGIP copyright record with accurate creator and holder distinction", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/#education");
    const ipCard = page.locator("[data-education-ip]");
    await expect(ipCard).toBeVisible();
    await expect(ipCard).toContainText("Thermal Comfort Monitoring Computer Program");
    await expect(ipCard).toContainText("Monitoring Kenyamanan Termal");
    await expect(ipCard).toContainText("Copyright Registration");
    await expect(ipCard).toContainText("EC002025076498");
    await expect(ipCard).toContainText("000916759");
    await expect(ipCard).toContainText("26 June 2025");
    await expect(ipCard).toContainText("Universitas Diponegoro");
    await expect(ipCard).toContainText("Creator #6");

    // Must never describe copyright registration as a patent or expose street addresses.
    await expect(ipCard).not.toContainText(/patent/i);
    await expect(ipCard).not.toContainText(/Bedono|Purworejo|Ngesrep/i);

    // Related project link navigates cleanly to the connected case study.
    const projectLink = ipCard.getByRole("link", { name: /View related project/ });
    await expect(projectLink).toHaveAttribute("href", "/projects/thermal-comfort-monitoring");
    await projectLink.click();
    await expect(page).toHaveURL(/\/projects\/thermal-comfort-monitoring$/);
    expect(errors).toEqual([]);
  });

  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    test(`/#education has 0px horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/#education");
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth, `/#education at ${width}px`).toBeLessThanOrEqual(innerWidth);
    });
  }
});
