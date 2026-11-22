"use client";

import { useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

import { useScrollMotionEnabled } from "./use-motion-enabled";

/** PRD 7: a decorative layer travels at most 120px across its section. */
const TRAVEL = 120;

// Faint binary strings and process glyphs (PRD 7 L1). Plain ASCII so the mono
// font subset renders them; purely decorative.
const LINES = [
  "01001001 >> map --as-is >> 01010000 >> 01001111",
  "[ input ] --> [ process ] --> [ output ] :: 0110",
  "10110010 :: analyze --gaps :: 01110011 :: 1001",
  "design --to-be >> 0101 >> build >> 1100 >> verify",
];

function setX(el: HTMLElement | null, value: number | null) {
  if (el) el.style.transform = value === null ? "" : `translate3d(${value.toFixed(1)}px, 0, 0)`;
}

/**
 * L1 layer at a section divider: sits in the section's empty top padding (never
 * behind text) and drifts sideways by up to 120px as the section scrolls past.
 * Desktop only, static under reduced motion; aria-hidden.
 */
function SectionGlyphs({ index }: { index: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const enabled = useScrollMotionEnabled();
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "end start"] });
  // Alternate the direction per section for a woven feel.
  const direction = index % 2 === 0 ? 1 : -1;
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [(direction * TRAVEL) / 2, (-direction * TRAVEL) / 2],
  );

  useMotionValueEvent(x, "change", (value) => {
    if (enabled) setX(layer.current, value);
  });
  useEffect(() => {
    setX(layer.current, enabled ? x.get() : null);
  }, [enabled, x]);

  return (
    <div ref={frame} aria-hidden="true" className="section-glyphs">
      <div ref={layer} data-layer="section-L1" className="section-glyphs-line">
        {LINES[index % LINES.length]}
      </div>
    </div>
  );
}

export { SectionGlyphs };
