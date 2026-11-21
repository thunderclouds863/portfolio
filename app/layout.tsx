import type { Metadata } from "next";

import { fontVariables } from "./fonts";

export const metadata: Metadata = {
  title: "Desi Armanda Sari",
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
