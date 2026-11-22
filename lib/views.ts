import type { Entry } from "@keystatic/core/reader";

import type keystaticConfig from "@/keystatic.config";

import { checkBody, isPublished, parsePublished, reader } from "./content";
import { collectText, extractHeadings, pruneTodoSections, type TocHeading } from "./markdoc";
import {
  EducationSchema,
  ExperienceSchema,
  ProfileSchema,
  ProjectSchema,
  SettingsSchema,
  RecommendationSchema,
  SkillSchema,
  hasTodo,
  todoMessage,
} from "./schema";

/*
 * View models for pages. Published entries are validated with the same Zod
 * contract as the build gate (lib/content.ts) and throw when invalid.
 * Draft entries are included ONLY in draft-preview mode (`npm run dev`), are
 * not validated, and carry isDraft: true so the UI can label them and show
 * their TODO fields as MISSING markers. Production never sees drafts.
 */

type Cfg = typeof keystaticConfig;
type Draftable = { isDraft: boolean };

export type ProfileView = Omit<Entry<Cfg["singletons"]["profile"]>, "status" | "about"> &
  Draftable & {
    /** Markdoc AST as JSON (cache-serializable); render with Markdoc.Ast.fromJSON. */
    aboutAst: string;
    /** The TODO message if the About text is still a placeholder. */
    aboutTodo: string | null;
  };
export type SettingsView = Omit<Entry<Cfg["singletons"]["settings"]>, "status"> & Draftable;
export type ProjectView = Omit<Entry<Cfg["collections"]["projects"]>, "status" | "body"> &
  Draftable & { slug: string };
export type ExperienceView = Omit<Entry<Cfg["collections"]["experience"]>, "status" | "entry"> &
  Draftable & { slug: string };
export type EducationView = Omit<Entry<Cfg["collections"]["education"]>, "status" | "entry"> &
  Draftable & { slug: string };
export type SkillView = Omit<Entry<Cfg["collections"]["skills"]>, "status"> &
  Draftable & { slug: string };
export type RecommendationView = Omit<Entry<Cfg["collections"]["recommendations"]>, "status"> &
  Draftable & { slug: string };

export type HomeData = {
  profile: ProfileView | null;
  settings: SettingsView | null;
  experience: ExperienceView[];
  education: EducationView[];
  /** All visible projects (for capability evidence links). */
  projects: ProjectView[];
  featuredProjects: ProjectView[];
  skills: SkillView[];
  /** LinkedIn recommendations (testimonial source A, PRD 17), newest first. */
  recommendations: RecommendationView[];
};

/** Draft preview is on in `next dev` unless CONTENT_DRAFT_PREVIEW=0. Never in builds. */
export function isDraftPreview(): boolean {
  return process.env.NODE_ENV === "development" && process.env.CONTENT_DRAFT_PREVIEW !== "0";
}

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const sortableMonth = (value: string | null | undefined, fallback: string) =>
  value && YEAR_MONTH.test(value) ? value : fallback;

async function visibleCollection<E extends { status: string }, V>(
  list: Promise<readonly { slug: string; entry: E }[]>,
  drafts: boolean,
  publish: (slug: string, entry: E) => V,
  draft: (slug: string, entry: E) => V,
): Promise<V[]> {
  const all = await list;
  return all
    .filter(({ entry }) => drafts || isPublished(entry))
    .map(({ slug, entry }) => (isPublished(entry) ? publish(slug, entry) : draft(slug, entry)));
}

/** Visible projects (published; plus drafts in preview), sorted by order then title. */
export async function loadProjects({ drafts }: { drafts: boolean }): Promise<ProjectView[]> {
  return (
    await visibleCollection(
      reader.collections.projects.all(),
      drafts,
      (slug, { status: _s, body: _b, ...data }) => {
        parsePublished(ProjectSchema, { slug, ...data }, `content/projects/${slug}`);
        return { slug, ...data, isDraft: false };
      },
      (slug, { status: _s, body: _b, ...data }) => ({ slug, ...data, isDraft: true }),
    )
  ).sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title));
}

