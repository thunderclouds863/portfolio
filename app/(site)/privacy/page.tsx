import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Missing } from "@/components/content/missing";
import { getHomeData } from "@/lib/home-data";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the contact form collects, why, and who processes it.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "22 November 2026";

function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-h3 text-green">
        {title}
      </h2>
      {children}
    </section>
  );
}

// PRD section 10 (Privacy) and FR-CF-01: plain English, processors named,
// contact for deletion requests. Testimonial sign-in is added in Phase 6B (FR-TST-11).
export default async function PrivacyPage() {
  const { profile } = await getHomeData();
  const email = profile?.links.find((l) => l.icon === "email" && l.url)?.url ?? null;
  const contact = email ? (
    <a href={email} className="text-green hover:text-amber underline underline-offset-4">
      {email.replace(/^mailto:/, "")}
    </a>
  ) : (
    <Missing what="contact email for deletion requests (IN-10)" />
  );

  return (
    <article className="mx-auto flex max-w-[760px] flex-col gap-10 px-4 py-16 md:px-6 md:py-24 [&_p]:max-w-[68ch] [&_ul]:max-w-[68ch]">
      <header className="flex flex-col gap-4">
        <h1 className="text-display-1 text-green glow">Privacy</h1>
        <p className="text-meta text-muted">Last updated: {LAST_UPDATED}</p>
        <p>
          This page explains what happens to the information you send through the contact form on
          this site, and who helps deliver it.
        </p>
      </header>

      <Part id="privacy-collect" title="What the contact form collects">
        <ul className="flex list-[square] flex-col gap-1 pl-5">
          <li>Your name</li>
          <li>Your email address</li>
          <li>The type of inquiry you choose</li>
          <li>Your message</li>
          <li>Your agreement to this notice (the consent checkbox)</li>
        </ul>
      </Part>

      <Part id="privacy-why" title="Why">
        <p>
          Only to read your message and reply to it. It is not used for marketing or shared for any
          other purpose.
        </p>
      </Part>

      <Part id="privacy-storage" title="Where it is kept">
        <p>
          Messages are not stored in a database on this site. When you send the form, your message
          is delivered as an email to the site owner&apos;s inbox, and it exists only there.
        </p>
        <p>
          Server logs record status codes and error types only. They never contain your message or
          your email address.
        </p>
      </Part>

      <Part id="privacy-processors" title="Who processes it">
        <ul className="flex list-[square] flex-col gap-2 pl-5">
          <li>
            <strong className="text-white">Vercel</strong> hosts this website and runs the code that
            handles the contact form.
          </li>
          <li>
            <strong className="text-white">Resend</strong> delivers the contact form message as an
            email.
          </li>
          <li>
            <strong className="text-white">Cloudflare Turnstile</strong> checks that the form is
            sent by a person and not a bot.
          </li>
        </ul>
      </Part>

      <Part id="privacy-cookies" title="Cookies and analytics">
        <p>This site does not set cookies for tracking or advertising.</p>
      </Part>

      <Part id="privacy-rights" title="Your choices">
        <p>
          You can ask for your message to be deleted, or ask what information from you is held, by
          writing to {contact}.
        </p>
        <p>
          This notice is written in the spirit of Indonesia&apos;s Personal Data Protection Law (UU
          No. 27/2022). It is not legal advice.
        </p>
      </Part>
    </article>
  );
}
