import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type TypingLineProps = { text: string; className?: string };

/** FR-HERO-03: the whole line types in at most 1.5s. */
const MAX_DURATION_MS = 1500;
const MS_PER_CHAR = 45;

/**
 * Hero terminal line that "types" once (FR-HERO-03). CSS only, no JavaScript:
 * a background-coloured cover slides off the text in character steps
 * (transform only). Never blocks content: the text is in the HTML from the start.
 * Under reduced motion the global rule finishes the animation instantly, so the
 * line is shown static; the cursor stops blinking. Decorative: aria-hidden.
 */
function TypingLine({ text, className }: TypingLineProps) {
  const duration = Math.min(MAX_DURATION_MS, text.length * MS_PER_CHAR);
  const style = {
    "--type-steps": text.length,
    "--type-duration": `${duration}ms`,
  } as CSSProperties;

  return (
    <p aria-hidden="true" className={cn("text-meta text-green-dim flex items-center", className)}>
      <span className="relative inline-block overflow-hidden whitespace-pre" style={style}>
        {text}
        <span data-typing-cover="" className="typing-cover bg-bg absolute inset-0" />
      </span>
      <span className="text-amber animate-blink ml-0.5">{"█"}</span>
    </p>
  );
}

export { TypingLine };
