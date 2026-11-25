import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendRecommendationSubmissionEmail, type EmailClient } from "@/lib/email";
import {
  checkDuplicateRecommendation,
  checkRecommendationRateLimit,
  resetRecommendationRateLimit,
} from "@/lib/rate-limit";
import {
  RECOMMENDATION_MAX_CHARS,
  authorizeModerationTransition,
  buildPendingRecommendation,
  validateRecommendationFields,
} from "@/lib/recommendation-submission";

const validInput = {
  authorName: "Alex Santoso",
  authorRole: "Operations Manager",
  organization: "Example Corp",
  relationship: "colleague" as const,
  platform: "linkedin" as const,
  text: "Desi translated complex operational bottlenecks into a clear, reliable workflow tool for our team.",
  profileUrl: "",
  linkedinUrl: "https://www.linkedin.com/in/alex-santoso/",
  consent: true as const,
};

describe("Phase 3 — Recommendation submission validation & security", () => {
  beforeEach(() => {
    resetRecommendationRateLimit();
  });

  it("accepts a valid submission and always forces status to PENDING", () => {
    const res = validateRecommendationFields({
      ...validInput,
      // Attempted mass-assignment / status tampering must be stripped & ignored.
      status: "PUBLISHED",
      approved: true,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const record = buildPendingRecommendation(res.data, new Date("2026-11-25T00:00:00Z"));
    expect(record.status).toBe("PENDING");
    expect("approved" in record).toBe(false);
    expect(record.submittedAt).toBe("2026-11-25T00:00:00.000Z");
  });

  it("rejects missing required fields and missing consent", () => {
    const res = validateRecommendationFields({
      authorName: "",
      authorRole: "",
      text: "",
      consent: false,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.fieldErrors.authorName).toBeDefined();
    expect(res.fieldErrors.authorRole).toBeDefined();
    expect(res.fieldErrors.text).toBeDefined();
    expect(res.fieldErrors.consent).toBeDefined();
  });

  it("rejects unsafe or malformed URLs (javascript:, data:, non-URL)", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,<script>", "not-a-url"]) {
      const res = validateRecommendationFields({ ...validInput, linkedinUrl: bad });
      expect(res.ok, bad).toBe(false);
      if (!res.ok) expect(res.fieldErrors.linkedinUrl).toBeDefined();
    }
  });

  it("rejects excessively short and excessively long recommendation text", () => {
    expect(validateRecommendationFields({ ...validInput, text: "Too short." }).ok).toBe(false);
    expect(
      validateRecommendationFields({
        ...validInput,
        text: "a".repeat(RECOMMENDATION_MAX_CHARS + 1),
      }).ok,
    ).toBe(false);
  });

  it("enforces per-IP rate limiting (max 3 per 10 minutes) and duplicate submission detection", () => {
    const now = 1_700_000_000_000;
    expect(checkRecommendationRateLimit("203.0.113.10", now, { bypassTestMode: true }).ok).toBe(
      true,
    );
    expect(
      checkRecommendationRateLimit("203.0.113.10", now + 1000, { bypassTestMode: true }).ok,
    ).toBe(true);
    expect(
      checkRecommendationRateLimit("203.0.113.10", now + 2000, { bypassTestMode: true }).ok,
    ).toBe(true);
    expect(
      checkRecommendationRateLimit("203.0.113.10", now + 3000, { bypassTestMode: true }).ok,
    ).toBe(false);

    expect(
      checkDuplicateRecommendation("Alex Santoso", validInput.text, now, { bypassTestMode: true })
        .ok,
    ).toBe(true);
    expect(
      checkDuplicateRecommendation("  alex santoso ", validInput.text, now + 5000, {
        bypassTestMode: true,
      }).ok,
    ).toBe(false);
  });

  it("enforces owner-only moderation authorization and lifecycle transitions", () => {
    // Anonymous users can NEVER approve, reject, or publish.
    expect(
      authorizeModerationTransition({ actor: "anonymous", from: "PENDING", to: "APPROVED" }),
    ).toEqual({ ok: false, reason: "unauthorized" });
    expect(
      authorizeModerationTransition({ actor: "anonymous", from: "PENDING", to: "REJECTED" }),
    ).toEqual({ ok: false, reason: "unauthorized" });
    expect(
      authorizeModerationTransition({ actor: "anonymous", from: "APPROVED", to: "PUBLISHED" }),
    ).toEqual({ ok: false, reason: "unauthorized" });

    // Owner cannot skip APPROVED to jump directly from PENDING -> PUBLISHED.
    expect(
      authorizeModerationTransition({ actor: "owner", from: "PENDING", to: "PUBLISHED" }),
    ).toEqual({ ok: false, reason: "invalid_transition" });

    // Valid owner transitions.
    expect(
      authorizeModerationTransition({ actor: "owner", from: "PENDING", to: "APPROVED" }),
    ).toEqual({ ok: true });
    expect(
      authorizeModerationTransition({ actor: "owner", from: "PENDING", to: "REJECTED" }),
    ).toEqual({ ok: true });
    expect(
      authorizeModerationTransition({ actor: "owner", from: "APPROVED", to: "PUBLISHED" }),
    ).toEqual({ ok: true });
  });

  it("delivers plain-text [PENDING MODERATION] review email via Resend client", async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: "rec_1" }, error: null });
    const fakeClient: EmailClient = { emails: { send } };
    const record = buildPendingRecommendation(validInput, new Date("2026-11-25T00:00:00Z"));
    const result = await sendRecommendationSubmissionEmail(record, fakeClient);
    expect(result).toEqual({ ok: true });
    expect(send).toHaveBeenCalledTimes(1);
    const payload = send.mock.calls[0]?.[0];
    expect(payload.subject).toContain("[PENDING MODERATION]");
    expect(payload.text).toContain("MODERATION STATUS: PENDING (NOT PUBLISHED)");
    expect(payload.text).toContain(validInput.text);
  });
});
