import type { Metadata } from "next";

import { SITE_NAME, siteUrl } from "@/lib/seo";

import { fontVariables } from "./fonts";

// PRD section 11 SEO: global static defaults (canonical base, title template).
// CMS-driven description and OG/Twitter defaults live in app/(site)/layout.tsx
// so /keystatic stays on static root metadata.
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
};

// Root layout: document shell only. Site chrome and global styles live in
// app/(site)/layout.tsx so the Keystatic admin (/keystatic) is not styled by them.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
