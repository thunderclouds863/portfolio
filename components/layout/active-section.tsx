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

/**
 * Single authoritative hash-target scroll helper (Phase 1B).
 * Reads the live sticky <header> height dynamically, respects
 * prefers-reduced-motion, scrolls exactly once, and syncs active nav state.
 */
export function scrollToSection(
  id: string,
  { smooth = false }: { smooth?: boolean } = {},
): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  const header = document.querySelector<HTMLElement>("header");
  const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
  const top = Math.max(
    0,
    Math.round(target.getBoundingClientRect().top + window.scrollY - headerHeight),
  );
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: smooth && !reduced ? "smooth" : "auto" });
  markActiveNavLinks(id, "true");
  return true;
}

const ROUTE_NAV_ID: Record<string, string> = {
  "/testimonials": "testimonials",
  "/projects": "projects",
};

/**
 * FR-NAV-02: the link of the section that occupies the viewport centre gets
 * aria-current="true" (styled amber); dedicated routes get aria-current="page".
 * Also handles authoritative hash scrolling on initial /#section load,
 * cross-route App Router landings, hashchange, and Back/Forward (popstate).
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

    const syncFromHash = () => {
      const hashId = window.location.hash.replace(/^#/, "");
      if (!hashId || !ids.includes(hashId)) return;
      scrollToSection(hashId, { smooth: false });
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);

    const crossing = new Set<string>();
    const firstSectionTop = sections[0]?.offsetTop ?? 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) crossing.add(entry.target.id);
          else crossing.delete(entry.target.id);
        }
        const visibleId = ids.find((id) => crossing.has(id)) ?? null;
        if (visibleId) {
          markActiveNavLinks(visibleId, "true");
        } else if (window.scrollY < Math.max(0, firstSectionTop - 80)) {
          markActiveNavLinks(null, "true");
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
      observer.disconnect();
      markActiveNavLinks(null);
    };
  }, [ids, pathname]);

  return null;
}

export { ActiveSection };
