import { expect, test, type Page } from "@playwright/test";

// Phase 3 — home sections. Runs against a production build, where only Published
// content renders (currently none), so these tests check structure, not copy.

const SECTIONS = [
  { id: "about", label: "./about" },
  { id: "capabilities", label: "./skills" },
  { id: "experience", label: "./experience" },
  { id: "projects", label: "./projects" },
  { id: "approach", label: "./approach" },
  { id: "stack", label: "./stack" },
  { id: "contact", label: "./contact" },
];
const NAV_HEIGHT = 64;

async function headingTop(page: Page, id: string) {
  return page.locator(`#${id}-title`).evaluate((el) => el.getBoundingClientRect().top);
}

test.describe("home sections (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("renders the hero and all sections in PRD order with numbered headings", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    const ids = await page.locator("main > section[id]").evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual(["top", ...SECTIONS.map((s) => s.id)]);
    for (const [i, s] of SECTIONS.entries()) {
      const section = page.locator(`#${s.id}`);
      await expect(section).toHaveAttribute("aria-labelledby", `${s.id}-title`);
      await expect(section.locator("h2")).toContainText(`0${i + 1} //`);
    }
  });

  test("every nav link reaches its section below the sticky nav and becomes active", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const s of SECTIONS) {
      const link = nav.getByRole("link", { name: s.label });
      await link.click();
      await expect(page).toHaveURL(new RegExp(`#${s.id}$`));
      // Wait for smooth scrolling to settle, then check the heading is not under the nav.
      await expect
        .poll(() => headingTop(page, s.id), { timeout: 5000 })
        .toBeGreaterThanOrEqual(NAV_HEIGHT);
      await expect(page.locator(`#${s.id}-title`)).toBeInViewport();
      // FR-NAV-02: active indicator via IntersectionObserver.
      await expect(link).toHaveAttribute("aria-current", "true");
      await expect(nav.locator('[aria-current="true"]')).toHaveCount(1);
    }
  });

  test("active indicator follows plain scrolling and clears in the hero", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.locator('[aria-current="true"]')).toHaveCount(0);
    await page.evaluate(() => {
      // Put the middle of the section on the viewport centre line (sections can be short).
      const el = document.getElementById("experience")!;
      const top = el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2;
      window.scrollTo({ top, behavior: "instant" });
    });
    await expect(nav.getByRole("link", { name: "./experience" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(nav.locator('[aria-current="true"]')).toHaveCount(0);
  });

  test("hero has the CTA to projects and an ASCII Input -> Process -> Output diagram", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.locator("#top");
    await expect(hero.getByRole("link", { name: "[ View projects ]" })).toHaveAttribute(
      "href",
      "#projects",
    );
    const visual = hero.locator('[aria-hidden="true"] pre');
    await expect(visual).toContainText("| INPUT |--->| PROCESS |--->| OUTPUT |");
  });

  test("contact form has the FR-CF-01 fields", async ({ page }) => {
    await page.goto("/");
    const form = page.getByRole("form", { name: "Contact form" });
    await expect(form.getByLabel(/^Name/)).toBeVisible();
    await expect(form.getByLabel(/^Email/)).toHaveAttribute("type", "email");
    await expect(form.getByLabel(/^Inquiry type/).locator("option")).toHaveText([
      "Choose a type",
      "Job opportunity",
      "Freelance project",
      "Collaboration",
      "Other",
    ]);
    await expect(form.getByLabel(/^Message/)).toBeVisible();
    await expect(form.getByRole("checkbox")).toBeVisible();
    await expect(form.getByRole("button", { name: "[ Send message ]" })).toBeEnabled();
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("mobile menu links reach each section and focus its heading", async ({ page }) => {
    await page.goto("/");
    for (const s of SECTIONS) {
      await page.locator('button[aria-label="Open menu"]').click();
      await page.getByRole("dialog").getByRole("link", { name: s.label }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`#${s.id}$`));
      await expect(page.locator(`#${s.id}-title`)).toBeFocused();
      await expect
        .poll(() => headingTop(page, s.id), { timeout: 5000 })
        .toBeGreaterThanOrEqual(NAV_HEIGHT);
    }
  });
});

for (const width of [320, 375, 768, 1280, 1440]) {
  test(`home has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
}

test.describe("JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });

  test("page renders every section and nav anchors still work", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    for (const s of SECTIONS) {
      await expect(page.locator(`#${s.id}-title`)).toBeAttached();
    }
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "./contact" })
      .click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator("#contact-title")).toBeInViewport();
    await expect(
      page.getByRole("form", { name: "Contact form" }).getByLabel(/^Name/),
    ).toBeVisible();
  });
});
