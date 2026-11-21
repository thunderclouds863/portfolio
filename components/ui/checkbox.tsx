"use client";

import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// shadcn/ui Checkbox (Radix), restyled: 24px square target (WCAG 2.5.8), amber when checked.
function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "bg-panel border-green-dim flex size-6 shrink-0 items-center justify-center border-2",
        "data-[state=checked]:border-amber data-[state=checked]:bg-amber data-[state=checked]:text-bg",
        "aria-invalid:border-red",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator">
        <CheckIcon aria-hidden="true" className="size-4" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
