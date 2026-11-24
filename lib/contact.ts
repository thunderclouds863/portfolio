import type { ContactField } from "./schema";

/** Field order on the form — the first invalid one gets focus (FR-CF-02). */
export const CONTACT_FIELDS: readonly ContactField[] = [
  "name",
  "email",
  "type",
  "message",
  "consent",
];

/** Hidden honeypot input name: humans never see or fill it. */
export const HONEYPOT_FIELD = "website";
/** FR-CF-03: submissions faster than this after the form appeared are rejected. */
export const MIN_FILL_MS = 3000;

/** State machine of PRD 8.6, as returned by the Server Action. */
export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Partial<Record<ContactField, string>> }
  | { status: "too_fast" }
  | { status: "rate_limited" }
  | { status: "verification_failed" }
  | { status: "delivery_failed" }
  | { status: "network_error" }
  | { status: "success" };

/** Reads the visitor's fields from form data (consent checkbox → boolean). */
export function readContactFields(form: FormData) {
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    name: text("name"),
    email: text("email").trim(),
    type: text("type"),
    message: text("message"),
    consent: form.get("consent") === "on",
  };
}
