import Link from "next/link";

import { Missing } from "@/components/content/missing";
import { DraftBadge } from "@/components/content/val";
import { levelLabel, skillGroups } from "@/lib/format";
import type { ProjectView, SkillView } from "@/lib/views";
import { Reveal } from "@/components/motion/reveal";

import { Section } from "./section";

type StackProps = { skills: SkillView[]; projects: ProjectView[]; number?: string };

// FR-STK-01: tools grouped by purpose, proficiency as words tied to evidence.
// No percentage bars.
function Stack({ skills, projects, number = "06" }: StackProps) {
  const titles = new Map(projects.map((p) => [p.slug, p.title]));
  const groups = [
    ...skillGroups.map((g) => ({ ...g, items: skills.filter((s) => s.group === g.key) })),
    // Draft preview only: skills whose group is not chosen yet.
    { key: "unset", label: "Not grouped yet", items: skills.filter((s) => s.group === "unset") },
  ].filter((g) => g.items.length > 0);

  return (
    <Section id="stack" number={number} title="Stack">
      {groups.length === 0 ? (
        <Missing what="skills with honest levels (IN-04)" />
      ) : (
        <Reveal stagger className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`stack-${group.key}`}>
              <h3 id={`stack-${group.key}`} className="text-label text-green mb-4">
                {group.label}
                {group.key === "unset" ? (
                  <Missing what="group for each skill" className="ml-3" />
                ) : null}
              </h3>
              <dl className="flex flex-col">
                {group.items.map((skill) => {
                  const evidence = skill.evidence.filter((e): e is string => !!e);
                  return (
                    <div
                      key={skill.slug}
                      className="border-green-dim/50 grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 border-b border-dashed py-3"
                    >
                      <dt className="flex items-center gap-2 text-white">
                        {skill.name}
                        <DraftBadge show={skill.isDraft} />
                      </dt>
                      <dd className="text-meta text-green text-right">
                        {skill.level === "unset" ? (
                          <Missing what="level" />
                        ) : (
                          levelLabel[skill.level]
                        )}
                      </dd>
                      {evidence.length > 0 ? (
                        <dd className="text-meta text-muted col-span-2">
                          used in:{" "}
                          {evidence.map((slug, i) => (
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
                  );
                })}
              </dl>
            </section>
          ))}
        </Reveal>
      )}
    </Section>
  );
}

export { Stack };
