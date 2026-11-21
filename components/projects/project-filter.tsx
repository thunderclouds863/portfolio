"use client";

import { useSearchParams } from "next/navigation";

import { parseFilter, type FilterValue } from "@/lib/filters";

import { FilterChips } from "./filter-chips";

/** Reads ?capability= from the URL (filter state lives in the URL query, FR-PL-01). */
function ProjectFilter({ counts }: { counts: Record<FilterValue, number> }) {
  const active = parseFilter(useSearchParams().get("capability"));
  return <FilterChips active={active} counts={counts} />;
}

export { ProjectFilter };
