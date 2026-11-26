import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

type PublishedProjectMeta = {
  slug: string;
  title: string;
  order: number;
  capabilities: string[];
  hasThumbnail: boolean;
  hasDemoUrl: boolean;
};

function readPublishedProjects(): PublishedProjectMeta[] {
  const root = path.join(process.cwd(), "content", "projects");
  const slugs = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const items: PublishedProjectMeta[] = [];
  for (const slug of slugs) {
    const file = path.join(root, slug, "index.mdoc");
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
    if (!/^status:\s*published\s*$/m.test(frontmatter)) continue;
    const title = frontmatter.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? slug;
    const orderMatch = frontmatter.match(/^order:\s*(\d+)/m)?.[1];
    const order = orderMatch ? Number(orderMatch) : 99;
    const capBlock =
      frontmatter.match(/^capabilities:\s*\r?\n((?:[ \t]+-[ \t]+.+\r?\n?)*)/m)?.[1] ?? "";
    const capabilities = [...capBlock.matchAll(/^\s*-\s*(\S+)\s*$/gm)].map((m) => m[1]!);
    const hasThumbnail = /^thumbnail:\s*(?!null\b|""\s*$|''\s*$)\S+/m.test(frontmatter);
    const hasDemoUrl = /^demoUrl:\s*https:\/\//m.test(frontmatter);
    items.push({ slug, title, order, capabilities, hasThumbnail, hasDemoUrl });
  }
  return items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

const PUBLISHED_PROJECTS = readPublishedProjects();
const CAPABILITY_COUNTS = {
  analysis: PUBLISHED_PROJECTS.filter((p) => p.capabilities.includes("system_analysis")).length,
  process: PUBLISHED_PROJECTS.filter((p) => p.capabilities.includes("process_improvement")).length,
  data: PUBLISHED_PROJECTS.filter((p) => p.capabilities.includes("data")).length,
  development: PUBLISHED_PROJECTS.filter((p) => p.capabilities.includes("system_development"))
    .length,
};

test.describe("Phase 2 — project listing & published case studies", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("/projects renders all published cards with consistent covers, demo links and working capability filters", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/projects");
    const items = page.locator("[data-project-list] > li");
    await expect(items).toHaveCount(PUBLISHED_PROJECTS.length);

    // Every rendered <img> must load cleanly (naturalWidth > 0).
    const brokenImgs = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.src),
    );
    expect(brokenImgs).toEqual([]);

    // Capability filters update URL and show matching counts derived from published CMS entries.
    const filters = page.getByRole("navigation", { name: "Filter projects by capability" });
    await filters.getByRole("link", { name: /Analysis/ }).click();
    await expect(page).toHaveURL(/capability=analysis/);
    await expect(items.filter({ visible: true })).toHaveCount(CAPABILITY_COUNTS.analysis);

    await filters.getByRole("link", { name: /Process/ }).click();
    await expect(page).toHaveURL(/capability=process/);
    await expect(items.filter({ visible: true })).toHaveCount(CAPABILITY_COUNTS.process);

    await filters.getByRole("link", { name: /Data/ }).click();
    await expect(page).toHaveURL(/capability=data/);
    await expect(items.filter({ visible: true })).toHaveCount(CAPABILITY_COUNTS.data);

    await filters.getByRole("link", { name: /Development/ }).click();
    await expect(page).toHaveURL(/capability=development/);
    await expect(items.filter({ visible: true })).toHaveCount(CAPABILITY_COUNTS.development);

    expect(errors).toEqual([]);
  });

  test("all published project detail pages return 200 with standardized template, cover, snapshot, narrative, optional demo link and related projects", async ({
    page,
  }) => {
    test.slow();
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    for (const project of PUBLISHED_PROJECTS) {
      const { slug } = project;
      const res = await page.goto(`/projects/${slug}`);
      expect(res?.status(), slug).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("region", { name: "Project snapshot" })).toBeVisible();
      await expect(page.locator(".case-body")).not.toBeEmpty();
      if (project.hasDemoUrl) {
        await expect(page.locator("[data-demo-link]").first()).toHaveAttribute(
          "href",
          /^https:\/\//,
        );
      } else {
        await expect(page.locator("[data-demo-link]")).toHaveCount(0);
      }
      await expect(page.getByRole("heading", { name: "Related projects" })).toBeVisible();
      await expect(page.getByRole("link", { name: "< back to projects" })).toHaveAttribute(
        "href",
        "/projects",
      );

      if (project.hasThumbnail) {
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
