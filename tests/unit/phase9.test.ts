import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Capabilities } from "@/components/sections/capabilities";
import { TestimonialCard } from "@/components/testimonials/testimonial-card";
import { loadHomeData, type RecommendationView } from "@/lib/views";

const baseRecommendation: RecommendationView = {
  slug: "sample-rec",
  authorName: "Rina Wijaya",
  authorHeadline: "Operations Lead",
  organization: "Sample Co",
  platform: "linkedin",
  platformLabel: "",
  linkedinUrl: "https://www.linkedin.com/in/rina-wijaya/",
  sourceUrl: "",
  relationship: "colleague",
  relationshipLabel: "Colleague",
  text: "Clear analytical thinker who improved our reporting pipeline.",
  date: "2026-10-01",
  avatar: null,
  avatarAlt: "",
  evidenceImage: null,
  evidenceAlt: "",
  featured: false,
  order: null,
  permissionConfirmed: true,
  isDraft: false,
};

describe("Phase 9 — Recommendations & Capabilities structural checks", () => {
  it("renders subtle accessible LinkedIn affordance when linkedinUrl is set and plain text otherwise", () => {
    const linkedHtml = renderToStaticMarkup(
      createElement(TestimonialCard, { item: baseRecommendation }),
    );
    expect(linkedHtml).toContain('data-contributor-link=""');
    expect(linkedHtml).toContain('href="https://www.linkedin.com/in/rina-wijaya/"');
    expect(linkedHtml).toContain('rel="noopener noreferrer"');
    expect(linkedHtml).toContain("(LinkedIn profile, opens in a new tab)");

    const unlinkedHtml = renderToStaticMarkup(
      createElement(TestimonialCard, {
        item: { ...baseRecommendation, linkedinUrl: "" },
      }),
    );
    expect(unlinkedHtml).not.toContain("data-contributor-link");
    expect(unlinkedHtml).toContain("Rina Wijaya");
  });

  it("renders all 3 Capabilities pillars with bounded evidence and archive filter overflow links", async () => {
    const { settings, projects } = await loadHomeData({ drafts: false });
    const html = renderToStaticMarkup(createElement(Capabilities, { settings, projects }));
    expect(html).toContain("Pillar 01 // Lead Focus");
    expect(html).toContain("Pillar 02");
    expect(html).toContain("Pillar 03");
    expect(html).toContain('href="/projects?capability=development"');
  });
});
