import { expect, test, type Page } from "@playwright/test";

async function headerHeight(page: Page) {
  return page.getByRole("banner").evaluate((el) => Math.ceil(el.getBoundingClientRect().height));
}

async function headingTop(page: Page, id: string) {
  return page.locator(`#${id}-title`).evaluate((el) => Math.round(el.getBoundingClientRect().top));
}

test.describe("Phase 1 — navigation consistency & cross-route routing (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("Recommendations nav item uses ./recommendations consistently on desktop, tablet and mobile", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/");
    const desktopRec = page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "./recommendations" });
    await expect(desktopRec).toBeVisible();
    await expect(desktopRec).toHaveAttribute("href", "/testimonials");

    // Verify 768px tablet keeps prominent brand + [ CV ] with 0px overflow and uses Orbit menu.
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(
      page.getByRole("banner").getByRole("link", { name: /Desi Armanda Sari.*home/i }),
    ).toBeVisible();
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    // Verify mobile orbit menu also uses ./recommendations.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator('button[aria-label="Open menu"]').click();
    const mobileRec = page
      .getByRole("dialog", { name: "Menu" })
      .getByRole("link", { name: "./recommendations" });
    await expect(mobileRec).toBeVisible();
    await expect(mobileRec).toHaveAttribute("href", "/testimonials");
    expect(errors).toEqual([]);
  });

  test("Home -> Recommendations -> About -> same-hash re-click -> Back/Forward (SPA, no reload, no console/hydration errors)", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/");
    // Canary on window to prove SPA transitions without unintended full-page reloads.
    await page.evaluate(() => {
      (window as unknown as { __spaCanary?: string }).__spaCanary = "alive";
    });
    const nav = page.getByRole("navigation", { name: "Main" });
    const stickyH = await headerHeight(page);

    // Home -> Recommendations
    await nav.getByRole("link", { name: "./recommendations" }).click();
    await expect(page).toHaveURL(/\/testimonials$/);
    await expect(nav.getByRole("link", { name: "./recommendations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      await page.evaluate(() => (window as unknown as { __spaCanary?: string }).__spaCanary),
    ).toBe("alive");

    // Recommendations -> About (cross-route section link)
    await nav.getByRole("link", { name: "./about" }).click();
    await expect(page).toHaveURL(/\/#about$/);
    await expect
      .poll(() => headingTop(page, "about"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(stickyH);
    await expect.poll(() => headingTop(page, "about"), { timeout: 5000 }).toBeLessThan(350);
    await expect(nav.getByRole("link", { name: "./about" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      await page.evaluate(() => (window as unknown as { __spaCanary?: string }).__spaCanary),
    ).toBe("alive");

    // Same-hash re-click after manually scrolling away
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await nav.getByRole("link", { name: "./about" }).click();
    await expect
      .poll(() => headingTop(page, "about"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(stickyH);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);

    // Browser Back -> /testimonials, then Forward -> /#about
    await page.goBack();
    await expect(page).toHaveURL(/\/testimonials$/);
    await expect(nav.getByRole("link", { name: "./recommendations" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.goForward();
    await expect(page).toHaveURL(/\/#about$/);
    await expect
      .poll(() => headingTop(page, "about"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(stickyH);
    await expect.poll(() => headingTop(page, "about"), { timeout: 5000 }).toBeLessThan(350);
    await expect(nav.getByRole("link", { name: "./about" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    expect(errors).toEqual([]);
  });

  test("navigation from /projects and /projects/[slug] reaches homepage sections and Home without reload", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    const nav = page.getByRole("navigation", { name: "Main" });

    // From /projects -> ./education (waitUntil: "networkidle" lets background RSC
    // prefetches settle so WebKit does not log aborted-fetch console errors on leave).
    await page.goto("/projects", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      (window as unknown as { __spaCanary?: string }).__spaCanary = "alive";
    });
    const stickyH = await headerHeight(page);
    await expect(nav.getByRole("link", { name: "./projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await nav.getByRole("link", { name: "./education" }).click();
    await expect(page).toHaveURL(/\/#education$/);
    await expect
      .poll(() => headingTop(page, "education"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(stickyH);
    await expect(nav.getByRole("link", { name: "./education" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      await page.evaluate(() => (window as unknown as { __spaCanary?: string }).__spaCanary),
    ).toBe("alive");

    // Let background RSC prefetches on `/` settle before hard navigation (WebKit aborts in-flight fetch on unload).
    await page.waitForLoadState("networkidle");

    // From /projects/[slug] -> ./experience
    await page.goto("/projects/overtime-management-system", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      (window as unknown as { __spaCanary?: string }).__spaCanary = "alive";
    });
    await expect(nav.getByRole("link", { name: "./projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await nav.getByRole("link", { name: "./experience" }).click();
    await expect(page).toHaveURL(/\/#experience$/);
    await expect
      .poll(() => headingTop(page, "experience"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(stickyH);
    await expect(nav.getByRole("link", { name: "./experience" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      await page.evaluate(() => (window as unknown as { __spaCanary?: string }).__spaCanary),
    ).toBe("alive");

    await page.waitForLoadState("networkidle");

    // Direct open /projects/[slug] -> click brand Home link
    await page.goto("/projects/fptk-sourcing-database", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Desi Armanda Sari.*home/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#hero-title")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("direct URL with hash /#education and reduced-motion preference position heading cleanly below sticky nav", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#education");
    const stickyH = await headerHeight(page);
    await expect
      .poll(() => headingTop(page, "education"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(stickyH);
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "./education" }),
    ).toHaveAttribute("aria-current", "true");
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.activeSection))
      .toBe("education");

    // Under reduced motion, same-page nav click scrolls immediately without error.
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "./contact" })
      .click();
    await expect(page).toHaveURL(/\/#contact$/);
    await expect
      .poll(() => headingTop(page, "contact"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(stickyH);

    // Under reduced motion, same-page nav click scrolls immediately without error.
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "./contact" })
      .click();
    await expect(page).toHaveURL(/\/#contact$/);
    await expect
      .poll(() => headingTop(page, "contact"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(stickyH);
  });

  test("Phase 8.1 — client-side / -> /projects/[slug] -> ./about and / -> /testimonials -> ./about (desktop & mobile)", async ({
    page,
  }) => {
    // 1. Desktop (1280px): start on /, click a featured project card (keeps / in Next.js 16 <Activity>),
    // then return to /#about via main nav.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const stickyH = await headerHeight(page);
    await page
      .locator("#projects")
      .getByRole("link", { name: "Overtime Management System" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/projects\/overtime-management-system$/);
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "./about" }).click();
    await expect(page).toHaveURL(/\/#about$/);
    await expect
      .poll(() => headingTop(page, "about"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(stickyH);
    await expect.poll(() => headingTop(page, "about"), { timeout: 5000 }).toBeLessThan(350);
    await expect(nav.getByRole("link", { name: "./about" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    // 2. Mobile (375px): start on /, navigate to /projects/[slug] and /testimonials,
    // then use MobileMenu to return to /#about (must NOT be fooled by hidden <Activity> DOM).
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const mobileStickyH = await headerHeight(page);
    await page
      .locator("#projects")
      .getByRole("link", { name: "Overtime Management System" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/projects\/overtime-management-system$/);

    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation", { name: "Mobile" })
      .getByRole("link", { name: "./about" })
      .click();
    await expect(page).toHaveURL(/\/#about$/);
    await expect
      .poll(() => headingTop(page, "about"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(mobileStickyH);
    await expect.poll(() => headingTop(page, "about"), { timeout: 5000 }).toBeLessThan(350);

    // Mobile: /#about -> /testimonials -> ./about
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation", { name: "Mobile" })
      .getByRole("link", { name: "./recommendations" })
      .click();
    await expect(page).toHaveURL(/\/testimonials$/);

    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation", { name: "Mobile" })
      .getByRole("link", { name: "./about" })
      .click();
    await expect(page).toHaveURL(/\/#about$/);
    await expect
      .poll(() => headingTop(page, "about"), { timeout: 5000 })
      .toBeGreaterThanOrEqual(mobileStickyH);
    await expect.poll(() => headingTop(page, "about"), { timeout: 5000 }).toBeLessThan(350);
  });
});
