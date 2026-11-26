import { describe, expect, it } from "vitest";

import {
  NEW_BADGE_WINDOW_MS,
  getLatestPublishedProject,
  getRecentProjects,
  hasUnseenRecentProjects,
  isProjectNew,
  latestPeriodMonth,
  mergeSeenSlugs,
  parsePublishedAtMs,
  type DiscoverableProject,
} from "@/lib/project-discovery";
import { ProjectSchema } from "@/lib/schema";

const NOW_2026_11_27 = Date.UTC(2026, 10, 27, 12, 0, 0); // 2026-11-27T12:00:00Z

function makeProject(overrides: Partial<DiscoverableProject> & { slug: string }): DiscoverableProject {
  return {
    title: overrides.slug,
    isDraft: false,
    order: 10,
    period: "2026-01 – 2026-06",
    publishedAt: null,
    ...overrides,
  };
}

describe("Latest Project Discovery System", () => {
  it("parses valid YYYY-MM-DD publishedAt dates and rejects invalid ones", () => {
    expect(parsePublishedAtMs("2026-11-25")).toBe(Date.UTC(2026, 10, 25));
    expect(parsePublishedAtMs("2026-02-30")).toBeNull();
    expect(parsePublishedAtMs("2026-11")).toBeNull();
    expect(parsePublishedAtMs("")).toBeNull();
    expect(parsePublishedAtMs(null)).toBeNull();
    expect(parsePublishedAtMs(undefined)).toBeNull();
  });

  it("extracts the latest period end month for deterministic fallback ordering", () => {
    expect(latestPeriodMonth("2026-09 – 2026-11")).toBe("2026-11");
    expect(latestPeriodMonth("2025-07")).toBe("2025-07");
    expect(latestPeriodMonth("2024")).toBe("2024-12");
    expect(latestPeriodMonth(null)).toBe("0000-00");
  });

  it("selects the newest published project by publishedAt and excludes drafts", () => {
    const projects = [
      makeProject({ slug: "older", order: 1, publishedAt: "2026-11-10" }),
      makeProject({ slug: "newest-draft", order: 1, isDraft: true, publishedAt: "2026-11-27" }),
      makeProject({ slug: "newest-published", order: 8, publishedAt: "2026-11-24" }),
      makeProject({ slug: "no-date", order: 1, period: "2026-12" }),
    ];

    expect(getLatestPublishedProject(projects)?.slug).toBe("newest-published");
  });

  it("falls back to the next eligible published project when the latest is unpublished or removed", () => {
    const projects = [
      makeProject({ slug: "removed-now-draft", isDraft: true, publishedAt: "2026-11-26" }),
      makeProject({ slug: "second-newest", publishedAt: "2026-11-20" }),
      makeProject({ slug: "oldest", publishedAt: "2026-11-01" }),
    ];

    expect(getLatestPublishedProject(projects)?.slug).toBe("second-newest");
  });

  it("falls back deterministically to most recent period then order when no publishedAt is set", () => {
    const projects = [
      makeProject({ slug: "fptk", order: 1, period: "2026-08 – 2026-10" }),
      makeProject({ slug: "overtime", order: 2, period: "2026-09 – 2026-11" }),
      makeProject({ slug: "draft-newer", isDraft: true, order: 1, period: "2026-12" }),
    ];

    expect(getLatestPublishedProject(projects)?.slug).toBe("overtime");
  });

  it("returns null gracefully when there are no published projects", () => {
    expect(getLatestPublishedProject([])).toBeNull();
    expect(getLatestPublishedProject([makeProject({ slug: "only-draft", isDraft: true })])).toBeNull();
  });

  it("applies the 7-day NEW badge window accurately and expires cleanly at >= 7 days", () => {
    const pubMs = Date.UTC(2026, 10, 20, 0, 0, 0); // 2026-11-20T00:00:00Z
    const proj = makeProject({ slug: "recent", publishedAt: "2026-11-20" });

    // Day 0 (same moment) -> NEW
    expect(isProjectNew(proj, pubMs)).toBe(true);
    // Day 6, last millisecond -> NEW
    expect(isProjectNew(proj, pubMs + NEW_BADGE_WINDOW_MS - 1)).toBe(true);
    // Exactly 7 days -> expired
    expect(isProjectNew(proj, pubMs + NEW_BADGE_WINDOW_MS)).toBe(false);
    // Future date -> not NEW
    expect(isProjectNew(proj, pubMs - 1)).toBe(false);
    // Draft -> never NEW
    expect(isProjectNew({ ...proj, isDraft: true }, pubMs + 1000)).toBe(false);
    // Missing publishedAt -> never NEW
    expect(isProjectNew(makeProject({ slug: "legacy" }), NOW_2026_11_27)).toBe(false);
  });

  it("returns all qualifying projects when multiple projects are published within 7 days", () => {
    const projects = [
      makeProject({ slug: "recent-a", publishedAt: "2026-11-26" }),
      makeProject({ slug: "recent-b", publishedAt: "2026-11-22" }),
      makeProject({ slug: "expired", publishedAt: "2026-11-15" }),
      makeProject({ slug: "draft-recent", isDraft: true, publishedAt: "2026-11-26" }),
    ];

    expect(getRecentProjects(projects, NOW_2026_11_27).map((p) => p.slug)).toEqual([
      "recent-a",
      "recent-b",
    ]);
  });

  it("does not reset badge lifecycle when non-publication fields of a project are edited", () => {
    const original = makeProject({
      slug: "edited-project",
      title: "Original Title",
      order: 5,
      publishedAt: "2026-11-10",
    });
    const edited = { ...original, title: "Updated Title", order: 1 };

    expect(isProjectNew(original, NOW_2026_11_27)).toBe(false);
    expect(isProjectNew(edited, NOW_2026_11_27)).toBe(false);
  });

  it("manages navigation indicator dismissal and re-activates when a newer project is published", () => {
    // No recent projects -> never show
    expect(hasUnseenRecentProjects([], null)).toBe(false);
    // Unseen recent project -> show
    expect(hasUnseenRecentProjects(["proj-a"], null)).toBe(true);
    // Dismissed after visiting /projects -> hide
    const seen1 = mergeSeenSlugs(null, ["proj-a"]);
    expect(hasUnseenRecentProjects(["proj-a"], seen1)).toBe(false);
    // New project published later -> re-appear for unseen proj-b
    expect(hasUnseenRecentProjects(["proj-a", "proj-b"], seen1)).toBe(true);
    // Visiting /projects again dismisses both
    const seen2 = mergeSeenSlugs(seen1, ["proj-a", "proj-b"]);
    expect(hasUnseenRecentProjects(["proj-a", "proj-b"], seen2)).toBe(false);
  });

  it("validates optional publishedAt in ProjectSchema", () => {
    const base = {
      slug: "sample-project",
      title: "Sample Project",
      summary: "One-line summary",
      problem: "One-line problem",
      type: "work" as const,
      capabilities: ["system_analysis" as const],
      role: "System Analyst",
      contribution: "owner" as const,
      teamSize: 1,
      period: "2026-11",
      stack: ["TypeScript"],
      outcomes: [],
      featured: false,
      order: 1,
      thumbnail: null,
      thumbnailAlt: null,
      demoUrl: null,
      gallery: [],
    };

    expect(ProjectSchema.safeParse({ ...base, publishedAt: "2026-11-26" }).success).toBe(true);
    expect(ProjectSchema.safeParse({ ...base, publishedAt: null }).success).toBe(true);
    expect(ProjectSchema.safeParse(base).success).toBe(true);
    expect(ProjectSchema.safeParse({ ...base, publishedAt: "2026/11/26" }).success).toBe(false);
  });
});
