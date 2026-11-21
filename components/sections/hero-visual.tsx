import { ParallaxLayer } from "@/components/motion/parallax-layer";
import { PixelIcon } from "@/components/pixel/pixel-icon";
import { cn } from "@/lib/utils";

// FR-HERO-02: CSS/SVG scene, no raster image (the H1 stays the LCP element).
// Parallax layers (PRD 7): L0 grid 0.15, L1 ASCII/binary 0.35, L3 sprites 1.15.
// Entirely decorative: aria-hidden.

// Plain ASCII only: box-drawing glyphs are outside the Latin font subset and fall
// back to a font with different widths, which breaks the alignment.
const DIAGRAM = [
  "+-------+    +---------+    +--------+",
  "| INPUT |--->| PROCESS |--->| OUTPUT |",
  "+-------+    +---------+    +--------+",
].join("\n");

const BINARY = ["01001001 01001110", "01010000 01010101", "01010100 00100000"];

function HeroVisual({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-panel border-green-dim relative isolate aspect-[5/4] w-full overflow-hidden border-2 select-none",
        className,
      )}
    >
      {/* L0 — pixel grid, speed 0.15. Taller than the frame so moving down leaves no gap. */}
      <ParallaxLayer speed={0.15} layer="L0" className="absolute inset-x-0 -top-32 bottom-0 -z-10">
        <svg className="text-green-dim/35 size-full">
          <defs>
            <pattern id="hero-grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </ParallaxLayer>

      {/* L1 — faint binary fragments and the ASCII process diagram, speed 0.35 */}
      <ParallaxLayer speed={0.35} layer="L1" className="absolute inset-0">
        <div className="text-green-dim/50 absolute top-4 right-4 flex flex-col items-end font-mono text-[10px] leading-4">
          {BINARY.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-2">
          <pre className="text-green xs:text-[10px] font-mono text-[9px] leading-tight sm:text-xs lg:text-[11px] xl:text-xs">
            {DIAGRAM}
          </pre>
        </div>
      </ParallaxLayer>

      {/* L3 — pixel sprites, speed 1.15 (near layer, moves ahead of the scroll) */}
      <ParallaxLayer speed={1.15} layer="L3" className="absolute inset-0">
        <div className="text-green absolute top-5 left-5">
          <PixelIcon name="cursor" size={24} />
        </div>
        <div className="text-amber absolute bottom-6 left-8">
          <PixelIcon name="floppy" size={32} />
        </div>
        <div className="text-green-dim absolute top-1/4 right-10 hidden sm:block">
          <PixelIcon name="gear" size={24} />
        </div>
        <div className="text-green absolute right-6 bottom-6">
          <PixelIcon name="arrow" size={24} />
        </div>
      </ParallaxLayer>
    </div>
  );
}

export { HeroVisual };
