import { z } from "zod";

/*
 * Runtime content contract — PRD 8.5 class diagram, adapted to Keystatic (PRD 18.3/18.4).
 * These schemas validate PUBLISHED entries only; drafts are never rendered.
 * A published entry fails validation (and the build) if a required field is
 * empty or contains "TODO", a verified outcome lacks evidence, an image lacks
 * alt text, or a recommendation lacks permission.
 */

// ── Primitives ──────────────────────────────────────────────────────────────

const TODO_PATTERN = /\bTODO\b/i;

/** Required, non-blank, no TODO placeholder. */
export const requiredText = (field: string) =>
  z
    .string({ error: `${field} is required` })
    .trim()
    .min(1, `${field} is required`)
    .refine((s) => !TODO_PATTERN.test(s), `${field} still contains a TODO placeholder`);

/** Optional text: blank becomes null; TODO is still rejected. */
export const optionalText = (field: string) =>
  z
    .string()
    .trim()
    .nullish()
    .transform((s) => (s ? s : null))
    .refine(
      (s) => s === null || !TODO_PATTERN.test(s),
      `${field} still contains a TODO placeholder`,
    );

export const yearMonth = (field: string) =>
  requiredText(field).pipe(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, `${field} must be YYYY-MM`));

/** YYYY-MM, or YYYY when only the year is known (education). */
export const yearOrMonth = (field: string) =>
  requiredText(field).pipe(
    z.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, `${field} must be YYYY-MM or YYYY`),
  );

