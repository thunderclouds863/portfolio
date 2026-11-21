import { Missing } from "@/components/content/missing";
import { DraftBadge, Val, isFilled } from "@/components/content/val";
import { Tag } from "@/components/ui/tag";
import { formatYearMonth, isYearMonth, scopeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EducationView, ExperienceView } from "@/lib/views";

import { Section } from "./section";

type ExperienceProps = { experience: ExperienceView[]; education: EducationView[] };

type Item =
  | { kind: "work"; key: string; sort: string; data: ExperienceView }
  | { kind: "education"; key: string; sort: string; data: EducationView };

function DateRange({
  start,
  end,
  current,
}: {
  start: string;
  end: string | null;
  current: boolean;
}) {
  const from = formatYearMonth(start);
  const to = current ? "Present" : formatYearMonth(end);
  return (
    <>
      {from ?? <Missing what="start month" />}
      {" – "}
      {to ?? <Missing what="end month" />}
    </>
  );
}

// FR-EXP-01: vertical timeline; each entry has org, role, dates, 2–4 bullets,
// tags and an explicit contribution scope. Education is part of the timeline (PRD 4).
function Experience({ experience, education }: ExperienceProps) {
  const items: Item[] = [
    ...experience.map((data) => ({
      kind: "work" as const,
      key: `work-${data.slug}`,
      // Current roles (empty end with a real start) sort first.
      sort: data.end ? (isYearMonth(data.end) ? data.end : "0000-00") : "9999-12",
      data,
    })),
    ...education.map((data) => ({
      kind: "education" as const,
      key: `edu-${data.slug}`,
      sort: isYearMonth(data.end) ? data.end : "0000-00",
      data,
    })),
  ].sort((a, b) => b.sort.localeCompare(a.sort));

  return (
    <Section id="experience" number="03" title="Experience">
      {items.length === 0 ? (
        <Missing what="experience entries (IN-02)" />
      ) : (
        <ol className="relative flex flex-col gap-12">
          {/* The vertical line; Phase 4 draws it with scroll (scaleY). */}
          <span
            aria-hidden="true"
            data-timeline-line=""
            className="bg-green-dim absolute top-2 bottom-2 left-[5px] w-0.5 origin-top"
          />
          {items.map((item) => {
            const current = item.kind === "work" && !item.data.end && isYearMonth(item.data.start);
            return (
              <li key={item.key} className="relative grid gap-3 pl-10 md:grid-cols-12 md:gap-8">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1.5 left-0 size-3",
                    current ? "bg-amber animate-blink" : "bg-green-dim",
                  )}
                />
                <p className="text-meta text-muted md:col-span-3">
                  {item.kind === "work" ? (
                    <DateRange start={item.data.start} end={item.data.end} current={current} />
                  ) : (
                    <DateRange start={item.data.start} end={item.data.end} current={false} />
                  )}
                  {current ? <span className="sr-only"> (current role)</span> : null}
                </p>

                <div className="flex flex-col gap-3 md:col-span-9">
                  {item.kind === "work" ? (
                    <WorkEntry data={item.data} />
                  ) : (
                    <EducationEntry data={item.data} />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}

function WorkEntry({ data }: { data: ExperienceView }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-h3 text-white">
          <Val value={data.role} what="role title (IN-02)" />
          <span className="text-muted"> {"·"} </span>
          <span className="text-green">
            <Val value={data.organization} what="organization" />
          </span>
        </h3>
        <DraftBadge show={data.isDraft} />
      </div>
      <p className="text-meta text-yellow">
        {data.scope === "unset" ? (
          <Missing what="contribution scope (IN-02)" />
        ) : (
          <>scope: {scopeLabel[data.scope]}</>
        )}
      </p>
      {data.highlights.length > 0 ? (
        <ul className="flex max-w-[68ch] flex-col gap-2">
          {data.highlights.map((h) => (
            <li key={h} className="flex gap-2">
              <span aria-hidden="true" className="text-green-dim">
                {"▸"}
              </span>
              <span>
                <Val value={h} what="highlight" />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Missing what="2–4 responsibilities (IN-02)" />
      )}
      {data.tags.length > 0 ? (
        <ul aria-label="Tags" className="flex flex-wrap gap-2">
          {data.tags.map((t) => (
            <li key={t}>
              <Tag>{t}</Tag>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function EducationEntry({ data }: { data: EducationView }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-h3 text-white">
          {data.degree} {data.major}
          <span className="text-muted"> {"·"} </span>
          <span className="text-green">{data.institution}</span>
        </h3>
        <DraftBadge show={data.isDraft} />
      </div>
      <p className="text-meta text-muted">
        education{isFilled(data.gpa) ? ` · GPA ${data.gpa}` : null}
      </p>
      {isFilled(data.thesis) ? (
        <p className="max-w-[68ch]">
          <span className="text-green-dim">Thesis: </span>
          <cite className="not-italic">{data.thesis}</cite>
        </p>
      ) : null}
      {data.focusAreas.length > 0 ? (
        <ul aria-label="Focus areas" className="flex flex-wrap gap-2">
          {data.focusAreas.map((f) => (
            <li key={f}>
              <Tag>{f}</Tag>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export { Experience };
