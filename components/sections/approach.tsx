import { Missing } from "@/components/content/missing";
import { DraftBadge, Val } from "@/components/content/val";
import { Reveal } from "@/components/motion/reveal";
import { PipelineProgress } from "@/components/motion/scroll-progress";
import type { SettingsView } from "@/lib/views";

import { Section } from "./section";

// FR-APR-01: six steps as a pipeline — horizontal on desktop, vertical on mobile.
// PipelineProgress fills the bar with scroll and marks the current step (amber).
function Approach({ settings, number = "05" }: { settings: SettingsView | null; number?: string }) {
  const steps = settings?.approach ?? [];

  return (
    <Section id="approach" number={number} title="Approach">
      <DraftBadge show={!!settings?.isDraft} className="mb-6" />
      {steps.length === 0 ? (
        <Missing what="six approach steps in Site settings (FR-APR-01)" />
      ) : (
        <PipelineProgress steps={steps.length}>
          <Reveal
            as="ol"
            stagger
            className="relative grid gap-6 md:grid-cols-3 lg:grid-cols-6 lg:gap-4"
          >
            {steps.map((step, index) => (
              <li
                key={step.title || index}
                data-step={index}
                className="group flex gap-4 lg:flex-col"
              >
                <span
                  aria-hidden="true"
                  className="bg-bg border-green text-label text-green group-data-[active]:border-amber group-data-[active]:text-amber flex size-12 shrink-0 items-center justify-center border-2"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-h3 group-data-[active]:text-amber text-white">
                    <span className="sr-only">Step {index + 1}: </span>
                    <Val value={step.title} what="step name" />
                  </h3>
                  <p className="text-sm">
                    <Val value={step.description} what="step description" />
                  </p>
                </div>
              </li>
            ))}
          </Reveal>
        </PipelineProgress>
      )}
    </Section>
  );
}

export { Approach };
