import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

// PRD section 11 / FR-CMS-03 / FR-TST-07: admin, API and dev-only routes are not crawled.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/keystatic", "/admin", "/api/", "/styleguide"] },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
