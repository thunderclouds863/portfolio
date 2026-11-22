import { Missing } from "@/components/content/missing";
import { DraftBadge, Val } from "@/components/content/val";
import { Reveal } from "@/components/motion/reveal";
import { TimelineTrack } from "@/components/motion/scroll-progress";
import { Tag } from "@/components/ui/tag";
import { formatYearMonth, isYearMonth, scopeShortLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ExperienceView } from "@/lib/views";

import { Section } from "./section";

type ExperienceProps = { experience: ExperienceView[]; number: string };

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

// FR-EXP-01: vertical timeline; each entry has org, role, dates, bullets, tags and an
// explicit contribution scope. Owner overrides (decision 0002): any number of bullets,
// and education has its own section instead of sharing this timeline.
function Experience({ experience, number }: ExperienceProps) {
  const items = [...experience].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

  return (
    <Section id="experience" number={number} title="Experience">
      {items.length === 0 ? (
        <Missing what="experience entries (IN-02)" />
      ) : (
        <TimelineTrack>
          <Reveal as="ol" stagger className="relative flex flex-col gap-12">
            {items.map((item) => {
              const current = !item.end && isYearMonth(item.start);
              return (
                <li key={item.slug} className="relative grid gap-3 pl-10 md:grid-cols-12 md:gap-8">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1.5 left-0 size-3",
                      current ? "bg-amber animate-blink" : "bg-green-dim",
                    )}
                  />
                  <p className="text-meta text-muted md:col-span-3">
                    <DateRange start={item.start} end={item.end} current={current} />
                    {current ? <span className="sr-only"> (current role)</span> : null}
                  </p>

                  <div className="flex flex-col gap-3 md:col-span-9">
                    <WorkEntry data={item} />
                  </div>
                </li>
              );
            })}
          </Reveal>
        </TimelineTrack>
      )}
    </Section>
  );
}

/** Current roles (empty end with a real start) sort first. */
function sortKey(data: ExperienceView) {
  return data.end ? (isYearMonth(data.end) ? data.end : "0000-00") : "9999-12";
}

/** Contribution scope per bullet (AGENTS.md: always state scope). */
function ScopeNote({ scope }: { scope: string }) {
  if (scope === "unset") return <Missing what="contribution scope" />;
  return (
    <span className="text-meta text-yellow whitespace-nowrap">
      [ {scopeShortLabel[scope]} ]<span className="sr-only"> contribution</span>
    </span>
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
      {data.highlights.length > 0 ? (
        <ul className="flex max-w-[68ch] flex-col gap-2">
          {data.highlights.map((h) => (
            <li key={h.text} className="flex gap-2">
              <span aria-hidden="true" className="text-green-dim">
                {"▸"}
              </span>
              <span>
                <Val value={h.text} what="highlight" /> <ScopeNote scope={h.scope} />
              </span>
            </li>
          ))}
        </ul>
      ) : data.isDraft ? (
        <Missing what="responsibilities (IN-02)" />
      ) : null}
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

export { Experience };
