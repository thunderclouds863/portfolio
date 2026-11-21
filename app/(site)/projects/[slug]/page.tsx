import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DraftBadge, Val, isFilled } from "@/components/content/val";
import { MarkdocContent } from "@/components/markdoc/markdoc-content";
import { ZoomableFigure } from "@/components/markdoc/zoomable-figure";
import { CaseStudySnapshot } from "@/components/projects/case-study-snapshot";
import { Tag } from "@/components/ui/tag";
import { capabilityLabel, projectTypeLabel } from "@/lib/format";
import { nodeFromJson } from "@/lib/markdoc";
import { getCaseStudy, getProjectSlugs } from "@/lib/site-data";

// FR-PD-01: generated statically from the content files.
export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

// FR-PD-04: per-page title, description, canonical URL (OG image in Phase 7).
export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) return { title: "Project not found" };
  const { project } = study;
  const description = isFilled(project.summary) ? project.summary : undefined;
  return {
    title: project.title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: { type: "article", title: project.title, description, url: `/projects/${slug}` },
    ...(project.isDraft ? { robots: { index: false, follow: false } } : {}),
  };
}

// Case study (PRD section 3 template): snapshot, Markdoc body with sticky TOC on
// desktop (FR-PD-02), diagram lightbox (FR-PD-03), prev/next, back to projects.
export default async function CaseStudyPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) notFound();
  const { project, headings, prev, next } = study;
  const tags = [
    projectTypeLabel[project.type] ?? project.type,
    ...project.capabilities.map((c) => capabilityLabel[c] ?? c),
  ];

  return (
    <article className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
      <header className="flex flex-col gap-5 pb-10">
        <Link
          href="/projects"
          className="text-meta text-green hover:text-amber self-start underline underline-offset-4"
        >
          {"< back to projects"}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <ul aria-label="Tags" className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <li key={t}>
                <Tag>{t}</Tag>
              </li>
            ))}
          </ul>
          <DraftBadge show={project.isDraft} />
        </div>
        <h1 className="text-display-1 text-green glow max-w-[24ch]">{project.title}</h1>
        <p className="max-w-[68ch] text-lg">
          <Val value={project.summary} what="one-line summary (IN-05)" />
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-8">
          <CaseStudySnapshot project={project} />

          <div className="case-body">
            <MarkdocContent node={nodeFromJson(study.bodyAst)} />
          </div>

          {project.gallery.length > 0 ? (
            <section aria-labelledby="gallery-title">
              <h2 id="gallery-title" className="text-display-2 text-green mb-4">
                Gallery
              </h2>
              {project.gallery.map((g) =>
                g.image ? (
                  <ZoomableFigure
                    key={g.image}
                    src={g.image}
                    alt={g.alt}
                    caption={g.caption || undefined}
                  />
                ) : null,
              )}
            </section>
          ) : null}

          <nav
            aria-label="More projects"
            className="border-green-dim grid gap-4 border-t-2 pt-8 sm:grid-cols-2"
          >
            {prev ? (
              <Link
                href={`/projects/${prev.slug}`}
                rel="prev"
                className="border-green-dim hover:border-amber flex flex-col gap-1 border-2 p-4"
              >
                <span className="text-meta text-green-dim">{"< previous"}</span>
                <span className="text-h3 text-green">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/projects/${next.slug}`}
                rel="next"
                className="border-green-dim hover:border-amber flex flex-col gap-1 border-2 p-4 sm:text-right"
              >
                <span className="text-meta text-green-dim">{"next >"}</span>
                <span className="text-h3 text-green">{next.title}</span>
              </Link>
            ) : null}
          </nav>
        </div>

        {headings.length > 0 ? (
          <aside className="hidden lg:col-span-4 lg:block">
            <nav
              aria-label="On this page"
              data-toc=""
              className="bg-panel border-green-dim sticky top-[calc(var(--nav-height)+1.5rem)] border-2 p-5"
            >
              <p className="text-label text-green mb-4">Contents</p>
              <ol className="flex flex-col gap-2">
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 3 ? "pl-4" : undefined}>
                    <a
                      href={`#${h.id}`}
                      className="text-muted hover:text-amber font-mono text-sm underline-offset-4 hover:underline"
                    >
                      {h.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
