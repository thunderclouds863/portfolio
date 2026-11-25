import { describe, expect, it } from "vitest";

import { resolveApproachStages } from "@/lib/approach-story";
import { loadHomeData } from "@/lib/views";

describe("Phase 7C — Approach CMS source-of-truth alignment", () => {
  it("resolves all 6 published CMS settings.approach steps verbatim with published-only projects", async () => {
    const { settings, projects } = await loadHomeData({ drafts: false });
    expect(settings).not.toBeNull();
    const cmsSteps = settings!.approach;
    expect(cmsSteps).toHaveLength(6);

    const publishedSlugs = new Set(projects.map((p) => p.slug));
    const resolved = resolveApproachStages(cmsSteps, projects);

    expect(resolved).toHaveLength(6);
    expect(resolved.map((s) => s.title)).toEqual(cmsSteps.map((s) => s.title));
    expect(resolved.map((s) => s.description)).toEqual(cmsSteps.map((s) => s.description));
    expect(resolved.map((s) => s.visualKind)).toEqual([
      "understand",
      "map-as-is",
      "analyze",
      "design-to-be",
      "build",
      "verify",
    ]);

    for (const stage of resolved) {
      expect(stage.projects.length).toBeGreaterThan(0);
      for (const p of stage.projects) {
        expect(publishedSlugs.has(p.slug), `unexpected slug: ${p.slug}`).toBe(true);
      }
    }
  });

  it("handles missing, empty, renamed, and draft-only project cases gracefully without hardcoded copy", () => {
    expect(resolveApproachStages(null, [])).toEqual([]);
    expect(resolveApproachStages([], [])).toEqual([]);

    const custom = resolveApproachStages(
      [
        { title: "  ", description: "ignored blank title" },
        { title: "Discover", description: "Custom CMS step description." },
      ],
      [
        {
          slug: "overtime-management-system",
          title: "Overtime Management System",
          isDraft: true,
        } as never,
      ],
    );

    expect(custom).toHaveLength(1);
    expect(custom[0]?.title).toBe("Discover");
    expect(custom[0]?.description).toBe("Custom CMS step description.");
    expect(custom[0]?.projects).toEqual([]); // draft project never leaked
  });
});
