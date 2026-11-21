import Image from "next/image";
import Link from "next/link";

import { Missing } from "@/components/content/missing";
import { DraftBadge, Val, isFilled } from "@/components/content/val";
import { PixelIcon } from "@/components/pixel/pixel-icon";
import { capabilityLabel, projectTypeLabel, scopeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProjectView } from "@/lib/views";

import { Tag } from "./tag";

type ProjectCardProps = {
  project: ProjectView;
  /** Zig-zag: put the thumbnail on the right on desktop. */
  flip?: boolean;
  headingLevel?: "h3" | "h2";
};

// FR-PRJ-01/02: title, one-line problem, role, tags, thumbnail; the whole card is
// a link (stretched link on the title). Hover and keyboard focus look the same.
function ProjectCard({ project, flip = false, headingLevel: H = "h3" }: ProjectCardProps) {
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
          "border-green-dim relative aspect-video overflow-hidden border-b-2 md:col-span-5 md:border-b-0",
          flip ? "md:order-2 md:border-l-2" : "md:border-r-2",
        )}
      >
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={isFilled(project.thumbnailAlt) ? project.thumbnailAlt : ""}
            fill
            sizes="(min-width: 1200px) 480px, (min-width: 768px) 40vw, 100vw"
            className="object-cover [image-rendering:pixelated]"
          />
        ) : (
          <div className="bg-bg flex size-full flex-col items-center justify-center gap-3 p-4">
            <PixelIcon name="floppy" size={48} className="text-green-dim" />
            <Missing what="thumbnail (IN-05)" />
          </div>
        )}
        {/* FR-PRJ-02: scanline sweep on hover/focus (transform + opacity, 200ms). */}
        <span aria-hidden="true" className="card-sweep" />
      </div>

      <div className="flex flex-col gap-4 p-6 md:col-span-7 md:p-8">
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

        <H className="text-h3 text-green">
          <Link
            href={`/projects/${project.slug}`}
            className="group-hover:text-amber after:absolute after:inset-0 focus-visible:outline-none"
          >
            {project.title}
          </Link>
        </H>

        <p className="max-w-[60ch]">
          <span className="text-meta text-green-dim">problem: </span>
          <Val value={project.problem} what="one-line problem (IN-05)" />
        </p>

        <p className="text-meta text-muted">
          <span className="text-green-dim">role: </span>
          <Val value={project.role} what="your role (IN-05)" />
          {" · "}
          {project.contribution === "unset" ? (
            <Missing what="contribution scope (IN-05)" />
          ) : (
            <span className="text-yellow">{scopeLabel[project.contribution]}</span>
          )}
        </p>
      </div>
    </article>
  );
}

export { ProjectCard };
