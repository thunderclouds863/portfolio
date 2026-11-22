import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { revealAll } from "./helpers";

// Phase 7 — metadata, sitemap/robots, OG image, CSP and axe on the production build.

const PUBLIC_ROUTES = ["/", "/projects", "/testimonials", "/cv", "/privacy"];
const ALL_ROUTES = [...PUBLIC_ROUTES, "/this-page-does-not-exist", "/styleguide"];

test.describe("metadata on every public route (PRD 11)", () => {
  test("unique title, description, canonical, Open Graph and Twitter tags", async ({ page }) => {
    const titles = new Set<string>();
    for (const path of PUBLIC_ROUTES) {
      await page.goto(path);
      const title = await page.title();
      expect(title, path).toMatch(/Desi Armanda Sari/);
      expect(titles.has(title), `duplicate title on ${path}`).toBe(false);
      titles.add(title);

      const meta = (sel: string) => page.locator(sel).first().getAttribute("content");
      const description = await meta('meta[name="description"]');
      expect(description, path).toBeTruthy();
      expect(description, path).not.toMatch(/TODO/);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonical!).pathname, path).toBe(path);
      expect(await meta('meta[property="og:title"]'), path).toBeTruthy();
      expect(await meta('meta[property="og:image"]'), path).toMatch(/opengraph-image/);
      expect(await meta('meta[name="twitter:card"]'), path).toBe("summary_large_image");
      expect(await meta('meta[name="twitter:image"]'), path).toMatch(/twitter-image/);
    }
  });

  test("the OG image is a 1200x630 PNG", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    const png = await res.body();
    // PNG IHDR: width and height are big-endian uint32 at bytes 16 and 20.
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  test("sitemap lists public routes only; robots disallows admin and dev routes", async ({
    request,
  }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const path of ["/projects", "/testimonials", "/cv", "/privacy"]) {
      expect(sitemap).toContain(`${path}</loc>`);
    }
    for (const hidden of ["/styleguide", "/keystatic", "/admin", "/api/"]) {
      expect(sitemap).not.toContain(hidden);
    }
    const robots = await (await request.get("/robots.txt")).text();
    for (const rule of [
      "Disallow: /keystatic",
      "Disallow: /admin",
      "Disallow: /api/",
      "Disallow: /styleguide",
    ]) {
      expect(robots).toContain(rule);
    }
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
  });

  test("the 404 and admin routes are noindex", async ({ page, request }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    expect((await request.get("/keystatic")).headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("Content Security Policy", () => {
  for (const path of ALL_ROUTES) {
    test(`no CSP violations on ${path}`, async ({ page }) => {
      await page.addInitScript(() => {
        const store: string[] = [];
        (window as unknown as { __csp: string[] }).__csp = store;
        document.addEventListener("securitypolicyviolation", (e) =>
          store.push(`${e.violatedDirective} ${e.blockedURI}`),
        );
      });
      const consoleViolations: string[] = [];
      page.on("console", (m) => {
        if (m.text().includes("Content Security Policy")) consoleViolations.push(m.text());
      });
      await page.goto(path);
      await revealAll(page); // scrolls the page so lazy work (reveals, Turnstile) runs
      const violations = await page.evaluate(
        () => (window as unknown as { __csp: string[] }).__csp,
      );
      expect(violations, path).toEqual([]);
      expect(consoleViolations, path).toEqual([]);
    });
  }
});

test("/testimonials has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/testimonials");
  await revealAll(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
  ).toEqual([]);
});
