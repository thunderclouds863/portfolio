import { collection, config, fields, singleton } from "@keystatic/core";
import { block, repeating, wrapper } from "@keystatic/core/content-components";

/*
 * Keystatic content model — PRD section 18.3.
 * Every type carries a Draft/Published status (PRD 18.4): only Published entries
 * render, and AI-seeded entries are always saved as Draft.
 * Zod contract for published entries: lib/schema.ts.
 */

// FR-CMS-02: local storage by default (development); GitHub storage when
// NEXT_PUBLIC_KEYSTATIC_STORAGE=github (production and preview, set in Vercel).
function storageConfig() {
  if (process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE !== "github") return { kind: "local" } as const;
  const repo = process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO;
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error("NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO must be set to 'owner/name' in GitHub mode");
  }
  return { kind: "github", repo: repo as `${string}/${string}`, branchPrefix: "content/" } as const;
}

const status = fields.select({
  label: "Status",
  description: "Only Published entries appear on the site. Publishing is your confirmation.",
  options: [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
  ],
  defaultValue: "draft",
});

const yearMonth = (label: string, description?: string) =>
  fields.text({ label, description: description ?? "Format YYYY-MM, e.g. 2025-06" });

const contributionScope = fields.select({
  label: "Contribution scope",
  description: "Your part in the work. Required to publish.",
  options: [
    { label: "Not set", value: "unset" },
    { label: "Owner", value: "owner" },
    { label: "Core team", value: "core_team" },
    { label: "Supporting", value: "supporting" },
  ],
  defaultValue: "unset",
});

const projectImage = (label: string) =>
  fields.image({ label, directory: "public/images/projects", publicPath: "/images/projects/" });

// Whitelisted Markdoc components (PRD 18.3). Body content cannot run JavaScript.
const caseStudyComponents = {
  Callout: wrapper({
    label: "Callout",
    schema: {
      tone: fields.select({
        label: "Tone",
        options: [
          { label: "Note", value: "note" },
          { label: "Warning", value: "warning" },
        ],
        defaultValue: "note",
      }),
    },
  }),
  Figure: block({
    label: "Figure",
    schema: {
      src: projectImage("Image"),
      alt: fields.text({ label: "Alt text", validation: { isRequired: true } }),
      caption: fields.text({ label: "Caption" }),
    },
  }),
  Diagram: block({
    label: "Diagram",
    schema: {
      src: projectImage("Diagram image (SVG or PNG)"),
      alt: fields.text({
        label: "Alt text",
        description: "Describe what the diagram shows",
        validation: { isRequired: true },
      }),
      caption: fields.text({ label: "Caption" }),
    },
  }),
  Steps: repeating({ label: "Steps", children: ["Step"], schema: {} }),
  Step: wrapper({
    label: "Step",
    forSpecificLocations: true,
    schema: { title: fields.text({ label: "Step title" }) },
  }),
};

