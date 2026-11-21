# 0001 — Stack

Status: accepted (Phase 0, 2026-11-21)

## Decision

Next.js 16.4 (App Router) + TypeScript 5.9 strict + Tailwind CSS 4.3 + Vitest 5 + Playwright 1.65 with
@axe-core/playwright, as specified in PRD section 9. Content via Keystatic (PRD section 18), added in Phase 2.

## Deviations from "latest stable"

- **TypeScript 5.9.3, not 7.0.x.** TypeScript 7 (native compiler) is the latest release, but
  create-next-app 16.4.6 scaffolds `typescript@^5` and the Next.js TS plugin targets the 5.x language
  service. Revisit once Next.js documents TS 7 support.
- **ESLint 9.39.5, not 10.x.** create-next-app 16.4.6 scaffolds `eslint@^9`; `eslint-config-next` and its
  plugins are verified against 9. Revisit with the next Next.js minor.

## Template defaults kept

`cacheComponents: true` and `partialPrefetching: true` from the Next.js 16.4 template. Compatible with
a static-first site; re-evaluate in Phase 6B when testimonials use on-demand revalidation.
