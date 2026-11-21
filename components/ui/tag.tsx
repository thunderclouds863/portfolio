import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// [ TAG ] — JetBrains Mono 12px, green-dim border (PRD section 6).
function Tag({ className, children, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="tag"
      className={cn(
        "border-green-dim text-muted inline-flex items-center gap-1 border px-1.5 py-1 font-mono text-xs leading-none uppercase",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true">[</span>
      {children}
      <span aria-hidden="true">]</span>
    </span>
  );
}

export { Tag };
