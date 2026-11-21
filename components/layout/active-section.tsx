"use client";

import { useEffect } from "react";

/** Marks nav links ([data-nav-id]) for the active section; used by MobileMenu too. */
export function markActiveNavLinks(activeId: string | null) {
  document.querySelectorAll<HTMLElement>("[data-nav-id]").forEach((link) => {
    if (link.dataset.navId === activeId) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
  if (activeId) document.documentElement.dataset.activeSection = activeId;
  else delete document.documentElement.dataset.activeSection;
}

/**
 * FR-NAV-02: the link of the section that occupies the viewport centre gets
 * aria-current="true" (styled amber). IntersectionObserver only — no scroll
 * listeners. The observer's root margin collapses the viewport to its centre line.
 * Renders nothing; does nothing on pages without these sections.
 */
function ActiveSection({ ids }: { ids: readonly string[] }) {
  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const crossing = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) crossing.add(entry.target.id);
          else crossing.delete(entry.target.id);
        }
        markActiveNavLinks(ids.find((id) => crossing.has(id)) ?? null);
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      markActiveNavLinks(null);
    };
  }, [ids]);

  return null;
}

export { ActiveSection };
