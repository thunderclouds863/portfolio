// PRD section 10 (email header injection): CR and LF are removed from any value
// that ends up in an email header (subject, display name), and runs of
// whitespace collapse to one space so the header stays on a single line.
export function stripLineBreaks(value: string): string {
  return value
    .replace(/[\r\n\u0085\u2028\u2029]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Inquiry type labels for the email subject (FR-CF-01 / FR-CF-04). */
export const inquiryTypeLabel = {
  job: "Job opportunity",
  freelance: "Freelance project",
  collaboration: "Collaboration",
  other: "Other",
} as const;

export type InquiryTypeValue = keyof typeof inquiryTypeLabel;

/** FR-CF-04: "[Portfolio] <type> — <name>", single line. */
export function contactSubject(type: InquiryTypeValue, name: string): string {
  return stripLineBreaks(`[Portfolio] ${inquiryTypeLabel[type]} — ${name}`);
}
