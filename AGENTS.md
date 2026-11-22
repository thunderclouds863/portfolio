# AGENTS.md — Desi Armanda Sari Portfolio

## Source of truth
- Product requirements: docs/PRD.md. Diagrams: docs/uml/.
- docs/PRD.md and docs/intake/ are local-only (git-ignored; the repo is public). If they are
  missing (fresh clone, cloud session, CI), stop and ask Desi for them; do not work from memory.
- If a request conflicts with the PRD, stop and ask. Do not silently diverge.

## Role
Act as a senior frontend engineer and UI designer. Build a production-quality
personal portfolio that positions Desi as a System Analyst who also improves
business processes and builds working systems.

## Content integrity (highest priority)
- Use only facts in content/*.ts, content/projects/*.mdx or PRD section 3 marked Verified.
- Never invent employers, responsibilities, dates, metrics, testimonials,
  certifications, clients or skills.
- Missing content -> leave `TODO(content): <what is needed>`; never fill with plausible text.
- Follow the Content Intake Protocol (PRD 3A): before building any section that needs personal
  content, send an INTAKE REQUEST and wait for Desi's answers. Write only confirmed rows.
- Always state contribution scope (owner / core team / supporting).
- All site copy in English. No banned phrases (PRD section 14).

## Stack
Next.js (App Router, static by default) + TypeScript strict + Tailwind CSS +
Motion (motion/react) + Lucide + Keystatic CMS (Reader API, Markdoc) + Zod. Contact: Server Action +
Resend + Cloudflare Turnstile. Hosting: Vercel. Tests: Vitest, Playwright, axe.
UI primitives: shadcn/ui (Radix) copied into the repo and restyled with tokens.
Supabase (Auth with LinkedIn OIDC + Postgres) only for testimonials (PRD 17).
Content: Keystatic (Git-based, GitHub mode in production, Markdoc bodies) per PRD 18.
AI-seeded content is always saved as Draft. No other CMS, no other database,
no state library unless the PRD changes.
Check current stable versions and official docs before using an API; do not rely on memory.

## Design rules
- Tokens only (PRD section 6). Colors: #050505, #0B140D, #2CFF56, #1F9E3A, #A3B8A8,
  #FFB200, #FFFFFF, #FFD700, #FF0000. No other colors without approval.
- Press Start 2P: display + labels only, weight 400. Body: IBM Plex Sans. Meta: JetBrains Mono.
- Radius 0. Hard pixel shadows. No gradients, glassmorphism, emojis, soft shadows.
- No pricing, logo walls, skill percentage bars. Testimonials only per PRD section 17
  (LinkedIn recommendations with permission + approved "Signed in with LinkedIn" submissions).
- Vary section layouts; never three equal cards in a row.

## Motion rules
- Animate transform and opacity only. Parallax on decorative layers only.
- prefers-reduced-motion disables parallax, typing, blinking and scanlines.
- Mobile (<768px): reveals only. No scroll-jacking, no loading screens.

## Engineering rules
- Server Components by default; 'use client' only at leaves.
- Secrets server-only (`import 'server-only'`); only NEXT_PUBLIC_* in the browser.
- Validate all input with the shared Zod schema on client and server.
- Semantic HTML, WCAG 2.2 AA, visible focus, keyboard support.
- Surgical changes: touch only files needed for the task; no unrelated refactors.
- No new dependency without stating why in the summary.

## Definition of done for any task
1. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.
2. Relevant Playwright tests added or updated and passing.
3. Checked in a browser at 375px and 1280px; no console errors; no horizontal overflow.
4. Summary lists: what changed, how it was verified, what is NOT verified, open TODOs.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
