import Link from "next/link";

import { Missing } from "@/components/content/missing";
import { DraftBadge, Val } from "@/components/content/val";
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

// FR-CAP-01: three roles in an asymmetric layout (one large, two stacked),
// each with what she does and links to the projects that prove it.
function Capabilities({ settings, projects }: CapabilitiesProps) {
  const items = settings?.capabilities ?? [];

  return (
    <Section id="capabilities" number="02" title="Capabilities">
      <DraftBadge show={!!settings?.isDraft} className="mb-6" />
      {items.length === 0 ? (
        <Missing what="three capabilities in Site settings (FR-CAP-01)" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 lg:grid-rows-2">
          {items.map((item, index) => {
            const large = index === 0;
            const evidence = projects.filter((p) => p.capabilities.includes(item.key));
            return (
              <article
                key={item.key}
                aria-labelledby={`cap-${item.key}`}
                className={cn(
                  "bg-panel border-green-dim flex flex-col gap-4 border-2 p-6",
                  large
                    ? "border-green shadow-pixel lg:col-span-7 lg:row-span-2 lg:p-10"
                    : "lg:col-span-5",
                )}
              >
                <div className={cn("flex items-center gap-3", large ? "text-amber" : "text-green")}>
                  <PixelIcon name={icons[item.key] ?? "cursor"} size={large ? 32 : 24} />
                  <h3
                    id={`cap-${item.key}`}
                    className={cn(large ? "text-display-2" : "text-h3", "text-green")}
                  >
                    <Val value={item.title} what="capability title" />
                  </h3>
                </div>
                <p className={cn("max-w-[60ch]", large && "text-lg")}>
                  <Val value={item.summary} what="capability summary" />
                </p>
                {item.activities.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {item.activities.map((activity) => (
                      <li key={activity} className="flex gap-2">
                        <span aria-hidden="true" className="text-green-dim">
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
                <div className="mt-auto pt-2">
                  <p className="text-meta text-green-dim mb-2">evidence:</p>
                  {evidence.length > 0 ? (
                    <ul className="flex flex-wrap gap-x-4 gap-y-2">
                      {evidence.map((p) => (
                        <li key={p.slug}>
                          <Link
                            href={`/projects/${p.slug}`}
                            className="text-green hover:text-amber font-mono text-sm underline underline-offset-4"
                          >
                            {p.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Missing what="projects tagged with this capability (IN-05)" />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Section>
  );
}

export { Capabilities };
