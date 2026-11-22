import type { Metadata } from "next";

import { getHomeData } from "@/lib/home-data";
import { SITE_NAME, siteDescription, siteUrl } from "@/lib/seo";

import { fontVariables } from "./fonts";

// PRD section 11 SEO: title template, description, canonical base, Open Graph
// and Twitter defaults. Routes refine these with pageMetadata() (lib/seo.ts).
export async function generateMetadata(): Promise<Metadata> {
  const description = siteDescription(await getHomeData());
  return {
    metadataBase: siteUrl(),
    title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
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

// Root layout: document shell only. Site chrome and global styles live in
// app/(site)/layout.tsx so the Keystatic admin (/keystatic) is not styled by them.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
