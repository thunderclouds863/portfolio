import Link from "next/link";

import { Missing } from "@/components/content/missing";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

// FR-CF-01 fields, UI only. Sending (Server Action, Turnstile, Resend) is Phase 6;
// until then the submit button is disabled, so the form cannot be submitted.
// Native controls so the form renders and is operable without JavaScript.
const inquiryTypes = [
  { value: "job", label: "Job opportunity" },
  { value: "freelance", label: "Freelance project" },
  { value: "collaboration", label: "Collaboration" },
  { value: "other", label: "Other" },
];

function ContactForm() {
  return (
    <form aria-label="Contact form" method="post" noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Name" required>
          {(p) => (
            <Input {...p} name="name" autoComplete="name" minLength={2} maxLength={80} required />
          )}
        </Field>
        <Field label="Email" required>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" required />}
        </Field>
      </div>
      <Field label="Inquiry type" required>
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
      <Field label="Message" required hint="20 to 2000 characters.">
        {(p) => <Textarea {...p} name="message" minLength={20} maxLength={2000} required />}
      </Field>
      <div className="flex items-start gap-3">
        <input
          id="contact-consent"
          name="consent"
          type="checkbox"
          required
          className="accent-amber mt-0.5 size-6 shrink-0"
        />
        <label htmlFor="contact-consent" className="text-sm">
          I agree that my name, email and message are used to reply to this inquiry, as described in
          the{" "}
          <Link
            href="/privacy"
            className="text-green hover:text-amber underline underline-offset-4"
          >
            privacy notice
          </Link>
          .
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled>
          [ Send message ]
        </Button>
        <Missing what="form sending is wired up in Phase 6" />
      </div>
    </form>
  );
}

export { ContactForm };
