import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { revealAll } from "./helpers";

// Phase 5 — secondary routes on the production build (Published content only).

test.describe("404", { tag: "@mobile" }, () => {
  test("unknown URL returns HTTP 404 with the GAME OVER page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "GAME OVER" })).toBeVisible();
    await expect(page.getByText("ERROR 404: FILE NOT FOUND")).toBeVisible();
    const next = page.getByRole("navigation", { name: "Where to go next" });
    await expect(next.getByRole("link", { name: "[ Home ]" })).toHaveAttribute("href", "/");
    await expect(next.getByRole("link", { name: "[ Projects ]" })).toHaveAttribute(
      "href",
      "/projects",
    );
    // Styled with the site chrome.
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator("h1")).toHaveCSS("font-family", /Press Start 2P/);
  });

  test("unknown project slug and the placeholder slug return 404", async ({ page }) => {
    expect((await page.goto("/projects/no-such-project"))?.status()).toBe(404);
    expect((await page.goto("/projects/__none__"))?.status()).toBe(404);
  });
});

test.describe("/projects", () => {
  test("has filter chips whose state lives in the URL", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
    const filters = page.getByRole("navigation", { name: "Filter projects by capability" });
    await expect(filters.getByRole("link")).toHaveCount(5);
    await expect(filters.getByRole("link", { name: /All/ })).toHaveAttribute(
      "aria-current",
      "true",
    );

    // A click that lands while the page is still hydrating (slow WebKit runs) can
    // be dropped by the router; click again until the URL changes.
    await expect(async () => {
      await filters.getByRole("link", { name: /Process/ }).click();
      await expect(page).toHaveURL(/\/projects\?capability=process$/, { timeout: 2000 });
    }).toPass();
    await expect(filters.getByRole("link", { name: /Process/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(filters.getByRole("link", { name: /All/ })).not.toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("a filter in the URL is applied on load", async ({ page }) => {
    await page.goto("/projects?capability=data");
    const filters = page.getByRole("navigation", { name: "Filter projects by capability" });
    await expect(filters.getByRole("link", { name: /Data/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("[data-active-filter]")).toHaveAttribute(
      "data-active-filter",
      "data",
    );
  });

  test("an unknown filter value falls back to All", async ({ page }) => {
    await page.goto("/projects?capability=nope");
    await expect(page.locator("[data-active-filter]")).toHaveAttribute("data-active-filter", "all");
  });
});

test.describe("/cv", () => {
  test("has semantic headings for every CV section", async ({ page }) => {
    await page.goto("/cv");
    await expect(page.locator("h1")).toHaveCount(1);
    for (const name of ["Profile", "Experience", "Education", "Skills", "Selected projects"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
  });

  // PRD 12 / FR-CV-02. Until the CV PDF is published the page shows a MISSING
  // marker instead of a link; once it is, the link must download a real PDF
  // under the agreed file name. Either way there is never a broken link.
  test("CV download link serves the PDF (or shows MISSING until it exists)", async ({
    page,
    request,
  }) => {
    await page.goto("/cv");
    const link = page.getByRole("link", { name: "[ Download PDF ]" });
    if ((await link.count()) === 0) {
      await expect(page.getByText(/MISSING: CV PDF/)).toBeVisible();
      return;
    }
    await expect(link).toHaveAttribute("download", "desi-armanda-sari-cv.pdf");
    const res = await request.get((await link.getAttribute("href"))!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
  });

  test("print preview is clean: white page, dark text, no chrome or effects", async ({
    page,
    browserName,
  }) => {
    await page.goto("/cv");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.locator("h1")).toHaveCSS("color", "rgb(5, 5, 5)");
    await expect(page.locator("h1")).toHaveCSS("text-shadow", "none");
    await expect(page.getByRole("banner")).toBeHidden();
    await expect(page.getByRole("contentinfo")).toBeHidden();
    await expect(page.getByTestId("scanlines")).toBeHidden();
    // Every visible element uses token colours only: near-black text on white.
    const offColours = await page.evaluate(() =>
      [...document.querySelectorAll("main *")]
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .map((el) => getComputedStyle(el).color)
        .filter((c) => c !== "rgb(5, 5, 5)"),
    );
    expect(offColours).toEqual([]);
    // A real PDF renders (A4). page.pdf() exists in headless Chromium only.
    if (browserName !== "chromium") return;
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    expect(pdf.byteLength).toBeGreaterThan(1000);
    await test.info().attach("cv-print.pdf", { body: pdf, contentType: "application/pdf" });
  });
});

test.describe("/privacy", () => {
  test("names the data collected, the purpose and the processors", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
    for (const item of ["Your name", "Your email address", "Your message"]) {
      await expect(page.getByText(item, { exact: true })).toBeVisible();
    }
    for (const processor of ["Vercel", "Resend", "Cloudflare Turnstile"]) {
      await expect(page.locator("strong", { hasText: processor })).toBeVisible();
    }
    await expect(page.getByText(/not stored in a database/)).toBeVisible();
  });
});

test.describe("lightbox (styleguide demo)", () => {
  test("opens an accessible dialog, closes on Esc and returns focus", async ({ page }) => {
    await page.goto("/styleguide");
    const trigger = page.getByRole("button", { name: /Enlarge diagram: Sample flowchart/ });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Sample diagram (styleguide only)" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("img", { name: /Sample flowchart/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

for (const path of ["/projects", "/cv", "/privacy", "/this-page-does-not-exist"]) {
  test(
    `${path} has no serious or critical axe violations`,
    { tag: "@mobile" },
    async ({ page }) => {
      await page.goto(path);
      await revealAll(page);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious).toEqual([]);
    },
  );
}

for (const width of [320, 1280]) {
  test(`secondary routes have no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/projects", "/cv", "/privacy", "/this-page-does-not-exist"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
}
