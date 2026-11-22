import {
  BriefcaseBusinessIcon,
  FolderGit2Icon,
  GlobeIcon,
  MailIcon,
  MessageCircleIcon,
} from "lucide-react";

import { Missing } from "@/components/content/missing";
import { DraftBadge, Val } from "@/components/content/val";
import { TerminalFrame } from "@/components/ui/terminal-frame";
import { joinOr, workModeLabel } from "@/lib/format";
import type { ProfileView, SettingsView } from "@/lib/views";
import { Reveal } from "@/components/motion/reveal";

import { ContactForm } from "./contact-form";
import { Section } from "./section";

const linkIcons = {
  email: MailIcon,
  linkedin: BriefcaseBusinessIcon,
  github: FolderGit2Icon,
  whatsapp: MessageCircleIcon,
  website: GlobeIcon,
} as const;

type ContactProps = { profile: ProfileView | null; settings: SettingsView | null; number?: string };

// FR-CTA-01: form + direct links + availability text + response expectation.
function Contact({ profile, settings, number = "07" }: ContactProps) {
  const availability = profile?.availability;
  const workModes = (availability?.workModes ?? []).map((m) => workModeLabel[m] ?? m);
  // Links without a URL (e.g. half-filled drafts) are not rendered.
  const links = (profile?.links ?? []).flatMap((link) =>
    link.url ? [{ ...link, url: link.url }] : [],
  );

  return (
    <Section id="contact" number={number} title="Contact">
      <Reveal stagger className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-8 lg:col-span-5">
          <DraftBadge show={!!profile?.isDraft || !!settings?.isDraft} className="self-start" />

          <div className="flex flex-col gap-2">
            <h3 className="text-label text-green">Availability</h3>
            {availability ? (
              <ul className="flex flex-col gap-1">
                {availability.openToWork && profile.preferredLocations.length > 0 ? (
                  <li>
                    Open to {workModes.length > 0 ? `${joinOr(workModes)} ` : ""}roles in{" "}
                    {joinOr(profile.preferredLocations)}.
                  </li>
                ) : null}
                {availability.freelance && availability.freelanceServices.length > 0 ? (
                  <li>Freelance: {availability.freelanceServices.join(", ").toLowerCase()}.</li>
                ) : null}
                <li className="text-meta text-muted">
                  start: <Val value={availability.availableFrom} what="availability" />
                </li>
              </ul>
            ) : (
              <Missing what="availability (IN-01)" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-label text-green">Response time</h3>
            <p>
              <Val value={settings?.contactResponseTime} what="response-time text" />
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-label text-green">Direct links</h3>
            {links.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {links.map((link) => {
                  const Icon = linkIcons[link.icon] ?? GlobeIcon;
                  const external = !link.url.startsWith("mailto:");
                  return (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="text-green hover:text-amber inline-flex min-h-11 items-center gap-3 font-mono"
                      >
                        <Icon aria-hidden="true" className="size-5" />
                        {link.label}
                        {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Missing what="email, LinkedIn, GitHub links (IN-10)" />
            )}
          </div>
        </div>

        <TerminalFrame title="contact.sh" thick className="lg:col-span-7">
          <ContactForm fallbackEmail={links.find((l) => l.icon === "email")?.url ?? null} />
        </TerminalFrame>
      </Reveal>
    </Section>
  );
}

export { Contact };
