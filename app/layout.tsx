import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { ScanlineOverlay } from "@/components/layout/scanline-overlay";
import { SkipLink } from "@/components/layout/skip-link";

import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Desi Armanda Sari",
  description: "TODO(content): meta description from confirmed headline (IN-01)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col antialiased">
        <SkipLink />
        <Nav />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
        <ScanlineOverlay />
      </body>
    </html>
  );
}
