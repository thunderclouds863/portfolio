"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  as?: ElementType;
  /** Stagger direct children 80ms apart (max 6; the rest appear together). */
  stagger?: boolean;
  className?: string;
  children: ReactNode;
  [key: `aria-${string}`]: string | undefined;
};

/**
 * Reveal on first entry into the viewport (PRD section 7): opacity 0→1 +
 * translateY 16→0px, 420ms ease-out, once. Styles live in app/globals.css.
 *
 * Content is server-rendered VISIBLE. Only after hydration, and only for
 * elements that are still below the viewport, is it hidden and then revealed
 * by IntersectionObserver — so it stays visible without JavaScript, under
 * reduced motion, and if this script fails. Works on all viewports.
 */
function Reveal({ as: Comp = "div", stagger = false, className, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { top } = el.getBoundingClientRect();
    if (top < window.innerHeight) return; // already on screen: never hide it

    el.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.dataset.reveal = "shown";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Comp
      ref={ref}
      className={className}
      {...(stagger ? { "data-reveal-stagger": "" } : {})}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export { Reveal };
