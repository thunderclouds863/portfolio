import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { controlClasses } from "./input";

// Native <select> styled like the other controls. Used in forms that must work
// without JavaScript (PRD 7 hard rule 5); the Radix Select needs JS.
function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(controlClasses, "min-h-11 appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        className="text-green pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2"
      />
    </div>
  );
}

export { NativeSelect };
