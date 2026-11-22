import type { ReactNode } from "react";

import { PageGrid } from "@/components/motion/page-grid";

import { Footer } from "./footer";
import { Nav } from "./nav";
import { ScanlineOverlay } from "./scanline-overlay";
import { SkipLink } from "./skip-link";

// Public site chrome: skip link, sticky nav, main landmark, footer, scanlines,
// and the page-wide L0 parallax grid (PRD 7). Shared by app/(site)/layout.tsx
// and app/not-found.tsx.
function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col antialiased">
      <PageGrid />
      <SkipLink />
      <Nav />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
      <ScanlineOverlay />
    </div>
  );
}

export { SiteChrome };
