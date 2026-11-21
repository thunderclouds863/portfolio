// FR-PL-01 filter chips: Analysis / Process / Development / Data.
// The URL value (?capability=…) maps to the content model's capability key.
export const capabilityFilters = [
  { value: "analysis", label: "Analysis", key: "system_analysis" },
  { value: "process", label: "Process", key: "process_improvement" },
  { value: "development", label: "Development", key: "system_development" },
  { value: "data", label: "Data", key: "data" },
] as const;

export type FilterValue = (typeof capabilityFilters)[number]["value"] | "all";

export function parseFilter(raw: string | null | undefined): FilterValue {
  return capabilityFilters.some((f) => f.value === raw) ? (raw as FilterValue) : "all";
}

/** Space-separated filter values for a project, for the [data-caps~=…] CSS selector. */
export function filterValuesFor(capabilities: readonly string[]): string {
  return capabilityFilters
    .filter((f) => capabilities.includes(f.key))
    .map((f) => f.value)
    .join(" ");
}
