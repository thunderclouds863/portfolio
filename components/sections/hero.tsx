import { Missing } from "@/components/content/missing";
import { DraftBadge, Val, isFilled } from "@/components/content/val";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { joinOr, workModeLabel } from "@/lib/format";
import { DEFAULT_AVAILABILITY_LABEL, DEFAULT_AVAILABILITY_SUMMARY } from "@/lib/schema";
import type { ProfileView, SettingsView } from "@/lib/views";

import { TerminalSequence, type TerminalStep } from "@/components/motion/terminal-sequence";

import { HeroVisual } from "./hero-visual";

const HERO_TERMINAL_STEPS: readonly TerminalStep[] = [
  { command: "> analyze --process=as-is", output: "Mapping current workflow..." },
  { command: "> identify --bottleneck", output: "Detecting operational inefficiencies..." },
  { command: "> design --to-be", output: "Optimizing business process..." },
  { command: "> build --solution", output: "Developing the required system..." },
  { command: "> verify --improvement", output: "Validating implementation results..." },
];

type HeroProps = { profile: ProfileView | null; settings: SettingsView | null };

// FR-HERO-01: H1 role line, sub-line, status chip, two CTAs, location/availability.
// Server-rendered and readable without JavaScript. Split layout: text 7 / visual 5.
function Hero({ profile, settings }: HeroProps) {
  const availability = profile?.availability;
  const showChip = !!availability?.openToWork && (settings?.showStatusChip ?? true);
  const workModes = (availability?.workModes ?? []).map((m) => workModeLabel[m] ?? m);

  return (
    <section id="top" aria-labelledby="hero-title" className="relative">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <TerminalSequence steps={HERO_TERMINAL_STEPS} />

          <DraftBadge show={!!profile?.isDraft} className="self-start" />

          <h1 id="hero-title" className="text-display-1 text-green glow max-w-[22ch]">
            <Val value={profile?.headline} what="hero headline (IN-01)" short />
          </h1>

          <p className="max-w-[60ch] text-lg">
            <Val value={profile?.subheadline} what="sub-headline (IN-01)" />
          </p>

          {showChip ? (
            <StatusChip className="self-start">
              {isFilled(availability.label) ? availability.label : DEFAULT_AVAILABILITY_LABEL}
            </StatusChip>
          ) : null}

          {availability ? (
            <>
              {availability.openToWork ? (
                <p className="text-muted max-w-[60ch] text-sm">
                  {isFilled(availability.summary)
                    ? availability.summary
                    : DEFAULT_AVAILABILITY_SUMMARY}
                </p>
              ) : null}
              <ul
                aria-label="Location and availability"
                className="text-meta text-muted flex flex-col gap-1"
              >
                {profile.preferredLocations.length > 0 ? (
                  <li>
                    <span className="text-green-dim">loc: </span>
                    {profile.preferredLocations.join(" / ")}
                    {workModes.length > 0 ? ` · ${joinOr(workModes)}` : null}
                  </li>
                ) : null}
                {isFilled(availability.availableFrom) ? (
                  <li>
                    <span className="text-green-dim">start: </span>
                    {availability.availableFrom}
                  </li>
                ) : null}
                {availability.freelance ? (
                  <li>
                    <span className="text-green-dim">freelance: </span>
                    {availability.freelanceServices.length > 0
                      ? availability.freelanceServices.join(", ")
                      : "open"}
                  </li>
                ) : null}
              </ul>
            </>
          ) : (
            <Missing what="location and availability (IN-01)" />
          )}

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <Button asChild>
              <a href="#projects">[ View projects ]</a>
            </Button>
            {profile?.cvPdf ? (
              <Button asChild variant="secondary">
                <a href={profile.cvPdf} download="desi-armanda-sari-cv.pdf">
                  [ Download CV ]
                </a>
              </Button>
            ) : (
              <Missing what="CV PDF for the Download CV button (IN-11)" />
            )}
          </div>
        </div>

        <HeroVisual className="lg:col-span-5" />
      </div>
    </section>
  );
}

export { Hero };
