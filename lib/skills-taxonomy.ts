import type { ProjectView, SkillView } from "./views";

export type TechIconKey =
  | "python"
  | "javascript"
  | "php"
  | "nodejs"
  | "express"
  | "nestjs"
  | "streamlit"
  | "django"
  | "tailwind"
  | "excel"
  | "pandas"
  | "powerbi"
  | "ml"
  | "analytics"
  | "postgresql"
  | "mysql"
  | "storage"
  | "cloudflare"
  | "workflow"
  | "requirements"
  | "gap"
  | "rca"
  | "workload"
  | "rad"
  | "uat"
  | "k6"
  | "arduino"
  | "odoo"
  | "visio"
  | "automate"
  | "hris"
  | "simulation"
  | "generic";

export type TaxonomyCategoryKey =
  | "languages_frameworks"
  | "data_analytics"
  | "databases_storage"
  | "analysis_process"
  | "testing_performance"
  | "platforms_iot_simulation";

export type TaxonomySkillItem = {
  id: string;
  name: string;
  kind:
    | "language"
    | "framework"
    | "database"
    | "storage"
    | "analytics"
    | "methodology"
    | "platform"
    | "testing"
    | "iot";
  category: TaxonomyCategoryKey;
  level: "daily" | "project" | "learning" | "unset";
  icon: TechIconKey;
  /** Published project slugs where this technology/skill is factually evidenced. */
  evidenceSlugs: string[];
  isDraft: boolean;
};

export type SkillCategoryView = {
  key: TaxonomyCategoryKey;
  label: string;
  description: string;
  items: TaxonomySkillItem[];
};

export const TAXONOMY_CATEGORIES: readonly {
  key: TaxonomyCategoryKey;
  label: string;
  description: string;
}[] = [
  {
    key: "analysis_process",
    label: "Business Analysis & Process Improvement",
    description: "Requirements analysis, process mapping, root-cause analysis, and UAT",
  },
  {
    key: "languages_frameworks",
    label: "Programming Languages & Frameworks",
    description: "Backend, full-stack web applications, and rapid internal tools",
  },
  {
    key: "data_analytics",
    label: "Data & Analytics",
    description: "Reporting, BI dashboards, spreadsheet automation, and text analytics",
  },
  {
    key: "databases_storage",
    label: "Databases & Storage",
    description: "Relational schemas, query design, and object storage",
  },
  {
    key: "testing_performance",
    label: "Testing & Performance",
    description: "Load, stress, and soak verification for web backends",
  },
  {
    key: "platforms_iot_simulation",
    label: "Platforms, IoT & Simulation",
    description: "ERP, HRIS, workflow automation, industrial simulation, and IoT hardware",
  },
];

type CanonicalRule = {
  matchSlugs?: readonly string[];
  matchStackTokens?: readonly string[];
  id: string;
  name: string;
  kind: TaxonomySkillItem["kind"];
  category: TaxonomyCategoryKey;
  icon: TechIconKey;
  defaultLevel: "daily" | "project" | "learning";
};

/**
 * Evidence-based canonical taxonomy rules.
 * Separates languages vs frameworks, databases vs analytics, and tools vs methodologies.
 * Only technologies backed by published CMS skills or published project stacks are emitted.
 */
