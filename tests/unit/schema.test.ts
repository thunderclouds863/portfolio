import { describe, expect, it } from "vitest";

import {
  ContactMessageSchema,
  ExperienceSchema,
  ProjectSchema,
  RecommendationSchema,
  SkillSchema,
  findDuplicateSlugs,
  todoMessage,
} from "@/lib/schema";

// Fixture values are synthetic test data, not site content.
const validProject = {
  slug: "example-project",
  title: "Example project",
  summary: "Example summary",
  problem: "Example problem",
  type: "work",
  capabilities: ["system_analysis"],
  role: "Example role",
  contribution: "owner",
  teamSize: 3,
  period: "2024-01 – 2024-06",
  stack: ["Example tool"],
  outcomes: [{ statement: "Example outcome", verified: false, evidence: null }],
  featured: true,
  order: 1,
  thumbnail: "/images/projects/example-project/thumbnail.png",
  thumbnailAlt: "Example thumbnail",
  gallery: [],
};

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((i) => i.path.join(".")) ?? [];
}

describe("ProjectSchema", () => {
  it("accepts a valid published project", () => {
    expect(ProjectSchema.safeParse(validProject).success).toBe(true);
  });

  it("rejects a missing role", () => {
    const { role: _role, ...rest } = validProject;
    const result = ProjectSchema.safeParse(rest);
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("role");
  });

  it("rejects an empty role", () => {
    const result = ProjectSchema.safeParse({ ...validProject, role: "   " });
    expect(issuePaths(result)).toContain("role");
  });

  it("rejects a missing contribution", () => {
    const { contribution: _c, ...rest } = validProject;
    const result = ProjectSchema.safeParse(rest);
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("contribution");
  });

  it("rejects contribution 'unset' (the CMS default)", () => {
    const result = ProjectSchema.safeParse({ ...validProject, contribution: "unset" });
    expect(issuePaths(result)).toContain("contribution");
  });

  it("rejects TODO placeholders in published fields", () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      summary: "TODO(content): one-line summary",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/TODO/);
  });

  it("rejects a verified outcome without evidence", () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      outcomes: [{ statement: "Example", verified: true, evidence: "" }],
    });
    expect(issuePaths(result)).toContain("outcomes.0.evidence");
  });

  it("accepts a verified outcome with evidence", () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      outcomes: [{ statement: "Example", verified: true, evidence: "Example evidence note" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects gallery images without alt text", () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      gallery: [{ image: "/images/projects/example-project/a.png", alt: "", caption: null }],
    });
    expect(issuePaths(result)).toContain("gallery.0.alt");
  });

  it("rejects a missing thumbnail", () => {
    const result = ProjectSchema.safeParse({ ...validProject, thumbnail: null });
    expect(issuePaths(result)).toContain("thumbnail");
  });
});

describe("findDuplicateSlugs", () => {
  it("returns nothing for unique slugs", () => {
    expect(findDuplicateSlugs([{ slug: "a" }, { slug: "b" }])).toEqual([]);
  });

  it("finds duplicate slugs", () => {
    expect(
      findDuplicateSlugs([{ slug: "a" }, { slug: "b" }, { slug: "a" }, { slug: "b" }]),
    ).toEqual(["a", "b"]);
  });
});

describe("ExperienceSchema", () => {
  const valid = {
    slug: "example",
    organization: "Example org",
    role: "Example role",
    start: "2024-01",
    end: "",
    scope: "supporting",
    highlights: ["One", "Two"],
    tags: [],
  };

  it("accepts a current role (empty end) and normalises it to null", () => {
    const result = ExperienceSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.end).toBeNull();
  });

  it("rejects dates that are not YYYY-MM", () => {
    expect(issuePaths(ExperienceSchema.safeParse({ ...valid, start: "Jan 2024" }))).toContain(
      "start",
    );
    expect(issuePaths(ExperienceSchema.safeParse({ ...valid, end: "2024-13" }))).toContain("end");
  });

  it("requires a contribution scope", () => {
    expect(issuePaths(ExperienceSchema.safeParse({ ...valid, scope: "unset" }))).toContain("scope");
  });

  it("requires 2–4 highlights", () => {
    expect(ExperienceSchema.safeParse({ ...valid, highlights: ["One"] }).success).toBe(false);
    expect(
      ExperienceSchema.safeParse({ ...valid, highlights: ["1", "2", "3", "4", "5"] }).success,
    ).toBe(false);
  });
});

describe("SkillSchema", () => {
  it("rejects unset group and level", () => {
    const result = SkillSchema.safeParse({
      slug: "x",
      name: "Example",
      group: "unset",
      level: "unset",
      evidence: [],
    });
    expect(issuePaths(result)).toEqual(expect.arrayContaining(["group", "level"]));
  });
});

describe("RecommendationSchema", () => {
  const valid = {
    slug: "example-person",
    authorName: "Example Person",
    authorHeadline: "Example headline",
    relationship: "colleague",
    text: "Example recommendation text.",
    date: "2026-01-15",
    permissionConfirmed: true,
  };

  it("accepts a recommendation with permission", () => {
    expect(RecommendationSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a recommendation without confirmed permission", () => {
    const result = RecommendationSchema.safeParse({ ...valid, permissionConfirmed: false });
    expect(issuePaths(result)).toContain("permissionConfirmed");
  });
});

describe("ContactMessageSchema (FR-CF-01)", () => {
  const valid = {
    name: "Example Name",
    email: "person@example.com",
    type: "job",
    message: "This is an example message with enough length.",
    consent: true,
    turnstileToken: "token",
    honeypot: "",
    renderedAt: 1_700_000_000_000,
  };

  it("accepts a valid message", () => {
    expect(ContactMessageSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["name", { name: "A" }],
    ["email", { email: "not-an-email" }],
    ["message", { message: "Too short" }],
    ["consent", { consent: false }],
    ["type", { type: "spam" }],
  ])("rejects invalid %s", (field, patch) => {
    expect(issuePaths(ContactMessageSchema.safeParse({ ...valid, ...patch }))).toContain(field);
  });
});

describe("todoMessage", () => {
  it("strips the TODO(content) prefix", () => {
    expect(todoMessage("TODO(content): start month YYYY-MM (IN-02)")).toBe(
      "start month YYYY-MM (IN-02)",
    );
    expect(todoMessage("TODO: something")).toBe("something");
    expect(todoMessage("TODO(content):")).toBe("content needed");
  });
});
