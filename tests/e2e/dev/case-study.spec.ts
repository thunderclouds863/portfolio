import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

// Case studies against `next dev` with the Draft preview: no project is
// published yet, so the production build has no case-study pages to test.

const SLUGS = [
  "fptk-sourcing-database",
  "overtime-management-system",
  "hospital-erp-prototype",
  "customer-chat-qa-engine",
  "sales-academy-lms",
  "thermal-comfort-monitoring",
  "survey-report-automation",
  "recruitment-data-compiler",
  "inventory-system-django",
  "e-commerce-1",
  "e-commerce-2",
  "equipment-loan-system",
  "library-system",
  "donation-distribution-system",
  "hmti-letter-generator",
];
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

function findDraftTodoProjectSlug(): string | null {
  const root = path.join(process.cwd(), "content", "projects");
  for (const slug of SLUGS) {
    const raw = fs.readFileSync(path.join(root, slug, "index.mdoc"), "utf8");
    const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
    if (/^status:\s*draft\s*$/m.test(frontmatter) && /\bTODO\(content\)/.test(raw)) {
      return slug;
    }
  }
  return null;
}

test.describe("case-study layout (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("snapshot, template headings, per-page title and back link", async ({ page }) => {
    await page.goto("/projects/overtime-management-system");
    await expect(page).toHaveTitle("Overtime Management System — Desi Armanda Sari");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overtime Management System");
    const snapshot = page.getByRole("region", { name: "Project snapshot" });
    await expect(snapshot).toContainText("Owner");
    await expect(snapshot).toContainText(
      "HR's overtime recap time went from about 4 hours to about 5 minutes.",
    );
    // All 10 standard case-study sections are now authored and visible.
    for (const name of TEMPLATE_HEADINGS) {
      const heading = page.getByRole("heading", { level: 2, name, exact: true });
      await expect(heading).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "< back to projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    // Canonical URL.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/projects\/overtime-management-system$/,
    );
  });

  test("sticky table of contents links to every heading", async ({ page }) => {
    await page.goto("/projects/hospital-erp-prototype");
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
    await page.goto("/projects/overtime-management-system");
    const more = page.getByRole("navigation", { name: "More projects" });
    await expect(more.locator('a[rel="prev"]')).toHaveAttribute(
      "href",
      "/projects/fptk-sourcing-database",
    );
    await expect(more.locator('a[rel="next"]')).toHaveAttribute(
      "href",
      "/projects/hospital-erp-prototype",
    );
    await page.goto("/projects/fptk-sourcing-database");
    await expect(more.locator('a[rel="prev"]')).toHaveCount(0);
  });

  test("draft TODO paragraphs render as MISSING markers, not raw TODO text", async ({ page }) => {
    const draftSlug = findDraftTodoProjectSlug();
    test.skip(!draftSlug, "No draft project with TODO(content) placeholders currently exists");
    await page.goto(`/projects/${draftSlug}`);
    await expect(page.locator("[data-todo-content]").first()).toBeVisible();
    await expect(page.locator(".case-body")).not.toContainText("TODO(content)");
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("table of contents is hidden and nothing overflows", async ({ page }) => {
    await page.goto("/projects/overtime-management-system");
    await expect(page.getByRole("navigation", { name: "On this page" })).toBeHidden();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

function countDraftPreviewCapability(capability: string): number {
  return SLUGS.filter((slug) => {
    const file = path.join(process.cwd(), "content", "projects", slug, "index.mdoc");
    const raw = fs.readFileSync(file, "utf8");
    const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
    const capBlock =
      frontmatter.match(/^capabilities:\s*\r?\n((?:[ \t]+-[ \t]+.+\r?\n?)*)/m)?.[1] ?? "";
    return new RegExp(`^\\s*-\\s*${capability}\\s*$`, "m").test(capBlock);
  }).length;
}

test("/projects lists every draft project and the filter hides non-matching ones", async ({
  page,
}) => {
  await page.goto("/projects");
  const items = page.locator("[data-project-list] > li");
  await expect(items).toHaveCount(SLUGS.length);
  await expect(items.filter({ visible: true })).toHaveCount(SLUGS.length);
  const filters = page.getByRole("navigation", { name: "Filter projects by capability" });
  const expectedAnalysis = countDraftPreviewCapability("system_analysis");
  const expectedProcess = countDraftPreviewCapability("process_improvement");
  await filters.getByRole("link", { name: /Analysis/ }).click();
  await expect(page).toHaveURL(/capability=analysis/);
  await expect(items.filter({ visible: true })).toHaveCount(expectedAnalysis);
  await expect(items.filter({ visible: true }).first()).toContainText("FPTK & Sourcing Database");
  await filters.getByRole("link", { name: /Process/ }).click();
  await expect(page).toHaveURL(/capability=process/);
  await expect(items.filter({ visible: true })).toHaveCount(expectedProcess);
  await expect(items.filter({ visible: true }).first()).toContainText("Overtime Management System");
});

// PRD 12: project card -> detail -> back, at desktop and phone widths.
for (const viewport of [
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
]) {
  test(`project card -> case study -> back (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/projects");
    const card = page.locator("[data-project-list] > li").filter({ hasText: "Sales Academy LMS" });
    await expect(async () => {
      await card.getByRole("link", { name: "Sales Academy LMS", exact: true }).click();
      await expect(page).toHaveURL(/\/projects\/sales-academy-lms$/, { timeout: 15_000 });
    }).toPass({ timeout: 45_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sales Academy LMS");

    // The in-page back link returns to the index.
    await page.getByRole("link", { name: "< back to projects" }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();

    // Browser history works both ways.
    await page.goBack();
    await expect(page).toHaveURL(/\/projects\/sales-academy-lms$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/projects$/);
  });
}

test("a featured card on the home page opens its case study", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/#projects");
  // A click that lands before hydration can be dropped by the router, so retry;
  // but give each attempt time: `next dev` compiles the case-study route on its
  // first visit, and clicking again would restart that navigation.
  await expect(async () => {
    await page
      .locator("#projects")
      .getByRole("link", { name: "Overtime Management System" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/projects\/overtime-management-system$/, { timeout: 15_000 });
  }).toPass({ timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overtime Management System");
  await page.goBack();
  await expect(page).toHaveURL(/\/#projects$|\/$/);
});

// PRD 14: numbers without evidence are labelled, never shown as proven facts.
test("outcomes show evidence when verified and 'self-reported' otherwise", async ({ page }) => {
  await page.goto("/projects/overtime-management-system");
  const verified = page.getByRole("region", { name: "Project snapshot" });
  await expect(verified.getByText(/^evidence: /)).toBeVisible();
  await expect(verified.locator("[data-outcome-unverified]")).toHaveCount(0);

  await page.goto("/projects/fptk-sourcing-database");
  const unverified = page.getByRole("region", { name: "Project snapshot" });
  await expect(unverified.locator("[data-outcome-unverified]")).toHaveText("self-reported");
  await expect(unverified.getByText(/^evidence: /)).toHaveCount(0);
});

// Owner request: every project with a running demo links to it directly.
test("demo links open the running app in a new tab, from the card and the case study", async ({
  page,
}) => {
  await page.goto("/projects");
  const card = page.locator("#project-fptk-sourcing-database");
  const demo = card.locator("[data-demo-link]");
  await expect(demo).toHaveAttribute("href", "https://fptkdemo-desi.streamlit.app");
  await expect(demo).toHaveAttribute("target", "_blank");
  await expect(demo).toHaveAccessibleName(
    /live demo.*of FPTK & Sourcing Database.*opens in a new tab/,
  );
  // The demo link sits above the card's stretched link, so a click reaches it.
  // Scroll into the viewport first because document.elementFromPoint returns null off-screen.
  await demo.scrollIntoViewIfNeeded();
  const box = (await demo.boundingBox())!;
  const hit = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest("a")?.getAttribute("href"),
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
  expect(hit).toBe("https://fptkdemo-desi.streamlit.app");

  await page.goto("/projects/fptk-sourcing-database");
  const snapshot = page.getByRole("region", { name: "Project snapshot" });
  await expect(snapshot.locator("[data-demo-link]")).toHaveAttribute(
    "href",
    "https://fptkdemo-desi.streamlit.app",
  );
  // A project without a demo shows no demo row.
  await page.goto("/projects/survey-report-automation");
  await expect(page.locator("[data-demo-link]")).toHaveCount(0);
});
