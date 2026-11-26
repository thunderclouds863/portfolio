"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

import { submitRecommendation } from "@/app/actions/recommendation";
import { TurnstileWidget, type TurnstileHandle } from "@/components/contact/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { TerminalFrame } from "@/components/ui/terminal-frame";
import { Textarea } from "@/components/ui/textarea";
import {
  HONEYPOT_FIELD,
  RECOMMENDATION_FIELDS,
  RECOMMENDATION_MAX_CHARS,
  RECOMMENDATION_MIN_CHARS,
  readRecommendationFields,
  type RecommendationSubmissionField,
  type RecommendationSubmitState,
} from "@/lib/recommendation-fields";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const relationshipOptions = [
  { value: "colleague", label: "Colleague" },
  { value: "manager", label: "Manager" },
  { value: "client", label: "Client" },
  { value: "lecturer", label: "Lecturer" },
  { value: "classmate", label: "Classmate" },
  { value: "other", label: "Other" },
];

const platformOptions = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "shopee", label: "Shopee" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "google", label: "Google" },
  { value: "other", label: "Other" },
];

/**
 * Public recommendation submission form (Phase 3).
 * Submissions always enter PENDING moderation and are reviewed by the owner
 * before publication — never published automatically.
 */
function RecommendationForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const shownAt = useRef<number>(0);
  const submittingRef = useRef(false);
  const successRef = useRef<HTMLParagraphElement>(null);
  const [state, setState] = useState<RecommendationSubmitState>({ status: "idle" });
  const [token, setToken] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open) shownAt.current = Date.now();
  }, [open, formKey]);

  useEffect(() => {
    if (state.status === "success" && !pending) successRef.current?.focus();
  }, [state.status, pending]);

  const fieldErrors = state.status === "invalid" ? state.fieldErrors : {};

  function focusFirstInvalid(errors: Partial<Record<RecommendationSubmissionField, string>>) {
    const first = RECOMMENDATION_FIELDS.find((f) => errors[f]);
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || submittingRef.current) return;
    submittingRef.current = true;

    const data = new FormData(event.currentTarget);
    const { validateRecommendationFields } = await import("@/lib/recommendation-submission");
    const validation = validateRecommendationFields(readRecommendationFields(data));
    if (!validation.ok) {
      submittingRef.current = false;
      setState({ status: "invalid", fieldErrors: validation.fieldErrors });
      focusFirstInvalid(validation.fieldErrors);
      return;
    }

    data.set("elapsedMs", String(Date.now() - shownAt.current));
    data.set("turnstileToken", token ?? "");

    startTransition(async () => {
      let result: RecommendationSubmitState;
      try {
        result = await submitRecommendation(data);
      } catch {
        result = { status: "network_error" };
      } finally {
        submittingRef.current = false;
      }
      setState(result);
      if (result.status === "invalid") focusFirstInvalid(result.fieldErrors);
      if (result.status !== "success") turnstileRef.current?.reset();
    });
  }

  function resetForm() {
    setState({ status: "idle" });
    setToken(null);
    setCharCount(0);
    setFormKey((k) => k + 1);
  }

  return (
    <TerminalFrame
      as="section"
      title="share-recommendation.sh"
      aria-labelledby="share-rec-title"
      className="min-w-0 overflow-x-clip"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 id="share-rec-title" className="text-h3 text-green">
              Share a Recommendation
            </h2>
            <p className="text-muted max-w-[66ch] text-sm">
              Have we worked together on a system, process improvement, or research project? Submit
              a recommendation below. All submissions enter a private review queue and are reviewed
              before publication — submission does not guarantee publication.
            </p>
          </div>
          {!open ? (
            <Button type="button" onClick={() => setOpen(true)} className="w-full sm:w-auto">
              [ Share a Recommendation ]
            </Button>
          ) : null}
        </div>

        {open ? (
          state.status === "success" && !pending ? (
            <div className="border-green-dim/60 flex flex-col items-start gap-4 border-t border-dashed pt-5">
              <p role="status" aria-live="polite" className="sr-only">
                Recommendation submitted for review.
              </p>
              <p ref={successRef} tabIndex={-1} className="text-display-2 text-green">
                SUBMISSION RECEIVED (PENDING REVIEW)
              </p>
              <p className="max-w-[66ch] text-sm">
                Thank you for sharing your recommendation. It has been queued for owner review and
                will only appear on this page if approved and published.
              </p>
              <Button type="button" variant="secondary" onClick={resetForm}>
                [ Submit another ]
              </Button>
            </div>
          ) : (
            <form
              key={formKey}
              ref={formRef}
              aria-label="Share a Recommendation form"
              noValidate
              onSubmit={onSubmit}
              aria-busy={pending}
              className="border-green-dim/60 flex flex-col gap-5 border-t border-dashed pt-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Full name" required error={fieldErrors.authorName}>
                  {(p) => (
                    <Input {...p} name="authorName" autoComplete="name" maxLength={80} required />
                  )}
                </Field>
                <Field label="Role or title" required error={fieldErrors.authorRole}>
                  {(p) => <Input {...p} name="authorRole" maxLength={100} required />}
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Company or organization" error={fieldErrors.organization}>
                  {(p) => <Input {...p} name="organization" maxLength={100} />}
                </Field>
                <Field label="Relationship" error={fieldErrors.relationship}>
                  {(p) => (
                    <NativeSelect {...p} name="relationship" defaultValue="colleague">
                      {relationshipOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
                <Field label="Platform or context" error={fieldErrors.platform}>
                  {(p) => (
                    <NativeSelect {...p} name="platform" defaultValue="linkedin">
                      {platformOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
              </div>

              <Field
                label="Recommendation"
                required
                hint={`${RECOMMENDATION_MIN_CHARS} to ${RECOMMENDATION_MAX_CHARS} characters. (${charCount} / ${RECOMMENDATION_MAX_CHARS})`}
                error={fieldErrors.text}
              >
                {(p) => (
                  <Textarea
                    {...p}
                    name="text"
                    maxLength={RECOMMENDATION_MAX_CHARS}
                    required
                    onChange={(e) => setCharCount(e.currentTarget.value.length)}
                  />
                )}
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="LinkedIn profile URL (optional)"
                  hint="https://www.linkedin.com/in/..."
                  error={fieldErrors.linkedinUrl}
                >
                  {(p) => <Input {...p} name="linkedinUrl" type="url" maxLength={300} />}
                </Field>
                <Field
                  label="Other profile URL (optional)"
                  hint="https://..."
                  error={fieldErrors.profileUrl}
                >
                  {(p) => <Input {...p} name="profileUrl" type="url" maxLength={300} />}
                </Field>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <input
                    id="rec-consent"
                    name="consent"
                    type="checkbox"
                    required
                    aria-invalid={fieldErrors.consent ? true : undefined}
                    aria-describedby={fieldErrors.consent ? "rec-consent-error" : undefined}
                    className="accent-amber mt-0.5 size-6 shrink-0"
                  />
                  <label htmlFor="rec-consent" className="text-sm">
                    I confirm this recommendation is my own and may be reviewed and displayed
                    publicly on this portfolio if approved.
                  </label>
                </div>
                {fieldErrors.consent ? (
                  <p id="rec-consent-error" className="text-red text-sm">
                    {fieldErrors.consent}
                  </p>
                ) : null}
              </div>

              {/* Honeypot: hidden from people and assistive technology. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="rec-website">Website</label>
                <input
                  id="rec-website"
                  name={HONEYPOT_FIELD}
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {SITE_KEY ? (
                <TurnstileWidget
                  ref={turnstileRef}
                  siteKey={SITE_KEY}
                  onToken={setToken}
                  onError={() => setToken(null)}
                />
              ) : (
                <p className="text-meta text-amber">
                  [ MISSING: NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set ]
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" disabled={pending}>
                  {pending ? "SUBMITTING..." : "[ Submit for review ]"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                >
                  [ Cancel ]
                </Button>
              </div>

              <div role="status" aria-live="polite" className="text-sm">
                {pending ? (
                  <span className="sr-only">Submitting your recommendation for review.</span>
                ) : state.status !== "idle" ? (
                  <p className="text-red">{errorMessage(state.status)}</p>
                ) : null}
              </div>
            </form>
          )
        ) : null}
      </div>
    </TerminalFrame>
  );
}

function errorMessage(status: RecommendationSubmitState["status"]): string {
  switch (status) {
    case "invalid":
      return "Please fix the highlighted fields.";
    case "too_fast":
      return "That was quick. Please wait a moment and submit again.";
    case "rate_limited":
      return "Too many submissions recently. Please wait a few minutes and try again.";
    case "duplicate":
      return "A matching recommendation was already submitted recently.";
    case "verification_failed":
      return "The security check did not pass. Please try again.";
    case "delivery_failed":
      return "Your submission could not be queued right now. Please try again later.";
    case "network_error":
      return "No connection to the server. Please check your connection and try again.";
    default:
      return "";
  }
}

export { RecommendationForm };
