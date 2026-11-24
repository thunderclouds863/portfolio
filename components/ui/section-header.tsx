import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  /** Section index, e.g. "01". Shown as "01 //" before the title. */
  number: string;
  title: ReactNode;
  /** id for the heading, used by aria-labelledby on the section. */
  id?: string;
  className?: string;
};

// H2 section title prefixed by its section number (PRD section 6 typography).
// tabIndex -1 lets the mobile menu move focus here after navigating (PRD 8.7).
function SectionHeader({ number, title, id, className }: SectionHeaderProps) {
  return (
    <h2 id={id} tabIndex={-1} className={cn("text-display-2 text-green break-words", className)}>
      <span aria-hidden="true" className="text-green-dim mr-3">
        {`${number} //`}
      </span>
      {title}
    </h2>
  );
}

export { SectionHeader };
