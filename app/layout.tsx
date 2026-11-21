import type { Metadata } from "next";

import { fontVariables } from "./fonts";

// PRD section 11 SEO: title template, canonical URLs from NEXT_PUBLIC_SITE_URL.
// Full metadata, OG image and JSON-LD come in Phase 7.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Desi Armanda Sari", template: "%s — Desi Armanda Sari" },
  description: "TODO(content): meta description from confirmed headline (IN-01)",
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
