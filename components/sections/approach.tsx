import { Missing } from "@/components/content/missing";
import { DraftBadge, Val } from "@/components/content/val";
import type { SettingsView } from "@/lib/views";

import { Section } from "./section";

// FR-APR-01: six steps as a pipeline — horizontal on desktop, vertical on mobile.
// The progress bar is static here; Phase 4 links scaleX to scroll.
function Approach({ settings }: { settings: SettingsView | null }) {
  const steps = settings?.approach ?? [];

  return (
    <Section id="approach" number="05" title="Approach">
      <DraftBadge show={!!settings?.isDraft} className="mb-6" />
      {steps.length === 0 ? (
        <Missing what="six approach steps in Site settings (FR-APR-01)" />
      ) : (
        <div className="relative">
          <div
            aria-hidden="true"
            className="bg-green-dim/30 absolute top-[22px] right-0 left-0 hidden h-1 lg:block"
          >
            <div data-approach-progress="" className="bg-amber h-full origin-left scale-x-0" />
          </div>
          <ol className="relative grid gap-6 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {steps.map((step, index) => (
              <li key={step.title || index} className="flex gap-4 lg:flex-col">
                <span
                  aria-hidden="true"
                  className="bg-bg border-green text-label text-green flex size-12 shrink-0 items-center justify-center border-2"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-h3 text-white">
                    <span className="sr-only">Step {index + 1}: </span>
                    <Val value={step.title} what="step name" />
                  </h3>
                  <p className="text-sm">
                    <Val value={step.description} what="step description" />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Section>
  );
}

export { Approach };