const isoDate = (field: string) =>
  requiredText(field).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${field} must be YYYY-MM-DD`));

/** Site-relative path to a file in /public, e.g. /images/projects/x/thumbnail.png. */
const publicPath = (field: string) =>
  requiredText(field).pipe(z.string().startsWith("/", `${field} must be a site-relative path`));

// ── Enumerations (PRD 8.5) ──────────────────────────────────────────────────

export const ContributionScope = z.enum(["owner", "core_team", "supporting"], {
  error: "contribution scope must be owner, core_team or supporting (not 'unset')",
});
export const Capability = z.enum([
  "system_analysis",
  "process_improvement",
  "system_development",
  "data",
]);
export const Proficiency = z.enum(["daily", "project", "learning"], {
  error: "level must be daily, project or learning (not 'unset')",
});
export const SkillGroup = z.enum(["analysis_modeling", "development", "data_automation", "tools"], {
  error: "group must be set (not 'unset')",
});
export const ProjectType = z.enum(["work", "thesis", "lab", "freelance", "personal"]);
export const Relationship = z.enum([
  "manager",
  "colleague",
  "client",
  "lecturer",
  "classmate",
  "other",
]);
export const WorkMode = z.enum(["on_site", "hybrid", "remote"]);
export const SocialIcon = z.enum(["email", "linkedin", "github", "whatsapp", "website"]);
export const InquiryType = z.enum(["job", "freelance", "collaboration", "other"]);

// ── Profile ─────────────────────────────────────────────────────────────────

export const SocialLinkSchema = z.object({
  label: requiredText("link label"),
  url: requiredText("link url").pipe(z.url({ error: "link url must be a valid URL" })),
  icon: SocialIcon,
});

export const DEFAULT_AVAILABILITY_LABEL = "Open to Opportunities & Collaboration";
export const DEFAULT_AVAILABILITY_SUMMARY =
  "Open to full-time employment, freelance opportunities, and project collaborations across business, technology, and digital transformation.";

export const AvailabilitySchema = z.object({
  openToWork: z.boolean(),
  label: optionalText("availability label"),
  summary: optionalText("availability summary"),
  workModes: z.array(WorkMode),
  availableFrom: requiredText("availability"),
  freelance: z.boolean(),
  freelanceServices: z.array(requiredText("freelance service")),
});

export const ProfileSchema = z.object({
  name: requiredText("name"),
  headline: requiredText("headline"),
  subheadline: requiredText("sub-headline"),
  location: requiredText("location"),
  preferredLocations: z.array(requiredText("preferred location")).min(1),
  availability: AvailabilitySchema,
  links: z.array(SocialLinkSchema).min(1, "at least one link is required"),
  cvPdf: publicPath("CV PDF"),
  languages: z.array(
    z.object({
      language: requiredText("language"),
      level: requiredText("language level"),
      evidence: optionalText("language evidence"),
    }),
  ),
  certifications: z.array(
    z.object({
      name: requiredText("certification name"),
      issuer: requiredText("certification issuer"),
      year: requiredText("certification year").pipe(
        z.string().regex(/^\d{4}$/, "year must be YYYY"),
      ),
      url: z.string().nullish(),
    }),
  ),
  publications: z.array(
    z.object({
      title: requiredText("publication title"),
      venue: requiredText("publication venue"),
      date: isoDate("publication date"),
      url: requiredText("publication link").pipe(z.url()),
    }),
  ),
});

export const SettingsSchema = z.object({
  seoTitle: requiredText("SEO title"),
  seoDescription: requiredText("SEO description").pipe(
    z.string().max(160, "SEO description must be 160 characters or fewer"),
  ),
  ogText: requiredText("OG text"),
  contactResponseTime: requiredText("contact response-time text"),
  showStatusChip: z.boolean(),
  // FR-CAP-01: exactly the three roles, each once.
  capabilities: z
    .array(
      z.object({
        key: z.enum(["system_analysis", "process_improvement", "system_development"]),
        title: requiredText("capability title"),
        summary: requiredText("capability summary"),
        activities: z.array(requiredText("capability activity")).min(1, "at least one activity"),
      }),
    )
    .length(3, "exactly 3 capabilities")
    .refine((items) => new Set(items.map((i) => i.key)).size === items.length, {
      message: "each capability may appear only once",
    }),
  // FR-APR-01: six pipeline steps.
  approach: z
    .array(
      z.object({
        title: requiredText("approach step title"),
        description: requiredText("approach step description"),
      }),
    )
    .length(6, "exactly 6 approach steps"),
});

// ── Experience / Education ──────────────────────────────────────────────────

export const ExperienceSchema = z.object({
  slug: z.string().min(1),
  organization: requiredText("organization"),
  role: requiredText("role"),
  start: yearMonth("start"),
  end: z
    .string()
    .trim()
    .nullish()
    .transform((s) => (s ? s : null))
    .pipe(
      z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "end must be YYYY-MM or empty for a current role")
        .nullable(),
    ),
  // Contribution scope is stated per bullet (AGENTS.md: always state scope).
  // Any number of highlights: owner override of FR-EXP-01's 2–4 (decision 0002, #5).
  highlights: z.array(z.object({ text: requiredText("highlight"), scope: ContributionScope })),
  tags: z.array(requiredText("tag")),
});

export const EducationSchema = z.object({
  slug: z.string().min(1),
  institution: requiredText("institution"),
  degree: requiredText("degree"),
  major: requiredText("major"),
  start: yearOrMonth("start"),
  end: yearOrMonth("end"),
  gpa: optionalText("grade"),
  focusAreas: z.array(requiredText("focus area")),
  thesis: optionalText("thesis"),
  // Competitions and awards from this period (owner request: decision 0002, #6).
  achievements: z.array(
    z.object({
      title: requiredText("achievement title"),
      issuer: requiredText("achievement issuer"),
      date: yearMonth("achievement month"),
    }),
  ),
});

// ── Projects ────────────────────────────────────────────────────────────────

export const OutcomeSchema = z
  .object({
    statement: requiredText("outcome statement"),
    verified: z.boolean(),
    evidence: optionalText("outcome evidence"),
  })
  .refine((o) => !o.verified || o.evidence !== null, {
    message: "an outcome marked verified needs an evidence note",
    path: ["evidence"],
  });

export const GalleryImageSchema = z.object({
  image: publicPath("gallery image"),
  alt: requiredText("gallery image alt text"),
  caption: optionalText("caption"),
});

export const ProjectSchema = z
  .object({
    slug: z.string().min(1),
    title: requiredText("title"),
    summary: requiredText("summary"),
    problem: requiredText("problem"),
    type: ProjectType,
    capabilities: z.array(Capability).min(1, "at least one capability"),
    role: requiredText("role"),
    contribution: ContributionScope,
    teamSize: z.number().int().positive().nullable(),
    period: requiredText("period"),
    stack: z.array(requiredText("stack item")),
    outcomes: z.array(OutcomeSchema),
    featured: z.boolean(),
    order: z.number().int(),
    // Optional (owner request): a project may be published before it has a screenshot.
    thumbnail: optionalText("thumbnail").refine(
      (s) => s === null || s.startsWith("/"),
      "thumbnail must be a site-relative path",
    ),
    thumbnailAlt: optionalText("thumbnail alt text"),
    // Link to the running demo app (opens in a new tab).
    demoUrl: optionalText("demo URL").refine(
      (s) => s === null || /^https:\/\/\S+$/.test(s),
      "demo URL must start with https://",
    ),
    gallery: z.array(GalleryImageSchema),
  })
  .refine((p) => p.thumbnail === null || p.thumbnailAlt !== null, {
    message: "a thumbnail needs alt text",
    path: ["thumbnailAlt"],
  });

// ── Skills / Recommendations ────────────────────────────────────────────────

export const SkillSchema = z.object({
  slug: z.string().min(1),
  name: requiredText("name"),
  group: SkillGroup,
  level: Proficiency,
  evidence: z.array(z.string().min(1, "evidence must reference a project")),
});

export const RecommendationSchema = z.object({
  slug: z.string().min(1),
  authorName: requiredText("author name"),
  authorHeadline: requiredText("author headline"),
  relationship: Relationship,
  relationshipLabel: optionalText("relationship label"),
  text: requiredText("recommendation text"),
  date: isoDate("date"),
  permissionConfirmed: z.literal(true, {
    error: "permission to republish must be confirmed before publishing",
  }),
});

// ── Contact message (transient, never persisted — PRD 8.5, FR-CF-01) ───────

/** The fields a visitor fills in. Shared by the client form and the Server Action (FR-CF-02). */
export const ContactFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be 2 to 80 characters.")
    .max(80, "Name must be 2 to 80 characters."),
  email: z.email({ error: "Enter a valid email address." }),
  type: InquiryType.or(z.literal("")).refine((v) => v !== "", "Choose an inquiry type."),
  message: z
    .string()
    .trim()
    .min(20, "Message must be 20 to 2000 characters.")
    .max(2000, "Message must be 20 to 2000 characters."),
  consent: z.literal(true, { error: "Please agree so the message can be answered." }),
});

export type ContactFields = z.infer<typeof ContactFieldsSchema>;
export type ContactField = keyof ContactFields;

/**
 * Bot-protection data the form posts next to the fields (FR-CF-03). Read on the
 * server only. Never throws: anything malformed falls back to the value that
 * fails the matching check (no token, "too fast"), so a bot gets no error detail.
 */
export const ContactMetaSchema = z.object({
  honeypot: z.string().catch(""),
  // Milliseconds between the form appearing and the submit. Reported by the
  // browser, so a bot can fake it: a UX guard against instant autofill submits,
  // not a security boundary (Turnstile is).
  elapsedMs: z.coerce.number().finite().nonnegative().catch(-1),
  // Cloudflare documents a 2048-character maximum for Turnstile tokens.
  turnstileToken: z.string().max(2048).catch(""),
});

/** Full transient message (PRD 8.5): fields + bot-protection data. Never persisted. */
export const ContactMessageSchema = ContactFieldsSchema.extend(ContactMetaSchema.shape);

// ── Types ───────────────────────────────────────────────────────────────────

export type Profile = z.infer<typeof ProfileSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Outcome = z.infer<typeof OutcomeSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;

// ── Collection-level checks ─────────────────────────────────────────────────

/** Returns the slugs that appear more than once. */
export function findDuplicateSlugs(items: readonly { slug: string }[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const { slug } of items) {
    if (seen.has(slug)) dupes.add(slug);
    seen.add(slug);
  }
  return [...dupes];
}

export function hasTodo(text: string): boolean {
  return TODO_PATTERN.test(text);
}

/** "TODO(content): x (IN-02)" → "x (IN-02)". */
export function todoMessage(text: string): string {
  return text.replace(/^.*?TODO(\(content\))?:?\s*/i, "").trim() || "content needed";
}
