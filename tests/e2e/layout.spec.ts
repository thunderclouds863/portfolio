import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SECTION_LABELS = [
  "./about",
  "./skills",
  "./experience",
  "./projects",
  "./approach",
  "./stack",
  "./contact",
];

async function noHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

async function hasVisibleFocusRing(page: Page) {
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return null;
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor };
  });
  expect(outline).toEqual({ style: "solid", width: "2px", color: "rgb(255, 178, 0)" });
}

test.describe("desktop (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("skip link is first, visible on focus and moves focus to main", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("keyboard reaches logo, every section link and the CTA, with amber focus", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Desi Armanda Sari, home" })).toBeFocused();
    await hasVisibleFocusRing(page);

    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of SECTION_LABELS) {
      await page.keyboard.press("Tab");
      await expect(nav.getByRole("link", { name: label })).toBeFocused();
      await hasVisibleFocusRing(page);
    }
    await page.keyboard.press("Tab");
    await expect(page.getByRole("banner").getByRole("link", { name: "[ CV ]" })).toBeFocused();
  });

  test("nav is sticky, 64px tall and the mobile toggle is hidden", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    const box = await header.boundingBox();
    expect(box?.height).toBe(64);
    await expect(header).toHaveCSS("position", "sticky");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  });

  test("fonts: pixel for display/labels, Plex for body, JetBrains Mono for meta", async ({
    page,
  }) => {
    await page.goto("/styleguide");
    await page.evaluate(() => document.fonts.ready);
    const family = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(await family("h1")).toContain("Press Start 2P");
    expect(await family(".text-label")).toContain("Press Start 2P");
    expect(await family("body")).toContain("IBM Plex Sans");
    expect(await family(".text-meta")).toContain("JetBrains Mono");
    await expect(page.locator("h1")).toHaveCSS("font-weight", "400");
  });

  test("footer has copyright, privacy link and build note", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer).toContainText("© 2026 Desi Armanda Sari");
    await expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    await expect(footer).toContainText("Built with Next.js, deployed on Vercel");
  });
});

test.describe("mobile menu (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("opens with aria-expanded, traps focus, closes on Esc and restores focus", async ({
    page,
  }) => {
    await page.goto("/");
    // CSS locator: while the menu is open, Radix marks the rest of the page
    // aria-hidden, so the toggle is not reachable by role (expected behaviour).
    const toggle = page.locator('button[aria-label="Open menu"]');
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const controls = await toggle.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    await expect(dialog).toHaveAttribute("id", controls!);

    // Body scroll is locked while open.
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    // Focus stays inside the dialog for more Tabs than it has focusable elements.
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    for (let i = 0; i < 3; i += 1) {
      await page.keyboard.press("Shift+Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });

  test("close button and link click both close the menu", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });

    await toggle.click();
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();

    await toggle.click();
    await page.getByRole("dialog").getByRole("link", { name: "./about" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  });

  test("menu closes when the viewport grows to desktop", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  });
});

test.describe("320px has no horizontal overflow", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of ["/", "/styleguide"]) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await noHorizontalOverflow(page);
    });
  }

  test("open mobile menu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await noHorizontalOverflow(page);
  });
});

test.describe("scanlines", () => {
  test("visible by default with opacity <= 0.06", async ({ page }) => {
    await page.goto("/");
    const overlay = page.getByTestId("scanlines");
    await expect(overlay).toHaveCSS("display", "block");
    const opacity = Number(await overlay.evaluate((el) => getComputedStyle(el).opacity));
    expect(opacity).toBeLessThanOrEqual(0.06);
    await expect(overlay).toHaveCSS("pointer-events", "none");
  });

  test("hidden under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByTestId("scanlines")).toBeHidden();
  });

  test("hidden in print", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });
    await expect(page.getByTestId("scanlines")).toBeHidden();
  });
});

test.describe("styleguide", () => {
  test("renders every primitive with no serious axe violations", async ({ page }) => {
    await page.goto("/styleguide");
    await expect(page.getByRole("heading", { level: 1, name: "Styleguide" })).toBeVisible();
    for (const name of [
      "Colour tokens",
      "Typography",
      "Buttons",
      "Form controls",
      "Dialog",
      "Pixel icons",
    ]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
  });

  test("select and dialog work from the keyboard", async ({ page }) => {
    await page.goto("/styleguide");
    const trigger = page.getByRole("combobox", { name: "Inquiry type" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("option", { name: "Collaboration" }).click();
    await expect(trigger).toContainText("Collaboration");

    await page.getByRole("button", { name: "[ Open dialog ]" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Dialog example" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
