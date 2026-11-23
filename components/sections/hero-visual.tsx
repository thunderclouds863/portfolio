import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { ParallaxLayer } from "@/components/motion/parallax-layer";
import { PointerTilt } from "@/components/motion/pointer-tilt";
import { TypeLog } from "@/components/motion/type-log";
import { PixelIcon } from "@/components/pixel/pixel-icon";
import { cn } from "@/lib/utils";

import photo from "../../public/images/profile/desi-armanda-sari.jpg";

// Hero visual: Desi's real photo (owner override 2, docs/decisions/0002) with
// the PRD 7 parallax layers around and in front of it. By depth:
//   L0 pixel grid inside the frame   scroll 0.15, tilt 2px
//   photo (content)                  never moves
//   L1 binary columns + scanlines    scroll 0.35, tilt 4px
//   L3 sprites + typing log          scroll 1.15, tilt 6px (PRD max), they
//                                    overlap the frame edge for visible depth
// Decorative layers are aria-hidden; the photo has alt text.

const BINARY = ["01000100", "01000101", "01010011", "01001001", "00100000", "01000001"];

// FR-HERO-02 / Phase 3: the ASCII Input -> Process -> Output diagram. Plain ASCII:
// box-drawing glyphs fall outside the font subset and break the alignment.
const DIAGRAM = [
  "+-------+    +---------+    +--------+",
  "| INPUT |--->| PROCESS |--->| OUTPUT |",
  "+-------+    +---------+    +--------+",
].join("\n");

// Decorative terminal log (types once on load). Generic, no claims.
const LOG = [
  { text: "$ whoami", tone: "prompt" },
  { text: "desi --role system-analyst", tone: "output" },
  { text: "$ map --process as-is", tone: "prompt" },
  { text: "$ build --system && verify", tone: "prompt" },
  { text: "ok: ready to ship", tone: "ok" },
] as const;

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
    <PointerTilt className={cn("relative w-full px-4 pb-10 sm:px-6", className)}>
      {/* The framed photo. */}
      <div className="bg-panel border-green shadow-pixel relative isolate aspect-[4/5] w-full overflow-hidden border-2">
        {/* Title bar (decorative), like the terminal frames elsewhere. */}
        <div
          aria-hidden="true"
          className="border-green-dim text-green-dim bg-panel absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b-2 px-3 py-1.5 font-mono text-[11px]"
        >
          <span>{"> open portrait.jpg"}</span>
          <span>[_][o][x]</span>
        </div>

        {/* L0 — pixel grid behind the photo's light wall, seen through the tint. */}
        <ParallaxLayer
          speed={0.15}
          layer="L0"
          className="absolute inset-x-0 -top-32 bottom-0 -z-10"
        >
          <Tilt depth={2} className="size-full">
            <svg aria-hidden="true" className="text-green-dim/60 size-full">
              <defs>
                <pattern id="hero-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>
          </Tilt>
        </ParallaxLayer>

        {/* The photo: content, so it never moves. Slightly see-through and
            colour-tinted so the grid and theme read through the light wall. */}
        <Image
          src={photo}
          alt="Portrait of Desi Armanda Sari"
          preload
          fetchPriority="high"
          sizes="(min-width: 1200px) 440px, (min-width: 1024px) 38vw, 90vw"
          className="hero-photo absolute inset-0 size-full object-cover object-[50%_30%]"
        />
        <div aria-hidden="true" className="hero-photo-tint absolute inset-0" />

        {/* L1 — binary columns and CRT scanlines over the photo edges. */}
        <ParallaxLayer
          speed={0.35}
          layer="L1"
          className="pointer-events-none absolute inset-0 z-10"
        >
          <Tilt depth={4} className="size-full">
            <div aria-hidden="true" className="relative size-full font-mono">
              <div className="text-green absolute top-[42%] right-3 flex flex-col items-end gap-1 text-[10px] leading-4">
                {BINARY.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
            </div>
          </Tilt>
        </ParallaxLayer>
        <div aria-hidden="true" className="hero-photo-scanlines absolute inset-0 z-20" />
      </div>

      {/* L3 — near layer, outside the frame's clip so it overlaps the edges. */}
      <ParallaxLayer speed={1.15} layer="L3" className="pointer-events-none absolute inset-0 z-40">
        <Tilt depth={6} className="size-full">
          <div className="relative size-full">
            {/* The process diagram on its own panel (contrast), over the top-right edge. */}
            <div
              aria-hidden="true"
              className="bg-panel border-green-dim absolute top-12 right-0 border-2 font-mono"
            >
              <div className="border-green-dim text-green-dim border-b-2 px-2 py-0.5 text-[10px]">
                process.map
              </div>
              <pre className="text-green px-2 py-1.5 text-[8px] leading-tight sm:text-[9px]">
                {DIAGRAM}
              </pre>
            </div>
            <TypeLog lines={LOG} className="absolute bottom-0 left-0 w-[min(17rem,78%)]" />
            <div aria-hidden="true" className="text-amber absolute top-10 left-0">
              <PixelIcon name="floppy" size={32} />
            </div>
            <div aria-hidden="true" className="text-green absolute top-1/3 right-0">
              <PixelIcon name="gear" size={24} />
            </div>
            <div aria-hidden="true" className="text-green absolute right-2 bottom-16">
              <PixelIcon name="arrow" size={24} />
            </div>
          </div>
        </Tilt>
      </ParallaxLayer>
    </PointerTilt>
  );
}

export { HeroVisual };
