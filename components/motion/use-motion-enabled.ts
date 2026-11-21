"use client";

import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True at ≥768px. False on the server and before hydration. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

/**
 * Scroll-linked motion (parallax, timeline draw, pipeline progress) runs only on
 * desktop and only when the user has not asked for reduced motion
 * (PRD section 7, hard rules 3 and 4). Below 768px only reveals remain.
 */
export function useScrollMotionEnabled(): boolean {
  const reduced = useReducedMotion();
  const desktop = useIsDesktop();
  return desktop && reduced === false;
}
