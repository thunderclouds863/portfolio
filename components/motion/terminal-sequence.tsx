"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

export type TerminalStep = {
  command: string;
  output: string;
};

const MAX_MS = 1500;
const MS_PER_CHAR = 45;
const START_MS = 150;
const OUT_MS = 220;
const HOLD_MS = 1900;

/**
 * Reusable terminal command->output sequence (zero extra dependencies).
 * Uses CSS `typing-cover` stepped transform for character-by-character typing,
 * pauses off-screen via IntersectionObserver, and renders static under reduced motion.
 */
export function TerminalSequence({
  steps,
  className = "",
}: {
  steps: readonly TerminalStep[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [idx, setIdx] = useState(0);
  const [showOut, setShowOut] = useState(false);

  const step = steps[idx % steps.length] ?? { command: "", output: "" };
  const dur = Math.min(MAX_MS, Math.max(400, step.command.length * MS_PER_CHAR));

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => e && setInView(e.isIntersecting), {
      threshold: 0.1,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || steps.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t1 = window.setTimeout(() => setShowOut(true), START_MS + dur + OUT_MS);
    const t2 =
      steps.length > 1
        ? window.setTimeout(
            () => {
              setShowOut(false);
              setIdx((n) => (n + 1) % steps.length);
            },
            START_MS + dur + OUT_MS + HOLD_MS,
          )
        : undefined;
    return () => {
      window.clearTimeout(t1);
      if (t2 !== undefined) window.clearTimeout(t2);
    };
  }, [idx, inView, steps.length, dur]);

  const style = {
    "--type-steps": Math.max(1, step.command.length),
    "--type-duration": `${dur}ms`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-terminal-sequence=""
      data-step-index={idx}
      className={`text-meta flex min-h-12 flex-col justify-center gap-1 overflow-hidden ${className}`}
    >
      <p className="text-green flex items-center">
        <span
          key={idx}
          className="relative inline-block max-w-full overflow-hidden whitespace-pre"
          style={style}
        >
          {step.command}
          <span data-typing-cover="" className="typing-cover bg-bg absolute inset-0" />
        </span>
        <span className="text-amber animate-blink ml-0.5 shrink-0">{"█"}</span>
      </p>
      <p
        data-terminal-output=""
        className={`text-muted min-h-[1.25rem] truncate transition-opacity duration-200 motion-reduce:opacity-100 ${showOut ? "opacity-100" : "opacity-0"}`}
      >
        {step.output}
      </p>
    </div>
  );
}
