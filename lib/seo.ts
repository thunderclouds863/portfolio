import type { Metadata } from "next";

import { hasTodo } from "./schema";
import type { HomeData, ProjectView } from "./views";

/*
 * SEO helpers — PRD section 11: unique title + description per route, title
 * template "%s — Desi Armanda Sari", canonical URLs from NEXT_PUBLIC_SITE_URL,
 * Open Graph + Twitter cards, JSON-LD Person and CreativeWork.
 */

export const SITE_NAME = "Desi Armanda Sari";

/** Used only until Site settings / Profile are published (never TODO text). */
export const FALLBACK_DESCRIPTION = "Portfolio of Desi Armanda Sari.";

export function siteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

const usable = (value: string | null | undefined): value is string =>
  !!value && value.trim() !== "" && !hasTodo(value);

/** Site description: SEO setting → profile sub-headline → neutral fallback. */
export function siteDescription(data: HomeData): string {
  if (usable(data.settings?.seoDescription)) return data.settings.seoDescription;
  if (usable(data.profile?.subheadline)) return data.profile.subheadline;
  return FALLBACK_DESCRIPTION;
}

/** Second line of the OG image: OG text setting → sub-headline → PRD positioning. */
export function ogLine(data: HomeData): string {
  if (usable(data.settings?.ogText)) return data.settings.ogText;
  if (usable(data.profile?.subheadline)) return data.profile.subheadline;
  return "System Analyst · Business Process Improvement · System Development";
}

type PageMetaInput = {
  /** Omit for the home page (uses the default site title). */
  title?: string;
  description?: string;
  /** Site-relative path, e.g. "/cv". */
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
};

// A route's own openGraph/twitter object replaces the parent's, which drops the
// image from app/opengraph-image.tsx — so every route references it explicitly.
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — System Analyst portfolio`,
};

/** Per-route metadata with canonical, Open Graph and Twitter tags. */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  noindex,
}: PageMetaInput): Metadata {
  const ogTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title: ogTitle,
      ...(description ? { description } : {}),
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      ...(description ? { description } : {}),
      images: [{ ...OG_IMAGE, url: "/twitter-image" }],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

// ── JSON-LD ───────────────────────────────────────────────────────────────

/** JSON-LD Person for the home page (PRD 11): only from content that exists. */
export function personJsonLd(data: HomeData): Record<string, unknown> | null {
  const profile = data.profile;
  if (!profile || !usable(profile.name)) return null;
  const jobTitle = usable(profile.subheadline)
    ? profile.subheadline.split("·")[0]!.trim()
    : undefined;
  const sameAs = profile.links
    .map((l) => l.url)
    .filter((url): url is string => !!url && /^https?:\/\//.test(url));
  const alumniOf = data.education
    .filter((e) => usable(e.institution))
    .map((e) => ({ "@type": "CollegeOrUniversity", name: e.institution }));
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: absoluteUrl("/"),
    ...(jobTitle ? { jobTitle } : {}),
    ...(usable(profile.location)
      ? { address: { "@type": "PostalAddress", addressLocality: profile.location } }
      : {}),
    ...(alumniOf.length ? { alumniOf } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** JSON-LD CreativeWork for a case study (PRD 11). */
export function caseStudyJsonLd(project: ProjectView): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    url: absoluteUrl(`/projects/${project.slug}`),
    ...(usable(project.summary) ? { description: project.summary } : {}),
    ...(project.stack.length ? { keywords: project.stack.join(", ") } : {}),
    author: { "@type": "Person", name: SITE_NAME, url: absoluteUrl("/") },
  };
}
