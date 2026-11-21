import Link from "next/link";

import { Button } from "@/components/ui/button";
import { navCta, sectionNav } from "@/lib/nav";

import { MobileMenu } from "./mobile-menu";

// FR-NAV-01: sticky, height 64px, z-index 100. Desktop links from 768px;
// below that the MobileMenu takes over (FR-NAV-04).
// Active-section indicator (FR-NAV-02) is added in Phase 3 with the sections.
function Nav() {
  return (
    <header className="bg-bg border-green-dim sticky top-0 z-100 h-(--nav-height) border-b-2">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          aria-label="Desi Armanda Sari, home"
          className="text-label text-green hover:text-amber flex min-h-11 items-center"
        >
          <span aria-hidden="true" className="lg:hidden">
            DAS
          </span>
          <span aria-hidden="true" className="hidden lg:inline">
            DESI ARMANDA SARI
          </span>
          <span aria-hidden="true" className="text-amber animate-blink">
            _
          </span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-3 lg:gap-5">
            {sectionNav.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  data-nav-id={item.id}
                  className="text-green hover:text-amber flex min-h-11 items-center font-mono text-xs lg:text-sm"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild size="compact" className="hidden md:inline-flex">
            <Link href={navCta.href}>{navCta.label}</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

export { Nav };
