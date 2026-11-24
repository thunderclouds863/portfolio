"use client";

import { useReducedMotion } from "motion/react";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type TerminalStep = {
  /** Command typed character by character, e.g. "> analyze --process=as-is". */
  command: string;
  /** Output line revealed after the command finishes typing. */
  output: string;
};

type TerminalSequenceProps = {
  steps: readonly TerminalStep[];
  className?: string;
};

/** FR-HERO-03: each command types in at most 1.5s. */
const MAX_TYPE_MS = 1500;
const MS_PER_CHAR = 45;
const START_DELAY_MS = 150;
const OUTPUT_DELAY_MS = 220;
const HOLD_MS = 1900;

/**
 * Reusable terminal command->output sequence.
 *
 * Uses the CSS `typing-cover` stepped transform for character-by-character typing
 * (zero per-character React re-renders, GPU transform only) and advances cleanly
 * through command -> output -> hold -> next command.
 *
 * - Fixed height prevents layout shift (CLS = 0).
 * - Pauses automatically when scrolled out of the viewport (IntersectionObserver).
 * - Under `prefers-reduced-motion: reduce`, renders the first command and output
 *   statically with no timers and no cover animation.
 */
function TerminalSequence({ steps, className }: TerminalSequenceProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [index, setIndex] = useState(0);
  const [showOutput, setShowOutput] = useState(false);

  const safeSteps = steps.length > 0 ? steps : [{ command: "", output: "" }];
  const current = safeSteps[index % safeSteps.length]!;
  const typeDuration = Math.min(MAX_TYPE_MS, Math.max(400, current.command.length * MS_PER_CHAR));

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !inView || safeSteps.length === 0) return;

    const revealTimer = window.setTimeout(
      () => setShowOutput(true),
      START_DELAY_MS + typeDuration + OUTPUT_DELAY_MS,
    );

    const nextTimer =
      safeSteps.length > 1
        ? window.setTimeout(
            () => {
              setShowOutput(false);
              setIndex((prev) => (prev + 1) % safeSteps.length);
            },
            START_DELAY_MS + typeDuration + OUTPUT_DELAY_MS + HOLD_MS,
          )
        : undefined;

    return () => {
      window.clearTimeout(revealTimer);
      if (nextTimer !== undefined) window.clearTimeout(nextTimer);
    };
  }, [index, inView, reduced, safeSteps.length, typeDuration]);

  const coverStyle = {
    "--type-steps": Math.max(1, current.command.length),
    "--type-duration": `${typeDuration}ms`,
  } as CSSProperties;

  const outputVisible = reduced || showOutput;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-terminal-sequence=""
      data-step-index={index}
      className={cn(
        "text-meta flex min-h-12 flex-col justify-center gap-1 overflow-hidden",
        className,
      )}
    >
      <p className="text-green flex items-center">
        <span
          key={index}
          className="relative inline-block max-w-full overflow-hidden whitespace-pre"
          style={coverStyle}
        >
          {current.command}
          <span data-typing-cover="" className="typing-cover bg-bg absolute inset-0" />
        </span>
        <span className="text-amber animate-blink ml-0.5 shrink-0">{"█"}</span>
      </p>
      <p
        data-terminal-output=""
        className={cn(
          "text-muted min-h-[1.25rem] truncate transition-opacity duration-200",
          outputVisible ? "opacity-100" : "opacity-0",
        )}
      >
        {current.output}
      </p>
    </div>
  );
}

export { TerminalSequence };
