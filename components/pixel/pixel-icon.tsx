import { cn } from "@/lib/utils";

import { pixelIcons, toRects, type PixelIconName } from "./pixel-icons";

type PixelIconProps = {
  name: PixelIconName;
  /** Rendered size in px; multiples of 16 keep pixels crisp. */
  size?: 16 | 24 | 32 | 48 | 64;
  /** Accessible name. Omit for decorative use (aria-hidden). */
  label?: string;
  className?: string;
};

// Custom 16×16 pixel SVG icons; colour comes from currentColor.
function PixelIcon({ name, size = 16, label, className }: PixelIconProps) {
  const rects = toRects(pixelIcons[name]);
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="currentColor"
      shapeRendering="crispEdges"
      className={cn("shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      focusable="false"
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.width} height={1} />
      ))}
    </svg>
  );
}

export { PixelIcon };
export type { PixelIconName };
