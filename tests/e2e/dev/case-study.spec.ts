import { expect, test } from "@playwright/test";

// Case studies against `next dev` with the Draft preview: no project is
// published yet, so the production build has no case-study pages to test.

const SLUGS = ["thermal-comfort-monitoring", "hris-migration-support", "dss-lab-tools"];
const TEMPLATE_HEADINGS = [
  "Context",
  "Problem",
  "My role",
  "As-is analysis",
  "Requirements",
  "Solution design",
  "Build",
  "Verification",
  "Outcome",
  "Reflection",
];

test.describe.configure({ timeout: 90_000 }); // dev compiles routes on first visit

test("every project page renders", async ({ page }) => {
  for (const slug of SLUGS) {
    const response = await page.goto(`/projects/${slug}`);
    expect(response?.status(), slug).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
  }
});

test.describe("case-study layout (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("snapshot, template headings, per-page title and back link", async ({ page }) => {
    await page.goto("/projects/hris-migration-support");
    await expect(page).toHaveTitle("HRIS Migration Support at Cimory — Desi Armanda Sari");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "HRIS Migration Support at Cimory",
    );
    const snapshot = page.getByRole("region", { name: "Project snapshot" });
    await expect(snapshot).toContainText("Supporting role, not core team");
    for (const name of TEMPLATE_HEADINGS) {
      await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "< back to projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    // Canonical URL.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/projects\/hris-migration-support$/,
    );
  });

  test("sticky table of contents links to every heading", async ({ page }) => {
    await page.goto("/projects/thermal-comfort-monitoring");
    const toc = page.getByRole("navigation", { name: "On this page" });
    await expect(toc).toBeVisible();
    await expect(toc).toHaveCSS("position", "sticky");
    await expect(toc.getByRole("link")).toHaveCount(TEMPLATE_HEADINGS.length);
    await toc.getByRole("link", { name: "Verification" }).click();
    await expect(page).toHaveURL(/#verification$/);
    await expect(page.locator("#verification")).toBeInViewport();
    // Stays visible after scrolling.
    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: "instant" }));
    await expect(toc).toBeInViewport();
  });

  test("previous / next follow the project order", async ({ page }) => {
    await page.goto("/projects/hris-migration-support");
    const more = page.getByRole("navigation", { name: "More projects" });
    await expect(more.locator('a[rel="prev"]')).toHaveAttribute(
      "href",
      "/projects/thermal-comfort-monitoring",
    );
    await expect(more.locator('a[rel="next"]')).toHaveAttribute("href", "/projects/dss-lab-tools");
    await page.goto("/projects/thermal-comfort-monitoring");
    await expect(more.locator('a[rel="prev"]')).toHaveCount(0);
  });

  test("draft TODO paragraphs render as MISSING markers, not raw TODO text", async ({ page }) => {
    await page.goto("/projects/dss-lab-tools");
    await expect(page.locator("[data-todo-content]").first()).toBeVisible();
    await expect(page.locator(".case-body")).not.toContainText("TODO(content)");
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("table of contents is hidden and nothing overflows", async ({ page }) => {
    await page.goto("/projects/hris-migration-support");
    await expect(page.getByRole("navigation", { name: "On this page" })).toBeHidden();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test("/projects lists every draft project and the filter hides non-matching ones", async ({
  page,
}) => {
  await page.goto("/projects");
  const items = page.locator("[data-project-list] > li");
  await expect(items).toHaveCount(SLUGS.length);
  await expect(items.filter({ visible: true })).toHaveCount(SLUGS.length);
  // No draft has capabilities yet, so a capability filter leaves nothing visible.
  await page
    .getByRole("navigation", { name: "Filter projects by capability" })
    .getByRole("link", { name: /Analysis/ })
    .click();
  await expect(page).toHaveURL(/capability=analysis/);
  await expect(items.filter({ visible: true })).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("No projects in this category yet.");
});
