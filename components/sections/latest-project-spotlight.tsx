import Link from "next/link";

import { isFilled } from "@/components/content/val";
import { NewProjectBadge } from "@/components/projects/project-discovery";
import { ProjectVisualCover } from "@/components/projects/project-visual-cover";
import { Button } from "@/components/ui/button";
import { DemoLink } from "@/components/ui/project-card";
import { Tag } from "@/components/ui/tag";
import { capabilityLabel, projectTypeLabel } from "@/lib/format";
import type { ProjectView } from "@/lib/views";

/**
 * Compact editorial Latest Project Spotlight placed between the Hero and 01 About.
 * Automatically highlights the newest published project (by `publishedAt`, with a
 * deterministic fallback to the most recent `period` and `order`) without altering
 * the numbered PRD section sequence (`main > section[id]`).
 */
function LatestProjectSpotlight({ project }: { project: ProjectView | null }) {
  if (!project || project.isDraft) return null;

  const description = isFilled(project.summary)
    ? project.summary
    : isFilled(project.problem)
      ? project.problem
      : null;

  const tags = [
    projectTypeLabel[project.type] ?? project.type,
    ...project.capabilities.slice(0, 2).map((c) => capabilityLabel[c] ?? c),
  ];

  return (
    <aside
      aria-labelledby="latest-project-title"
      data-latest-project-spotlight={project.slug}
      className="border-green-dim/40 border-y"
    >
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-label text-amber">Latest project</span>
            <NewProjectBadge publishedAt={project.publishedAt} isDraft={project.isDraft} />
          </div>
          {isFilled(project.period) ? (
            <span className="text-meta text-muted text-xs">{project.period}</span>
          ) : null}
        </div>

        <div className="bg-panel border-green-dim shadow-pixel group relative grid border-2 md:grid-cols-12">
          <div className="bg-bg border-green-dim relative flex overflow-hidden border-b-2 md:col-span-5 md:min-h-[220px] md:border-r-2 md:border-b-0">
            <ProjectVisualCover
              project={project}
              interactive
              fit="contain"
              sizes="(min-width: 1200px) 480px, (min-width: 768px) 42vw, calc(100vw - 2rem)"
              className="h-full md:aspect-auto"
            />
            <span aria-hidden="true" className="card-sweep" />
          </div>

          <div className="flex flex-col gap-3 p-5 md:col-span-7 md:justify-center md:p-6">
            <ul aria-label="Latest project categories" className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t}>
                  <Tag>{t}</Tag>
                </li>
              ))}
            </ul>

            <h2 id="latest-project-title" className="text-h3 text-green">
              <Link
                href={`/projects/${project.slug}`}
                prefetch={false}
                className="hover:text-amber focus-visible:text-amber transition-colors duration-(--dur-fast)"
              >
                {project.title}
              </Link>
            </h2>

            {description ? (
              <p className="text-muted max-w-[60ch] text-sm leading-relaxed md:text-base">
                {description}
              </p>
            ) : null}

            <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              <Button asChild variant="secondary" size="compact">
                <Link href={`/projects/${project.slug}`} prefetch={false}>
                  [ Explore project {"->"} ]
                </Link>
              </Button>
              {project.demoUrl ? <DemoLink href={project.demoUrl} title={project.title} /> : null}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export { LatestProjectSpotlight };
