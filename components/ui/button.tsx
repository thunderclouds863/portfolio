import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// PRD section 6 components: primary = amber fill, secondary = green outline.
// Only transform transitions; the shadow swaps instantly (transform/opacity-only motion rule).
const buttonVariants = cva(
  [
    "text-label inline-flex max-w-full shrink-0 items-center justify-center gap-2 border-2 text-center whitespace-normal select-none sm:whitespace-nowrap",
    "transition-transform duration-(--dur-fast) ease-pixel",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: [
          "border-amber bg-amber text-bg shadow-pixel",
          "hover:shadow-pixel-hover hover:-translate-x-0.5 hover:-translate-y-0.5",
          "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        ],
        secondary: [
          "border-green bg-transparent text-green",
          "hover:bg-panel active:translate-x-0.5 active:translate-y-0.5",
        ],
      },
      size: {
        default: "min-h-11 px-5 py-3.5",
        compact: "min-h-10 px-3 py-2.5",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a link) with button styles. */
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