const CANONICAL_RULES: readonly CanonicalRule[] = [
  // Business Analysis & Process Improvement
  {
    id: "business-process-mapping",
    name: "Business Process Mapping",
    kind: "methodology",
    category: "analysis_process",
    icon: "workflow",
    defaultLevel: "daily",
    matchSlugs: ["business-process-mapping"],
  },
  {
    id: "requirements-analysis",
    name: "Requirements Analysis",
    kind: "methodology",
    category: "analysis_process",
    icon: "requirements",
    defaultLevel: "daily",
    matchSlugs: ["requirements-analysis"],
  },
  {
    id: "gap-analysis",
    name: "Gap Analysis",
    kind: "methodology",
    category: "analysis_process",
    icon: "gap",
    defaultLevel: "daily",
    matchSlugs: ["gap-analysis"],
  },
  {
    id: "root-cause-analysis-tbp",
    name: "Root Cause Analysis (TBP)",
    kind: "methodology",
    category: "analysis_process",
    icon: "rca",
    defaultLevel: "daily",
    matchSlugs: ["root-cause-analysis-tbp"],
  },
  {
    id: "workload-analysis",
    name: "Workload Analysis",
    kind: "methodology",
    category: "analysis_process",
    icon: "workload",
    defaultLevel: "daily",
    matchSlugs: ["workload-analysis"],
  },
  {
    id: "rad",
    name: "Rapid Application Development (RAD)",
    kind: "methodology",
    category: "analysis_process",
    icon: "rad",
    defaultLevel: "daily",
    matchSlugs: ["rad"],
  },
  {
    id: "uat",
    name: "User Acceptance Testing (UAT)",
    kind: "methodology",
    category: "analysis_process",
    icon: "uat",
    defaultLevel: "daily",
    matchSlugs: ["uat"],
  },

  // Programming Languages & Frameworks (languages clearly separated from frameworks)
  {
    id: "python",
    name: "Python",
    kind: "language",
    category: "languages_frameworks",
    icon: "python",
    defaultLevel: "project",
    matchSlugs: ["python-and-streamlit"],
    matchStackTokens: ["python"],
  },
  {
    id: "javascript-html-css",
    name: "HTML / CSS / JavaScript",
    kind: "language",
    category: "languages_frameworks",
    icon: "javascript",
    defaultLevel: "project",
    matchStackTokens: ["html/javascript", "html/css/javascript"],
  },
  {
    id: "php",
    name: "PHP",
    kind: "language",
    category: "languages_frameworks",
    icon: "php",
    defaultLevel: "project",
    matchSlugs: ["php"],
    matchStackTokens: ["php"],
  },
  {
    id: "nodejs",
    name: "Node.js",
    kind: "platform",
    category: "languages_frameworks",
    icon: "nodejs",
    defaultLevel: "project",
    matchSlugs: ["nodejs-and-express"],
    matchStackTokens: ["node.js"],
  },
  {
    id: "express",
    name: "Express.js",
    kind: "framework",
    category: "languages_frameworks",
    icon: "express",
    defaultLevel: "project",
    matchSlugs: ["nodejs-and-express"],
    matchStackTokens: ["express"],
  },
  {
    id: "nestjs",
    name: "NestJS",
    kind: "framework",
    category: "languages_frameworks",
    icon: "nestjs",
    defaultLevel: "project",
    matchStackTokens: ["nestjs"],
  },
  {
    id: "streamlit",
    name: "Streamlit",
    kind: "framework",
    category: "languages_frameworks",
    icon: "streamlit",
    defaultLevel: "project",
    matchSlugs: ["python-and-streamlit"],
    matchStackTokens: ["streamlit"],
  },
  {
    id: "django",
    name: "Django",
    kind: "framework",
    category: "languages_frameworks",
    icon: "django",
    defaultLevel: "project",
    matchStackTokens: ["django"],
  },
  {
    id: "tailwind-css",
    name: "Tailwind CSS",
    kind: "framework",
    category: "languages_frameworks",
    icon: "tailwind",
    defaultLevel: "project",
    matchStackTokens: ["tailwind css"],
  },

  // Data & Analytics
  {
    id: "excel-advanced",
    name: "Excel Advanced (VBA, Power Query, Pivot Tables)",
    kind: "analytics",
    category: "data_analytics",
    icon: "excel",
    defaultLevel: "daily",
    matchSlugs: ["excel-advanced-vba-power-query-pivot-tables"],
  },
  {
    id: "pandas",
    name: "Pandas",
    kind: "framework",
    category: "data_analytics",
    icon: "pandas",
    defaultLevel: "project",
    matchSlugs: ["python-pandas"],
    matchStackTokens: ["pandas"],
  },
  {
    id: "power-bi",
    name: "Power BI",
    kind: "analytics",
    category: "data_analytics",
    icon: "powerbi",
    defaultLevel: "project",
    matchSlugs: ["power-bi"],
    matchStackTokens: ["power bi"],
  },
  {
    id: "scikit-learn-tfidf",
    name: "scikit-learn (TF-IDF / Text QA)",
    kind: "analytics",
    category: "data_analytics",
    icon: "ml",
    defaultLevel: "project",
    matchStackTokens: ["scikit-learn (tf-idf)"],
  },
  {
    id: "forecasting-variance",
    name: "Forecasting & Variance Analysis",
    kind: "methodology",
    category: "data_analytics",
    icon: "analytics",
    defaultLevel: "project",
    matchSlugs: ["forecasting-and-variance-analysis"],
  },

  // Databases & Storage
  {
    id: "postgresql",
    name: "PostgreSQL",
    kind: "database",
    category: "databases_storage",
    icon: "postgresql",
    defaultLevel: "project",
    matchSlugs: ["sql-postgresql-mysql"],
    matchStackTokens: ["postgresql"],
  },
  {
    id: "mysql",
    name: "MySQL",
    kind: "database",
    category: "databases_storage",
    icon: "mysql",
    defaultLevel: "project",
    matchSlugs: ["sql-postgresql-mysql"],
    matchStackTokens: ["mysql"],
  },
  {
    id: "supabase-storage",
    name: "Supabase Storage",
    kind: "storage",
    category: "databases_storage",
    icon: "storage",
    defaultLevel: "project",
    matchStackTokens: ["supabase storage"],
  },
  {
    id: "cloudflare-r2",
    name: "Cloudflare R2",
    kind: "storage",
    category: "databases_storage",
    icon: "cloudflare",
    defaultLevel: "project",
    matchStackTokens: ["cloudflare r2"],
  },

  // Testing & Performance
  {
    id: "k6",
    name: "k6 (Load & Soak Testing)",
    kind: "testing",
    category: "testing_performance",
    icon: "k6",
    defaultLevel: "project",
    matchStackTokens: ["k6"],
  },

  // Platforms, IoT & Simulation
  {
    id: "arduino-mkr-wifi-1010",
    name: "Arduino MKR Wi-Fi 1010 (IoT)",
    kind: "iot",
    category: "platforms_iot_simulation",
    icon: "arduino",
    defaultLevel: "project",
    matchStackTokens: ["arduino mkr wi-fi 1010", "arduino mkr wifi 1010"],
  },
  {
    id: "odoo-erp",
    name: "Odoo ERP",
    kind: "platform",
    category: "platforms_iot_simulation",
    icon: "odoo",
    defaultLevel: "project",
    matchSlugs: ["odoo-erp"],
  },
  {
    id: "microsoft-visio",
    name: "Microsoft Visio",
    kind: "platform",
    category: "platforms_iot_simulation",
    icon: "visio",
    defaultLevel: "project",
    matchSlugs: ["microsoft-visio"],
  },
  {
    id: "power-automate",
    name: "Power Automate",
    kind: "platform",
    category: "platforms_iot_simulation",
    icon: "automate",
    defaultLevel: "project",
    matchSlugs: ["power-automate"],
  },
  {
    id: "pro-int-hris",
    name: "Pro-Int HRIS",
    kind: "platform",
    category: "platforms_iot_simulation",
    icon: "hris",
    defaultLevel: "project",
    matchSlugs: ["pro-int-hris"],
  },
  {
    id: "extendsim",
    name: "ExtendSim",
    kind: "platform",
    category: "platforms_iot_simulation",
    icon: "simulation",
    defaultLevel: "project",
    matchSlugs: ["extendsim"],
  },
  {
    id: "flexsim",
    name: "FlexSim",
    kind: "platform",
    category: "platforms_iot_simulation",
    icon: "simulation",
    defaultLevel: "project",
    matchSlugs: ["flexsim"],
  },
];

