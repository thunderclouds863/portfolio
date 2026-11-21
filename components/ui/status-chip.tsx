import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// "■ OPEN TO WORK" — yellow text, blinking square (static under reduced motion).
function StatusChip({ className, children, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="status-chip"
      className={cn(
        "text-label border-yellow text-yellow inline-flex items-center gap-2 border-2 px-3 py-2",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="animate-blink">
        {"■"}
      </span>
      {children}
    </p>
  );
}

export { StatusChip };
