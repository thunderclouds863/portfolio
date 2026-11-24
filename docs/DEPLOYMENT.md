# Deployment checklist (PRD section 13)

Follow the steps in order. Each step says **who** does it:

- **YOU**: needs your accounts, payment, DNS or secrets. Done in a browser dashboard.
- **CLI**: Can be run from the terminal once you have installed and signed in to the
  tool named in step 0. Confirm before every command that changes something outside this
  folder (pushing, creating the repo, changing settings).

**Secrets never go in the chat.** The "Where to set it" column says where each one is typed. A
secret is only ever pasted into the Vercel dashboard (or into `.env.local` on your own computer
for local testing). The GitHub Actions workflow needs no secrets.

---

## Before you start: two decisions

### A. The content is still Draft

The production build shows only **Published** content. Today every entry is Draft, so a production
deploy shows `[ MISSING: â€¦ ]` markers in place of the hero, about, experience and projects.

Before step 8 (Release), confirm the sentences in `docs/intake/case-study-claims.md`, answer the
open content questions (E2 has 5 bullets and E5 has 1, the CV PDF without the phone number, the
Hospital ERP period, project capabilities), and set each entry to **Published** in Keystatic.
Steps 1â€“7 can be done before that: the Vercel URL is not linked from anywhere yet.

### B. Main branch

The workflow runs on pull requests and on pushes to `main`. Locally the default branch is still
`master` (only the Create Next App commit); the work is on the stacked `phase-*` branches.

---

## Step 0. Tools (YOU, once)

| Tool       | Install                     | Sign in                          |
| ---------- | --------------------------- | -------------------------------- |
| GitHub CLI | `winget install GitHub.cli` | `gh auth login` (browser, HTTPS) |
| Vercel CLI | `npm i -g vercel`           | `vercel login`                   |

You sign in yourself; tokens stay local to your CLI session. Without these tools, every CLI step below can
also be done by hand in the dashboards.

---

## Step 1. Repository (mixed)

| #   | Who | Task                                                                                                                                                                                                                                         |
| --- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | YOU | GitHub account: turn on two-factor authentication (Settings â†’ Password and authentication).                                                                                                                                                |
| 1.2 | CLI | Rename `master` to `main` and fast-forward it to `phase-8/ci` (local, reversible).                                                                                                                                                           |
| 1.3 | CLI | `gh repo create <name> --private --source . --push` (or public, your choice), then push `main`. Before pushing, check that no company data is in the history (you said you clean repos yourself; list the files that would be pushed first). |
| 1.4 | CLI | Branch protection on `main`: require a pull request and the `Lint, test, build, e2e` and `Lighthouse CI` status checks (`gh api` call, shown to you before it runs).                                                                         |
| 1.5 | CLI | Open a test PR (for example the Phase 9 branch) so the workflow runs on GitHub for the first time. This is the "workflow passes on a test PR" check from Phase 8.                                                                            |
| 1.6 | YOU | Repository â†’ Settings â†’ Code security: turn on **Dependabot alerts** and **Dependabot security updates**. Version updates start by themselves from `.github/dependabot.yml`.                                                             |

## Step 2. Domain (YOU)

| #   | Who | Task                                                                |
| --- | --- | ------------------------------------------------------------------- |
| 2.1 | YOU | Buy the domain (for example `<name>.com`, `.dev` or `.my.id`).      |
| 2.2 | YOU | At the registrar: turn on two-factor authentication and auto-renew. |

## Step 3. Vercel project (mixed)

| #   | Who        | Task                                                                                                                                                                                                                                                           |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | YOU        | Create the Vercel account (Hobby is for personal, non-commercial use, which fits a personal portfolio; read the plan terms once).                                                                                                                              |
| 3.2 | YOU or CLI | Import the GitHub repo: dashboard **Add New â†’ Project**, framework preset **Next.js**, defaults for build and output. (CLI: `vercel link`, then the Git connection is made in the dashboard.) Note: importing deploys `main` straight away (see decision A). |
| 3.3 | YOU        | Add the environment variables from the table below in **Project â†’ Settings â†’ Environment Variables**, choosing **Production** and **Preview** separately.                                                                                                  |
| 3.4 | CLI        | `vercel env ls` to confirm every name exists in both environments (names only, values are never printed).                                                                                                                                                      |

### Environment variables

Where to set them: **Vercel â†’ Project â†’ Settings â†’ Environment Variables**. For local testing the same
names go in `.env.local` (never committed). Values marked secret are only ever pasted there.

