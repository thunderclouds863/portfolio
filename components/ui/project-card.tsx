import Link from "next/link";

import { Missing } from "@/components/content/missing";
import { DraftBadge, Val, isFilled } from "@/components/content/val";
import { NewProjectBadge } from "@/components/projects/project-discovery";
import { ProjectVisualCover } from "@/components/projects/project-visual-cover";
import { DemoLink } from "@/components/ui/demo-link";
import { capabilityLabel, projectTypeLabel, scopeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProjectView } from "@/lib/views";

import { Tag } from "./tag";

type ProjectCardProps = {
  project: ProjectView;
  /** Zig-zag: put the thumbnail on the right on desktop. */
  flip?: boolean;
  headingLevel?: "h3" | "h2";
  /** First card above the fold: its thumbnail is the LCP image, so fetch it early and high. */
  lcp?: boolean;
};

// FR-PRJ-01/02: title, one-line problem, role, tags, thumbnail; the whole card is
// a link (stretched link on the title). Hover and keyboard focus look the same.
function ProjectCard({
  project,
  flip = false,
  headingLevel: H = "h3",
  lcp = false,
}: ProjectCardProps) {
  const tags = [
    projectTypeLabel[project.type] ?? project.type,
    ...project.capabilities.map((c) => capabilityLabel[c] ?? c),
  ];

  return (
    <article
      id={`project-${project.slug}`}
      className={cn(
        "bg-panel border-green-dim shadow-pixel group relative grid border-2 md:grid-cols-12",
        "ease-pixel transition-transform duration-(--dur-fast)",
        "hover:border-amber hover:shadow-pixel-hover hover:-translate-x-0.5 hover:-translate-y-0.5",
        "has-[a:focus-visible]:border-amber has-[a:focus-visible]:shadow-pixel-hover",
      )}
    >
      <div
        className={cn(
          "bg-bg border-green-dim relative flex overflow-hidden border-b-2 md:col-span-6 md:min-h-[296px] md:border-b-0",
          flip ? "md:order-2 md:border-l-2" : "md:border-r-2",
        )}
      >
        <ProjectVisualCover
          project={project}
          lcp={lcp}
          interactive
          fit="contain"
          sizes="(min-width: 1200px) 600px, (min-width: 768px) 50vw, calc(100vw - 2rem)"
          className="h-full md:aspect-auto"
        />
        {/* FR-PRJ-02: scanline sweep on hover/focus (transform + opacity, 200ms). */}
        <span aria-hidden="true" className="card-sweep" />
      </div>

      <div className="flex flex-col gap-3.5 p-5 md:col-span-6 md:p-6 lg:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <ul aria-label="Tags" className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <li key={t}>
                <Tag>{t}</Tag>
              </li>
            ))}
          </ul>
          <NewProjectBadge publishedAt={project.publishedAt} isDraft={project.isDraft} />
          <DraftBadge show={project.isDraft} />
        </div>

        <H className="text-h3 text-green">
          <Link
            href={`/projects/${project.slug}`}
            prefetch={false}
            className="group-hover:text-amber after:absolute after:inset-0 focus-visible:outline-none"
          >
            {project.title}
          </Link>
        </H>

        {isFilled(project.problem) ? (
          <p className="max-w-[60ch]">
            <span className="text-meta text-green-dim">problem: </span>
            {project.problem}
          </p>
        ) : isFilled(project.summary) ? (
          <p className="max-w-[60ch]">{project.summary}</p>
        ) : project.isDraft ? (
          <p className="max-w-[60ch]">
            <span className="text-meta text-green-dim">problem: </span>
            <Val value={project.problem} what="one-line problem (IN-05)" />
          </p>
        ) : null}

        {isFilled(project.role) || project.contribution !== "unset" || project.isDraft ? (
          <p className="text-meta text-muted">
            {isFilled(project.role) || project.isDraft ? (
              <>
                <span className="text-green-dim">role: </span>
                <Val value={project.role} what="your role (IN-05)" />
              </>
            ) : null}
            {isFilled(project.role) && project.contribution !== "unset" ? " · " : null}
            {project.contribution === "unset" ? (
              project.isDraft ? (
                <Missing what="contribution scope (IN-05)" />
              ) : null
            ) : (
              <span className="text-yellow">{scopeLabel[project.contribution]}</span>
            )}
          </p>
        ) : null}

        {project.stack.length > 0 ? (
          <ul
            aria-label="Technology stack"
            className="text-meta text-muted flex flex-wrap gap-x-2 gap-y-1"
          >
            {project.stack.slice(0, 5).map((item) => (
              <li key={item} className="border-green-dim/60 border px-1.5 text-xs">
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
          <span
            aria-hidden="true"
            className="text-meta text-green group-hover:text-amber inline-flex items-center gap-1.5 text-sm underline-offset-4 transition-colors duration-(--dur-fast) group-hover:underline"
          >
            <span>[ read case study</span>
            <span className="inline-block transition-transform duration-(--dur-fast) group-hover:translate-x-0.5 motion-reduce:transform-none">
              {"->"}
            </span>
            <span>]</span>
          </span>
          {project.demoUrl ? (
            // Sits above the card's stretched link so it opens the demo, not the case study.
            <DemoLink href={project.demoUrl} title={project.title} className="relative z-10" />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export { DemoLink, ProjectCard };
