import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Missing } from "@/components/content/missing";
import { DraftBadge, Val, isFilled } from "@/components/content/val";
import { MarkdocContent } from "@/components/markdoc/markdoc-content";
import { Button } from "@/components/ui/button";
import {
  formatIsoDate,
  formatYearMonth,
  formatYearOrMonth,
  isYearMonth,
  joinOr,
  levelLabel,
  scopeShortLabel,
  skillGroups,
  workModeLabel,
} from "@/lib/format";
import { getHomeData } from "@/lib/home-data";
import { nodeFromJson } from "@/lib/markdoc";
import { DEFAULT_AVAILABILITY_SUMMARY } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "CV",
  description:
    "CV of Desi Armanda Sari: experience, education, skills and selected projects, with a PDF download.",
  path: "/cv",
});

const CV_FILE_NAME = "desi-armanda-sari-cv.pdf"; // FR-CV-02

function CvSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="border-green-dim/50 flex break-inside-avoid-page flex-col gap-5 border-t pt-8"
    >
      <h2 id={id} className="text-label text-green">
        {title}
      </h2>
      {children}
    </section>
  );
}

function range(start: string, end: string | null, current: boolean) {
  const from = formatYearMonth(start);
  const to = current ? "Present" : formatYearMonth(end);
  return (
    <>
      {from ?? <Missing what="start month" />} {"–"} {to ?? <Missing what="end month" />}
    </>
  );
}