| Name                                    | Production value                                                | Preview value                                       | Secret? | Where the value comes from                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                  | `https://<your-domain>` (the canonical host, no trailing slash) | leave empty or the preview URL                      | no      | your domain. **Must start with `https://`**: canonical URLs, the sitemap and the `upgrade-insecure-requests` CSP rule depend on it |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`        | production site key                                             | `1x00000000000000000000AA` (Cloudflare test key)    | no      | Cloudflare â†’ Turnstile â†’ your widget (step 6)                                                                                  |
| `TURNSTILE_SECRET_KEY`                  | production secret key                                           | `1x0000000000000000000000000000000AA` (test secret) | **yes** | same widget page                                                                                                                   |
| `RESEND_API_KEY`                        | sending-only key                                                | same key, or a second sending-only key              | **yes** | Resend â†’ API Keys (step 5)                                                                                                       |
| `CONTACT_TO_EMAIL`                      | the inbox for messages (for example desi.arr863@gmail.com)      | same                                                | no      | you                                                                                                                                |
| `CONTACT_FROM_EMAIL`                    | `Portfolio <portfolio@<your-domain>>`                           | same                                                | no      | an address on the Resend-verified domain                                                                                           |
| `NEXT_PUBLIC_KEYSTATIC_STORAGE`         | `github`                                                        | `github`                                            | no      | fixed value                                                                                                                        |
| `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO`     | `<github-user>/<repo>`                                          | same                                                | no      | step 1.3                                                                                                                           |
| `KEYSTATIC_GITHUB_CLIENT_ID`            | from step 3.5                                                   | same                                                | no      | Keystatic GitHub App                                                                                                               |
| `KEYSTATIC_GITHUB_CLIENT_SECRET`        | from step 3.5                                                   | same                                                | **yes** | Keystatic GitHub App                                                                                                               |
| `KEYSTATIC_SECRET`                      | from step 3.5                                                   | same                                                | **yes** | generated by the setup flow                                                                                                        |
| `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | from step 3.5                                                   | same                                                | no      | Keystatic GitHub App                                                                                                               |

Never set `CONTACT_TEST_MODE`, `ENABLE_STYLEGUIDE` or `CONTENT_DRAFT_PREVIEW` on Vercel; they are for
tests and local work only (test mode is refused when `VERCEL_ENV=production`).

Testimonials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `CRON_SECRET`) come
later with Phase 6B part 2, after Supabase and the LinkedIn app exist. Their setup steps will be a
separate checklist at that point.

### 3.5 Keystatic on the live site (mixed)

Needed so you can edit content at `https://<your-domain>/keystatic` (PRD 18).

| #     | Who | Task                                                                                                                                                                                                                                                |
| ----- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.5.1 | CLI | Locally, set `NEXT_PUBLIC_KEYSTATIC_STORAGE=github` and `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO=<user>/<repo>` in `.env.local` (no secrets), start `npm run dev`.                                                                                        |
| 3.5.2 | YOU | Open `http://localhost:3000/keystatic` and follow Keystatic's "Create GitHub App" flow in your browser. It creates the app on your GitHub account and writes the four `KEYSTATIC_*` values into `.env.local` itself; nothing goes through the chat. |
| 3.5.3 | YOU | GitHub â†’ Settings â†’ Developer settings â†’ GitHub Apps â†’ your Keystatic app: add the callback URL `https://<your-domain>/api/keystatic/github/oauth/callback` (keep the localhost one). Install the app on the portfolio repo only.           |
| 3.5.4 | YOU | Copy the four `KEYSTATIC_*` values from `.env.local` into Vercel (table above).                                                                                                                                                                     |

## Step 4. Custom domain (YOU)

| #   | Who | Task                                                                                                            |
| --- | --- | --------------------------------------------------------------------------------------------------------------- |
| 4.1 | YOU | Vercel â†’ Project â†’ Settings â†’ Domains: add the apex (`<domain>`) and `www.<domain>`.                      |
| 4.2 | YOU | At the registrar, create exactly the DNS records Vercel shows (an A record for the apex and a CNAME for `www`). |
| 4.3 | YOU | In Vercel, set one to redirect to the other (apex as canonical is usual), matching `NEXT_PUBLIC_SITE_URL`.      |
| 4.4 | YOU | Wait for "Valid Configuration" and the certificate.                                                             |

## Step 5. Resend (YOU)

| #   | Who | Task                                                                                                                                  |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | YOU | Resend â†’ Domains â†’ Add domain: the domain or a subdomain such as `mail.<domain>`.                                                 |
| 5.2 | YOU | Add the DNS records Resend shows (SPF/MX and DKIM) at the registrar; wait for "Verified".                                             |
| 5.3 | YOU | Add a DMARC record: TXT on `_dmarc.<domain>` with `v=DMARC1; p=none;` to start.                                                       |
| 5.4 | YOU | Resend â†’ API Keys â†’ Create: permission **Sending access**, limited to this domain. Paste it only into Vercel as `RESEND_API_KEY`. |

