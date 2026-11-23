import Link from "next/link";

import { Missing } from "@/components/content/missing";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ui/project-card";
import { cn } from "@/lib/utils";
import type { ProjectView } from "@/lib/views";
import { Reveal } from "@/components/motion/reveal";

import { Section } from "./section";

// FR-PRJ-01: three featured case studies in a zig-zag layout + link to /projects.
function Projects({ projects, number }: { projects: ProjectView[]; number: string }) {
  return (
    <Section id="projects" number={number} title="Projects">
      {projects.length === 0 ? (
        <Missing what="three featured projects (IN-05)" />
      ) : (
        <Reveal as="ul" stagger className="flex flex-col gap-10 md:gap-14">
          {projects.map((project, index) => (
            <li key={project.slug} className={cn("md:w-[92%]", index % 2 === 1 && "md:ml-auto")}>
              <ProjectCard project={project} flip={index % 2 === 1} />
            </li>
          ))}
        </Reveal>
      )}
      <div className="mt-12">
        <Button asChild variant="secondary">
          <Link href="/projects">[ All projects ]</Link>
        </Button>
      </div>
    </Section>
  );
}

export { Projects };
