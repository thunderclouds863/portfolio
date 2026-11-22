import type { MetadataRoute } from "next";

import publishedSlugs from "@/lib/generated/project-slugs.json";
import { absoluteUrl } from "@/lib/seo";

// PRD section 11: public routes + published case studies only. The admin
// (/keystatic, /admin), the API and the dev-only /styleguide are excluded.
// Slugs come from scripts/generate-routes.mjs (published entries only).
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/projects",
    ...publishedSlugs.map((slug) => `/projects/${slug}`),
    "/testimonials",
    "/cv",
    "/privacy",
  ];
  return paths.map((path) => ({ url: absoluteUrl(path) }));
}
