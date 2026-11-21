import { cacheLife } from "next/cache";

import { isDraftPreview, loadHomeData, type HomeData } from "./views";

/**
 * Cached home-page data (Cache Components: file reads must be inside "use cache"
 * to be part of the static shell). Content changes ship with a deploy, so the
 * production lifetime is "max". In development, "minutes" refreshes edits made in
 * /keystatic within about a minute; the shorter "seconds" profile expires in under
 * 5 minutes, which Next excludes from prerendering (blocking-route error).
 */
export async function getHomeData(): Promise<HomeData> {
  "use cache";
  if (process.env.NODE_ENV === "development") cacheLife("minutes");
  else cacheLife("max");
  return loadHomeData({ drafts: isDraftPreview() });
}
