import type { Metadata } from "next";

import { SiteChrome } from "@/components/layout/site-chrome";
import { getHomeData } from "@/lib/home-data";
import { SITE_NAME, siteDescription } from "@/lib/seo";

import "../globals.css";

// PRD section 11 SEO: CMS-driven description, Open Graph and Twitter defaults.
// Lives in the public site layout (not app/layout.tsx) so /keystatic does not
// execute dynamic generateMetadata() during prerendering.
export async function generateMetadata(): Promise<Metadata> {
  const description = siteDescription(await getHomeData());
  return {
    description,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: "/",
      title: SITE_NAME,
      description,
    },
    twitter: { card: "summary_large_image", title: SITE_NAME, description },
  };
}

// Public site layout. Global styles live here (not in the root layout) so the
// Keystatic admin at /keystatic is not styled by them.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome>{children}</SiteChrome>;
}
