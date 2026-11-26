import {
  BookOpen,
  Clock,
  Database,
  FileText,
  GraduationCap,
  HeartHandshake,
  Layers,
  MessageSquareText,
  Package,
  ShoppingCart,
  Thermometer,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

import { Missing } from "@/components/content/missing";
import { isFilled } from "@/components/content/val";
import { projectTypeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProjectView } from "@/lib/views";

const SLUG_ICON: Record<string, LucideIcon> = {
  "fptk-sourcing-database": Database,
  "overtime-management-system": Clock,
  "customer-chat-qa-engine": MessageSquareText,
  "sales-academy-lms": GraduationCap,
  "inventory-system-django": Package,
  "thermal-comfort-monitoring": Thermometer,
  "e-commerce-1": ShoppingCart,
  "e-commerce-2": ShoppingCart,
  "equipment-loan-system": Wrench,
  "library-system": BookOpen,
  "donation-distribution-system": HeartHandshake,
  "hmti-letter-generator": FileText,
};

type ProjectVisualCoverProps = {
  project: ProjectView;
  /** High-priority fetch for the primary LCP cover image. */
  lcp?: boolean;
  /** Image sizes hint for responsive srcset selection. */
  sizes?: string;
  /** Zoom slightly on parent `.group:hover` (used on ProjectCard). */
  interactive?: boolean;
  /**
   * Image fit strategy. Defaults to "contain" so application UI screenshots stay
   * legible and uncropped inside a framed dark stage; use "cover" only when edge
   * cropping is intentional.
   */
  fit?: "contain" | "cover";
  className?: string;
};

/**
 * Standardized project cover visual.
 * - Renders the real verified screenshot via next/image whenever project.thumbnail exists.
 * - Defaults to a framed, uncropped dark preview stage (object-contain) so wide application
 *   screenshots keep their full navigation, tables, and controls legible.
 * - When a real screenshot has not yet been uploaded, renders an honest, domain-specific
 *   terminal system schematic derived strictly from verified project metadata (never a
 *   fabricated screenshot or stock photo).
 */
function ProjectVisualCover({
  project,
  lcp = false,
  sizes = "(min-width: 1200px) 760px, 100vw",
  interactive = false,
  fit = "contain",
  className,
}: ProjectVisualCoverProps) {
  if (project.thumbnail) {
    if (fit === "cover") {
      return (
        <div className={cn("bg-bg relative aspect-video w-full overflow-hidden", className)}>
          <Image
            src={project.thumbnail}
            alt={isFilled(project.thumbnailAlt) ? project.thumbnailAlt : project.title}
            fill
            {...(lcp ? { preload: true, fetchPriority: "high" as const } : {})}
            sizes={sizes}
            className={cn(
              "ease-pixel object-cover transition-transform duration-(--dur-base)",
              interactive ? "group-hover:scale-[1.03]" : "",
            )}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "bg-bg relative flex w-full items-center justify-center overflow-hidden p-3 sm:p-4 md:p-5",
          className,
        )}
      >
        <div className="relative aspect-video w-full">
          <Image
            src={project.thumbnail}
            alt={isFilled(project.thumbnailAlt) ? project.thumbnailAlt : project.title}
            fill
            {...(lcp ? { preload: true, fetchPriority: "high" as const } : {})}
            sizes={sizes}
            className={cn(
              "ease-pixel object-contain transition-transform duration-(--dur-base)",
              interactive ? "group-hover:scale-[1.02]" : "",
            )}
          />
        </div>
      </div>
    );
  }

  const Icon = SLUG_ICON[project.slug] ?? Layers;
  const typeLabel = projectTypeLabel[project.type] ?? project.type;
  const stackPreview = project.stack.slice(0, 4);

  return (
    <div
      data-project-schematic={project.slug}
      className={cn(
        "bg-bg relative flex aspect-video w-full flex-col justify-between overflow-hidden p-4 select-none",
        className,
      )}
    >
      <div className="border-green-dim/60 flex items-center justify-between gap-2 border-b border-dashed pb-2 font-mono text-[10px]">
        <span className="text-green-dim truncate">./{project.slug}</span>
        <span className="text-amber shrink-0 uppercase">[{typeLabel}]</span>
      </div>

      <div className="my-auto flex flex-col items-center justify-center gap-3 py-2 text-center">
        <div className="border-green/70 bg-panel flex size-12 items-center justify-center border-2">
          <Icon aria-hidden="true" className="text-green size-6" />
        </div>
        <p className="text-meta line-clamp-2 max-w-[26ch] text-xs font-medium text-white">
          {project.title}
        </p>
        {stackPreview.length > 0 ? (
          <div aria-hidden="true" className="flex flex-wrap justify-center gap-1.5">
            {stackPreview.map((item) => (
              <span
                key={item}
                className="border-green-dim/60 bg-panel text-muted border px-1.5 py-0.5 font-mono text-[10px]"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
        {project.isDraft ? <Missing what="thumbnail (IN-05)" /> : null}
      </div>

      <div className="border-green-dim/60 text-muted flex items-center justify-between gap-2 border-t border-dashed pt-2 font-mono text-[10px]">
        <span>{project.demoUrl ? "STATUS: LIVE DEMO" : "STATUS: CASE STUDY"}</span>
        <span className="text-green-dim">VISUAL: SCHEMATIC</span>
      </div>
    </div>
  );
}

export { ProjectVisualCover };
