import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge must know the custom utilities from app/globals.css; otherwise it
// reads `text-label` / `text-meta` as text colours and drops them next to `text-amber`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display-1", "display-2", "h3", "label", "meta"] }],
      shadow: [{ shadow: ["pixel", "pixel-hover", "pixel-amber"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
