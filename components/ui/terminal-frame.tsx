import type { ComponentProps, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type TerminalFrameProps = {
  /** File-style title shown in the decorative bar, e.g. "about.txt". */
  title: string;
  /** Element to render as. Defaults to div. */
  as?: ElementType;
  /** 4px border for primary frames (PRD section 6). */
  thick?: boolean;
  children: ReactNode;
} & Omit<ComponentProps<"div">, "title" | "children">;

const RULE = "─".repeat(120);

// Terminal frame: panel background, green border, decorative title bar
// "┌─ about.txt ──── [_][□][x] ─┐" (aria-hidden, PRD section 6).
function TerminalFrame({
  title,
  as: Comp = "div",
  thick = false,
  className,
  children,
  ...props
}: TerminalFrameProps) {
  return (
    <Comp
      data-slot="terminal-frame"
      className={cn(
        "bg-panel border-green shadow-pixel",
        thick ? "border-4" : "border-2",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="text-meta border-green-dim text-green flex items-center gap-2 overflow-hidden border-b-2 px-3 py-1 whitespace-nowrap select-none"
      >
        <span>
          {"┌─"} {title}
        </span>
        {/* contain:inline-size gives the rule zero intrinsic width so it never widens the frame. */}
        <span className="text-green-dim min-w-0 flex-1 overflow-hidden [contain:inline-size]">
          {RULE}
        </span>
        <span>{"[_][□][x] ─┐"}</span>
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </Comp>
  );
}

export { TerminalFrame };
