import { describe, expect, it } from "vitest";

import {
  EducationSchema,
  ContactMessageSchema,
  ContactMetaSchema,
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

  it("accepts no thumbnail, but a thumbnail needs alt text", () => {
    expect(
      ProjectSchema.safeParse({ ...validProject, thumbnail: null, thumbnailAlt: "" }).success,
    ).toBe(true);
    const result = ProjectSchema.safeParse({ ...validProject, thumbnailAlt: "" });
    expect(issuePaths(result)).toContain("thumbnailAlt");
  });

  it("accepts an https demo link and rejects anything else", () => {
    expect(
      ProjectSchema.safeParse({ ...validProject, demoUrl: "https://demo.example.com" }).success,
    ).toBe(true);
    const result = ProjectSchema.safeParse({ ...validProject, demoUrl: "javascript:alert(1)" });
    expect(issuePaths(result)).toContain("demoUrl");
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
    highlights: [
      { text: "One", scope: "owner" },
      { text: "Two", scope: "supporting" },
    ],
    tags: [],
  };
  const bullets = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ text: `Bullet ${i + 1}`, scope: "owner" }));

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

  it("requires a contribution scope on every bullet", () => {
    const result = ExperienceSchema.safeParse({
      ...valid,
      highlights: [
        { text: "One", scope: "owner" },
        { text: "Two", scope: "unset" },
      ],
    });
    expect(issuePaths(result)).toContain("highlights.1.scope");
  });

  it("accepts any number of highlights (no 2–4 limit, decision 0002 #5)", () => {
    for (const n of [0, 1, 4, 7]) {
      expect(ExperienceSchema.safeParse({ ...valid, highlights: bullets(n) }).success).toBe(true);
    }
  });
});

describe("EducationSchema", () => {
  const valid = {
    slug: "school",
    institution: "Example school",
    degree: "High school",
    major: "Science",
    start: "2018",
    end: "2021-06",
    gpa: "",
    focusAreas: [],
    thesis: "",
    achievements: [{ title: "2nd place", issuer: "Example issuer", date: "2020-05" }],
  };

  it("accepts a year-only or YYYY-MM period and optional grade/thesis", () => {
    const result = EducationSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.gpa).toBeNull();
  });

  it("rejects other date formats", () => {
    expect(issuePaths(EducationSchema.safeParse({ ...valid, start: "2018/19" }))).toContain(
      "start",
    );
  });

  it("needs a title, issuer and YYYY-MM month for every achievement", () => {
    const result = EducationSchema.safeParse({
      ...valid,
      achievements: [{ title: "", issuer: "Example issuer", date: "2020" }],
    });
    expect(issuePaths(result)).toEqual(
      expect.arrayContaining(["achievements.0.title", "achievements.0.date"]),
    );
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
    elapsedMs: "4200", // FormData sends strings
  };

  it("accepts a valid message", () => {
    const result = ContactMessageSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.elapsedMs).toBe(4200);
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

describe("ContactMetaSchema (FR-CF-03)", () => {
  it("reads FormData values", () => {
    expect(
      ContactMetaSchema.parse({ honeypot: "", elapsedMs: "3500", turnstileToken: "abc" }),
    ).toEqual({ honeypot: "", elapsedMs: 3500, turnstileToken: "abc" });
  });

  it("never throws: missing or malformed values fail the matching check", () => {
    // FormData.get returns null for a missing field, or a File for a file input.
    const file = new Blob(["x"]);
    expect(
      ContactMetaSchema.parse({ honeypot: null, elapsedMs: null, turnstileToken: null }),
    ).toEqual({
      honeypot: "",
      elapsedMs: 0,
      turnstileToken: "",
    });
    const odd = ContactMetaSchema.parse({ honeypot: file, elapsedMs: "abc", turnstileToken: file });
    expect(odd.elapsedMs).toBe(-1); // treated as "too fast"
    expect(odd.turnstileToken).toBe(""); // treated as "no token"
    expect(ContactMetaSchema.parse({ elapsedMs: "-5" }).elapsedMs).toBe(-1);
    expect(ContactMetaSchema.parse({ turnstileToken: "x".repeat(2049) }).turnstileToken).toBe("");
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
