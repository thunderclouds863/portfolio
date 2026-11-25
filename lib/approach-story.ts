import type { ProjectView, SettingsView } from "./views";

export type ApproachVisualKind =
  "understand" | "map-as-is" | "analyze" | "design-to-be" | "build" | "verify";

export type CmsApproachStep = NonNullable<SettingsView>["approach"][number];

export type ResolvedApproachStage = {
  id: string;
  number: string;
  title: string;
  description: string;
  visualKind: ApproachVisualKind;
  visualCaption: string;
  projects: { slug: string; title: string }[];
};

const VISUAL_ORDER: readonly ApproachVisualKind[] = [
  "understand",
  "map-as-is",
  "analyze",
  "design-to-be",
  "build",
  "verify",
];

/**
 * Presentation metadata (diagram caption + verified project evidence slugs) keyed by
 * visual archetype. Titles, descriptions, step count, and order come exclusively from
 * Keystatic CMS (`settings.approach` in `content/settings.yaml`) as the single source of truth.
 */
const STAGE_PRESENTATION: Record<
  ApproachVisualKind,
  { visualCaption: string; projectSlugs: readonly string[] }
> = {
  understand: {
    visualCaption: "Business context, stakeholder goals, and constraints converge into scope.",
    projectSlugs: ["overtime-management-system", "fptk-sourcing-database"],
  },
  "map-as-is": {
    visualCaption: "Existing workflows, manual handoffs, and system interactions are mapped.",
    projectSlugs: ["fptk-sourcing-database", "overtime-management-system"],
  },
  analyze: {
    visualCaption: "Fragmented operational signals filter down to verified gaps and root causes.",
    projectSlugs: ["customer-chat-qa-engine", "fptk-sourcing-database"],
  },
  "design-to-be": {
    visualCaption: "To-be rules, relational storage, and reporting connect into a clear blueprint.",
    projectSlugs: ["overtime-management-system", "sales-academy-lms"],
  },
  build: {
    visualCaption: "Core modules ship iteratively with user feedback and practical automation.",
    projectSlugs: ["thermal-comfort-monitoring", "sales-academy-lms"],
  },
  verify: {
    visualCaption:
      "Requirements, UAT, and performance checks confirm impact and next improvements.",
    projectSlugs: ["sales-academy-lms", "overtime-management-system"],
  },
};

function slugifyStage(title: string, index: number): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `stage-${index + 1}`;
}

function inferVisualKind(slug: string, index: number): ApproachVisualKind {
  if (slug.includes("understand")) return "understand";
  if (slug.includes("map") || slug.includes("as-is")) return "map-as-is";
  if (slug.includes("analy") || slug.includes("investigat")) return "analyze";
  if (slug.includes("design") || slug.includes("to-be") || slug.includes("structur")) {
    return "design-to-be";
  }
  if (slug.includes("build") || slug.includes("implement")) return "build";
  if (slug.includes("verif") || slug.includes("measur") || slug.includes("refin")) return "verify";
  return VISUAL_ORDER[index % VISUAL_ORDER.length]!;
}

/**
 * Resolves CMS-managed `settings.approach` steps into interactive storytelling stages.
 * - Uses CMS titles, descriptions, count, and order verbatim (no hardcoded duplicate copy).
 * - Filters out malformed/blank CMS entries gracefully.
 * - Resolves project evidence links strictly against published projects (`!p.isDraft`).
 * - Returns `[]` when CMS steps are missing so the caller can render the standard `<Missing />` fallback.
 */
export function resolveApproachStages(
  cmsSteps: readonly CmsApproachStep[] | null | undefined,
  projects: readonly ProjectView[],
): ResolvedApproachStage[] {
  if (!cmsSteps || cmsSteps.length === 0) return [];

  const publishedBySlug = new Map(projects.filter((p) => !p.isDraft).map((p) => [p.slug, p.title]));
  const usedIds = new Set<string>();
  const resolved: ResolvedApproachStage[] = [];

  for (const raw of cmsSteps) {
    const title = raw?.title?.trim() ?? "";
    const description = raw?.description?.trim() ?? "";
    if (!title) continue;

    const index = resolved.length;
    const baseId = slugifyStage(title, index);
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix++}`;
    }
    usedIds.add(id);

    const visualKind = inferVisualKind(baseId, index);
    const presentation = STAGE_PRESENTATION[visualKind];

    resolved.push({
      id,
      number: String(index + 1).padStart(2, "0"),
      title,
      description,
      visualKind,
      visualCaption: presentation.visualCaption,
      projects: presentation.projectSlugs
        .filter((slug) => publishedBySlug.has(slug))
        .map((slug) => ({ slug, title: publishedBySlug.get(slug)! })),
    });
  }

  return resolved;
}
