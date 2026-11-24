import Link from "next/link";

import { Button } from "@/components/ui/button";
import { navCta, sectionNav } from "@/lib/nav";

import { ActiveSection } from "./active-section";
import { MobileMenu } from "./mobile-menu";

// FR-NAV-01: sticky, height 64px, z-index 100. Desktop links from 768px;
// below that the MobileMenu takes over (FR-NAV-04).
// FR-NAV-02: ActiveSection sets aria-current on the link of the section in view.
function Nav() {
  return (
    <header className="bg-bg border-green-dim sticky top-0 z-100 h-(--nav-height) border-b-2 print:hidden">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6">
        {/* WCAG 2.5.3 label in name: visible text matches the accessible name
            ("DESI / Armanda Sari" stacked below 1024px, single-line above). */}
        <Link
          href="/"
          className="text-label text-green hover:text-amber flex min-h-11 items-center"
        >
          <span className="flex flex-col leading-none lg:hidden">
            <span className="text-label text-green flex items-center leading-none">
              DESI
              <span aria-hidden="true" className="text-amber animate-blink">
                _
              </span>
            </span>
            <span className="text-muted mt-0.5 font-mono text-[10px] leading-tight tracking-normal">
              Armanda Sari
            </span>
          </span>
          <span className="hidden lg:inline">DESI ARMANDA SARI</span>
          <span className="sr-only">, home</span>
          <span aria-hidden="true" className="text-amber animate-blink hidden lg:inline">
            _
          </span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-2 lg:gap-3.5 xl:gap-4">
            {sectionNav.map((item) => {
              const linkClass =
                "text-green hover:text-amber aria-[current=true]:text-amber aria-[current=true]:decoration-amber aria-[current=page]:text-amber aria-[current=page]:decoration-amber flex min-h-11 items-center font-mono text-[11px] decoration-2 underline-offset-8 aria-[current=true]:underline aria-[current=page]:underline lg:text-xs xl:text-sm";
              const labelNode = item.label.startsWith("./") ? (
                <span>
                  <span className="md:max-lg:hidden">./</span>
                  {item.label.slice(2)}
                </span>
              ) : (
                item.label
              );
              return (
                <li key={item.id}>
                  {item.href.startsWith("/#") ? (
                    <a href={item.href} data-nav-id={item.id} className={linkClass}>
                      {labelNode}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      prefetch={false}
                      data-nav-id={item.id}
                      className={linkClass}
                    >
                      {labelNode}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild size="compact" className="hidden md:inline-flex">
            <Link href={navCta.href} prefetch={false}>
              {navCta.label}
            </Link>
          </Button>
          <MobileMenu />
        </div>
        <ActiveSection ids={sectionNav.map((item) => item.id)} />
      </div>
    </header>
  );
}

export { Nav };
