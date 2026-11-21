import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { controlClasses } from "./input";

function Textarea({ className, rows = 6, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(controlClasses, "min-h-32 resize-y", className)}
      {...props}
    />
  );
}

export { Textarea };
