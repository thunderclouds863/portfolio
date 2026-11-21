"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { useScrollMotionEnabled } from "./use-motion-enabled";

/** Writes the timeline draw state (null = static, fully drawn). */
function setLine(line: HTMLElement | null, value: number | null) {
  if (line) line.style.transform = value === null ? "" : `scaleY(${value.toFixed(3)})`;
}

/** Writes the pipeline fill and marks the step reached so far (null = static). */
function setPipeline(
  wrap: HTMLElement | null,
  bar: HTMLElement | null,
  steps: number,
  value: number | null,
) {
  if (bar) bar.style.transform = value === null ? "" : `scaleX(${value.toFixed(3)})`;
  const current = value !== null && value > 0 ? Math.min(steps - 1, Math.floor(value * steps)) : -1;
  wrap?.querySelectorAll<HTMLElement>("[data-step]").forEach((el, index) => {
    el.toggleAttribute("data-active", index === current);
  });
}

/**
 * Experience timeline line that "draws" with scroll (PRD 7: scaleY linked to
 * the section's scroll progress). Children (the server-rendered <ol>) are
 * untouched. Without scroll motion (mobile, reduced motion, no JS) the line is
 * shown fully drawn.
 */
function TimelineTrack({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const enabled = useScrollMotionEnabled();
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start 0.75", "end 0.5"] });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (enabled) setLine(lineRef.current, value);
  });
  useEffect(() => {
    setLine(lineRef.current, enabled ? scrollYProgress.get() : null);
  }, [enabled, scrollYProgress]);

  return (
    <div ref={wrapRef} className="relative">
      <span
        ref={lineRef}
        aria-hidden="true"
        data-timeline-line=""
        className="bg-green-dim absolute top-2 bottom-2 left-[5px] w-0.5 origin-top"
      />
      {children}
    </div>
  );
}

type PipelineProgressProps = { steps: number; className?: string; children: ReactNode };

/**
 * Approach pipeline (FR-APR-01, PRD 7): the progress bar fills (scaleX) as the
 * section scrolls past the centre, and the step reached so far gets
 * data-active (styled amber). Children are the server-rendered steps marked
 * with [data-step]. Desktop only; static without scroll motion.
 */
function PipelineProgress({ steps, className, children }: PipelineProgressProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const enabled = useScrollMotionEnabled();
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start 0.8", "end 0.4"] });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (enabled) setPipeline(wrapRef.current, barRef.current, steps, value);
  });
  useEffect(() => {
    setPipeline(wrapRef.current, barRef.current, steps, enabled ? scrollYProgress.get() : null);
  }, [enabled, scrollYProgress, steps]);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div
        aria-hidden="true"
        className="bg-green-dim/30 absolute top-[22px] right-0 left-0 hidden h-1 lg:block"
      >
        <div
          ref={barRef}
          data-approach-progress=""
          className="bg-amber h-full origin-left scale-x-0"
        />
      </div>
      {children}
    </div>
  );
}

export { PipelineProgress, TimelineTrack };
