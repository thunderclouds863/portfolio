"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

export type TerminalStep = { command: string; output: string };

/**
 * Reusable terminal command->output sequence.
 * Uses CSS `typing-cover` stepped transform for character-by-character typing,
 * pauses off-screen via IntersectionObserver, and renders static under reduced motion.
 */
export function TerminalSequence({ steps }: { steps: readonly TerminalStep[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [showOut, setShowOut] = useState(false);

  const step = steps[idx % steps.length] ?? { command: "", output: "" };
  const dur = Math.min(1500, Math.max(400, step.command.length * 45));

  useEffect(() => {
    const el = ref.current;
    if (!el || !steps.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    const start = () => {
      stop();
      t1 = setTimeout(() => setShowOut(true), 370 + dur);
      if (steps.length > 1) {
        t2 = setTimeout(() => {
          setShowOut(false);
          setIdx((n) => (n + 1) % steps.length);
        }, 2270 + dur);
      }
    };
    const io = new IntersectionObserver(([e]) => (e?.isIntersecting ? start() : stop()), {
      threshold: 0.1,
    });
    io.observe(el);
    return () => {
      stop();
      io.disconnect();
    };
  }, [idx, steps.length, dur]);

  const style = {
    "--type-steps": step.command.length || 1,
    "--type-duration": `${dur}ms`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-terminal-sequence=""
      data-step-index={idx}
      className="text-meta flex min-h-12 flex-col justify-center gap-1 overflow-hidden"
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
