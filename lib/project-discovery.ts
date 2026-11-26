/**
 * Latest Project Discovery System — pure, deterministic lifecycle helpers.
 *
 * Source of truth:
 * - `publishedAt` (optional YYYY-MM-DD field in Keystatic `projects` collection) is
 *   the authoritative publication date for the 7-day NEW badge and Latest Project
 *   Spotlight ordering. Editing a project does not alter `publishedAt`.
 * - Draft projects (`isDraft: true`) are always excluded from both Spotlight and
 *   NEW badges.
 * - When no published project has `publishedAt` set yet, `getLatestPublishedProject`
 *   falls back deterministically to the most recent `period` end month, then `order`,
 *   then `title`, without fabricating `publishedAt` timestamps or NEW badges.
 */

export const NEW_BADGE_WINDOW_DAYS = 7;
export const NEW_BADGE_WINDOW_MS = NEW_BADGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
export const SEEN_PROJECTS_STORAGE_KEY = "portfolio:seen-new-projects-v1";
export const SEEN_PROJECTS_EVENT = "portfolio:new-projects-seen";

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_MONTH_RE = /(\d{4})-(0[1-9]|1[0-2])/g;
const YEAR_ONLY_RE = /\b(19|20)\d{2}\b/g;

export type DiscoverableProject = {
  slug: string;
  title: string;
  isDraft: boolean;
  order: number | null;
  period: string | null | undefined;
  publishedAt?: string | null;
};

export type ProjectPublishRef = {
  slug: string;
  publishedAt?: string | null;
  isDraft?: boolean;
};

/** Parses a strict YYYY-MM-DD date string to UTC midnight ms; returns null if invalid or absent. */
export function parsePublishedAtMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = ISO_DATE_RE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return ms;
}

/**
 * Extracts the latest YYYY-MM from a project's `period` string (e.g. "2026-09 – 2026-11" -> "2026-11")
 * for deterministic fallback ordering when `publishedAt` is not set.
 */
export function latestPeriodMonth(period: string | null | undefined): string {
  if (!period) return "0000-00";
  const months = Array.from(period.matchAll(YEAR_MONTH_RE), (m) => `${m[1]}-${m[2]}`);
  if (months.length > 0) {
    return months.sort().at(-1) ?? "0000-00";
  }
  const years = Array.from(period.matchAll(YEAR_ONLY_RE), (m) => `${m[0]}-12`);
  if (years.length > 0) {
    return years.sort().at(-1) ?? "0000-00";
  }
  return "0000-00";
}

/**
 * Returns true iff the project is published, has a valid `publishedAt` date,
 * and is within the 7-day NEW window `[0, 7 days)` relative to `nowMs`.
 */
export function isProjectNew(
  project: Pick<ProjectPublishRef, "isDraft" | "publishedAt">,
  nowMs: number = Date.now(),
): boolean {
  if (project.isDraft) return false;
  const publishedMs = parsePublishedAtMs(project.publishedAt);
  if (publishedMs === null) return false;
  const ageMs = nowMs - publishedMs;
  return ageMs >= 0 && ageMs < NEW_BADGE_WINDOW_MS;
}

/** Returns all published projects currently within the 7-day NEW window. */
export function getRecentProjects<T extends ProjectPublishRef>(
  projects: readonly T[],
  nowMs: number = Date.now(),
): T[] {
  return projects.filter((p) => isProjectNew(p, nowMs));
}

/**
 * Selects the single newest published project for the Homepage Spotlight.
 * - Excludes drafts.
 * - Prefers projects with an authoritative `publishedAt` (newest first).
 * - Falls back deterministically to most recent `period` end month, then `order`, then `title`.
 * - Returns null when there are no published projects.
 */
export function getLatestPublishedProject<T extends DiscoverableProject>(
  projects: readonly T[],
): T | null {
  const published = projects.filter((p) => !p.isDraft);
  if (published.length === 0) return null;

  return (
    [...published].sort((a, b) => {
      const aPub = parsePublishedAtMs(a.publishedAt);
      const bPub = parsePublishedAtMs(b.publishedAt);
      if (aPub !== null || bPub !== null) {
        if (aPub === null) return 1;
        if (bPub === null) return -1;
        if (bPub !== aPub) return bPub - aPub;
      }
      const periodCmp = latestPeriodMonth(b.period).localeCompare(latestPeriodMonth(a.period));
      if (periodCmp !== 0) return periodCmp;
      return (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title);
    })[0] ?? null
  );
}

/** Parses a stored comma-separated seen-slug list into a Set. */
export function parseSeenSlugs(stored: string | null | undefined): Set<string> {
  if (!stored) return new Set();
  return new Set(
    stored
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** Merges newly seen slugs into the stored set and returns a stable serialized string. */
export function mergeSeenSlugs(
  existing: string | null | undefined,
  seenSlugs: readonly string[],
): string {
  const merged = parseSeenSlugs(existing);
  for (const slug of seenSlugs) {
    if (slug.trim()) merged.add(slug.trim());
  }
  return Array.from(merged).sort().join(",");
}

/** Returns true when at least one qualifying recent slug has not yet been seen. */
export function hasUnseenRecentProjects(
  recentSlugs: readonly string[],
  storedSeen: string | null | undefined,
): boolean {
  if (recentSlugs.length === 0) return false;
  const seen = parseSeenSlugs(storedSeen);
  return recentSlugs.some((slug) => !seen.has(slug));
}
