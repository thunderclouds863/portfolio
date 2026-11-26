"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  SEEN_PROJECTS_EVENT,
  SEEN_PROJECTS_STORAGE_KEY,
  getRecentProjects,
  hasUnseenRecentProjects,
  isProjectNew,
  mergeSeenSlugs,
  type ProjectPublishRef,
} from "@/lib/project-discovery";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};
const getServerFalse = () => false;

function subscribeSeenStore(callback: () => void) {
  window.addEventListener(SEEN_PROJECTS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SEEN_PROJECTS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function readSeenStorage(): string | null {
  try {
    return window.localStorage.getItem(SEEN_PROJECTS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeSeenStorage(value: string): void {
  try {
    window.localStorage.setItem(SEEN_PROJECTS_STORAGE_KEY, value);
  } catch {
    // Ignore storage errors (private browsing / restricted storage).
  }
}

/**
 * Small, restrained NEW badge rendered only for published projects within the
 * 7-day window from `publishedAt`. Evaluates `Date.now()` on the client via
 * `useSyncExternalStore` so static prerendering stays cacheable and expiration
 * works live without rebuilds or hydration mismatches.
 */
function NewProjectBadge({
  publishedAt,
  isDraft = false,
  className,
}: {
  publishedAt?: string | null;
  isDraft?: boolean;
  className?: string;
}) {
  const visible = useSyncExternalStore(
    noopSubscribe,
    () => isProjectNew({ isDraft, publishedAt }, Date.now()),
    getServerFalse,
  );

  if (!visible) return null;

  return (
    <span
      data-new-badge=""
      className={cn(
        "border-amber bg-amber text-bg inline-flex items-center border px-1.5 py-0.5 font-mono text-[10px] leading-none font-semibold tracking-wider uppercase select-none",
        className,
      )}
    >
      NEW
    </span>
  );
}

/**
 * Subtle amber pixel indicator on the Projects navigation link (desktop bar and
 * mobile orbit menu). Appears only when one or more published projects are within
 * the 7-day window and have not yet been dismissed by visiting `/projects`.
 */
function ProjectsNavIndicator({
  projects,
  placement = "inline",
  className,
}: {
  projects: readonly ProjectPublishRef[];
  placement?: "inline" | "overlay";
  className?: string;
}) {
  const show = useSyncExternalStore(
    subscribeSeenStore,
    () => {
      const recentSlugs = getRecentProjects(projects, Date.now()).map((p) => p.slug);
      return hasUnseenRecentProjects(recentSlugs, readSeenStorage());
    },
    getServerFalse,
  );

  if (!show) return null;

  return (
    <span
      data-projects-new-indicator=""
      className={cn(
        placement === "overlay"
          ? "pointer-events-none absolute top-2 -right-2 inline-flex items-center"
          : "inline-flex items-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("bg-amber block size-1.5 shrink-0", placement === "inline" && "ml-1.5")}
      />
      <span className="sr-only"> (new projects available)</span>
    </span>
  );
}

/**
 * Mounted on `/projects` to mark currently qualifying recent projects as seen in
 * localStorage and immediately dismiss the Projects navigation indicator.
 */
function ProjectsVisitedTracker({ projects }: { projects: readonly ProjectPublishRef[] }) {
  useEffect(() => {
    const recentSlugs = getRecentProjects(projects, Date.now()).map((p) => p.slug);
    if (recentSlugs.length === 0) return;
    const next = mergeSeenSlugs(readSeenStorage(), recentSlugs);
    writeSeenStorage(next);
    window.dispatchEvent(new Event(SEEN_PROJECTS_EVENT));
  }, [projects]);

  return null;
}

export { NewProjectBadge, ProjectsNavIndicator, ProjectsVisitedTracker };
