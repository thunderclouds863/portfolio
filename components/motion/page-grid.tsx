"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef } from "react";

import { useScrollMotionEnabled } from "./use-motion-enabled";

/** PRD 7 L0: whole-page pixel grid, speed 0.15. */
const SPEED = 0.15;
/** The pattern repeats every PERIOD px, so the offset wraps there (always < 120px). */
const PERIOD = 32;

function offsetFor(scrollY: number) {
  // A fixed layer moved by -scroll*speed appears to scroll at `speed`; wrapping
  // at the pattern period keeps the actual translation tiny and seamless.
  return -((scrollY * SPEED) % PERIOD);
}

/**
 * Page-wide L0 layer (PRD 7: "Pixel grid / dot matrix background — whole page,
 * fixed background, transformed"). A faint dot-and-line grid fixed behind all
 * content that drifts at 0.15x the scroll speed on desktop. Static on phones and
 * under reduced motion. Decorative: aria-hidden, no pointer events.
 */
function PageGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useScrollMotionEnabled();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => {
    if (enabled && ref.current) {
      ref.current.style.transform = `translate3d(0, ${offsetFor(value).toFixed(1)}px, 0)`;
    }
  });
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.transform = enabled
      ? `translate3d(0, ${offsetFor(scrollY.get()).toFixed(1)}px, 0)`
      : "";
  }, [enabled, scrollY]);

  return (
    <div aria-hidden="true" className="page-grid-frame">
      <div ref={ref} data-layer="page-L0" className="page-grid" />
    </div>
  );
}

export { PageGrid };
