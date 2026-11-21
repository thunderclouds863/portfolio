import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { ScanlineOverlay } from "@/components/layout/scanline-overlay";
import { SkipLink } from "@/components/layout/skip-link";

import "../globals.css";

// Public site chrome: skip link, sticky nav, main landmark, footer, scanlines.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col antialiased">
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
