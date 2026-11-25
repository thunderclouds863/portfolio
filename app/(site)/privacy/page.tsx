import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Missing } from "@/components/content/missing";
import { getHomeData } from "@/lib/home-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description:
    "What the contact and recommendation forms collect, why it is processed, and who handles delivery.",
  path: "/privacy",
});

const LAST_UPDATED = "25 November 2026";

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

// PRD section 10 (Privacy) and Phase 7E.1: plain English disclosure covering both
// the contact form and the moderated public recommendation form on /testimonials.
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
          This page explains what happens to the information you send through the contact form and
          the recommendation submission form on this site, and who helps deliver it.
        </p>
      </header>

      <Part id="privacy-collect" title="What the contact form collects">
        <ul className="flex list-[square] flex-col gap-1 pl-5">
          <li>Your name</li>
          <li>Your email address</li>
          <li>The type of inquiry you choose</li>
          <li>Your message</li>
          <li>Your agreement to this notice (the consent checkbox)</li>
          <li>
            Your IP address and browser signals, which Cloudflare Turnstile uses for the bot check
          </li>
        </ul>
      </Part>

      <Part id="privacy-recommendations" title="What the recommendation form collects">
        <ul className="flex list-[square] flex-col gap-1 pl-5">
          <li>Your full name and role or title</li>
          <li>Your company or organization (optional)</li>
          <li>Your relationship and platform or context selection</li>
          <li>
            Your recommendation text, including any personal or work details you choose to include
            in the free-text field
          </li>
          <li>Your LinkedIn or other profile URL (optional)</li>
          <li>Your confirmation that the recommendation may be reviewed and displayed publicly</li>
          <li>
            Your IP address and browser signals for Cloudflare Turnstile verification and temporary
            in-memory spam and duplicate checks
          </li>
        </ul>
      </Part>

      <Part id="privacy-why" title="Why">
        <p>
          Contact form messages are used only to read your inquiry and reply to it. Recommendation
          submissions are used only for manual review by the site owner to decide whether to publish
          the recommendation on the Recommendations page. Neither form is used for marketing or
          advertising.
        </p>
      </Part>

      <Part id="privacy-storage" title="Where it is kept">
        <p>
          Submissions from both forms are not stored in a database on this site. When you submit
          either form, the information is delivered as a plain-text email to the site owner&apos;s
          private inbox, where only the site owner has access to it.
        </p>
        <p>
          Recommendations are never published automatically. A submitted recommendation appears
          publicly on this site only if the site owner manually approves and publishes it through
          the site&apos;s content management workflow.
        </p>
        <p>
          Temporary rate-limiting and duplicate-submission checks run in short-lived server memory
          only and are not persisted across restarts. No automated retention period is enforced on
          delivered emails; emails remain in the owner&apos;s inbox until manually archived or
          deleted.
        </p>
        <p>
          Server logs record status codes and error types only. They never contain your message,
          recommendation text, or email address.
        </p>
      </Part>

      <Part id="privacy-processors" title="Who processes it">
        <ul className="flex list-[square] flex-col gap-2 pl-5">
          <li>
            <strong className="text-white">Vercel</strong> hosts this website and runs the server
            code that handles both forms.
          </li>
          <li>
            <strong className="text-white">Resend</strong> delivers contact messages and pending
            recommendation review notifications as plain-text emails.
          </li>
          <li>
            <strong className="text-white">Cloudflare Turnstile</strong> checks that form
            submissions are sent by a person and not a bot.
          </li>
        </ul>
      </Part>

      <Part id="privacy-cookies" title="Cookies and analytics">
        <p>This site does not set cookies for tracking or advertising.</p>
      </Part>

      <Part id="privacy-rights" title="Your choices">
        <p>
          You can ask for your contact message, pending recommendation email, or published
          recommendation to be corrected or removed, or ask what information from you is held, by
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
