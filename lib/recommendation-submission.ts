import { z } from "zod";

import {
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  MODERATION_STATUSES,
  RECOMMENDATION_FIELDS,
  RECOMMENDATION_MAX_CHARS,
  RECOMMENDATION_MIN_CHARS,
  RECOMMENDATION_PLATFORMS,
  RECOMMENDATION_RELATIONSHIPS,
  readRecommendationFields,
  type ModerationStatus,
  type PendingRecommendationRecord,
  type RecommendationSubmissionField,
  type RecommendationSubmissionInput,
  type RecommendationSubmitState,
} from "./recommendation-fields";

// Disable Zod v4 JIT (new Function / eval) so client-side dynamic validation on
// form submit never triggers a Content-Security-Policy script-src eval violation.
z.config({ jitless: true });

export {
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  MODERATION_STATUSES,
  RECOMMENDATION_FIELDS,
  RECOMMENDATION_MAX_CHARS,
  RECOMMENDATION_MIN_CHARS,
  RECOMMENDATION_PLATFORMS,
  RECOMMENDATION_RELATIONSHIPS,
  readRecommendationFields,
  type ModerationStatus,
  type PendingRecommendationRecord,
  type RecommendationSubmissionField,
  type RecommendationSubmissionInput,
  type RecommendationSubmitState,
};

/** Safe optional URL: empty string allowed; otherwise strict http(s) URL only (blocks javascript:, data:, etc.). */
const SafeOptionalUrl = z
  .string()
  .trim()
  .max(300, "URL must be at most 300 characters.")
  .refine((val) => {
    if (!val) return true;
    try {
      const parsed = new URL(val);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a valid http:// or https:// URL.");

export const RecommendationSubmissionSchema = z.object({
  authorName: z
    .string()
    .trim()
    .min(2, "Please enter your full name (at least 2 characters).")
    .max(80, "Name must be at most 80 characters."),
  authorRole: z
    .string()
    .trim()
    .min(2, "Please enter your role or title (at least 2 characters).")
    .max(100, "Role must be at most 100 characters."),
  organization: z
    .string()
    .trim()
    .max(100, "Organization must be at most 100 characters.")
    .default(""),
  relationship: z.enum(RECOMMENDATION_RELATIONSHIPS).default("colleague"),
  platform: z.enum(RECOMMENDATION_PLATFORMS).default("linkedin"),
  text: z
    .string()
    .trim()
    .min(RECOMMENDATION_MIN_CHARS, `Please write at least ${RECOMMENDATION_MIN_CHARS} characters.`)
    .max(
      RECOMMENDATION_MAX_CHARS,
      `Recommendation must be at most ${RECOMMENDATION_MAX_CHARS} characters.`,
    ),
  profileUrl: SafeOptionalUrl.default(""),
  linkedinUrl: SafeOptionalUrl.default(""),
  consent: z.literal(true, {
    message: "Please confirm permission to review and display this recommendation if approved.",
  }),
});

export function validateRecommendationFields(
  input: unknown,
):
  | { ok: true; data: RecommendationSubmissionInput }
  | { ok: false; fieldErrors: Partial<Record<RecommendationSubmissionField, string>> } {
  const result = RecommendationSubmissionSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: Partial<Record<RecommendationSubmissionField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as RecommendationSubmissionField | undefined;
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return { ok: false, fieldErrors };
}

/**
 * Creates a pending record. Explicitly forces `status: "PENDING"` regardless of
 * any extra fields passed by a caller (prevents status-tampering / mass assignment).
 */
export function buildPendingRecommendation(
  data: RecommendationSubmissionInput,
  now = new Date(),
): PendingRecommendationRecord {
  return {
    authorName: data.authorName,
    authorRole: data.authorRole,
    organization: data.organization,
    relationship: data.relationship,
    platform: data.platform,
    text: data.text,
    profileUrl: data.profileUrl,
    linkedinUrl: data.linkedinUrl,
    consent: data.consent,
    status: "PENDING",
    submittedAt: now.toISOString(),
  };
}

/**
 * Authorization boundary for moderation state transitions.
 * Anonymous/public callers can NEVER approve, reject, or publish submissions.
 */
export function authorizeModerationTransition(params: {
  actor: "anonymous" | "owner";
  from: ModerationStatus;
  to: ModerationStatus;
}): { ok: true } | { ok: false; reason: "unauthorized" | "invalid_transition" } {
  if (params.actor !== "owner") {
    return { ok: false, reason: "unauthorized" };
  }
  const allowed: Record<ModerationStatus, readonly ModerationStatus[]> = {
    PENDING: ["APPROVED", "REJECTED"],
    APPROVED: ["PUBLISHED", "REJECTED"],
    REJECTED: [],
    PUBLISHED: [],
  };
  if (!allowed[params.from].includes(params.to)) {
    return { ok: false, reason: "invalid_transition" };
  }
  return { ok: true };
}
