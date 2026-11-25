import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const PUBLISHED_SLUGS = [
  "fptk-sourcing-database",
  "overtime-management-system",
  "customer-chat-qa-engine",
  "sales-academy-lms",
  "inventory-system-django",
  "thermal-comfort-monitoring",
  "e-commerce-1",
  "e-commerce-2",
  "equipment-loan-system",
  "library-system",
  "donation-distribution-system",
  "hmti-letter-generator",
] as const;

function hasProjectThumbnail(slug: string): boolean {
  const file = path.join(process.cwd(), "content", "projects", slug, "index.mdoc");
  const raw = fs.readFileSync(file, "utf8");
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  return /^thumbnail:\s*(?!null\b|""\s*$|''\s*$)\S+/m.test(frontmatter);
}

test.describe("Phase 2 — project listing & all 12 published case studies", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("/projects renders all 12 published cards with consistent covers, demo links and working capability filters", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/projects");
    const items = page.locator("[data-project-list] > li");
    await expect(items).toHaveCount(PUBLISHED_SLUGS.length);

    // Every rendered <img> must load cleanly (naturalWidth > 0).
    const brokenImgs = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.src),
    );
    expect(brokenImgs).toEqual([]);

    // Capability filters update URL and show matching counts.
    const filters = page.getByRole("navigation", { name: "Filter projects by capability" });
    await filters.getByRole("link", { name: /Analysis/ }).click();
    await expect(page).toHaveURL(/capability=analysis/);
    await expect(items.filter({ visible: true })).toHaveCount(4);

    await filters.getByRole("link", { name: /Process/ }).click();
    await expect(page).toHaveURL(/capability=process/);
    await expect(items.filter({ visible: true })).toHaveCount(1);

    await filters.getByRole("link", { name: /Data/ }).click();
    await expect(page).toHaveURL(/capability=data/);
    await expect(items.filter({ visible: true })).toHaveCount(2);

    await filters.getByRole("link", { name: /Development/ }).click();
    await expect(page).toHaveURL(/capability=development/);
    await expect(items.filter({ visible: true })).toHaveCount(12);

    expect(errors).toEqual([]);
  });

  test("all 12 published project detail pages return 200 with standardized template, cover, snapshot, narrative, demo link and related projects", async ({
    page,
  }) => {
    test.slow();
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    for (const slug of PUBLISHED_SLUGS) {
      const res = await page.goto(`/projects/${slug}`);
      expect(res?.status(), slug).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("region", { name: "Project snapshot" })).toBeVisible();
      await expect(page.locator(".case-body")).not.toBeEmpty();
      await expect(page.locator("[data-demo-link]").first()).toHaveAttribute("href", /^https:\/\//);
      await expect(page.getByRole("heading", { name: "Related projects" })).toBeVisible();
      await expect(page.getByRole("link", { name: "< back to projects" })).toHaveAttribute(
        "href",
        "/projects",
      );

      if (hasProjectThumbnail(slug)) {
        const img = page.locator("article figure img").first();
        await expect(img).toBeVisible();
        const loaded = await img.evaluate((el: HTMLImageElement) => el.naturalWidth > 0);
        expect(loaded, `${slug} thumbnail loaded`).toBe(true);
      } else {
        await expect(page.locator(`[data-project-schematic="${slug}"]`)).toBeVisible();
      }
    }

    expect(errors).toEqual([]);
  });

  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    test(`/projects and /projects/overtime-management-system have 0px horizontal overflow at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/projects", "/projects/overtime-management-system"]) {
        await page.goto(route);
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(scrollWidth, `${route} at ${width}px`).toBeLessThanOrEqual(innerWidth);
      }
    });
  }
});
