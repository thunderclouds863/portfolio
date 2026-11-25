import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Missing } from "@/components/content/missing";
import { DraftBadge, isFilled } from "@/components/content/val";
import { Reveal } from "@/components/motion/reveal";
import { Tag } from "@/components/ui/tag";
import { formatYearMonth, formatYearOrMonth } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EducationView, ProjectView } from "@/lib/views";

import { Section } from "./section";

type EducationProps = {
  education: EducationView[];
  projects?: readonly ProjectView[];
  number: string;
};

/**
 * Resolves an IP record's `projectSlug` against currently published projects only.
 * Returns null if the slug is blank, unknown, or points to an unpublished draft,
 * preventing broken links while preserving the verified copyright record itself.
 */
export function resolveIpProjectSlug(
  projectSlug: string | null | undefined,
  projects: readonly ProjectView[],
): string | null {
  const normalized = projectSlug?.trim();
  if (!normalized) return null;
  const match = projects.find((p) => !p.isDraft && p.slug === normalized);
  return match ? match.slug : null;
}

// Phase 9 Workstream B: Educational timeline with each entry's factual artifacts
// integrated inline (university thesis + DGIP copyright registration beside Undip;
// competition & training awards inline inside SMA Negeri 2 Purworejo rather than
// floating in a disconnected sidebar box).
function Education({ education, projects = [], number }: EducationProps) {
  return (
    <Section id="education" number={number} title="Education">
      {education.length === 0 ? (
        <Missing what="education entries (IN-03)" />
      ) : (
        <Reveal as="ol" stagger data-education-list="" className="flex flex-col gap-10">
          {education.map((ed, index) => {
            const ipList = ed.intellectualProperty ?? [];
            const achievements = [...ed.achievements].sort((a, b) =>
              (b.date ?? "").localeCompare(a.date ?? ""),
            );
            const hasRightRail = ipList.length > 0 || achievements.length > 0;
            const isPrimary = index === 0;

            return (
              <li
                key={ed.slug}
                className={cn(
                  "border-green-dim/70 grid gap-6 border-l-2 pl-5 lg:grid-cols-12 lg:gap-10",
                  isPrimary ? "border-green" : "border-green-dim/60",
                  index > 0 && "border-t-green-dim/30 border-t pt-8",
                )}
              >
                {/* Core academic credentials & focus areas */}
                <div
                  className={cn(
                    "flex flex-col gap-3",
                    hasRightRail ? "lg:col-span-5" : "lg:col-span-12",
                  )}
                >
                  <p className="text-meta text-muted text-xs">
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
                    <p className="max-w-[56ch] text-sm">
                      <span className="text-meta text-green-dim">Thesis: </span>
                      <cite className="text-white/95 not-italic">{ed.thesis}</cite>
                    </p>
                  ) : null}
                  {ed.focusAreas.length > 0 ? (
                    <ul aria-label="Focus areas" className="flex flex-wrap gap-2 pt-1">
                      {ed.focusAreas.map((f) => (
                        <li key={f}>
                          <Tag>{f}</Tag>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {/* Integrated educational outcomes: IP registrations and/or school-era awards */}
                {hasRightRail ? (
                  <div className="flex flex-col gap-5 lg:col-span-7">
                    {ipList.length > 0 ? (
                      <div
                        aria-label="Intellectual property and copyright recognition"
                        data-education-ip=""
                        className="flex flex-col gap-4"
                      >
                        {ipList.map((ip) => {
                          const validProjectSlug = resolveIpProjectSlug(ip.projectSlug, projects);
                          return (
                            <article
                              key={ip.registrationReference}
                              className="bg-panel border-green-dim flex flex-col gap-3 border-2 p-4 md:p-5"
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
                                  <dt className="text-meta text-green-dim">
                                    Registration reference
                                  </dt>
                                  <dd className="font-mono break-all text-white">
                                    {ip.registrationReference}
                                  </dd>
                                </div>
                                {isFilled(ip.recordNumber) ? (
                                  <div>
                                    <dt className="text-meta text-green-dim">
                                      Copyright record no.
                                    </dt>
                                    <dd className="font-mono break-all text-white">
                                      {ip.recordNumber}
                                    </dd>
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
                                {validProjectSlug ? (
                                  <Link
                                    href={`/projects/${validProjectSlug}`}
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
                          );
                        })}
                      </div>
                    ) : null}

                    {achievements.length > 0 ? (
                      <section
                        aria-labelledby={`education-awards-${ed.slug}`}
                        data-education-awards=""
                        className="border-green-dim/50 flex flex-col gap-3 border-t border-dashed pt-4 lg:border-t-0 lg:pt-0"
                      >
                        <h4
                          id={`education-awards-${ed.slug}`}
                          className="text-meta text-amber text-xs tracking-wider uppercase"
                        >
                          Competitions &amp; awards
                        </h4>
                        <ol className="divide-green-dim/40 flex flex-col divide-y divide-dashed">
                          {achievements.map((a) => (
                            <li
                              key={`${a.date}-${a.title}`}
                              className="grid gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[7.5rem_1fr] sm:items-baseline sm:gap-4"
                            >
                              <p className="text-meta text-green-dim shrink-0 text-xs">
                                {formatYearMonth(a.date) ?? <Missing what="month" />}
                              </p>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-medium text-white">{a.title}</p>
                                <p className="text-meta text-muted text-xs">{a.issuer}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </section>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
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
