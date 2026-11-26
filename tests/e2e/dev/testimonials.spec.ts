import { expect, test } from "@playwright/test";

import { revealAll } from "../helpers";

// Testimonials source A (LinkedIn recommendations) and the per-bullet experience
// scope, against `next dev` with the Draft preview (nothing is published yet).

test.describe.configure({ timeout: 90_000 });
test.use({ viewport: { width: 1280, height: 900 } });

const PEOPLE = [
  { name: "Nabila Zwei", label: "Colleague" },
  { name: "Angelika Anggreni Batubara", label: "Supervisor" },
  { name: "Fista Afriya Aisiyah", label: "Former schoolmate" },
];

test("home shows the recommendations after Projects, verbatim, without dates", async ({ page }) => {
  await page.goto("/");
  const ids = await page.locator("main > section[id]").evaluateAll((els) => els.map((e) => e.id));
  expect(ids.slice(3, 8)).toEqual([
    "experience",
    "education",
    "projects",
    "testimonials",
    "approach",
  ]);
  // Section numbers shift when Testimonials is present.
  await expect(page.locator("#testimonials h2")).toContainText("06 //");
  await expect(page.locator("#approach h2")).toContainText("07 //");
  await expect(page.locator("#contact h2")).toContainText("09 //");

  const section = page.locator("#testimonials");
  const cards = section.locator("figure");
  await expect(cards).toHaveCount(3);
  for (const person of PEOPLE) {
    const card = cards.filter({ hasText: person.name });
    await expect(card).toContainText(person.label);
    await expect(card).toContainText("LinkedIn recommendation");
    await expect(card).not.toContainText(/Verified/i);
  }
  // Verbatim text (spot check) and no dates shown.
  await expect(section).toContainText(
    "I had the pleasure of working with Desi as her direct supervisor.",
  );
  await expect(section).not.toContainText(/2025|2026|November|July/);
  // Asymmetric: a full-width lead quote above the others, which share a row
  // (not the Capabilities shape of one large block beside two stacked ones).
  // Wait for staggered Reveal scale transitions to settle before measuring rects.
  await revealAll(page);
  const boxes = await cards.evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { top: r.top, width: r.width };
    }),
  );
  expect(boxes[0]!.width).toBeGreaterThan(boxes[1]!.width + 40);
  expect(boxes[1]!.top).toBeGreaterThan(boxes[0]!.top);
  expect(Math.abs(boxes[1]!.top - boxes[2]!.top)).toBeLessThan(2);
  await expect(section.getByRole("link", { name: "[ All recommendations ]" })).toHaveAttribute(
    "href",
    "/testimonials",
  );
});

test("/testimonials filters by relationship with the state in the URL", async ({ page }) => {
  await page.goto("/testimonials");
  const items = page.locator("[data-testimonial-list] > li");
  await expect(items).toHaveCount(3);
  const filters = page.getByRole("navigation", { name: "Filter testimonials by relationship" });
  await expect(filters.getByRole("link")).toHaveCount(4); // All + 3 present relationships
  await filters.getByRole("link", { name: /Supervisor/ }).click();
  await expect(page).toHaveURL(/relationship=manager/);
  await expect(items.filter({ visible: true })).toHaveCount(1);
  await expect(items.filter({ visible: true })).toContainText("Angelika Anggreni Batubara");
  await filters.getByRole("link", { name: /All/ }).click();
  await expect(items.filter({ visible: true })).toHaveCount(3);
});

test("experience states a contribution scope on every bullet", async ({ page }) => {
  await page.goto("/");
  const cimory = page
    .locator("#experience li")
    .filter({ hasText: "HR Development Specialist – Corporate People Analyst" })
    .first();
  await expect(cimory).toContainText(
    "HR's overtime recap time went from about 4 hours to about 5 minutes.",
  );
  const hris = cimory.locator("li").filter({ hasText: "Supported the HRIS migration to Pro-Int" });
  await expect(hris).toContainText("[ Supporting ]");
  const fptk = cimory.locator("li").filter({ hasText: "FPTK & Sourcing Database" });
  await expect(fptk).toContainText("[ Owner ]");
});
