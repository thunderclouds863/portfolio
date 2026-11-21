import { existsSync } from "node:fs";
import path from "node:path";

import type { Node } from "@markdoc/markdoc";
import { createReader } from "@keystatic/core/reader";
import type { z } from "zod";

import keystaticConfig from "@/keystatic.config";

import { collectImageSources, collectText, validateMarkdoc } from "./markdoc";
import {
  EducationSchema,
  ExperienceSchema,
  ProfileSchema,
  ProjectSchema,
  RecommendationSchema,
  SettingsSchema,
  SkillSchema,
  findDuplicateSlugs,
  hasTodo,
  type Education,
  type Experience,
  type Profile,
  type Project,
  type Recommendation,
  type Settings,
  type Skill,
} from "./schema";

/*
 * Content loaders — PRD 18.4. Reads through the Keystatic Reader API, keeps
 * only Published entries, validates them with Zod and sorts them.
 * Any invalid published entry throws ContentValidationError, which fails the
 * page render and therefore the build. Drafts are never returned.
 */

const reader = createReader(process.cwd(), keystaticConfig);

export class ContentValidationError extends Error {
  constructor(
    public readonly where: string,
    public readonly issues: string[],
  ) {
    super(`Invalid published content in ${where}:\n  - ${issues.join("\n  - ")}`);
    this.name = "ContentValidationError";
  }
}

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message));
}

function parsePublished<T extends z.ZodType>(schema: T, data: unknown, where: string): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw new ContentValidationError(where, formatIssues(result.error));
  return result.data;
}

function checkBody(node: Node, where: string) {
  const issues = validateMarkdoc(node).map((e) => e.message);
  if (collectText(node).some(hasTodo)) issues.push("body still contains a TODO placeholder");
  if (issues.length) throw new ContentValidationError(where, issues);
}

const isPublished = (entry: { status: string }) => entry.status === "published";

// ── Singletons ──────────────────────────────────────────────────────────────

export type ProfileWithAbout = Profile & { about: Node };

export async function getProfile(): Promise<ProfileWithAbout | null> {
  const entry = await reader.singletons.profile.read();
  if (!entry || !isPublished(entry)) return null;
  const { status: _status, about, ...data } = entry;
  const profile = parsePublished(ProfileSchema, data, "content/profile");
  const { node } = await about();
  checkBody(node, "content/profile (about)");
  return { ...profile, about: node };
}

export async function getSettings(): Promise<Settings | null> {
  const entry = await reader.singletons.settings.read();
  if (!entry || !isPublished(entry)) return null;
  const { status: _status, ...data } = entry;
  return parsePublished(SettingsSchema, data, "content/settings");
}

// ── Collections ─────────────────────────────────────────────────────────────

export async function getProjects(options: { featured?: boolean } = {}): Promise<Project[]> {
  const all = await reader.collections.projects.all();
  const projects = all
    .filter(({ entry }) => isPublished(entry))
    .map(({ slug, entry }) => {
      const { status: _status, body: _body, ...data } = entry;
      return parsePublished(ProjectSchema, { slug, ...data }, `content/projects/${slug}`);
    });
  const dupes = findDuplicateSlugs(projects);
  if (dupes.length)
    throw new ContentValidationError("content/projects", [`duplicate slugs: ${dupes.join(", ")}`]);
  return projects
    .filter((p) => options.featured === undefined || p.featured === options.featured)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function getProject(slug: string): Promise<(Project & { body: Node }) | null> {
  const entry = await reader.collections.projects.read(slug);
  if (!entry || !isPublished(entry)) return null;
  const { status: _status, body, ...data } = entry;
  const where = `content/projects/${slug}`;
  const project = parsePublished(ProjectSchema, { slug, ...data }, where);
  const { node } = await body();
  checkBody(node, `${where} (body)`);
  return { ...project, body: node };
}

export async function getExperience(): Promise<Experience[]> {
  const all = await reader.collections.experience.all();
  return (
    all
      .filter(({ entry }) => isPublished(entry))
      .map(({ slug, entry }) => {
        const { status: _status, entry: _name, ...data } = entry;
        return parsePublished(ExperienceSchema, { slug, ...data }, `content/experience/${slug}`);
      })
      // Current roles (no end) first, then most recent end/start.
      .sort(
        (a, b) =>
          (b.end ?? "9999-12").localeCompare(a.end ?? "9999-12") || b.start.localeCompare(a.start),
      )
  );
}

export async function getEducation(): Promise<Education[]> {
  const all = await reader.collections.education.all();
  return all
    .filter(({ entry }) => isPublished(entry))
    .map(({ slug, entry }) => {
      const { status: _status, entry: _name, ...data } = entry;
      return parsePublished(EducationSchema, { slug, ...data }, `content/education/${slug}`);
    })
    .sort((a, b) => b.end.localeCompare(a.end));
}

const groupOrder = ["analysis_modeling", "development", "data_automation", "tools"] as const;

export async function getSkills(): Promise<Skill[]> {
  const all = await reader.collections.skills.all();
  return all
    .filter(({ entry }) => isPublished(entry))
    .map(({ slug, entry }) => {
      const { status: _status, ...data } = entry;
      return parsePublished(
        SkillSchema,
        { slug, ...data, evidence: data.evidence.filter((e): e is string => e !== null) },
        `content/skills/${slug}`,
      );
    })
    .sort(
      (a, b) =>
        groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group) || a.name.localeCompare(b.name),
    );
}

