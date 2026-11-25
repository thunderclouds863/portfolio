import {
  Activity,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Cloud,
  Code2,
  Cpu,
  Database,
  FileSpreadsheet,
  Gauge,
  GitBranch,
  HardDrive,
  Layers,
  Search,
  Server,
  Sparkles,
  Terminal,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { TechIconKey } from "@/lib/skills-taxonomy";
import { cn } from "@/lib/utils";

/**
 * Monochrome brand SVG paths (24x24 viewBox) for core technologies where a
 * clean, recognizable geometric mark fits the retro terminal design tokens.
 * Rendered in currentColor with zero external network dependencies.
 */
const BRAND_PATHS: Partial<Record<TechIconKey, string>> = {
  // Python intertwined dual-head mark (simplified monochrome)
  python:
    "M12 2c-3.5 0-3.3 1.5-3.3 1.5V5.5h3.4v.7H7.2S4 5.9 4 9.7c0 3.7 2.8 3.6 2.8 3.6h1.7v-1.7s-.1-2.8 2.7-2.8h4.6s2.6 0 2.6-2.5V4.4S18.8 2 12 2zm-1.8 1.5a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zM12 22c3.5 0 3.3-1.5 3.3-1.5v-2h-3.4v-.7h4.9s3.2.3 3.2-3.5c0-3.7-2.8-3.6-2.8-3.6h-1.7v1.7s.1 2.8-2.7 2.8H8.2s-2.6 0-2.6 2.5v1.9S5.2 22 12 22zm1.8-1.5a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z",
  // Node.js hexagon mark
  nodejs: "M12 2 3.5 7v10L12 22l8.5-5V7L12 2zm0 2.3 6.5 3.8v7.8L12 19.7l-6.5-3.8V8.1L12 4.3z",
  // Tailwind CSS twin wave mark
  tailwind:
    "M12 6c-2.7 0-4.3 1.3-5 4 1-1.3 2.2-1.8 3.5-1.5.8.2 1.3.7 1.9 1.3C13.4 10.8 14.6 12 17 12c2.7 0 4.3-1.3 5-4-1 1.3-2.2 1.8-3.5 1.5-.8-.2-1.3-.7-1.9-1.3C15.6 7.2 14.4 6 12 6zM7 12c-2.7 0-4.3 1.3-5 4 1-1.3 2.2-1.8 3.5-1.5.8.2 1.3.7 1.9 1.3C8.4 16.8 9.6 18 12 18c2.7 0 4.3-1.3 5-4-1 1.3-2.2 1.8-3.5 1.5-.8-.2-1.3-.7-1.9-1.3C10.6 13.2 9.4 12 7 12z",
  // Streamlit crown/signal mark
  streamlit: "M12 4 15.5 13 21 9l-2.5 10h-13L3 9l5.5 4L12 4z",
};

const LUCIDE_MAP: Record<TechIconKey, LucideIcon> = {
  python: Code2,
  javascript: Code2,
  php: Terminal,
  nodejs: Server,
  express: Server,
  nestjs: Layers,
  streamlit: Sparkles,
  django: Boxes,
  tailwind: Layers,
  excel: FileSpreadsheet,
  pandas: BarChart3,
  powerbi: BarChart3,
  ml: Sparkles,
  analytics: Activity,
  postgresql: Database,
  mysql: Database,
  storage: HardDrive,
  cloudflare: Cloud,
  workflow: Workflow,
  requirements: ClipboardList,
  gap: Search,
  rca: GitBranch,
  workload: Users,
  rad: Zap,
  uat: CheckCircle2,
  k6: Gauge,
  arduino: Cpu,
  odoo: Boxes,
  visio: Workflow,
  automate: Zap,
  hris: Users,
  simulation: Activity,
  generic: Terminal,
};

function TechIcon({ icon, className }: { icon: TechIconKey; className?: string }) {
  const path = BRAND_PATHS[icon];
  if (path) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        data-tech-icon={icon}
        className={cn("size-4 shrink-0", className)}
      >
        <path d={path} />
      </svg>
    );
  }
  const Icon = LUCIDE_MAP[icon] ?? Terminal;
  return (
    <Icon aria-hidden="true" data-tech-icon={icon} className={cn("size-4 shrink-0", className)} />
  );
}

export { TechIcon };
