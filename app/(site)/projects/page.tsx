import type { Metadata } from "next";
import { Suspense } from "react";

import { Missing } from "@/components/content/missing";
import { Reveal } from "@/components/motion/reveal";
import { FilterChips } from "@/components/projects/filter-chips";
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
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-16 md:px-6 md:py-24">
      <header className="flex flex-col gap-4">
        <p className="text-meta text-green-dim">{"> ls ./projects"}</p>
        <h1 className="text-display-1 text-green glow">Projects</h1>
      </header>

      <Suspense fallback={<FilterChips active="all" counts={counts} />}>
        <ProjectFilter counts={counts} />
      </Suspense>

      {projects.length === 0 ? (
        <Missing what="published projects (IN-05)" />
      ) : (
        <Reveal as="ul" stagger data-project-list="" className="flex flex-col gap-10">
          {projects.map((project, i) => (
            <li key={project.slug} data-caps={values[i]}>
              <ProjectCard project={project} headingLevel="h2" />
            </li>
          ))}
        </Reveal>
      )}
    </div>
  );
}
