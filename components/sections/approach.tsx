import { Missing } from "@/components/content/missing";
import { DraftBadge } from "@/components/content/val";
import { resolveApproachStages } from "@/lib/approach-story";
import type { ProjectView, SettingsView } from "@/lib/views";

import { ApproachStory } from "./approach-story";
import { Section } from "./section";

type ApproachProps = {
  settings: SettingsView | null;
  projects?: ProjectView[];
  number?: string;
};

// Interactive visual storytelling driven directly by Keystatic CMS (`settings.approach`)
// as the single source of truth, linked to verified published projects.
function Approach({ settings, projects = [], number = "05" }: ApproachProps) {
  const stages = resolveApproachStages(settings?.approach, projects);

  return (
    <Section id="approach" number={number} title="Approach">
      <DraftBadge show={!!settings?.isDraft} className="mb-6" />
      {stages.length === 0 ? (
        <Missing what="approach steps in Site Settings (IN-06)" />
      ) : (
        <ApproachStory stages={stages} />
      )}
    </Section>
  );
}

export { Approach };
