import { describe, expect, it } from "vitest";

import { buildSkillTaxonomy } from "@/lib/skills-taxonomy";
import { loadHomeData } from "@/lib/views";

describe("Phase 4 — Evidence-based skills taxonomy", () => {
  it("categorizes real CMS skills & published project stacks without duplicates", async () => {
    const { skills, projects } = await loadHomeData({ drafts: false });
    const categories = buildSkillTaxonomy(skills, projects);

    expect(categories.length).toBe(6);
    const allItems = categories.flatMap((c) => c.items);
    const ids = allItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Language vs framework separation
    const langCat = categories.find((c) => c.key === "languages_frameworks");
    expect(langCat?.items.some((i) => i.id === "python" && i.kind === "language")).toBe(true);
    expect(langCat?.items.some((i) => i.id === "streamlit" && i.kind === "framework")).toBe(true);
    expect(langCat?.items.some((i) => i.id === "django" && i.kind === "framework")).toBe(true);
    expect(langCat?.items.some((i) => i.id === "nestjs" && i.kind === "framework")).toBe(true);

    // Databases separated from analytics
    const dbCat = categories.find((c) => c.key === "databases_storage");
    expect(dbCat?.items.some((i) => i.id === "postgresql" && i.kind === "database")).toBe(true);
    expect(dbCat?.items.some((i) => i.id === "cloudflare-r2" && i.kind === "storage")).toBe(true);

    // Performance testing & IoT evidenced from published projects
    const testCat = categories.find((c) => c.key === "testing_performance");
    expect(testCat?.items.some((i) => i.id === "k6")).toBe(true);
    const iotCat = categories.find((c) => c.key === "platforms_iot_simulation");
    expect(iotCat?.items.some((i) => i.id === "arduino-mkr-wifi-1010")).toBe(true);
  });

  it("links only published project slugs and assigns a valid icon to every item", async () => {
    const { skills, projects } = await loadHomeData({ drafts: false });
    const publishedSlugs = new Set(projects.map((p) => p.slug));
    const categories = buildSkillTaxonomy(skills, projects);

    for (const cat of categories) {
      for (const item of cat.items) {
        expect(item.icon.length).toBeGreaterThan(0);
        for (const ev of item.evidenceSlugs) {
          expect(publishedSlugs.has(ev), `draft or unknown slug: ${ev}`).toBe(true);
        }
      }
    }

    const pg = categories.flatMap((c) => c.items).find((i) => i.id === "postgresql");
    expect(pg?.evidenceSlugs).toContain("fptk-sourcing-database");
    expect(pg?.evidenceSlugs).toContain("overtime-management-system");
    expect(pg?.evidenceSlugs).toContain("sales-academy-lms");
  });
});
