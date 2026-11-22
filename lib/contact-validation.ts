import type { readContactFields } from "./contact";
import { ContactFieldsSchema, type ContactField, type ContactFields } from "./schema";

// Kept apart from lib/contact.ts so the browser loads Zod only when the form is
// submitted (dynamic import), not with the page. The server uses the same code.

export type ContactValidation =
  | { ok: true; data: ContactFields }
  | { ok: false; fieldErrors: Partial<Record<ContactField, string>> };

/** Shared validation (client and server), first message per field. */
export function validateContactFields(
  raw: ReturnType<typeof readContactFields>,
): ContactValidation {
  const result = ContactFieldsSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: Partial<Record<ContactField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ContactField | undefined;
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return { ok: false, fieldErrors };
}
