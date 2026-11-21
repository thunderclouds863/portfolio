"use client";

import { useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

import { useScrollMotionEnabled } from "./use-motion-enabled";

/** PRD section 7: no decorative layer moves more than 120px across its section. */
const MAX_TRAVEL_PX = 120;
/** The farthest layer (L0, factor 0.15) gets the full 120px; others scale by depth. */
const FARTHEST_SPEED = 0.15;
/** Scroll distance (≈ the hero's height) over which the travel happens. */
const SCROLL_RANGE_PX = 800;

/** Writes the layer offset (null = static, no transform). */
function setOffset(el: HTMLElement | null, value: number | null) {
  if (el) el.style.transform = value === null ? "" : `translate3d(0, ${value.toFixed(1)}px, 0)`;
}

type ParallaxLayerProps = {
  /** Speed factor relative to scroll: L0 0.15, L1 0.35, L3 1.15 (L2 content is 1.0). */
  speed: number;
  /** Layer name for debugging/tests, e.g. "L0". */
  layer: string;
  className?: string;
  children: ReactNode;
};

/**
 * Decorative parallax layer (PRD section 7). Translates on Y with the page scroll
 * via Motion's useScroll/useTransform; writes `transform` only. Layers slower
 * than content (speed < 1) lag behind; faster ones (> 1) move ahead.
 * Static below 768px and under prefers-reduced-motion.
 */
function ParallaxLayer({ speed, layer, className, children }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useScrollMotionEnabled();
  const { scrollY } = useScroll();
  const travel = (MAX_TRAVEL_PX * (1 - speed)) / (1 - FARTHEST_SPEED);
  const y = useTransform(scrollY, [0, SCROLL_RANGE_PX], [0, travel]); // clamped by default

  useMotionValueEvent(y, "change", (value) => {
    if (enabled) setOffset(ref.current, value);
  });
  useEffect(() => {
    setOffset(ref.current, enabled ? y.get() : null);
  }, [enabled, y]);

  return (
    <div ref={ref} data-layer={layer} className={className}>
      {children}
    </div>
  );
}

export { ParallaxLayer };