export async function getRecommendations(): Promise<Recommendation[]> {
  const all = await reader.collections.recommendations.all();
  return all
    .filter(({ entry }) => isPublished(entry))
    .map(({ slug, entry }) => {
      const { status: _status, ...data } = entry;
      return parsePublished(
        RecommendationSchema,
        { slug, ...data },
        `content/recommendations/${slug}`,
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── Build gate (PRD 18.4) ───────────────────────────────────────────────────

function publicFileExists(publicPath: string): boolean {
  return existsSync(path.join(process.cwd(), "public", publicPath));
}

/**
 * Validates every published entry and cross-checks references and files.
 * Returns a list of human-readable problems; an empty list means the content is valid.
 * Run by tests/content/content-gate.test.ts, which `npm run build` executes first.
 */
export async function validateAllContent(): Promise<string[]> {
  const problems: string[] = [];
  const attempt = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
      return undefined;
    }
  };

  const profile = await attempt(getProfile);
  if (profile && !publicFileExists(profile.cvPdf)) {
    problems.push(`content/profile: CV file not found at public${profile.cvPdf}`);
  }
  await attempt(getSettings);
  await attempt(getExperience);
  await attempt(getEducation);
  await attempt(getRecommendations);

  const projects = (await attempt(() => getProjects())) ?? [];
  for (const p of projects) {
    const full = await attempt(() => getProject(p.slug));
    const images = [p.thumbnail, ...p.gallery.map((g) => g.image)];
    if (full) images.push(...collectImageSources(full.body));
    for (const src of images) {
      if (!publicFileExists(src))
        problems.push(`content/projects/${p.slug}: image not found at public${src}`);
    }
  }

  const skills = (await attempt(getSkills)) ?? [];
  const projectSlugs = new Set(projects.map((p) => p.slug));
  for (const s of skills) {
    for (const ref of s.evidence) {
      if (!projectSlugs.has(ref)) {
        problems.push(`content/skills/${s.slug}: evidence '${ref}' is not a published project`);
      }
    }
  }
  return problems;
}

/** Counts of draft vs published entries, for reporting. */
export async function contentStatusSummary() {
  const count = async (list: Promise<{ entry: { status: string } }[]>) => {
    const items = await list;
    return {
      published: items.filter(({ entry }) => isPublished(entry)).length,
      draft: items.filter(({ entry }) => !isPublished(entry)).length,
    };
  };
  return {
    profile: (await reader.singletons.profile.read())?.status ?? "missing",
    settings: (await reader.singletons.settings.read())?.status ?? "missing",
    projects: await count(reader.collections.projects.all()),
    experience: await count(reader.collections.experience.all()),
    education: await count(reader.collections.education.all()),
    skills: await count(reader.collections.skills.all()),
    recommendations: await count(reader.collections.recommendations.all()),
  };
}
