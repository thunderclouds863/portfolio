import { hasTodo, todoMessage } from "@/lib/schema";
import { cn } from "@/lib/utils";

import { Missing } from "./missing";

type ValProps = {
  /** Content value from Keystatic. */
  value: string | null | undefined;
  /** What is needed if the value is empty, e.g. "start month (IN-02)". */
  what: string;
  /** Always show `what` instead of the TODO text (for tight spots like the H1). */
  short?: boolean;
};

/**
 * Renders a content string, or an amber MISSING marker when it is empty or
 * still a TODO(content) placeholder. Published content never reaches this
 * state (the build gate rejects it); it only appears for drafts in dev.
 */
function Val({ value, what, short = false }: ValProps) {
  if (!value || !value.trim()) return <Missing what={what} />;
  if (hasTodo(value)) return <Missing what={short ? what : todoMessage(value)} />;
  return <>{value}</>;
}

/** True when a value can be shown as real content. */
export function isFilled(value: string | null | undefined): value is string {
  return !!value && !!value.trim() && !hasTodo(value);
}

/** Labels unpublished entries in the development draft preview. */
function DraftBadge({ show, className }: { show: boolean; className?: string }) {
  if (!show) return null;
  return (
    <span
      className={cn(
        "border-yellow text-yellow inline-block border border-dashed px-1.5 font-mono text-xs uppercase",
        className,
      )}
    >
      Draft
    </span>
  );
}

export { DraftBadge, Val };
