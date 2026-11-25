import "server-only";

import { Resend } from "resend";

import type { PendingRecommendationRecord } from "./recommendation-submission";
import {
  contactSubject,
  inquiryTypeLabel,
  stripLineBreaks,
  type InquiryTypeValue,
} from "./sanitize";
import { TEST_DELIVERY_FAILURE_DOMAIN, isContactTestMode } from "./test-mode";

export type ContactEmail = {
  name: string;
  email: string;
  type: InquiryTypeValue;
  message: string;
};

export type SendResult = { ok: true } | { ok: false; code: string };

/** Minimal surface of the Resend client, so tests can pass a fake. */
export type EmailClient = {
  emails: {
    send: (payload: {
      from: string;
      to: string;
      replyTo: string;
      subject: string;
      text: string;
    }) => Promise<{
      data: { id: string } | null;
      error: { name: string; statusCode?: number | null } | null;
    }>;
  };
};

/**
 * FR-CF-04 / PRD 8.3: sends the message to the owner as plain text via Resend.
 * The sender's address is only ever the reply-to, never "from" (header injection,
 * PRD 10). Header values have CR/LF stripped. Never throws.
 * FR-CF-06 / PRD 10: logs error codes only — never the message or an email address.
 */
export async function sendContactEmail(
  message: ContactEmail,
  client?: EmailClient,
): Promise<SendResult> {
  if (isContactTestMode() && !client) {
    return message.email.toLowerCase().endsWith(`@${TEST_DELIVERY_FAILURE_DOMAIN}`)
      ? { ok: false, code: "test_delivery_failure" }
      : { ok: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!client && (!apiKey || !to || !from)) {
    console.error(
      "[contact] email: RESEND_API_KEY, CONTACT_TO_EMAIL or CONTACT_FROM_EMAIL is not set",
    );
    return { ok: false, code: "not_configured" };
  }

  const resend: EmailClient = client ?? (new Resend(apiKey) as unknown as EmailClient);
  const name = stripLineBreaks(message.name);
  const text = [
    `Name: ${name}`,
    `Email: ${message.email}`,
    `Inquiry type: ${inquiryTypeLabel[message.type]}`,
    "",
    message.message,
    "",
    "-- Sent from the portfolio contact form",
  ].join("\n");

  try {
    const { error } = await resend.emails.send({
      from: from ?? "",
      to: to ?? "",
      replyTo: stripLineBreaks(message.email),
      subject: contactSubject(message.type, name),
      text,
    });
    if (error) {
      console.error(
        `[contact] email: send failed (${error.name}${error.statusCode ? ` ${error.statusCode}` : ""})`,
      );
      return { ok: false, code: error.name };
    }
    return { ok: true };
  } catch (error) {
    console.error(
      `[contact] email: request failed (${error instanceof Error ? error.name : "unknown"})`,
    );
    return { ok: false, code: "network_error" };
  }
}

/**
 * Phase 3: Delivers a public recommendation submission to the owner's private inbox
 * as a plain-text [PENDING MODERATION] review item. Never publishes automatically
 * and never writes directly to GitHub/CMS.
 */
export async function sendRecommendationSubmissionEmail(
  record: PendingRecommendationRecord,
  client?: EmailClient,
): Promise<SendResult> {
  if (isContactTestMode() && !client) {
    return record.authorName.toLowerCase().includes("faildelivery")
      ? { ok: false, code: "test_delivery_failure" }
      : { ok: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!client && (!apiKey || !to || !from)) {
    console.error(
      "[recommendation] email: RESEND_API_KEY, CONTACT_TO_EMAIL or CONTACT_FROM_EMAIL is not set",
    );
    return { ok: false, code: "not_configured" };
  }

  const resend: EmailClient = client ?? (new Resend(apiKey) as unknown as EmailClient);
  const safeName = stripLineBreaks(record.authorName);
  const safeRole = stripLineBreaks(record.authorRole);
  const safeOrg = stripLineBreaks(record.organization);
  const text = [
    "MODERATION STATUS: PENDING (NOT PUBLISHED)",
    `Submitted at: ${record.submittedAt}`,
    "",
    `Name: ${safeName}`,
    `Role: ${safeRole}`,
    `Organization: ${safeOrg || "(not provided)"}`,
    `Relationship: ${record.relationship}`,
    `Platform: ${record.platform}`,
    `LinkedIn URL: ${record.linkedinUrl || "(not provided)"}`,
    `Profile URL: ${record.profileUrl || "(not provided)"}`,
    `Public display consent: ${record.consent ? "Confirmed" : "Not confirmed"}`,
    "",
    "Recommendation text:",
    record.text,
    "",
    "Next steps (Owner Moderation):",
    "- To REJECT: ignore or archive this email. Nothing has been published.",
    "- To APPROVE & PUBLISH: sign in at https://desiarmandasari.my.id/keystatic, add this entry under Recommendations, and save to a content/* branch.",
  ].join("\n");

  try {
    const { error } = await resend.emails.send({
      from: from ?? "",
      to: to ?? "",
      replyTo: to ?? "",
      subject: `[PENDING MODERATION] Recommendation from ${safeName}`,
      text,
    });
    if (error) {
      console.error(
        `[recommendation] email: send failed (${error.name}${error.statusCode ? ` ${error.statusCode}` : ""})`,
      );
      return { ok: false, code: error.name };
    }
    return { ok: true };
  } catch (error) {
    console.error(
      `[recommendation] email: request failed (${error instanceof Error ? error.name : "unknown"})`,
    );
    return { ok: false, code: "network_error" };
  }
}
