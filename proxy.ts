import { NextResponse, type NextRequest } from "next/server";

import publishedSlugs from "@/lib/generated/project-slugs.json";

const published = new Set<string>(publishedSlugs);

/**
 * FR-404-01: unknown case-study URLs must return HTTP 404. With Cache Components
 * the page's own notFound() runs after the static shell is sent (status 200), so
 * the slug is checked here, before rendering starts (Next.js docs: loading.js →
 * Status codes). The list is generated at build time by scripts/generate-routes.mjs.
 * Development skips the check so the Draft preview can show unpublished projects.
 */
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") return NextResponse.next();
  let slug = "";
  try {
    slug = decodeURIComponent(request.nextUrl.pathname.split("/")[2] ?? "");
  } catch {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }
  if (published.has(slug)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
}

export const config = { matcher: "/projects/:slug" };
