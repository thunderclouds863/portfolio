"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

import { sendContact } from "@/app/actions/contact";
import { TurnstileWidget, type TurnstileHandle } from "@/components/contact/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_FIELDS,
  HONEYPOT_FIELD,
  readContactFields,
  type ContactState,
} from "@/lib/contact";
import type { ContactField } from "@/lib/schema";

const inquiryTypes = [
  { value: "job", label: "Job opportunity" },
  { value: "freelance", label: "Freelance project" },
  { value: "collaboration", label: "Collaboration" },
  { value: "other", label: "Other" },
];

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type ContactFormProps = {
  /** mailto: link from the Profile (IN-10), shown when sending fails (FR-CF-05/06). */
  fallbackEmail: string | null;
};

/**
 * FR-CF-01…06 — states from PRD 8.6: idle/editing, invalid (field errors, focus
 * the first), submitting ("TRANSMITTING..."), success ("MESSAGE RECEIVED"),
 * verification / delivery / network errors with retry and a direct email link.
 * Every state change is announced through the polite live region.
 */
function ContactForm({ fallbackEmail }: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const shownAt = useRef<number>(0);
  const successRef = useRef<HTMLParagraphElement>(null);
  const [state, setState] = useState<ContactState>({ status: "idle" });
  const [token, setToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Bumped after a successful send to remount an empty form.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    shownAt.current = Date.now();
  }, [formKey]);

  // The form is replaced on success: move focus to the confirmation.
  useEffect(() => {
    if (state.status === "success" && !pending) successRef.current?.focus();
  }, [state.status, pending]);

  const fieldErrors = state.status === "invalid" ? state.fieldErrors : {};

  function focusFirstInvalid(errors: Partial<Record<ContactField, string>>) {
    const first = CONTACT_FIELDS.find((f) => errors[f]);
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);

    // Zod is loaded on first submit only, keeping it out of the first-load JS.
    const { validateContactFields } = await import("@/lib/contact-validation");
    const validation = validateContactFields(readContactFields(data));
    if (!validation.ok) {
      setState({ status: "invalid", fieldErrors: validation.fieldErrors });
      focusFirstInvalid(validation.fieldErrors);
      return;
    }

    data.set("elapsedMs", String(Date.now() - shownAt.current));
    data.set("turnstileToken", token ?? "");

    startTransition(async () => {
      let result: ContactState;
      try {
        result = await sendContact(data);
      } catch {
        result = { status: "network_error" };
      }
      setState(result);
      if (result.status === "invalid") focusFirstInvalid(result.fieldErrors);
      // A Turnstile token is single-use: get a fresh one for any retry.
      if (result.status !== "success") turnstileRef.current?.reset();
    });
  }

  function sendAnother() {
    setState({ status: "idle" });
    setToken(null);
    setFormKey((k) => k + 1);
  }

  const announcement = pending ? "Sending your message." : statusMessage(state.status);

  if (state.status === "success" && !pending) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
        <p ref={successRef} tabIndex={-1} className="text-display-2 text-green glow">
          MESSAGE RECEIVED
        </p>
        <p>Thank you. Your message was delivered and you will get a reply by email.</p>
        <Button variant="secondary" onClick={sendAnother}>
          [ Send another message ]
        </Button>
      </div>
    );
  }

  return (
    <form
      key={formKey}
      ref={formRef}
      aria-label="Contact form"
      noValidate
      onSubmit={onSubmit}
      aria-busy={pending}
      className="flex flex-col gap-6"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Name" required error={fieldErrors.name}>
          {(p) => <Input {...p} name="name" autoComplete="name" maxLength={80} required />}
        </Field>
        <Field label="Email" required error={fieldErrors.email}>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" required />}
        </Field>
      </div>
      <Field label="Inquiry type" required error={fieldErrors.type}>
        {(p) => (
          <NativeSelect {...p} name="type" defaultValue="" required>
            <option value="" disabled>
              Choose a type
            </option>
            {inquiryTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        )}
      </Field>
      <Field label="Message" required hint="20 to 2000 characters." error={fieldErrors.message}>
        {(p) => <Textarea {...p} name="message" maxLength={2000} required />}
      </Field>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <input
            id="contact-consent"
            name="consent"
            type="checkbox"
            required
            aria-invalid={fieldErrors.consent ? true : undefined}
            aria-describedby={fieldErrors.consent ? "contact-consent-error" : undefined}
            className="accent-amber mt-0.5 size-6 shrink-0"
          />
          <label htmlFor="contact-consent" className="text-sm">
            I agree that my name, email and message are used to reply to this inquiry, as described
            in the{" "}
            <Link
              href="/privacy"
              className="text-green hover:text-amber underline underline-offset-4"
            >
              privacy notice
            </Link>
            .
          </label>
        </div>
        {fieldErrors.consent ? (
          <p id="contact-consent-error" className="text-red text-sm">
            {fieldErrors.consent}
          </p>
        ) : null}
      </div>

      {/* Honeypot (FR-CF-03): hidden from people and assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
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
          [ MISSING: NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set (see .env.example) ]
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "TRANSMITTING..." : "[ Send message ]"}
        </Button>
      </div>

      <div role="status" aria-live="polite" className="text-sm">
        {pending ? (
          <span className="sr-only">{announcement}</span>
        ) : state.status !== "idle" ? (
          <StatusMessage status={state.status} fallbackEmail={fallbackEmail} />
        ) : null}
      </div>
    </form>
  );
}

function statusMessage(status: ContactState["status"]): string {
  switch (status) {
    case "invalid":
      return "Please fix the highlighted fields.";
    case "too_fast":
      return "That was quick. Please wait a moment, then send again.";
    case "verification_failed":
      return "The security check did not pass. Please try again.";
    case "delivery_failed":
      return "Your message could not be sent right now.";
    case "network_error":
      return "No connection to the server. Check your connection and try again.";
    case "success":
      return "Message received.";
    default:
      return "";
  }
}

function StatusMessage({
  status,
  fallbackEmail,
}: {
  status: ContactState["status"];
  fallbackEmail: string | null;
}) {
  const isError = status !== "success";
  const offerEmail =
    status === "delivery_failed" || status === "network_error" || status === "verification_failed";
  return (
    <p className={isError ? "text-red" : "text-green"}>
      {statusMessage(status)}
      {offerEmail ? (
        fallbackEmail ? (
          <>
            {" "}
            You can also write directly to{" "}
            <a
              href={fallbackEmail}
              className="text-green hover:text-amber underline underline-offset-4"
            >
              {fallbackEmail.replace(/^mailto:/, "")}
            </a>
            .
          </>
        ) : (
          " Please try again later."
        )
      ) : null}
    </p>
  );
}

export { ContactForm };