// FR-CV-01/02/03: HTML CV from the same content files as the site, PDF download,
// print stylesheet (globals.css @media print). Semantic headings for screen readers.
export default async function CvPage() {
  const { profile, experience, education, skills, projects } = await getHomeData();
  const availability = profile?.availability;
  const workModes = (availability?.workModes ?? []).map((m) => workModeLabel[m] ?? m);
  const links = (profile?.links ?? []).filter((l) => !!l.url);

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-10 px-4 pt-12 pb-24 md:px-6 md:pt-16 lg:pb-16 print:max-w-none print:gap-6 print:p-0">
      <header className="flex flex-col gap-4">
        <DraftBadge show={!!profile?.isDraft} className="self-start print:hidden" />
        <h1 className="text-display-1 text-green glow">
          <Val value={profile?.name} what="name" />
        </h1>
        <p className="text-lg text-white">
          <Val value={profile?.headline} what="headline (IN-01)" short />
        </p>
        <p className="max-w-[68ch]">
          <Val value={profile?.subheadline} what="sub-headline (IN-01)" />
        </p>
        <ul aria-label="Contact" className="text-meta flex flex-wrap gap-x-6 gap-y-2">
          {links.length > 0 ? (
            links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url!}
                  className="text-green hover:text-amber underline underline-offset-4"
                >
                  {link.label}
                </a>
                {/* On paper a link needs its address, unless the label already is it. */}
                {link.url!.replace(/^mailto:/, "") !== link.label ? (
                  <span className="hidden print:inline">
                    {" "}
                    ({link.url!.replace(/^mailto:/, "")})
                  </span>
                ) : null}
              </li>
            ))
          ) : (
            <li>
              <Missing what="email, LinkedIn, GitHub links (IN-10)" />
            </li>
          )}
          {isFilled(profile?.location) ? <li>{profile.location}</li> : null}
        </ul>
        <div className="flex flex-wrap gap-4 print:hidden">
          {profile?.cvPdf ? (
            <Button asChild>
              <a href={profile.cvPdf} download={CV_FILE_NAME}>
                [ Download PDF ]
              </a>
            </Button>
          ) : (
            <Missing what={`CV PDF, saved as /cv/${CV_FILE_NAME} (IN-11)`} />
          )}
        </div>
      </header>

      <CvSection id="cv-profile" title="Profile">
        <div className="case-body">
          {!profile ? (
            <Missing what="About text (IN-01)" />
          ) : profile.aboutTodo ? (
            <Missing what={profile.aboutTodo} />
          ) : (
            <MarkdocContent node={nodeFromJson(profile.aboutAst)} />
          )}
        </div>
        {availability ? (
          <p className="text-meta text-muted">
            {availability.openToWork
              ? `${isFilled(availability.summary) ? availability.summary : DEFAULT_AVAILABILITY_SUMMARY} `
              : null}
            {profile.preferredLocations.length > 0
              ? `Locations: ${joinOr(profile.preferredLocations)}${workModes.length > 0 ? ` (${joinOr(workModes)})` : ""}. `
              : null}
            {isFilled(availability.availableFrom) ? `Start: ${availability.availableFrom}.` : null}
            {availability.freelance && availability.freelanceServices.length > 0
              ? ` Freelance: ${availability.freelanceServices.join(", ").toLowerCase()}.`
              : null}
          </p>
        ) : null}
      </CvSection>

      <CvSection id="cv-experience" title="Experience">
        {experience.length === 0 ? (
          <Missing what="experience entries (IN-02)" />
        ) : (
          <ol className="flex flex-col gap-6">
            {experience.map((e) => {
              const current = !e.end && isYearMonth(e.start);
              return (
                <li key={e.slug} className="flex break-inside-avoid flex-col gap-2">
                  <h3 className="text-h3 text-white">
                    <Val value={e.role} what="role title (IN-02)" />,{" "}
                    <Val value={e.organization} what="organization" />{" "}
                    <DraftBadge show={e.isDraft} className="print:hidden" />
                  </h3>
                  <p className="text-meta text-muted">{range(e.start, e.end, current)}</p>
                  {e.highlights.length > 0 ? (
                    <ul className="flex list-[square] flex-col gap-1 pl-5">
                      {e.highlights.map((h) => (
                        <li key={h.text}>
                          <Val value={h.text} what="highlight" />
                          {h.scope === "unset" ? (
                            <>
                              {" "}
                              <Missing what="contribution scope" />
                            </>
                          ) : (
                            <span className="text-meta text-muted">
                              {" "}
                              ({scopeShortLabel[h.scope]})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </CvSection>

      <CvSection id="cv-education" title="Education">
        {education.length === 0 ? (
          <Missing what="education entry (IN-03)" />
        ) : (
          <ol className="flex flex-col gap-6">
            {education.map((ed) => (
              <li key={ed.slug} className="flex break-inside-avoid flex-col gap-2">
                <h3 className="text-h3 text-white">
                  {ed.degree} {ed.major}, {ed.institution}{" "}
                  <DraftBadge show={ed.isDraft} className="print:hidden" />
                </h3>
                <p className="text-meta text-muted">
                  {formatYearOrMonth(ed.start) ?? <Missing what="start" />} {"–"}{" "}
                  {formatYearOrMonth(ed.end) ?? <Missing what="end" />}
                  {isFilled(ed.gpa) ? ` · grade ${ed.gpa}` : null}
                </p>
                {isFilled(ed.thesis) ? (
                  <p>
                    Thesis: <cite className="not-italic">{ed.thesis}</cite>
                  </p>
                ) : null}
                {ed.focusAreas.length > 0 ? <p>Focus areas: {ed.focusAreas.join(", ")}</p> : null}
                {ed.achievements.length > 0 ? (
                  <ul className="flex list-[square] flex-col gap-1 pl-5">
                    {ed.achievements.map((a) => (
                      <li key={`${a.date}-${a.title}`}>
                        {a.title}, {a.issuer}
                        <span className="text-meta text-muted"> ({formatYearMonth(a.date)})</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CvSection>

      <CvSection id="cv-skills" title="Skills">
        {skills.length === 0 ? (
          <Missing what="skills with honest levels (IN-04)" />
        ) : (
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {[...skillGroups, { key: "unset", label: "Not grouped yet" }].map((group) => {
              const items = skills.filter((s) => s.group === group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key} className="break-inside-avoid">
                  <dt className="text-meta text-green-dim">{group.label}</dt>
                  <dd>
                    {items.map((s, i) => (
                      <span key={s.slug}>
                        {i > 0 ? ", " : null}
                        {s.name}
                        {s.level !== "unset" ? ` (${levelLabel[s.level]})` : null}
                      </span>
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </CvSection>

      {profile && profile.languages.length > 0 ? (
        <CvSection id="cv-languages" title="Languages">
          <ul className="flex flex-col gap-2">
            {profile.languages.map((l) => (
              <li key={l.language}>
                <span className="text-white">{l.language}</span>:{" "}
                <Val value={l.level} what="language level" />
                {isFilled(l.evidence) ? (
                  <span className="text-meta text-muted"> ({l.evidence})</span>
                ) : null}
              </li>
            ))}
          </ul>
        </CvSection>
      ) : null}

      {profile && profile.certifications.length > 0 ? (
        <CvSection id="cv-certifications" title="Certifications">
          <ul className="flex flex-col gap-2">
            {profile.certifications.map((c) => (
              <li key={c.name}>
                {c.url ? (
                  <a
                    href={c.url}
                    className="text-green hover:text-amber underline underline-offset-4"
                  >
                    {c.name}
                  </a>
                ) : (
                  <span className="text-white">{c.name}</span>
                )}
                <span className="text-meta text-muted">
                  {" "}
                  {"·"} {c.issuer}, {c.year}
                </span>
              </li>
            ))}
          </ul>
        </CvSection>
      ) : null}

      {profile && profile.publications.length > 0 ? (
        <CvSection id="cv-publications" title="Publications">
          <ul className="flex flex-col gap-2">
            {profile.publications.map((p) => (
              <li key={p.title}>
                {p.url ? (
                  <a
                    href={p.url}
                    lang="id"
                    className="text-green hover:text-amber underline underline-offset-4"
                  >
                    {p.title}
                  </a>
                ) : (
                  <span lang="id">{p.title}</span>
                )}
                <span className="text-meta text-muted">
                  {" "}
                  {"·"} {p.venue}
                  {formatIsoDate(p.date) ? `, ${formatIsoDate(p.date)}` : null}
                </span>
              </li>
            ))}
          </ul>
        </CvSection>
      ) : null}

      <CvSection id="cv-projects" title="Selected projects">
        {projects.length === 0 ? (
          <Missing what="published projects (IN-05)" />
        ) : (
          <ul className="flex flex-col gap-3">
            {projects.map((p) => (
              <li key={p.slug} className="break-inside-avoid">
                <Link
                  href={`/projects/${p.slug}`}
                  className="text-green hover:text-amber underline underline-offset-4"
                >
                  {p.title}
                </Link>
                {isFilled(p.summary) ? (
                  <span>
                    {" "}
                    {"—"} {p.summary}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CvSection>
    </div>
  );
}
