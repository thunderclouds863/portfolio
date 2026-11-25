import Link from "next/link";

import { Missing } from "@/components/content/missing";
import { DraftBadge, Val } from "@/components/content/val";
import { Reveal } from "@/components/motion/reveal";
import { PixelIcon, type PixelIconName } from "@/components/pixel/pixel-icon";
import { cn } from "@/lib/utils";
import type { ProjectView, SettingsView } from "@/lib/views";

import { Section } from "./section";

type CapabilitiesProps = { settings: SettingsView | null; projects: ProjectView[] };

const icons: Record<string, PixelIconName> = {
  system_analysis: "cursor",
  process_improvement: "gear",
  system_development: "floppy",
};

const CAPABILITY_FILTER_SLUG: Record<string, string> = {
  system_analysis: "analysis",
  process_improvement: "process",
  system_development: "development",
};

const MAX_INLINE_EVIDENCE = 4;

// Phase 9 Workstream E (High Priority) — Editorial Spine + Practice Matrix:
// Replaces the disproportionate 7-col x 2-row mega-card layout with three cohesive,
// border-separated architectural capability bands (`01 Analyze -> 02 Improve -> 03 Build`).
// Eliminates empty box voids while keeping System Analyst clearly framed as the lead
// pillar, pairing each capability's practices directly with bounded project evidence.
function Capabilities({ settings, projects }: CapabilitiesProps) {
  const items = settings?.capabilities ?? [];

  return (
    <Section id="capabilities" number="02" title="Capabilities">
      <DraftBadge show={!!settings?.isDraft} className="mb-6" />
      {items.length === 0 ? (
        <Missing what="three capabilities in Site settings (FR-CAP-01)" />
      ) : (
        <Reveal as="ol" stagger data-capabilities-list="" className="border-green-dim/50 divide-green-dim/40 flex flex-col divide-y border-y">
          {items.map((item, index) => {
            const isPrimary = index === 0;
            const evidence = projects.filter((p) => p.capabilities.includes(item.key));
            const shownEvidence = evidence.slice(0, MAX_INLINE_EVIDENCE);
            const remainingCount = evidence.length - shownEvidence.length;
            const filterKey = CAPABILITY_FILTER_SLUG[item.key];
            const indexLabel = String(index + 1).padStart(2, "0");

            return (
              <li
                key={item.key}
                data-capability-key={item.key}
                aria-labelledby={`cap-${item.key}`}
                className={cn(
                  "grid gap-6 py-8 md:py-10 lg:grid-cols-12 lg:gap-10",
                  isPrimary && "border-l-amber border-l-4 pl-4 md:pl-6",
                )}
              >
                {/* Left pillar column: role anchor, summary, relationship */}
                <div className="flex flex-col gap-3 lg:col-span-5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "text-meta text-xs tracking-wider uppercase",
                        isPrimary ? "text-amber" : "text-green-dim",
                      )}
                    >
                      {`Pillar ${indexLabel}`}
                      {isPrimary ? " // Lead Focus" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <PixelIcon
                      name={icons[item.key] ?? "cursor"}
                      size={isPrimary ? 28 : 24}
                      className={isPrimary ? "text-amber shrink-0" : "text-green shrink-0"}
                    />
                    <h3
                      id={`cap-${item.key}`}
                      className={cn(
                        isPrimary ? "text-display-2 text-white" : "text-h3 text-green",
                      )}
                    >
                      <Val value={item.title} what="capability title" />
                    </h3>
                  </div>

                  <p className="text-muted max-w-[50ch] text-sm leading-relaxed md:text-base">
                    <Val value={item.summary} what="capability summary" />
                  </p>
                </div>

                {/* Right matrix column: concrete practices + bounded evidence ledger */}
                <div className="flex flex-col justify-between gap-5 lg:col-span-7">
                  {item.activities.length > 0 ? (
                    <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                      {item.activities.map((activity) => (
                        <li key={activity} className="flex items-start gap-2 text-sm text-white/90">
                          <span aria-hidden="true" className="text-green-dim mt-0.5 shrink-0">
                            {"▸"}
                          </span>
                          <span>
                            <Val value={activity} what="activity" />
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Missing what="activities for this capability" />
                  )}

                  <div className="border-green-dim/40 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-dashed pt-3">
                    <span className="text-meta text-green-dim shrink-0 text-xs">evidence:</span>
                    {evidence.length > 0 ? (
                      <ul className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                        {shownEvidence.map((p) => (
                          <li key={p.slug}>
                            <Link
                              href={`/projects/${p.slug}`}
                              className="text-meta text-green hover:text-amber text-xs underline underline-offset-4 transition-colors duration-(--dur-fast)"
                            >
                              {p.title}
                            </Link>
                          </li>
                        ))}
                        {remainingCount > 0 && filterKey ? (
                          <li>
                            <Link
                              href={`/projects?capability=${filterKey}`}
                              className="text-meta text-amber hover:text-yellow text-xs underline underline-offset-4 transition-colors duration-(--dur-fast)"
                            >
                              {`+${remainingCount} more ->`}
                            </Link>
                          </li>
                        ) : null}
                      </ul>
                    ) : (
                      <Missing what="projects tagged with this capability (IN-05)" />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </Reveal>
      )}
    </Section>
  );
}

export { Capabilities };
