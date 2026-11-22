"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useScrollMotionEnabled } from "./use-motion-enabled";

type PointerTiltProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Hero pointer tilt (PRD 7: "pointer tilt <= 6px translation, disabled on touch
 * devices"). Writes --tilt-x / --tilt-y (-1..1) on this element; children with
 * the `tilt-layer` class translate by `--depth` px times those values (CSS in
 * app/globals.css). Only on desktop with a fine pointer and without reduced
 * motion; otherwise the variables stay unset and nothing moves.
 */
function PointerTilt({ className, children }: PointerTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useScrollMotionEnabled();

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !window.matchMedia("(pointer: fine)").matches) return;
    // Track the pointer over the whole hero, not only over this box.
    const area = el.closest("section") ?? el;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = area.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width) * 2 - 1;
      const y = ((event.clientY - box.top) / box.height) * 2 - 1;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--tilt-x", Math.max(-1, Math.min(1, x)).toFixed(3));
        el.style.setProperty("--tilt-y", Math.max(-1, Math.min(1, y)).toFixed(3));
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty("--tilt-x", "0");
      el.style.setProperty("--tilt-y", "0");
    };
    area.addEventListener("pointermove", onMove as EventListener, { passive: true });
    area.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener("pointermove", onMove as EventListener);
      area.removeEventListener("pointerleave", onLeave);
      el.style.removeProperty("--tilt-x");
      el.style.removeProperty("--tilt-y");
    };
  }, [enabled]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export { PointerTilt };
