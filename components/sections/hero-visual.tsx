import type { CSSProperties, ReactNode } from "react";

import { ParallaxLayer } from "@/components/motion/parallax-layer";
import { PointerTilt } from "@/components/motion/pointer-tilt";
import { PixelIcon } from "@/components/pixel/pixel-icon";
import { cn } from "@/lib/utils";

import { PixelPortrait } from "./pixel-portrait";

// FR-HERO-02: the hero visual is CSS/SVG only (no raster image; the H1 stays the
// LCP element). PRD 7 layers, by depth:
//   L0 pixel grid      scroll 0.15, tilt 2px
//   L1 binary + ASCII  scroll 0.35, tilt 4px
//   L2 portrait        content: never moves
//   L3 pixel sprites   scroll 1.15, tilt 6px (the PRD maximum)
// Decorative layers are aria-hidden; the portrait has an accessible name.

// Plain ASCII only: box-drawing glyphs are outside the Latin font subset and fall
// back to a font with different widths, which breaks the alignment.
const DIAGRAM = [
  "+-------+    +---------+    +--------+",
  "| INPUT |--->| PROCESS |--->| OUTPUT |",
  "+-------+    +---------+    +--------+",
].join("\n");

const BINARY_LEFT = ["01000100", "01000101", "01010011", "01001001", "00100000", "01000001"];
const BINARY_RIGHT = ["01010011", "01011001", "01010011", "00101110", "01000001", "01001110"];

/** Inner wrapper that follows the pointer tilt by `depth` px (max 6). */
function Tilt({
  depth,
  className,
  children,
}: {
  depth: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("tilt-layer", className)} style={{ "--depth": depth } as CSSProperties}>
      {children}
    </div>
  );
}

function HeroVisual({ className }: { className?: string }) {
  return (
    <PointerTilt className={cn("relative w-full", className)}>
      <div className="bg-panel border-green shadow-pixel relative isolate aspect-square w-full overflow-hidden border-2 select-none">
        {/* Title bar (decorative), like the terminal frames elsewhere. */}
        <div
          aria-hidden="true"
          className="border-green-dim text-green-dim bg-panel absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 px-3 py-1.5 font-mono text-[11px]"
        >
          <span>{"> render portrait --pixel"}</span>
          <span>[_][o][x]</span>
        </div>

        {/* L0 — pixel grid. Taller than the frame so moving down leaves no gap. */}
        <ParallaxLayer
          speed={0.15}
          layer="L0"
          className="absolute inset-x-0 -top-32 bottom-0 -z-10"
        >
          <Tilt depth={2} className="size-full">
            <svg aria-hidden="true" className="text-green-dim/50 size-full">
              <defs>
                <pattern id="hero-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>
          </Tilt>
        </ParallaxLayer>

        {/* L1 — binary columns and the process diagram, behind the portrait. */}
        <ParallaxLayer speed={0.35} layer="L1" className="absolute inset-0 -z-[5]">
          <Tilt depth={4} className="size-full">
            <div aria-hidden="true" className="relative size-full font-mono">
              {/* Diagram in the band between the title bar and the head. */}
              <pre className="text-green absolute inset-x-0 top-11 text-center text-[9px] leading-tight sm:text-[10px]">
                {DIAGRAM}
              </pre>
              {/* Binary columns below the corner sprites, beside the shoulders. */}
              <div className="text-green-dim absolute top-[34%] left-3 flex flex-col gap-1 text-[10px] leading-4 opacity-80">
                {BINARY_LEFT.map((line, i) => (
                  <span key={`l${i}`}>{line}</span>
                ))}
              </div>
              <div className="text-green-dim absolute top-[34%] right-3 flex flex-col items-end gap-1 text-[10px] leading-4 opacity-80">
                {BINARY_RIGHT.map((line, i) => (
                  <span key={`r${i}`}>{line}</span>
                ))}
              </div>
            </div>
          </Tilt>
        </ParallaxLayer>

        {/* L2 — the portrait: content, so it never moves. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center">
          <PixelPortrait className="w-[78%]" />
        </div>

        {/* L3 — pixel sprites around the edges (never over the face). */}
        <ParallaxLayer speed={1.15} layer="L3" className="absolute inset-0 z-20">
          <Tilt depth={6} className="size-full">
            <div aria-hidden="true" className="relative size-full">
              <div className="text-green absolute top-12 left-4">
                <PixelIcon name="cursor" size={24} />
              </div>
              <div className="text-amber absolute bottom-6 left-4">
                <PixelIcon name="floppy" size={32} />
              </div>
              <div className="text-green absolute top-12 right-4 hidden sm:block">
                <PixelIcon name="gear" size={24} />
              </div>
              <div className="text-green absolute right-4 bottom-6">
                <PixelIcon name="arrow" size={24} />
              </div>
            </div>
          </Tilt>
        </ParallaxLayer>
      </div>
    </PointerTilt>
  );
}

export { HeroVisual };
