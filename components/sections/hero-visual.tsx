import { PixelIcon } from "@/components/pixel/pixel-icon";
import { cn } from "@/lib/utils";

// FR-HERO-02: CSS/SVG scene, no raster image (the H1 stays the LCP element).
// Layers are marked for Phase 4 parallax: L0 grid, L1 ASCII/binary, L3 sprites.
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
      {/* L0 — pixel grid */}
      <svg data-layer="L0" className="text-green-dim/35 absolute inset-0 -z-10 size-full">
        <defs>
          <pattern id="hero-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      {/* L1 — faint binary fragments, away from the diagram */}
      <div
        data-layer="L1"
        className="text-green-dim/50 absolute top-4 right-4 flex flex-col items-end font-mono text-[10px] leading-4"
      >
        {BINARY.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>

      {/* L1 — ASCII process diagram */}
      <div data-layer="L1" className="absolute inset-0 flex items-center justify-center px-2">
        <pre className="text-green xs:text-[10px] font-mono text-[9px] leading-tight sm:text-xs lg:text-[11px] xl:text-xs">
          {DIAGRAM}
        </pre>
      </div>

      {/* L3 — pixel sprites (placeholders; parallax in Phase 4) */}
      <div data-layer="L3" className="text-green absolute top-5 left-5">
        <PixelIcon name="cursor" size={24} />
      </div>
      <div data-layer="L3" className="text-amber absolute bottom-6 left-8">
        <PixelIcon name="floppy" size={32} />
      </div>
      <div data-layer="L3" className="text-green-dim absolute top-1/4 right-10 hidden sm:block">
        <PixelIcon name="gear" size={24} />
      </div>
      <div data-layer="L3" className="text-green absolute right-6 bottom-6">
        <PixelIcon name="arrow" size={24} />
      </div>
    </div>
  );
}

export { HeroVisual };