## Step 6. Turnstile (YOU)

| #   | Who | Task                                                                                                                                                                    |
| --- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | YOU | Cloudflare â†’ Turnstile â†’ Add widget: mode **Managed**, hostnames `<domain>` and `www.<domain>`.                                                                     |
| 6.2 | YOU | Put the site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the secret in `TURNSTILE_SECRET_KEY` (Production only). Previews keep the Cloudflare test keys from the table. |

## Step 7. Analytics (mixed)

| #   | Who | Task                                                                                                                                                                                                                                                                                               |
| --- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | YOU | Vercel â†’ Project â†’ Analytics and Speed Insights: enable both.                                                                                                                                                                                                                                  |
| 7.2 | CLI | Add `@vercel/analytics` and `@vercel/speed-insights` (two new dependencies; needs your OK) and render their components in the root layout. Their scripts load from the site's own origin (`/_vercel/â€¦`), which the current CSP already allows; the post-deploy check confirms no CSP violations. |
| 7.3 | CLI | Add Vercel Analytics and Speed Insights to the processors listed on `/privacy`.                                                                                                                                                                                                                    |

## Step 8. Release (mixed)

| #   | Who | Task                                                                                          |
| --- | --- | --------------------------------------------------------------------------------------------- |
| 8.1 | YOU | Publish the confirmed content (decision A).                                                   |
| 8.2 | CLI | Open the release PR to `main`; CI must be green (lint, tests, build, e2e, audit, Lighthouse). |
| 8.3 | YOU | Merge it. Vercel deploys production; watch the build log in the Vercel dashboard.             |
| 8.4 | YOU | Confirm the deploy is done and the production URL.                                            |
| 8.5 | CLI | Run the post-deploy checklist below and report.                                               |

## Step 9. Search (YOU)

| #   | Who | Task                                                                                                    |
| --- | --- | ------------------------------------------------------------------------------------------------------- |
| 9.1 | YOU | Google Search Console â†’ Add property â†’ **Domain** â†’ add the TXT record it shows at the registrar. |
| 9.2 | YOU | Sitemaps â†’ submit `https://<domain>/sitemap.xml`.                                                     |

## Step 10. Monitoring (YOU)

| #    | Who | Task                                                                                                                                                |
| ---- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10.1 | YOU | Create a free uptime monitor (for example UptimeRobot or Better Stack) for `https://<domain>/`, checking every 5 minutes, with email alerts to you. |

---

## Post-deploy checklist (PRD 13)

Automated by `npm run deploy:check -- https://<domain>` (`scripts/post-deploy-check.mjs`), plus
`curl -I` on the main routes and the link checker against the live site.

| Check                                                                   | How                                                                                                                                                         | Who |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| Every route returns 200; unknown routes return 404                      | `deploy:check` (routes from the sitemap plus fixed ones)                                                                                                    | CLI |
| HTTPS valid; `http://` and `www` redirect correctly                     | `deploy:check` (certificate expiry, redirect status and target)                                                                                             | CLI |
| Security headers present                                                | `deploy:check` and `curl -I` (CSP with `upgrade-insecure-requests`, HSTS, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, no `X-Powered-By`) | CLI |
| sitemap.xml and robots.txt correct                                      | `deploy:check` (absolute `https://<domain>` URLs, admin and dev routes disallowed)                                                                          | CLI |
| OG tags and image                                                       | `deploy:check` (og:title, og:image as absolute HTTPS, twitter:card, 1200x630 PNG)                                                                           | CLI |
| No broken links                                                         | `npm run links:check -- https://<domain>`                                                                                                                   | CLI |
| Lighthouse mobile â‰¥ 95 on the production URL                          | `npx @lhci/cli@0.16.1 collect --url=https://<domain>/`                                                                                                      | CLI |
| Zero console errors and CSP violations                                  | headless browser pass over every route                                                                                                                      | CLI |
| Contact form delivers a real email; spam folder checked; reply-to works | send one message from your phone                                                                                                                            | YOU |
| CV PDF downloads with the correct file name                             | open `/cv`, click Download (once the PDF exists)                                                                                                            | YOU |
| OG preview renders on LinkedIn and WhatsApp                             | paste the URL into the LinkedIn post composer and a WhatsApp chat                                                                                           | YOU |
| Real iPhone (Safari) and Android (Chrome) pass                          | PRD 12 manual QA checklist                                                                                                                                  | YOU |

## Rollback

Vercel â†’ Project â†’ Deployments â†’ the previous production deployment â†’ **Instant Rollback**. Then fix
forward on a branch and merge through a PR. Never edit production by hand.
