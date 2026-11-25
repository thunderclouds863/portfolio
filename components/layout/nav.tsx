import Link from "next/link";

import { Button } from "@/components/ui/button";
import { navCta, sectionNav } from "@/lib/nav";

import { ActiveSection } from "./active-section";
import { MobileMenu } from "./mobile-menu";
import { NavSectionLink } from "./nav-section-link";

// Group boundary index (0..3: Profile & Background; 4..8: Proof, Process & Contact).
const GROUP_SPLIT_ID = "projects";

// Phase 9 Workstream A — Identity-anchored adaptive navigation bar:
// - Below lg (<1024px): full prominent owner name on left + [ CV ] CTA on right,
//   delegating section jumps to the MobileMenu orbit (prevents shrunk/crowded tablet bars).
// - Desktop (>=1024px): bright white wordmark anchored on left with structural hairline
//   separator; calm muted section links (amber underline on active, subtle dim ./ prompt)
//   split cleanly into profile vs proof groups so navigation never competes with Desi's name.
function Nav() {
  return (
    <header className="bg-bg border-green-dim sticky top-0 z-100 h-(--nav-height) border-b-2 print:hidden">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-2 px-4 min-[375px]:gap-4 lg:gap-3.5 lg:px-6 xl:gap-4">
        {/* Prominent, unshrunk owner identity anchor across all viewports (WCAG 2.5.3). */}
        <Link
          href="/"
          className="text-label border-green-dim/50 hover:text-amber flex min-h-11 shrink-0 items-center text-white transition-[color,border-color] duration-(--dur-fast) max-[374px]:text-[9px] max-[374px]:tracking-normal lg:border-r lg:pr-3 xl:pr-4"
        >
          <span className="truncate">DESI ARMANDA SARI</span>
          <span className="sr-only">, home</span>
          <span aria-hidden="true" className="text-green animate-blink ml-0.5">
            _
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1.5 xl:gap-2">
            {sectionNav.map((item) => {
              const isGroupStart = item.id === GROUP_SPLIT_ID;
              const linkClass =
                "group relative flex min-h-11 items-center font-mono text-[11px] xl:text-xs whitespace-nowrap text-muted transition-[color,border-color] duration-(--dur-fast) hover:text-white aria-[current=true]:text-amber aria-[current=page]:text-amber after:pointer-events-none after:absolute after:inset-x-0 after:bottom-2.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-amber after:transition-transform after:duration-(--dur-fast) motion-reduce:after:transition-none aria-[current=true]:after:scale-x-100 aria-[current=page]:after:scale-x-100";
              const labelNode = item.label.startsWith("./") ? (
                <span className="inline">
                  <span
                    aria-hidden="true"
                    className="text-green-dim/70 group-hover:text-green group-aria-[current=true]:text-amber/80 group-aria-[current=page]:text-amber/80 hidden xl:inline"
                  >
                    ./
                  </span>
                  {item.label.slice(2)}
                </span>
              ) : (
                item.label
              );
              return (
                <li
                  key={item.id}
                  className={
                    isGroupStart ? "border-green-dim/40 ml-0.5 border-l pl-2 xl:pl-2.5" : ""
                  }
                >
                  <NavSectionLink
                    id={item.id}
                    href={item.href}
                    ariaLabel={item.label}
                    className={linkClass}
                  >
                    {labelNode}
                  </NavSectionLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Button asChild size="compact">
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
