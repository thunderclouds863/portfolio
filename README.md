# Desi Armanda Sari — Portfolio

Personal portfolio for Desi Armanda Sari (System Analyst · Business Process Improvement · System Development).
Requirements: [`docs/PRD.md`](docs/PRD.md). Diagrams: [`docs/uml/`](docs/uml). Agent rules: [`AGENTS.md`](AGENTS.md).

## Stack

Next.js 16 (App Router, static by default) · TypeScript (strict) · Tailwind CSS 4 · Vitest · Playwright + axe.
Added in later phases: Motion, Lucide, shadcn/ui, Keystatic (content), Zod, Resend, Cloudflare Turnstile, Supabase (testimonials only).

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

## Editing content

Content will be edited through Keystatic at `/keystatic` (PRD section 18). This is set up in Phase 2,
and `docs/EDITING.md` will describe the workflow.

## Deployment and rollback

Vercel with Git integration: every PR gets a preview, merging to `main` deploys production.
Rollback: Vercel "Instant Rollback" to the previous production deployment, then fix forward on a branch.
Full runbook: PRD section 13 (completed in Phase 9).
