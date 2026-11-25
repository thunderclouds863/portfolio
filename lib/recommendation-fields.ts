import { HONEYPOT_FIELD, MIN_FILL_MS } from "./contact";

// Kept apart from lib/recommendation-submission.ts so the browser does not load
// Zod v4 on initial /testimonials page load (which triggers Zod's JIT eval probe
// and violates the strict production Content-Security-Policy).

export { HONEYPOT_FIELD, MIN_FILL_MS };

/** Explicit moderation lifecycle (Phase 3): public submissions ALWAYS enter PENDING. */
export const MODERATION_STATUSES = ["PENDING", "APPROVED", "REJECTED", "PUBLISHED"] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const RECOMMENDATION_RELATIONSHIPS = [
  "manager",
  "colleague",
  "client",
  "lecturer",
  "classmate",
  "other",
] as const;

export const RECOMMENDATION_PLATFORMS = [
  "linkedin",
  "shopee",
  "whatsapp",
  "email",
  "google",
  "other",
] as const;

export const RECOMMENDATION_MIN_CHARS = 30;
export const RECOMMENDATION_MAX_CHARS = 1500;

export type RecommendationRelationship = (typeof RECOMMENDATION_RELATIONSHIPS)[number];
export type RecommendationPlatform = (typeof RECOMMENDATION_PLATFORMS)[number];

export type RecommendationSubmissionInput = {
  authorName: string;
  authorRole: string;
  organization: string;
  relationship: RecommendationRelationship;
  platform: RecommendationPlatform;
  text: string;
  profileUrl: string;
  linkedinUrl: string;
  consent: true;
};

export type RecommendationSubmissionField = keyof RecommendationSubmissionInput;

export const RECOMMENDATION_FIELDS: readonly RecommendationSubmissionField[] = [
  "authorName",
  "authorRole",
  "organization",
  "relationship",
  "platform",
  "text",
  "profileUrl",
  "linkedinUrl",
  "consent",
];

export type PendingRecommendationRecord = RecommendationSubmissionInput & {
  status: "PENDING";
  submittedAt: string;
};

export type RecommendationSubmitState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Partial<Record<RecommendationSubmissionField, string>> }
  | { status: "too_fast" }
  | { status: "rate_limited" }
  | { status: "duplicate" }
  | { status: "verification_failed" }
  | { status: "delivery_failed" }
  | { status: "network_error" }
  | { status: "success"; moderationStatus: "PENDING" };

export function readRecommendationFields(form: FormData) {
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    authorName: text("authorName"),
    authorRole: text("authorRole"),
    organization: text("organization"),
    relationship: text("relationship") || "colleague",
    platform: text("platform") || "linkedin",
    text: text("text"),
    profileUrl: text("profileUrl"),
    linkedinUrl: text("linkedinUrl"),
    consent: form.get("consent") === "on",
  };
}
