"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export type RelationshipOption = { value: string; label: string; count: number };

type ChipsProps = { active: string; options: RelationshipOption[]; total: number };

/**
 * FR-TST-02 relationship chips (?relationship=…). Plain links, so they work
 * without JS. `data-active-relationship` drives the CSS that hides other items
 * (globals.css). No hooks here: also used as the Suspense fallback.
 */
function RelationshipChips({ active, options, total }: ChipsProps) {
  const chips = [{ value: "all", label: "All", count: total }, ...options];
  const shown = chips.find((c) => c.value === active)?.count ?? total;
  return (
    <div data-active-relationship={active} className="flex flex-col gap-4">
      <nav aria-label="Filter testimonials by relationship">
        <ul className="flex flex-wrap gap-3">
          {chips.map((chip) => {
            const current = chip.value === active;
            return (
              <li key={chip.value}>
                <Link
                  href={
                    chip.value === "all"
                      ? "/testimonials"
                      : `/testimonials?relationship=${chip.value}`
                  }
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
                  <span className="text-meta text-muted normal-case">{chip.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <p role="status" className="text-meta text-muted">
        Showing {shown} of {total} testimonial{total === 1 ? "" : "s"}.
      </p>
    </div>
  );
}

/** Reads ?relationship= from the URL; unknown values fall back to All. */
function RelationshipFilter({ options, total }: { options: RelationshipOption[]; total: number }) {
  const raw = useSearchParams().get("relationship");
  const active = options.some((o) => o.value === raw) ? raw! : "all";
  return <RelationshipChips active={active} options={options} total={total} />;
}

export { RelationshipChips, RelationshipFilter };
