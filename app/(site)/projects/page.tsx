import type { Metadata } from "next";
import { Suspense } from "react";

import { Missing } from "@/components/content/missing";
import { FilterChips } from "@/components/projects/filter-chips";
import { ProjectsVisitedTracker } from "@/components/projects/project-discovery";
import { ProjectFilter } from "@/components/projects/project-filter";
import { ProjectCard } from "@/components/ui/project-card";
import { capabilityFilters, filterValuesFor, type FilterValue } from "@/lib/filters";
import { getHomeData } from "@/lib/home-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description:
    "Case studies by Desi Armanda Sari: the problem, her role, the process analysis, the system and the outcome.",
  path: "/projects",
});

// FR-PL-01: all projects, filterable by capability; filter state in the URL query.
// The list is server-rendered once; the client filter only marks which value is
// active and CSS hides the rest, so the page stays static.
export default async function ProjectsPage() {
  const { projects } = await getHomeData();
  const discoveryProjects = projects
    .filter((p) => !p.isDraft && p.publishedAt)
    .map((p) => ({ slug: p.slug, publishedAt: p.publishedAt, isDraft: false }));
  const values = projects.map((p) => filterValuesFor(p.capabilities));
  const counts = {
    all: projects.length,
    ...Object.fromEntries(
      capabilityFilters.map((f) => [
        f.value,
        values.filter((v) => v.split(" ").includes(f.value)).length,
      ]),
    ),
  } as Record<FilterValue, number>;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 md:px-6 md:py-12">
      <ProjectsVisitedTracker projects={discoveryProjects} />
      <header className="flex flex-col gap-4">
        <p className="text-meta text-green-dim">{"> ls ./projects"}</p>
        <h1 className="text-display-1 text-green glow">Projects</h1>
        <p className="text-muted max-w-[68ch]">
          Selected systems analysis, business process improvement, data analytics, and web
          application case studies. Filter by capability or open any project for architecture notes
          and live demos.
        </p>
      </header>

      <Suspense fallback={<FilterChips active="all" counts={counts} />}>
        <ProjectFilter counts={counts} />
      </Suspense>

      {projects.length === 0 ? (
        <Missing what="published projects (IN-05)" />
      ) : (
        <ul data-project-list="" className="flex flex-col gap-10">
          {projects.map((project, i) => (
            <li key={project.slug} data-caps={values[i]}>
              <ProjectCard project={project} headingLevel="h2" lcp={i === 0} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
