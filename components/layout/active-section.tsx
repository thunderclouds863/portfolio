"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Marks nav links ([data-nav-id]) for the active section or route; used by MobileMenu too. */
export function markActiveNavLinks(activeId: string | null, current: "true" | "page" = "true") {
  document.querySelectorAll<HTMLElement>("[data-nav-id]").forEach((link) => {
    if (link.dataset.navId === activeId) link.setAttribute("aria-current", current);
    else link.removeAttribute("aria-current");
  });
  if (activeId) document.documentElement.dataset.activeSection = activeId;
  else delete document.documentElement.dataset.activeSection;
}

const ROUTE_NAV_ID: Record<string, string> = {
  "/testimonials": "testimonials",
  "/projects": "projects",
};

/**
 * FR-NAV-02: the link of the section that occupies the viewport centre gets
 * aria-current="true" (styled amber); dedicated routes get aria-current="page".
 * IntersectionObserver only — no scroll listeners.
 */
function ActiveSection({ ids }: { ids: readonly string[] }) {
  const pathname = usePathname();

  useEffect(() => {
    const routeId =
      ROUTE_NAV_ID[pathname] ?? (pathname.startsWith("/projects/") ? "projects" : null);
    if (routeId) {
      markActiveNavLinks(routeId, "page");
      return () => markActiveNavLinks(null);
    }

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
        markActiveNavLinks(ids.find((id) => crossing.has(id)) ?? null, "true");
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      markActiveNavLinks(null);
    };
  }, [ids, pathname]);

  return null;
}

export { ActiveSection };
