"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import { scrollToSection } from "./active-section";

type NavSectionLinkProps = {
  id: string;
  href: string;
  className: string;
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
function NavSectionLink({ id, href, className, children }: NavSectionLinkProps) {
  const pathname = usePathname();
  const isHomeSection = href.startsWith("/#");

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isHomeSection || pathname !== "/") return;
    if (!document.getElementById(id)) return;
    event.preventDefault();
    const nextHash = `#${id}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    scrollToSection(id, { smooth: true });
  }

  return (
    <Link href={href} prefetch={false} data-nav-id={id} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export { NavSectionLink };