export type CaseStudyView = {
  project: ProjectView;
  /** Markdoc body as AST JSON (cache-serializable). */
  bodyAst: string;
  headings: TocHeading[];
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

/** One case study with its body, TOC headings and prev/next neighbours. Null if not visible. */
export async function loadCaseStudy(
  slug: string,
  { drafts }: { drafts: boolean },
): Promise<CaseStudyView | null> {
  const projects = await loadProjects({ drafts });
  const index = projects.findIndex((p) => p.slug === slug);
  const project = projects[index];
  if (!project) return null;
  const entry = await reader.collections.projects.read(slug);
  if (!entry) return null;
  const { node: raw } = await entry.body();
  // Published: empty TODO sections are hidden (drafts keep their MISSING markers).
  const node = project.isDraft ? raw : pruneTodoSections(raw);
  if (!project.isDraft) checkBody(node, `content/projects/${slug} (body)`);
  const neighbour = (p: ProjectView | undefined) => (p ? { slug: p.slug, title: p.title } : null);
  return {
    project,
    bodyAst: JSON.stringify(node),
    headings: extractHeadings(node),
    prev: neighbour(projects[index - 1]),
    next: neighbour(projects[index + 1]),
  };
}

export async function loadHomeData({ drafts }: { drafts: boolean }): Promise<HomeData> {
  // Profile (with the About Markdoc body).
  let profile: ProfileView | null = null;
  const profileEntry = await reader.singletons.profile.read();
  if (profileEntry && (drafts || isPublished(profileEntry))) {
    const { status, about, ...data } = profileEntry;
    const published = status === "published";
    if (published) parsePublished(ProfileSchema, data, "content/profile");
    const { node } = await about();
    if (published) checkBody(node, "content/profile (about)");
    const todo = collectText(node).find(hasTodo);
    profile = {
      ...data,
      isDraft: !published,
      aboutAst: JSON.stringify(node),
      aboutTodo: todo ? todoMessage(todo) : null,
    };
  }

  let settings: SettingsView | null = null;
  const settingsEntry = await reader.singletons.settings.read();
  if (settingsEntry && (drafts || isPublished(settingsEntry))) {
    const { status, ...data } = settingsEntry;
    if (status === "published") parsePublished(SettingsSchema, data, "content/settings");
    settings = { ...data, isDraft: status !== "published" };
  }

  const projects = await loadProjects({ drafts });

  const experience = (
    await visibleCollection(
      reader.collections.experience.all(),
      drafts,
      (slug, { status: _s, entry: _e, ...data }) => {
        parsePublished(ExperienceSchema, { slug, ...data }, `content/experience/${slug}`);
        return { slug, ...data, isDraft: false };
      },
      (slug, { status: _s, entry: _e, ...data }) => ({ slug, ...data, isDraft: true }),
    )
  ).sort(
    (a, b) =>
      sortableMonth(b.end, "9999-12").localeCompare(sortableMonth(a.end, "9999-12")) ||
      sortableMonth(b.start, "0000-00").localeCompare(sortableMonth(a.start, "0000-00")),
  );

  const education = (
    await visibleCollection(
      reader.collections.education.all(),
      drafts,
      (slug, { status: _s, entry: _e, ...data }) => {
        parsePublished(EducationSchema, { slug, ...data }, `content/education/${slug}`);
        return { slug, ...data, isDraft: false };
      },
      (slug, { status: _s, entry: _e, ...data }) => ({ slug, ...data, isDraft: true }),
    )
  ).sort((a, b) => sortableMonth(b.end, "0000-00").localeCompare(sortableMonth(a.end, "0000-00")));

  const skills = (
    await visibleCollection(
      reader.collections.skills.all(),
      drafts,
      (slug, { status: _s, ...data }) => {
        parsePublished(
          SkillSchema,
          { slug, ...data, evidence: data.evidence.filter((e) => e !== null) },
          `content/skills/${slug}`,
        );
        return { slug, ...data, isDraft: false };
      },
      (slug, { status: _s, ...data }) => ({ slug, ...data, isDraft: true }),
    )
  ).sort((a, b) => a.name.localeCompare(b.name));

  const recommendations = (
    await visibleCollection(
      reader.collections.recommendations.all(),
      drafts,
      (slug, { status: _s, ...data }) => {
        parsePublished(RecommendationSchema, { slug, ...data }, `content/recommendations/${slug}`);
        return { slug, ...data, isDraft: false };
      },
      (slug, { status: _s, ...data }) => ({ slug, ...data, isDraft: true }),
    )
  ).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return {
    profile,
    settings,
    recommendations,
    experience,
    education,
    projects,
    featuredProjects: projects.filter((p) => p.featured).slice(0, 3),
    skills,
  };
}
