import { describe, expect, it } from "vitest";

import { resolveIpProjectSlug } from "@/components/sections/education";
import { loadHomeData, type ProjectView } from "@/lib/views";

const sampleProjects = [
  { slug: "thermal-comfort-monitoring", title: "Thermal Comfort Monitoring", isDraft: false },
  { slug: "draft-only-project", title: "Draft Project", isDraft: true },
] as unknown as ProjectView[];

describe("Phase 7F — Education IP project slug validation (ISS-07)", () => {
  it("resolves valid published project slugs and rejects draft, unknown, or empty slugs", () => {
    expect(resolveIpProjectSlug("thermal-comfort-monitoring", sampleProjects)).toBe(
      "thermal-comfort-monitoring",
    );
    expect(resolveIpProjectSlug("  thermal-comfort-monitoring  ", sampleProjects)).toBe(
      "thermal-comfort-monitoring",
    );
    expect(resolveIpProjectSlug("draft-only-project", sampleProjects)).toBeNull();
    expect(resolveIpProjectSlug("nonexistent-project", sampleProjects)).toBeNull();
    expect(resolveIpProjectSlug("", sampleProjects)).toBeNull();
    expect(resolveIpProjectSlug("   ", sampleProjects)).toBeNull();
    expect(resolveIpProjectSlug(null, sampleProjects)).toBeNull();
    expect(resolveIpProjectSlug(undefined, sampleProjects)).toBeNull();
  });

  it("verifies all published CMS Education IP project slugs resolve to published projects", async () => {
    const { education, projects } = await loadHomeData({ drafts: false });
    const ipRecords = education.flatMap((ed) => ed.intellectualProperty ?? []);
    expect(ipRecords.length).toBeGreaterThan(0);

    for (const ip of ipRecords) {
      if (ip.projectSlug) {
        expect(resolveIpProjectSlug(ip.projectSlug, projects)).toBe(ip.projectSlug);
      }
    }
  });
});
