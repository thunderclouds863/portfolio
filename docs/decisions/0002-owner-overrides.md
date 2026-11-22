# 0002 — Owner overrides of the PRD

Status: accepted (2026-11-22, decided by Desi in the build session)

AGENTS.md says a request that conflicts with the PRD must be confirmed first. These were
confirmed by the owner; this note records them so later work does not "fix" them back.

## 1. CV PDF: the owner's own file, including the phone number

- **PRD:** section 10 / intake answer: the phone number is not shown on the site; FR-CV-02 CV PDF.
- **Decision:** `public/cv/desi-armanda-sari-cv.pdf` is Desi's own CV file, served as-is (not
  generated from `/cv`). It includes her phone number by her choice. The HTML pages still never
  show the phone number.
- **Consequence:** the phone number is public through the PDF. To undo, replace the file with a
  version without it (docs/EDITING.md, "Update the CV PDF").

## 2. Hero: real photo instead of a CSS/SVG-only scene

- **PRD:** FR-HERO-02 (no raster image in the hero, so the H1 is the LCP element); section 3 allows
  "a real photo or a pixel-art avatar".
- **Decision:** the hero shows Desi's real photo, blended into the dark theme and layered with the
  parallax decoration.
- **Guard rails kept:** LCP budget < 2.5 s (PRD 11), responsive AVIF/WebP via next/image, explicit
  size (no CLS), and the photo itself never moves (PRD 7: content stays at scroll speed).

## 3. "Typing" decoration in the parallax layers

- **PRD:** section 14, "one typing line in the hero only".
- **Decision:** decorative code lines in the background layers type out as the page scrolls, for a
  developer feel. Headings and content never type.
- **Guard rails kept:** transform/opacity only, aria-hidden, off on phones and under reduced motion,
  never behind body text, WCAG AA contrast.

## 4. Mobile navigation: bottom-corner "orbit" menu

- **PRD:** section 8.7 mobile nav (top bar + menu sheet).
- **Decision:** on phones a round button sits in the bottom-right corner; it opens the section links
  arranged in an orbit around it.
- **Guard rails kept:** button and links >= 44 px, `aria-expanded`, focus trapped while open, Esc
  and outside tap close it and return focus, works with the keyboard, reduced motion = no animation.

## 5. Experience: any number of highlights

- **PRD:** FR-EXP-01, 2–4 bullets per entry.
- **Decision (2026-11-23):** no minimum and no maximum. The content gate still requires a
  contribution scope on every bullet and no TODO in published entries.
- **Consequence:** the DSS Lab Coordinator entry is published with its one confirmed bullet.

## 6. Education: its own section, with competitions and awards

- **PRD:** section 4, education is part of the Experience timeline.
- **Decision (2026-11-23):** education has its own home section after Experience (`#education`,
  nav "./education"), so the degree no longer sits in the work timeline. Each education entry can
  list achievements (title, issuer, month), shown in an "awards.log" panel and on `/cv`. Years
  without a known month are allowed for education dates.

## 7. Status chip: "Open to collaboration"

- **PRD:** FR-HERO status chip "■ OPEN TO WORK".
- **Decision (2026-11-23):** the chip and the share image say "Open to collaboration", because
  Desi takes on projects as well as formal roles. The Profile field keeps its key `openToWork`
  (label "Open to collaboration" in the CMS).