/**
 * Builds the deduplicated, evidence-backed skills taxonomy from live CMS skills and
 * published projects. Any newly added CMS skill that does not match a canonical rule
 * is preserved automatically under the closest category so CMS edits always appear.
 */
export function buildSkillTaxonomy(
  skills: readonly SkillView[],
  projects: readonly ProjectView[],
): SkillCategoryView[] {
  const publishedProjects = projects.filter((p) => !p.isDraft);
  const publishedSlugSet = new Set(publishedProjects.map((p) => p.slug));
  const skillBySlug = new Map(skills.map((s) => [s.slug, s]));
  const consumedSkillSlugs = new Set<string>();
  const grouped = new Map<TaxonomyCategoryKey, TaxonomySkillItem[]>();

  for (const cat of TAXONOMY_CATEGORIES) grouped.set(cat.key, []);

  for (const rule of CANONICAL_RULES) {
    const matchedSkills = (rule.matchSlugs ?? [])
      .map((s) => skillBySlug.get(s))
      .filter((s): s is SkillView => Boolean(s));
    matchedSkills.forEach((s) => consumedSkillSlugs.add(s.slug));

    const stackTokens = new Set((rule.matchStackTokens ?? []).map((t) => t.toLowerCase()));
    const matchedProjectSlugs = new Set<string>();

    // Collect explicit CMS evidence (only published projects).
    for (const s of matchedSkills) {
      for (const ev of s.evidence) {
        if (ev && publishedSlugSet.has(ev)) matchedProjectSlugs.add(ev);
      }
    }
    // Collect factual matches from published project stack arrays.
    if (stackTokens.size > 0) {
      for (const p of publishedProjects) {
        if (p.stack.some((token) => stackTokens.has(token.toLowerCase()))) {
          matchedProjectSlugs.add(p.slug);
        }
      }
    }

    // Emit item only if backed by a CMS skill entry OR at least one published project stack.
    if (matchedSkills.length === 0 && matchedProjectSlugs.size === 0) continue;

    const cmsSkill = matchedSkills[0];
    grouped.get(rule.category)!.push({
      id: rule.id,
      name: rule.name,
      kind: rule.kind,
      category: rule.category,
      level: cmsSkill ? cmsSkill.level : rule.defaultLevel,
      icon: rule.icon,
      evidenceSlugs: [...matchedProjectSlugs],
      isDraft: matchedSkills.length > 0 && matchedSkills.every((s) => s.isDraft),
    });
  }

  // Preserve any future CMS skill added via Keystatic that isn't in CANONICAL_RULES yet.
  const fallbackCategory: Record<string, TaxonomyCategoryKey> = {
    analysis_modeling: "analysis_process",
    development: "languages_frameworks",
    data_automation: "data_analytics",
    tools: "platforms_iot_simulation",
    unset: "platforms_iot_simulation",
  };

  for (const skill of skills) {
    if (consumedSkillSlugs.has(skill.slug)) continue;
    const cat = fallbackCategory[skill.group] ?? "platforms_iot_simulation";
    grouped.get(cat)!.push({
      id: skill.slug,
      name: skill.name,
      kind: "platform",
      category: cat,
      level: skill.level,
      icon: "generic",
      evidenceSlugs: skill.evidence.filter((e): e is string => !!e && publishedSlugSet.has(e)),
      isDraft: skill.isDraft,
    });
  }

  return TAXONOMY_CATEGORIES.map((cat) => ({
    ...cat,
    items: grouped.get(cat.key) ?? [],
  })).filter((cat) => cat.items.length > 0);
}
