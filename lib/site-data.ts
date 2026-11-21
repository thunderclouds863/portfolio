import { cacheLife } from "next/cache";

import { isDraftPreview, loadCaseStudy, loadProjects, type CaseStudyView } from "./views";

/*
 * Cached data for secondary routes (Cache Components: file reads must sit inside
 * "use cache"). Same lifetimes as lib/home-data.ts: "max" in production,
 * "minutes" in development so Keystatic edits show up.
 */

function life() {
  if (process.env.NODE_ENV === "development") cacheLife("minutes");
  else cacheLife("max");
}

/** Slugs to prerender. Cache Components rejects an empty list, so a placeholder
 * slug is returned while nothing is published; the page sends it to notFound(). */
export const PLACEHOLDER_SLUG = "__none__";

export async function getProjectSlugs(): Promise<string[]> {
  "use cache";
  life();
  const projects = await loadProjects({ drafts: isDraftPreview() });
  return projects.length > 0 ? projects.map((p) => p.slug) : [PLACEHOLDER_SLUG];
}

export async function getCaseStudy(slug: string): Promise<CaseStudyView | null> {
  "use cache";
  life();
  if (slug === PLACEHOLDER_SLUG) return null;
  return loadCaseStudy(slug, { drafts: isDraftPreview() });
}
