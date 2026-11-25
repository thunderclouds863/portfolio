"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import { scrollToSection, setPendingSectionTarget } from "./active-section";

type NavSectionLinkProps = {
  id: string;
  href: string;
  className: string;
  ariaLabel?: string;
  children: ReactNode;
};

/**
 * Reliable section & cross-route navigation link (Phase 1B):
 * - Renders a real Next.js <Link> (progressive enhancement with JS disabled).
 * - On the homepage (`/`), intercepts `/#<id>` clicks, updates history via
 *   pushState (which does NOT fire hashchange/popstate, preventing duplicate
 *   scroll calls), and delegates to the single authoritative scrollToSection().
 * - From any other route, delegates to Next.js App Router SPA navigation
 *   (no full-page reload), where ActiveSection invokes scrollToSection() once.
 */
function NavSectionLink({ id, href, className, ariaLabel, children }: NavSectionLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isHomeSection = href.startsWith("/#");

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    if (!isHomeSection) {
      setPendingSectionTarget(null);
      return;
    }
    if (pathname !== "/") {
      // Cross-route click (e.g. /projects/[slug] -> /#about): delegate via
      // router.push(..., { scroll: false }) so Next.js's built-in <Link> scroll
      // handler does not reset scroll to 0 in WebKit before ActiveSection scrolls.
      event.preventDefault();
      setPendingSectionTarget(id);
      router.push(href, { scroll: false });
      return;
    }
    if (!document.getElementById(id)) return;
    event.preventDefault();
    const nextHash = `#${id}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    scrollToSection(id, { smooth: true });
  }

  return (
    <Link
      href={href}
      prefetch={false}
      scroll={!isHomeSection}
      data-nav-id={id}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export { NavSectionLink };
