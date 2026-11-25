import Link from "next/link";

import { Missing } from "@/components/content/missing";
import { DraftBadge } from "@/components/content/val";
import { Reveal } from "@/components/motion/reveal";
import { TechIcon } from "@/components/ui/tech-icon";
import { levelLabel } from "@/lib/format";
import { buildSkillTaxonomy } from "@/lib/skills-taxonomy";
import type { ProjectView, SkillView } from "@/lib/views";

import { Section } from "./section";

type StackProps = { skills: SkillView[]; projects: ProjectView[]; number?: string };

// FR-STK-01 + Phase 4: evidence-backed taxonomy separating languages, frameworks,
// analytics, databases, performance testing, and business analysis/platforms.
// No percentage bars; honest usage words tied to verified project links.
function Stack({ skills, projects, number = "06" }: StackProps) {
  const titles = new Map(projects.map((p) => [p.slug, p.title]));
  const categories = buildSkillTaxonomy(skills, projects);

  return (
    <Section id="stack" number={number} title="Stack">
      {categories.length === 0 ? (
        <Missing what="skills with honest levels (IN-04)" />
      ) : (
        <Reveal stagger className="grid gap-x-10 gap-y-10 md:grid-cols-2">
          {categories.map((category) => (
            <section
              key={category.key}
              aria-labelledby={`stack-${category.key}`}
              data-stack-category={category.key}
              className="bg-panel border-green-dim/70 flex flex-col gap-3 border-2 p-5"
            >
              <header className="border-green-dim/60 flex flex-col gap-1 border-b pb-3">
                <h3 id={`stack-${category.key}`} className="text-label text-green">
                  {category.label}
                </h3>
                <p className="text-meta text-muted text-xs">{category.description}</p>
              </header>

              <dl className="flex flex-col">
                {category.items.map((skill) => (
                  <div
                    key={skill.id}
                    className="border-green-dim/40 grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 border-b border-dashed py-2.5 last:border-b-0 last:pb-0"
                  >
                    <dt className="flex min-w-0 items-center gap-2.5 text-sm text-white">
                      <TechIcon icon={skill.icon} className="text-green" />
                      <span className="truncate">{skill.name}</span>
                      <DraftBadge show={skill.isDraft} />
                    </dt>
                    <dd className="text-meta text-green shrink-0 text-right text-xs">
                      {skill.level === "unset" ? <Missing what="level" /> : levelLabel[skill.level]}
                    </dd>
                    {skill.evidenceSlugs.length > 0 ? (
                      <dd className="text-meta text-muted col-span-2 pl-6.5 text-xs">
                        used in:{" "}
                        {skill.evidenceSlugs.map((slug, i) => (
                          <span key={slug}>
                            {i > 0 ? ", " : null}
                            <Link
                              href={`/projects/${slug}`}
                              className="hover:text-amber underline underline-offset-4"
                            >
                              {titles.get(slug) ?? slug}
                            </Link>
                          </span>
                        ))}
                      </dd>
                    ) : null}
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </Reveal>
      )}
    </Section>
  );
}

export { Stack };
