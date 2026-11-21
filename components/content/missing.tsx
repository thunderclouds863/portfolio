import { cn } from "@/lib/utils";

type MissingProps = {
  /** What content is needed, e.g. "LinkedIn URL (IN-10)". */
  what: string;
  className?: string;
};

// Visible placeholder for content Desi has not confirmed yet (PRD 3A).
// Renders an amber "[ MISSING: … ]" marker everywhere except Vercel production;
// the Phase 2 content gate fails production builds that still contain TODO(content).
function Missing({ what, className }: MissingProps) {
  if (process.env.VERCEL_ENV === "production") return null;
  return (
    <span
      data-todo-content=""
      className={cn(
        "text-meta border-amber text-amber inline-block border border-dashed px-2",
        className,
      )}
    >
      [ MISSING: {what} ]
    </span>
  );
}

export { Missing };
