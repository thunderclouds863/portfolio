# Desi Armanda Sari — Portfolio

Personal portfolio for Desi Armanda Sari (System Analyst · Business Process Improvement · System Development).
Requirements: [`docs/PRD.md`](docs/PRD.md). Diagrams: [`docs/uml/`](docs/uml). Agent rules: [`AGENTS.md`](AGENTS.md).

## Stack

Next.js 16 (App Router, static by default) · TypeScript (strict) · Tailwind CSS 4 · Vitest · Playwright + axe.
Also: shadcn/ui (Radix), Lucide, Keystatic + Markdoc (content), Zod. Later phases: Motion, Resend, Cloudflare Turnstile, Supabase (testimonials only).

## Requirements

- Node.js 24 LTS or newer (`node -v`)
- npm 11 or newer

## Setup

```bash
npm ci
cp .env.example .env.local   # fill in values; never commit .env.local
npx playwright install chromium
npm run dev                  # http://localhost:3000
```

Environment variables are listed in `.env.example` (PRD section 13). Variables starting with
`NEXT_PUBLIC_` reach the browser; all others are server-only.

## Scripts

| Script                                    | What it does                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run dev`                             | Development server                                                                           |
| `npm run build` / `npm run start`         | Production build / serve it                                                                  |
| `npm run lint`                            | ESLint                                                                                       |
| `npm run typecheck`                       | Generate route types, then `tsc --noEmit`                                                    |
| `npm run format` / `npm run format:check` | Prettier write / check                                                                       |
| `npm run test`                            | Unit tests (Vitest, `tests/unit`)                                                            |
| `npm run test:e2e`                        | End-to-end + accessibility tests (Playwright, `tests/e2e`); builds and starts the app itself |

## Contact form

The form posts to a Server Action (`app/actions/contact.ts`): honeypot, 3-second minimum, shared Zod
validation, Cloudflare Turnstile (`lib/turnstile.ts`), then a plain-text email through Resend
(`lib/email.ts`). Nothing is stored; logs contain error codes only.

| Variable                         | Where            | Local development                                   |
| -------------------------------- | ---------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | browser + server | `1x00000000000000000000AA` (Cloudflare test key)    |
| `TURNSTILE_SECRET_KEY`           | server only      | `1x0000000000000000000000000000000AA` (test secret) |
| `RESEND_API_KEY`                 | server only      | a Resend key with sending access                    |
| `CONTACT_TO_EMAIL`               | server only      | your inbox                                          |
| `CONTACT_FROM_EMAIL`             | server only      | an address on a Resend-verified domain              |

Without Resend, set `CONTACT_TEST_MODE=1` in `.env.local` to simulate delivery (refused on Vercel
production). The Playwright build always runs in test mode and fakes the Turnstile script.

## Generated files

`scripts/generate-routes.mjs` writes `lib/generated/project-slugs.json` (published case-study slugs,
git-ignored) before `dev`, `build` and `typecheck`. `proxy.ts` uses it so unknown
`/projects/<slug>` URLs return HTTP 404.

## Editing content

Content is managed with Keystatic (PRD section 18): run `npm run dev` and open
<http://localhost:3000/keystatic>. Files live in `content/`; only **Published** entries render.
`npm run build` first runs `npm run content:check`, which fails on invalid published content.
Step-by-step guide: [`docs/EDITING.md`](docs/EDITING.md).

## Deployment and rollback

Vercel with Git integration: every PR gets a preview, merging to `main` deploys production.
Rollback: Vercel "Instant Rollback" to the previous production deployment, then fix forward on a branch.
Full runbook: PRD section 13 (completed in Phase 9).
