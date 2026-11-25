import { ExternalLink } from "lucide-react";
import Link from "next/link";

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
                {(ed.intellectualProperty ?? []).length > 0 ? (
                  <div
                    aria-label="Intellectual property and copyright recognition"
                    data-education-ip=""
                    className="mt-2 flex flex-col gap-4"
                  >
                    {(ed.intellectualProperty ?? []).map((ip) => (
                      <article
                        key={ip.registrationReference}
                        className="bg-panel border-green-dim flex flex-col gap-3 border-2 p-4"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="text-meta text-amber text-xs">{ip.workType}</p>
                          <h4 className="text-h3 text-white">{ip.title}</h4>
                          {isFilled(ip.officialTitle) ? (
                            <p className="text-meta text-muted text-xs">
                              Official title: {ip.officialTitle}
                            </p>
                          ) : null}
                        </div>

                        <p className="max-w-[66ch] text-sm">{ip.summary}</p>

                        <dl className="border-green-dim/50 grid gap-x-6 gap-y-2 border-t border-dashed pt-3 text-xs sm:grid-cols-2">
                          <div>
                            <dt className="text-meta text-green-dim">Registration reference</dt>
                            <dd className="font-mono break-all text-white">
                              {ip.registrationReference}
                            </dd>
                          </div>
                          {isFilled(ip.recordNumber) ? (
                            <div>
                              <dt className="text-meta text-green-dim">Copyright record no.</dt>
                              <dd className="font-mono break-all text-white">{ip.recordNumber}</dd>
                            </div>
                          ) : null}
                          <div>
                            <dt className="text-meta text-green-dim">Registration date</dt>
                            <dd className="text-white">{ip.registrationDate}</dd>
                          </div>
                          {isFilled(ip.firstPublication) ? (
                            <div>
                              <dt className="text-meta text-green-dim">First publication</dt>
                              <dd className="text-white">{ip.firstPublication}</dd>
                            </div>
                          ) : null}
                          <div>
                            <dt className="text-meta text-green-dim">Copyright holder</dt>
                            <dd className="text-white">{ip.copyrightHolder}</dd>
                          </div>
                          <div>
                            <dt className="text-meta text-green-dim">Creator attribution</dt>
                            <dd className="text-white">{ip.creatorAttribution}</dd>
                          </div>
                        </dl>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                          {isFilled(ip.projectSlug) ? (
                            <Link
                              href={`/projects/${ip.projectSlug}`}
                              className="text-meta text-green hover:text-amber text-xs underline underline-offset-4"
                            >
                              [ View related project {"->"} ]
                            </Link>
                          ) : null}
                          {isFilled(ip.verificationUrl) ? (
                            <a
                              href={ip.verificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-meta text-amber hover:text-yellow inline-flex items-center gap-1.5 text-xs underline underline-offset-4"
                            >
                              [ View official copyright record
                              <ExternalLink aria-hidden="true" className="size-3.5" /> ]
                              <span className="sr-only"> (opens in a new tab)</span>
                            </a>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
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