export default config({
  storage: storageConfig(),
  ui: { brand: { name: "Desi Armanda Sari — content" } },

  singletons: {
    profile: singleton({
      label: "Profile & Hero",
      path: "content/profile",
      format: { data: "yaml" },
      schema: {
        status,
        name: fields.text({ label: "Name" }),
        headline: fields.text({
          label: "Main headline (Hero H1)",
          description: "Primary hero statement shown at the top of the homepage.",
        }),
        subheadline: fields.text({
          label: "Professional positioning (Hero sub-headline)",
          description: "Role positioning shown under the main headline.",
          multiline: true,
        }),
        about: fields.markdoc({
          label: "About",
          options: { image: false, codeBlock: false, table: false, heading: false },
        }),
        location: fields.text({ label: "Location (city)" }),
        preferredLocations: fields.array(fields.text({ label: "Location" }), {
          label: "Preferred work locations",
          itemLabel: (p) => p.value,
        }),
        availability: fields.object(
          {
            openToWork: fields.checkbox({
              label: "Show availability status",
              description:
                "Shows the availability chip in the hero, on the share image, and the availability summary in Hero, Contact, and CV.",
              defaultValue: false,
            }),
            label: fields.text({
              label: "Availability label",
              description:
                'Short chip label for the hero and Open Graph image, e.g. "Open to Opportunities & Collaboration".',
            }),
            summary: fields.text({
              label: "Supporting availability description",
              description: "Reused in the Hero, Contact section, and CV page.",
              multiline: true,
            }),
            workModes: fields.multiselect({
              label: "Work modes",
              options: [
                { label: "On-site", value: "on_site" },
                { label: "Hybrid", value: "hybrid" },
                { label: "Remote", value: "remote" },
              ],
            }),
            availableFrom: fields.text({ label: "Availability", description: "e.g. Immediately" }),
            freelance: fields.checkbox({ label: "Open to freelance", defaultValue: false }),
            freelanceServices: fields.array(fields.text({ label: "Service" }), {
              label: "Freelance services",
              itemLabel: (p) => p.value,
            }),
          },
          { label: "Availability" },
        ),
        links: fields.array(
          fields.object({
            label: fields.text({ label: "Label" }),
            url: fields.url({ label: "URL (mailto: for email)" }),
            icon: fields.select({
              label: "Icon",
              options: [
                { label: "Email", value: "email" },
                { label: "LinkedIn", value: "linkedin" },
                { label: "GitHub", value: "github" },
                { label: "WhatsApp", value: "whatsapp" },
                { label: "Website", value: "website" },
              ],
              defaultValue: "email",
            }),
          }),
          { label: "Social links", itemLabel: (p) => p.fields.label.value },
        ),
        cvPdf: fields.file({ label: "CV PDF", directory: "public/cv", publicPath: "/cv/" }),
        languages: fields.array(
          fields.object({
            language: fields.text({ label: "Language" }),
            level: fields.text({
              label: "Level",
              description: "e.g. Professional working proficiency",
            }),
            evidence: fields.text({
              label: "Evidence (optional)",
              description: "e.g. EF SET 72/100 (C2), May 2026",
            }),
          }),
          { label: "Languages", itemLabel: (p) => p.fields.language.value },
        ),
        certifications: fields.array(
          fields.object({
            name: fields.text({ label: "Name" }),
            issuer: fields.text({ label: "Issuer" }),
            year: fields.text({ label: "Year", description: "YYYY" }),
            url: fields.url({ label: "Credential URL (optional)" }),
          }),
          { label: "Certifications", itemLabel: (p) => p.fields.name.value },
        ),
        publications: fields.array(
          fields.object({
            title: fields.text({ label: "Title (original language)", multiline: true }),
            venue: fields.text({ label: "Venue", description: "e.g. E-Journal Undip" }),
            date: fields.date({ label: "Date" }),
            url: fields.url({ label: "Link" }),
          }),
          { label: "Publications", itemLabel: (p) => p.fields.title.value },
        ),
      },
    }),

    settings: singleton({
      label: "Site settings",
      path: "content/settings",
      format: { data: "yaml" },
      schema: {
        status,
        seoTitle: fields.text({ label: "SEO title" }),
        seoDescription: fields.text({
          label: "SEO description",
          multiline: true,
          validation: { length: { max: 160 } },
        }),
        ogText: fields.text({ label: "Open Graph image text" }),
        contactResponseTime: fields.text({ label: "Contact response-time text" }),
        showStatusChip: fields.checkbox({ label: "Show status chip", defaultValue: true }),
        // FR-CAP-01: three roles; the first is shown large. Evidence links come from
        // published projects tagged with the same capability.
        capabilities: fields.array(
          fields.object({
            key: fields.select({
              label: "Capability",
              options: [
                { label: "System analysis", value: "system_analysis" },
                { label: "Process improvement", value: "process_improvement" },
                { label: "System development", value: "system_development" },
              ],
              defaultValue: "system_analysis",
            }),
            title: fields.text({ label: "Title" }),
            summary: fields.text({ label: "What you do (one or two sentences)", multiline: true }),
            activities: fields.array(fields.text({ label: "Activity" }), {
              label: "Activities",
              itemLabel: (p) => p.value,
            }),
          }),
          {
            label: "Capabilities (exactly 3; the first is shown large)",
            itemLabel: (p) => p.fields.title.value,
          },
        ),
        // FR-APR-01: six steps, Understand → Map as-is → Analyze → Design to-be → Build → Verify.
        approach: fields.array(
          fields.object({
            title: fields.text({ label: "Step" }),
            description: fields.text({ label: "How you do this step", multiline: true }),
          }),
          { label: "Approach steps (exactly 6)", itemLabel: (p) => p.fields.title.value },
        ),
      },
    }),
  },

  collections: {
    projects: collection({
      label: "Projects",
      slugField: "title",
      path: "content/projects/*/",
      format: { contentField: "body" },
      entryLayout: "content",
      columns: ["title", "status"],
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        status,
        featured: fields.checkbox({ label: "Featured on home", defaultValue: false }),
        order: fields.integer({ label: "Order", defaultValue: 99 }),
        type: fields.select({
          label: "Type",
          options: [
            { label: "Work", value: "work" },
            { label: "Thesis", value: "thesis" },
            { label: "Lab", value: "lab" },
            { label: "Freelance", value: "freelance" },
            { label: "Personal", value: "personal" },
          ],
          defaultValue: "work",
        }),
        capabilities: fields.multiselect({
          label: "Capabilities",
          options: [
            { label: "System analysis", value: "system_analysis" },
            { label: "Process improvement", value: "process_improvement" },
            { label: "System development", value: "system_development" },
            { label: "Data", value: "data" },
          ],
        }),
        role: fields.text({ label: "Your role", description: "Required to publish" }),
        contribution: contributionScope,
        teamSize: fields.integer({ label: "Team size" }),
        period: fields.text({ label: "Period", description: "e.g. 2024-09 – 2025-06" }),
        stack: fields.array(fields.text({ label: "Tool" }), {
          label: "Stack",
          itemLabel: (p) => p.value,
        }),
        summary: fields.text({ label: "Summary (one line)", multiline: true }),
        problem: fields.text({ label: "Problem (one line)", multiline: true }),
        outcomes: fields.array(
          fields.object({
            statement: fields.text({ label: "Statement", multiline: true }),
            verified: fields.checkbox({ label: "Verified number/result", defaultValue: false }),
            evidence: fields.text({
              label: "Evidence note",
              description: "Required when Verified is ticked",
              multiline: true,
            }),
          }),
          { label: "Outcomes", itemLabel: (p) => p.fields.statement.value },
        ),
        thumbnail: projectImage("Thumbnail (optional)"),
        thumbnailAlt: fields.text({
          label: "Thumbnail alt text",
          description: "Required when there is a thumbnail",
        }),
        demoUrl: fields.url({
          label: "Live demo link (optional)",
          description: "https://… — shown as a [ live demo ] button on the card and case study",
        }),
        gallery: fields.array(
          fields.object({
            image: projectImage("Image"),
            alt: fields.text({ label: "Alt text" }),
            caption: fields.text({ label: "Caption" }),
          }),
          { label: "Gallery", itemLabel: (p) => p.fields.alt.value },
        ),
        body: fields.markdoc({
          label: "Case study",
          options: { image: false, codeBlock: false, heading: [2, 3] },
          components: caseStudyComponents,
        }),
      },
    }),

    experience: collection({
      label: "Experience",
      slugField: "entry",
      path: "content/experience/*",
      format: { data: "yaml" },
      columns: ["entry", "status"],
      schema: {
        entry: fields.slug({ name: { label: "Entry name (internal)" } }),
        status,
        organization: fields.text({ label: "Organization" }),
        role: fields.text({ label: "Role / title" }),
        start: yearMonth("Start month"),
        end: yearMonth("End month", "YYYY-MM, or leave empty if current"),
        // Contribution scope is stated per bullet (owner / core team / supporting).
        highlights: fields.array(
          fields.object({
            text: fields.text({ label: "Highlight", multiline: true }),
            scope: contributionScope,
          }),
          { label: "Highlights", itemLabel: (p) => p.fields.text.value },
        ),
        tags: fields.array(fields.text({ label: "Tag" }), {
          label: "Tags",
          itemLabel: (p) => p.value,
        }),
      },
    }),

    education: collection({
      label: "Education",
      slugField: "entry",
      path: "content/education/*",
      format: { data: "yaml" },
      schema: {
        entry: fields.slug({ name: { label: "Entry name (internal)" } }),
        status,
        institution: fields.text({ label: "Institution" }),
        degree: fields.text({ label: "Degree" }),
        major: fields.text({ label: "Major" }),
        start: yearMonth("Start", "Format YYYY-MM, or YYYY if you only know the year"),
        end: yearMonth("End", "Format YYYY-MM, or YYYY if you only know the year"),
        gpa: fields.text({ label: "Grade (optional)", description: "e.g. 3.60/4.00 or 90.39/100" }),
        focusAreas: fields.array(fields.text({ label: "Focus area" }), {
          label: "Focus areas",
          itemLabel: (p) => p.value,
        }),
        thesis: fields.text({ label: "Thesis title (optional)", multiline: true }),
        achievements: fields.array(
          fields.object({
            title: fields.text({
              label: "Title",
              description: "e.g. 2nd place, Informatics Science Competition",
            }),
            issuer: fields.text({ label: "Issued by" }),
            date: yearMonth("Month"),
          }),
          { label: "Achievements (competitions, awards)", itemLabel: (p) => p.fields.title.value },
        ),
        intellectualProperty: fields.array(
          fields.object({
            title: fields.text({ label: "Program / work title" }),
            officialTitle: fields.text({ label: "Official certificate title (optional)" }),
            workType: fields.text({
              label: "Registration type",
              description: "e.g. Copyright Registration · Computer Program",
            }),
            registrationReference: fields.text({ label: "Registration / application reference" }),
            recordNumber: fields.text({ label: "Copyright record number (optional)" }),
            registrationDate: fields.text({ label: "Registration date" }),
            firstPublication: fields.text({ label: "First publication date & place (optional)" }),
            copyrightHolder: fields.text({ label: "Copyright holder" }),
            creatorAttribution: fields.text({ label: "Creator attribution" }),
            summary: fields.text({ label: "Technical summary", multiline: true }),
            projectSlug: fields.text({ label: "Related project slug (optional)" }),
            verificationUrl: fields.text({
              label: "Official verification URL (optional, https:// only)",
            }),
          }),
          {
            label: "Intellectual property & copyright registrations",
            itemLabel: (p) => p.fields.title.value,
          },
        ),
      },
    }),

    skills: collection({
      label: "Skills",
      slugField: "name",
      path: "content/skills/*",
      format: { data: "yaml" },
      columns: ["name", "status"],
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        status,
        group: fields.select({
          label: "Group",
          options: [
            { label: "Not set", value: "unset" },
            { label: "Analysis & Modeling", value: "analysis_modeling" },
            { label: "Development", value: "development" },
            { label: "Data & Automation", value: "data_automation" },
            { label: "Tools", value: "tools" },
          ],
          defaultValue: "unset",
        }),
        level: fields.select({
          label: "Level",
          description: "Honest proficiency, shown as text (no bars)",
          options: [
            { label: "Not set", value: "unset" },
            { label: "Daily use", value: "daily" },
            { label: "Project use", value: "project" },
            { label: "Learning", value: "learning" },
          ],
          defaultValue: "unset",
        }),
        evidence: fields.array(fields.relationship({ label: "Project", collection: "projects" }), {
          label: "Evidence (projects where used)",
          itemLabel: (p) => p.value ?? "",
        }),
      },
    }),

    recommendations: collection({
      label: "Recommendations",
      slugField: "authorName",
      path: "content/recommendations/*",
      format: { data: "yaml" },
      columns: ["authorName", "platform", "status"],
      schema: {
        authorName: fields.slug({ name: { label: "Name" } }),
        status,
        authorHeadline: fields.text({ label: "Role / position (optional)" }),
        organization: fields.text({ label: "Organization (optional)" }),
        platform: fields.select({
          label: "Platform",
          options: [
            { label: "LinkedIn", value: "linkedin" },
            { label: "Shopee", value: "shopee" },
            { label: "WhatsApp", value: "whatsapp" },
            { label: "Email", value: "email" },
            { label: "Google", value: "google" },
            { label: "Other", value: "other" },
          ],
          defaultValue: "linkedin",
        }),
        platformLabel: fields.text({
          label: "Custom source description (when Platform is Other)",
        }),
        linkedinUrl: fields.url({
          label: "LinkedIn profile URL (optional)",
          description: "Links the recommender's name to their LinkedIn profile.",
        }),
        sourceUrl: fields.url({
          label: "Profile / original source URL (optional)",
          description: "Optional link to the original review or profile.",
        }),
        relationship: fields.select({
          label: "Relationship",
          options: [
            { label: "Manager", value: "manager" },
            { label: "Colleague", value: "colleague" },
            { label: "Client", value: "client" },
            { label: "Lecturer", value: "lecturer" },
            { label: "Classmate", value: "classmate" },
            { label: "Other", value: "other" },
          ],
          defaultValue: "colleague",
        }),
        relationshipLabel: fields.text({
          label: "Relationship as shown (optional)",
          description: "Overrides the label above on the site, e.g. Supervisor, Former schoolmate",
        }),
        text: fields.text({
          label: "Testimonial (verbatim)",
          description: "Published word for word; an excerpt may only be cut with […]",
          multiline: true,
        }),
        date: fields.date({ label: "Date (optional)" }),
        avatar: fields.image({
          label: "Avatar (optional)",
          directory: "public/images/recommendations",
          publicPath: "/images/recommendations/",
        }),
        avatarAlt: fields.text({ label: "Avatar alt text (optional)" }),
        evidenceImage: fields.image({
          label: "Screenshot / evidence (optional)",
          description: "Original testimonial screenshot (blur private contact info before upload).",
          directory: "public/images/recommendations/evidence",
          publicPath: "/images/recommendations/evidence/",
        }),
        evidenceAlt: fields.text({
          label: "Screenshot alt text",
          description: "Required when a screenshot is uploaded.",
        }),
        featured: fields.checkbox({
          label: "Featured",
          description: "Highlights this testimonial first.",
          defaultValue: false,
        }),
        order: fields.integer({
          label: "Display order (optional)",
          description: "Lower numbers appear first.",
        }),
        permissionConfirmed: fields.checkbox({
          label: "Permission to republish confirmed",
          description: "Required to publish",
          defaultValue: false,
        }),
      },
    }),
  },
});
