"use client";

import { useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

import { useScrollMotionEnabled } from "./use-motion-enabled";

/** PRD 7: a decorative layer travels at most 120px across its section. */
const TRAVEL = 120;
/** Scroll progress over which the line types itself (0 = strip enters the screen). */
const TYPE_FROM = 0.05;
const TYPE_TO = 0.42;

// Faint binary strings and process glyphs (PRD 7 L1). Plain ASCII so the mono
// font subset renders them; purely decorative, no claims.
const LINES = [
  "$ map --as-is >> 01001001 01010000 >> analyze",
  "[ input ] --> [ process ] --> [ output ] :: 0110",
  "$ analyze --gaps :: 10110010 :: 01110011 :: ok",
  "$ design --to-be && build && verify :: 1100",
];

function setX(el: HTMLElement | null, value: number | null) {
  if (el) el.style.transform = value === null ? "" : `translate3d(${value.toFixed(1)}px, 0, 0)`;
}

/** Shows the first `count` characters (opacity only); null = show all. */
function setTyped(el: HTMLElement | null, count: number | null) {
  if (!el) return;
  const chars = el.children;
  for (let i = 0; i < chars.length; i += 1) {
    (chars[i] as HTMLElement).style.opacity = count === null || i < count ? "" : "0";
  }
}

/**
 * L1 layer at a section divider: sits in the section's empty top padding (never
 * behind text). As the section scrolls in, the line types itself character by
 * character (decoration only, owner override 3) and drifts sideways by up to
 * 120px. Opacity and transform only. Desktop only; under reduced motion and on
 * phones it is shown complete and still. aria-hidden.
 */
function SectionGlyphs({ index }: { index: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const enabled = useScrollMotionEnabled();
  const text = LINES[index % LINES.length]!;
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "end start"] });
  // Alternate the direction per section for a woven feel.
  const direction = index % 2 === 0 ? 1 : -1;
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [(direction * TRAVEL) / 2, (-direction * TRAVEL) / 2],
  );
  const typed = useTransform(scrollYProgress, [TYPE_FROM, TYPE_TO], [0, text.length]);

  useMotionValueEvent(x, "change", (value) => {
    if (enabled) setX(layer.current, value);
  });
  useMotionValueEvent(typed, "change", (value) => {
    if (enabled) setTyped(layer.current, Math.round(value));
  });
  useEffect(() => {
    setX(layer.current, enabled ? x.get() : null);
    setTyped(layer.current, enabled ? Math.round(typed.get()) : null);
  }, [enabled, x, typed]);

  return (
    <div ref={frame} aria-hidden="true" className="section-glyphs">
      <div ref={layer} data-layer="section-L1" className="section-glyphs-line">
        {[...text].map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </div>
    </div>
  );
}

export { SectionGlyphs };
