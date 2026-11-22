import { Missing } from "@/components/content/missing";
import { DraftBadge, isFilled } from "@/components/content/val";
import { Reveal } from "@/components/motion/reveal";
import { Tag } from "@/components/ui/tag";
import { TerminalFrame } from "@/components/ui/terminal-frame";
import { formatYearMonth, formatYearOrMonth } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EducationView } from "@/lib/views";

import { Section } from "./section";

type EducationProps = { education: EducationView[]; number: string };

// Owner override (decision 0002, #6): education has its own section after Experience,
// with competitions and awards in a log beside the schools. Layout differs from the
// Experience timeline on purpose (AGENTS.md: vary section layouts).
function Education({ education, number }: EducationProps) {
  const achievements = education
    .flatMap((ed) => ed.achievements.map((a) => ({ ...a, school: ed.institution, key: ed.slug })))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <Section id="education" number={number} title="Education">
      {education.length === 0 ? (
        <Missing what="education entries (IN-03)" />
      ) : (
        <Reveal stagger className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <ol
            data-education-list
            className={cn(
              "flex flex-col gap-10",
              achievements.length > 0 ? "lg:col-span-7" : "lg:col-span-12",
            )}
          >
            {education.map((ed) => (
              <li key={ed.slug} className="border-green-dim flex flex-col gap-3 border-l-2 pl-5">
                <p className="text-meta text-muted">
                  <Period start={ed.start} end={ed.end} />
                  {isFilled(ed.gpa) ? ` · grade ${ed.gpa}` : null}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-h3 text-white">
                    {ed.degree} {ed.major}
                    <span className="text-muted"> {"·"} </span>
                    <span className="text-green">{ed.institution}</span>
                  </h3>
                  <DraftBadge show={ed.isDraft} />
                </div>
                {isFilled(ed.thesis) ? (
                  <p className="max-w-[68ch]">
                    <span className="text-green-dim">Thesis: </span>
                    <cite className="not-italic">{ed.thesis}</cite>
                  </p>
                ) : null}
                {ed.focusAreas.length > 0 ? (
                  <ul aria-label="Focus areas" className="flex flex-wrap gap-2">
                    {ed.focusAreas.map((f) => (
                      <li key={f}>
                        <Tag>{f}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>

          {achievements.length > 0 ? (
            <TerminalFrame
              as="aside"
              title="awards.log"
              aria-labelledby="education-awards"
              className="self-start lg:col-span-5"
            >
              <div className="flex flex-col gap-4">
                <h3 id="education-awards" className="text-label text-green">
                  Competitions &amp; awards
                </h3>
                <ol className="flex flex-col gap-4">
                  {achievements.map((a) => (
                    <li
                      key={`${a.key}-${a.date}-${a.title}`}
                      className="border-green-dim/40 grid gap-1 border-b border-dashed pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="text-meta text-amber">
                        {formatYearMonth(a.date) ?? <Missing what="month" />}
                      </p>
                      <p className="text-white">{a.title}</p>
                      <p className="text-meta text-muted">
                        {a.issuer} {"·"} {a.school}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </TerminalFrame>
          ) : null}
        </Reveal>
      )}
    </Section>
  );
}

function Period({ start, end }: { start: string; end: string }) {
  return (
    <>
      {formatYearOrMonth(start) ?? <Missing what="start" />}
      {" – "}
      {formatYearOrMonth(end) ?? <Missing what="end" />}
    </>
  );
}

export { Education };
