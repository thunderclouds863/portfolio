import Link from "next/link";

import { capabilityFilters, type FilterValue } from "@/lib/filters";
import { cn } from "@/lib/utils";

type FilterChipsProps = {
  active: FilterValue;
  /** Number of projects per filter value, plus "all". */
  counts: Record<FilterValue, number>;
};

/**
 * FR-PL-01 chips. Plain links (?capability=…), so they work without JS; the
 * selected one carries aria-current. `data-active-filter` drives the CSS that
 * hides non-matching projects (globals.css). No hooks: also used as the
 * Suspense fallback before the client reads the URL.
 */
function FilterChips({ active, counts }: FilterChipsProps) {
  const chips = [{ value: "all" as const, label: "All" }, ...capabilityFilters];
  const shown = counts[active] ?? 0;

  return (
    <div data-active-filter={active} className="flex flex-col gap-4">
      <nav aria-label="Filter projects by capability">
        <ul className="flex flex-wrap gap-3">
          {chips.map((chip) => {
            const current = chip.value === active;
            return (
              <li key={chip.value}>
                <Link
                  href={chip.value === "all" ? "/projects" : `/projects?capability=${chip.value}`}
                  scroll={false}
                  replace
                  aria-current={current ? "true" : undefined}
                  className={cn(
                    "text-label inline-flex min-h-11 items-center gap-2 border-2 px-4",
                    current
                      ? "border-amber text-amber"
                      : "border-green-dim text-green hover:border-green",
                  )}
                >
                  [ {chip.label} ]
                  <span className="text-meta text-muted normal-case">
                    {counts[chip.value] ?? 0}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <p role="status" className="text-meta text-muted">
        {shown === 0
          ? "No projects in this category yet."
          : `Showing ${shown} of ${counts.all} project${counts.all === 1 ? "" : "s"}.`}
      </p>
    </div>
  );
}

export { FilterChips };
