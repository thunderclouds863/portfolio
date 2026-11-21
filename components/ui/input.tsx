import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// Panel bg, 2px green-dim border; focus amber border + outline; error red border (PRD section 6).
export const controlClasses = [
  "bg-panel border-green-dim w-full border-2 px-3 py-2.5 text-base text-white",
  "placeholder:text-muted",
  "focus-visible:border-amber",
  "aria-invalid:border-red",
  "disabled:cursor-not-allowed disabled:opacity-50",
];

function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(controlClasses, "min-h-11", className)}
      {...props}
    />
  );
}

export { Input };
