# 0002 — Owner overrides of the PRD

Status: accepted (2026-11-22, decided by Desi in the build session)

AGENTS.md says a request that conflicts with the PRD must be confirmed first. These four were
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
