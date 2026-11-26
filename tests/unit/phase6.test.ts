import Markdoc from "@markdoc/markdoc";
import { describe, expect, it } from "vitest";

import { getProject, getProjects, reader } from "@/lib/content";
import { validateMarkdoc } from "@/lib/markdoc";
import { checkContactRateLimit, extractClientIp, resetContactRateLimit } from "@/lib/rate-limit";
import { ProjectSchema, RecommendationSchema } from "@/lib/schema";
import { evaluateCmsPrScope, parseRawGitDiff } from "@/scripts/check-cms-pr-scope.mjs";

describe("Workstream 3 — Multi-platform RecommendationSchema", () => {
  const base = {
    slug: "sample-rec",
    authorName: "Sample Reviewer",
    relationship: "client" as const,
    text: "Great work delivering the system on schedule.",
    permissionConfirmed: true as const,
  };

  it.each(["linkedin", "shopee", "whatsapp", "email", "google", "other"] as const)(
    "accepts platform '%s'",
    (platform) => {
      const res = RecommendationSchema.safeParse({ ...base, platform });
      expect(res.success).toBe(true);
    },
  );

  it("supports LinkedIn URL, source URL, screenshot evidence with alt, featured and order", () => {
    const res = RecommendationSchema.safeParse({
      ...base,
      platform: "linkedin",
      linkedinUrl: "https://www.linkedin.com/in/sample-reviewer/",
      sourceUrl: "https://example.com/review/1",
      evidenceImage: "/images/recommendations/evidence/sample.png",
      evidenceAlt: "Screenshot of original recommendation",
      featured: true,
      order: 1,
    });
    expect(res.success).toBe(true);
  });

  it("rejects screenshot evidence without alt text or non-https URLs", () => {
    expect(
      RecommendationSchema.safeParse({
        ...base,
        platform: "shopee",
        evidenceImage: "/images/recommendations/evidence/sample.png",
        evidenceAlt: "",
      }).success,
    ).toBe(false);

    expect(
      RecommendationSchema.safeParse({
        ...base,
        platform: "linkedin",
        linkedinUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("preserves backward compatibility when optional legacy fields are omitted", () => {
    const res = RecommendationSchema.safeParse({
      ...base,
      authorHeadline: "Senior Engineer",
      date: "2026-11-05",
    });
    expect(res.success).toBe(true);
    expect(res.data?.platform).toBe("linkedin");
    expect(res.data?.featured).toBe(false);
  });
});

describe("Workstream 4 — Published projects follow CMS status & drafts stay excluded", () => {
  it("publishes every CMS-published project with valid bodies/demo URLs and excludes drafts", async () => {
    const allEntries = await reader.collections.projects.all();
    const expectedPublishedSlugs = allEntries
      .filter(({ entry }) => entry.status === "published")
      .map(({ slug }) => slug);
    const expectedDraftSlugs = allEntries
      .filter(({ entry }) => entry.status === "draft")
      .map(({ slug }) => slug);

    const published = await getProjects();
    const publishedSlugs = published.map((p) => p.slug);

    expect(published.length).toBe(expectedPublishedSlugs.length);
    expect(new Set(publishedSlugs)).toEqual(new Set(expectedPublishedSlugs));
    for (const draftSlug of expectedDraftSlugs) {
      expect(publishedSlugs).not.toContain(draftSlug);
    }

    // Every published project passes full body/Markdoc validation.
    for (const slug of publishedSlugs) {
      const full = await getProject(slug);
      expect(full?.slug).toBe(slug);
    }

    // Existing live-demo URLs remain intact and every optional demoUrl uses https.
    const urls = published.map((p) => p.demoUrl).filter((u): u is string => Boolean(u));
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\//);
    }
    for (const expected of [
      "https://fptkdemo-desi.streamlit.app",
      "https://livechat-analysis-desi.streamlit.app",
      "https://overtime-demo-tci7.onrender.com",
      "https://cimory-academy-demo.onrender.com",
      "https://inventory-demo-9osp.onrender.com",
      "https://monitoring-termal-demo.onrender.com",
      "https://ecommerce1-demo.onrender.com",
      "https://ecommerce2-demo.onrender.com/login.php",
      "https://peminjaman-alat-demo.onrender.com",
      "https://perpustakaan-demo.onrender.com",
      "https://penyaluran-donasi-demo.onrender.com",
      "https://generate-surat-demo.onrender.com",
    ]) {
      expect(urls).toContain(expected);
    }
  });

  it("allows demo-showcase projects without invented role/summary while rejecting TODO text", () => {
    const ok = ProjectSchema.safeParse({
      slug: "demo-only",
      title: "Demo Only",
      summary: "",
      problem: "",
      type: "personal",
      capabilities: [],
      role: "",
      contribution: "unset",
      teamSize: null,
      period: "",
      stack: [],
      outcomes: [],
      featured: false,
      order: 10,
      thumbnail: null,
      thumbnailAlt: "",
      demoUrl: "https://demo.example.com",
      gallery: [],
    });
    expect(ok.success).toBe(true);

    const bad = ProjectSchema.safeParse({
      ...ok.data,
      summary: "TODO(content): fill me",
    });
    expect(bad.success).toBe(false);
  });
});

describe("Workstream 5 — Contact rate limiter & trusted IP extraction", () => {
  it("allows 5 requests in the window, blocks the 6th, and recovers after window expiry", () => {
    resetContactRateLimit();
    const now = 1_700_000_000_000;
    for (let i = 0; i < 5; i += 1) {
      expect(checkContactRateLimit("203.0.113.10", now + i * 1000).ok).toBe(true);
    }
    const blocked = checkContactRateLimit("203.0.113.10", now + 6000);
    expect(blocked.ok).toBe(false);
    // Different IP is unaffected.
    expect(checkContactRateLimit("203.0.113.11", now + 6000).ok).toBe(true);
    // Window expiry allows requests again.
    expect(checkContactRateLimit("203.0.113.10", now + 11 * 60 * 1000).ok).toBe(true);
    resetContactRateLimit();
  });

  it("prefers x-vercel-forwarded-for over spoofable x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
      "x-vercel-forwarded-for": "203.0.113.99",
    });
    expect(extractClientIp(headers)).toBe("203.0.113.99");
  });
});

describe("Security — Markdoc unsafe link protocol rejection", () => {
  it("blocks javascript: and data: links at parse time and in AST validation while allowing https:/relative links", () => {
    // markdown-it refuses to parse javascript: as a link node (renders inert text).
    const parsedXss = Markdoc.parse("[click](javascript:alert(1))");
    expect([...parsedXss.walk()].some((n) => n.type === "link")).toBe(false);

    // Defense-in-depth: even a raw AST link node with javascript:/data: is rejected.
    const rawJsLink = new Markdoc.Ast.Node("document", {}, [
      new Markdoc.Ast.Node("link", { href: "javascript:alert(1)" }),
    ]);
    expect(validateMarkdoc(rawJsLink).some((e) => e.id === "unsafe-link-protocol")).toBe(true);

    const rawDataLink = new Markdoc.Ast.Node("document", {}, [
      new Markdoc.Ast.Node("link", { href: "data:text/html,<script>alert(1)</script>" }),
    ]);
    expect(validateMarkdoc(rawDataLink).some((e) => e.id === "unsafe-link-protocol")).toBe(true);

    const safeDoc = Markdoc.parse("[ok](https://desiarmandasari.my.id) [rel](/projects)");
    expect(validateMarkdoc(safeDoc)).toEqual([]);
  });
});

describe("Workstream 7 — CMS Auto-Publish strict content-only scope guard", () => {
  it("allows regular content/* yaml/mdoc and public/images/* raster images targeting main", () => {
    const res = evaluateCmsPrScope({
      headRef: "content/add-testimonial",
      baseRef: "main",
      files: [
        { status: "A", mode: "100644", path: "content/recommendations/new-client.yaml" },
        {
          status: "A",
          mode: "100644",
          path: "public/images/recommendations/evidence/new-client.png",
        },
      ],
    });
    expect(res.eligible).toBe(true);
  });

  it("blocks code, workflow, deletion, rename, symlink, executable, SVG, and dotfile changes", () => {
    expect(
      evaluateCmsPrScope({
        headRef: "content/bad-code",
        baseRef: "main",
        files: [{ status: "M", mode: "100644", path: "app/(site)/page.tsx" }],
      }).eligible,
    ).toBe(false);

    expect(
      evaluateCmsPrScope({
        headRef: "content/bad-workflow",
        baseRef: "main",
        files: [{ status: "M", mode: "100644", path: ".github/workflows/ci.yml" }],
      }).eligible,
    ).toBe(false);

    expect(
      evaluateCmsPrScope({
        headRef: "content/bad-delete",
        baseRef: "main",
        files: [
          {
            status: "D",
            mode: "000000",
            path: "content/projects/fptk-sourcing-database/index.mdoc",
          },
        ],
      }).eligible,
    ).toBe(false);

    expect(
      evaluateCmsPrScope({
        headRef: "content/bad-rename",
        baseRef: "main",
        files: [{ status: "R", mode: "100644", path: "content/settings.yaml" }],
      }).eligible,
    ).toBe(false);

    expect(
      evaluateCmsPrScope({
        headRef: "content/bad-symlink",
        baseRef: "main",
        files: [{ status: "A", mode: "120000", path: "content/symlink.yaml" }],
      }).eligible,
    ).toBe(false);

    expect(
      evaluateCmsPrScope({
        headRef: "content/bad-exec",
        baseRef: "main",
        files: [{ status: "A", mode: "100755", path: "content/script.yaml" }],
      }).eligible,
    ).toBe(false);

    expect(
      evaluateCmsPrScope({
        headRef: "content/bad-svg",
        baseRef: "main",
        files: [{ status: "A", mode: "100644", path: "public/images/recommendations/xss.svg" }],
      }).eligible,
    ).toBe(false);

    expect(
      evaluateCmsPrScope({
        headRef: "content/bad-dotfile",
        baseRef: "main",
        files: [{ status: "A", mode: "100644", path: "content/.env" }],
      }).eligible,
    ).toBe(false);
  });

  it("parses git diff --raw --no-renames output accurately", () => {
    const parsed = parseRawGitDiff(
      ":000000 100644 0000000 abcdef1 A\tcontent/recommendations/a.yaml\n:100644 120000 abcdef1 1234567 T\tcontent/link.yaml\n",
    );
    expect(parsed).toEqual([
      { status: "A", mode: "100644", path: "content/recommendations/a.yaml" },
      { status: "T", mode: "120000", path: "content/link.yaml" },
    ]);
  });
});
