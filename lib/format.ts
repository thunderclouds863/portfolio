// UI labels for enum values and date formatting. Labels only — no personal content.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isYearMonth(value: string | null | undefined): value is string {
  return !!value && YEAR_MONTH.test(value);
}

/** "2025-06" → "Jun 2025". Returns null for anything that is not YYYY-MM. */
export function formatYearMonth(value: string | null | undefined): string | null {
  const match = value ? YEAR_MONTH.exec(value) : null;
  if (!match) return null;
  return `${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

export const scopeLabel: Record<string, string> = {
  owner: "Owner",
  core_team: "Core team",
  supporting: "Supporting role, not core team",
};

export const capabilityLabel: Record<string, string> = {
  system_analysis: "Analysis",
  process_improvement: "Process",
  system_development: "Development",
  data: "Data",
};

export const projectTypeLabel: Record<string, string> = {
  work: "Work",
  thesis: "Thesis",
  lab: "Lab",
  freelance: "Freelance",
  personal: "Personal",
};

export const levelLabel: Record<string, string> = {
  daily: "Daily use",
  project: "Project use",
  learning: "Learning",
};

// FR-STK-01 group names, in display order.
export const skillGroups = [
  { key: "analysis_modeling", label: "Analysis & Modeling" },
  { key: "development", label: "Development" },
  { key: "data_automation", label: "Data & Automation" },
  { key: "tools", label: "Tools" },
] as const;

export const workModeLabel: Record<string, string> = {
  on_site: "on-site",
  hybrid: "hybrid",
  remote: "remote",
};

/** ["a", "b", "c"] → "a, b or c". */
export function joinOr(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`;
}
