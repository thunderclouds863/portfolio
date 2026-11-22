import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { SectionGlyphs } from "@/components/motion/section-glyphs";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";

type SectionProps = {
  /** Anchor id (PRD section 4), e.g. "about". */
  id: string;
  /** Section index, e.g. "01". */
  number: string;
  title: string;
  className?: string;
  children: ReactNode;
};

// Shared section shell: landmark + numbered H2, container 1200px, PRD spacing.
// The H2 id is `${id}-title`; the section id is the nav anchor.
function Section({ id, number, title, className, children }: SectionProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      data-section={id}
      className={cn(
        "border-green-dim/40 relative border-t py-[clamp(4rem,8vw,8rem)] first:border-t-0",
        className,
      )}
    >
      {/* PRD 7 L1 at the section divider: in the empty top padding, decorative. */}
      <SectionGlyphs index={Number(number) || 0} />
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <Reveal>
          <SectionHeader id={titleId} number={number} title={title} className="mb-10 md:mb-14" />
        </Reveal>
        {children}
      </div>
    </section>
  );
}

export { Section };
