import { describe, expect, it } from "vitest";

import { contentStatusSummary, validateAllContent } from "@/lib/content";

/*
 * Content gate — PRD 18.4. Runs before `next build` (npm "prebuild" script),
 * so any invalid PUBLISHED entry fails the build. Drafts are ignored.
 */
describe("content gate", () => {
  it("every published entry is valid, referenced and has its files", async () => {
    const problems = await validateAllContent();
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("all content files are readable by the Keystatic reader", async () => {
    const summary = await contentStatusSummary();
    expect(summary.profile).not.toBe("missing");
    expect(summary.settings).not.toBe("missing");
  });
});
