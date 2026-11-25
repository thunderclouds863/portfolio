"use server";

import { headers } from "next/headers";

import { sendRecommendationSubmissionEmail } from "@/lib/email";
import {
  checkDuplicateRecommendation,
  checkRecommendationRateLimit,
  extractClientIp,
} from "@/lib/rate-limit";
import {
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  buildPendingRecommendation,
  readRecommendationFields,
  validateRecommendationFields,
  type RecommendationSubmitState,
} from "@/lib/recommendation-submission";
import { ContactMetaSchema } from "@/lib/schema";
import { verifyTurnstile } from "@/lib/turnstile";

/**
 * Public recommendation submission Server Action (Phase 3).
 *
 * Security & moderation invariants:
 * 1. Honeypot filled -> silent success, nothing sent.
 * 2. Elapsed fill time < 3s -> "too_fast".
 * 3. Independent server-side Zod validation (required fields, char bounds, safe http(s) URLs).
 * 4. Per-IP rate limit + duplicate-submission fingerprint check.
 * 5. Cloudflare Turnstile siteverify.
 * 6. Status is ALWAYS forced to "PENDING" on the server (never published automatically;
 *    no public write access to GitHub or Keystatic CMS).
 */
export async function submitRecommendation(form: FormData): Promise<RecommendationSubmitState> {
  const meta = ContactMetaSchema.parse({
    honeypot: form.get(HONEYPOT_FIELD),
    elapsedMs: form.get("elapsedMs"),
    turnstileToken: form.get("turnstileToken"),
  });

  if (meta.honeypot.trim() !== "") {
    return { status: "success", moderationStatus: "PENDING" };
  }

  if (meta.elapsedMs < MIN_FILL_MS) {
    return { status: "too_fast" };
  }

  const validation = validateRecommendationFields(readRecommendationFields(form));
  if (!validation.ok) {
    return { status: "invalid", fieldErrors: validation.fieldErrors };
  }

  const requestHeaders = await headers();
  const remoteIp = extractClientIp(requestHeaders);
  if (!checkRecommendationRateLimit(remoteIp).ok) {
    return { status: "rate_limited" };
  }

  const verification = await verifyTurnstile(meta.turnstileToken || null, remoteIp);
  if (!verification.ok) {
    return { status: "verification_failed" };
  }

  if (!checkDuplicateRecommendation(validation.data.authorName, validation.data.text).ok) {
    return { status: "duplicate" };
  }

  const pendingRecord = buildPendingRecommendation(validation.data);
  const sent = await sendRecommendationSubmissionEmail(pendingRecord);
  return sent.ok
    ? { status: "success", moderationStatus: "PENDING" }
    : { status: "delivery_failed" };
}
