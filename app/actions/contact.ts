"use server";

import { headers } from "next/headers";

import { HONEYPOT_FIELD, MIN_FILL_MS, readContactFields, type ContactState } from "@/lib/contact";
import { validateContactFields } from "@/lib/contact-validation";
import { sendContactEmail } from "@/lib/email";
import { checkContactRateLimit, extractClientIp } from "@/lib/rate-limit";
import { ContactMetaSchema } from "@/lib/schema";
import { verifyTurnstile } from "@/lib/turnstile";

/**
 * Contact form Server Action — PRD 8.3 sequence, 8.6 states, FR-CF-01…06.
 *
 *  1. Honeypot filled → silent "success", nothing is sent (bots only).
 *  2. Filled in under 3s → "too_fast", the visitor is asked to send again
 *     (a person using autofill must never see a fake success; PRD 14).
 *  3. Shared Zod validation → "invalid" with field errors.
 *  4. Turnstile siteverify → "verification_failed".
 *  5. Resend → "success" only when the provider returned OK, else "delivery_failed".
 *
 * The message is never stored and never logged (PRD 10).
 */
export async function sendContact(form: FormData): Promise<ContactState> {
  // Shared Zod schemas for everything the form posts (AGENTS.md): the
  // bot-protection data here, the visitor's fields below.
  const meta = ContactMetaSchema.parse({
    honeypot: form.get(HONEYPOT_FIELD),
    elapsedMs: form.get("elapsedMs"),
    turnstileToken: form.get("turnstileToken"),
  });
  if (meta.honeypot.trim() !== "") {
    return { status: "success" };
  }

  if (meta.elapsedMs < MIN_FILL_MS) {
    return { status: "too_fast" };
  }

  const validation = validateContactFields(readContactFields(form));
  if (!validation.ok) return { status: "invalid", fieldErrors: validation.fieldErrors };

  const requestHeaders = await headers();
  const remoteIp = extractClientIp(requestHeaders);
  if (!checkContactRateLimit(remoteIp).ok) return { status: "rate_limited" };
  const verification = await verifyTurnstile(meta.turnstileToken || null, remoteIp);
  if (!verification.ok) return { status: "verification_failed" };

  const { name, email, type, message } = validation.data;
  const sent = await sendContactEmail({ name, email, type, message });
  return sent.ok ? { status: "success" } : { status: "delivery_failed" };
}
