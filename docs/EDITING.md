# Editing content (Keystatic)

How to add and change site content without touching code (PRD section 18, FR-CMS-07).
Screenshots will be added once the site is deployed with GitHub storage (Phase 9).

## Where content lives

| Type                     | Admin location  | File in the repo                                                                 |
| ------------------------ | --------------- | -------------------------------------------------------------------------------- |
| Profile                  | Profile         | `content/profile.yaml` (+ `content/profile/about.mdoc`)                          |
| Site settings            | Site settings   | `content/settings.yaml`                                                          |
| Projects (case studies)  | Projects        | `content/projects/<slug>/index.mdoc`, images in `public/images/projects/<slug>/` |
| Experience               | Experience      | `content/experience/<slug>.yaml`                                                 |
| Education                | Education       | `content/education/<slug>.yaml`                                                  |
| Skills                   | Skills          | `content/skills/<slug>.yaml`                                                     |
| LinkedIn recommendations | Recommendations | `content/recommendations/<slug>.yaml`                                            |

## Draft and Published

- Every entry has a **Status**. Only **Published** entries appear on the site.
- Anything the AI agent adds for you is saved as **Draft**. Read it, correct it, then switch it to
  Published — publishing is your confirmation that every fact is true.
- Placeholders look like `TODO(content): …`. A Published entry that still contains `TODO`, misses a
  required field, has a "verified" outcome without an evidence note, an image without alt text, or a
  recommendation without permission **fails the build**. The error message names the file and field.

## Opening the editor

- **On your computer (now):** run `npm run dev`, open <http://localhost:3000/keystatic>. Changes are
  written straight to the files in this folder; commit and push them as usual.
- **On the live site (after Phase 9):** open `https://<domain>/keystatic` and sign in with GitHub.
  Only accounts with write access to the repository can save.

## Add a project

1. Projects → **Create**.
2. Fill the fields. **Your role** and **Contribution scope** are required to publish.
3. Write the case study in the editor. Use the headings that are already in the skeletons:
   Context, Problem, My role, As-is analysis, Requirements, Solution design, Build, Verification,
   Outcome, Reflection.
4. Add process maps with **Diagram** and screenshots with **Figure** (both need alt text).
   Other allowed blocks: **Callout** and **Steps**.
5. Keep **Status = Draft** while writing. Switch to **Published** when the facts are final.
6. Save. With GitHub storage, save to a branch named `content/<slug>`; Vercel builds a preview.
   Check it on phone and desktop, then merge.

## Add experience, a skill or a recommendation

- **Experience:** dates as `YYYY-MM`; leave **End month** empty for a current role; 2–4 highlights;
  set the contribution scope.
- **Skill:** choose a group and an honest level (Daily use / Project use / Learning) and link the
  projects where you used it.
- **Recommendation:** paste the LinkedIn text word for word (you may only shorten it with `[…]`),
  and tick **Permission to republish confirmed** only after the recommender agreed.

## Update the CV PDF

The download is **your own CV file**, served as-is (it is not generated from the `/cv` page).
To replace it: in the editor open **Profile → CV PDF** and upload the new file, or replace
`public/cv/desi-armanda-sari-cv.pdf` directly. Visitors always download it as
`desi-armanda-sari-cv.pdf`.

Note: the file is public. Your current CV includes your phone number by your choice
(see `docs/decisions/0002-owner-overrides.md`); remove it from the file if you change your mind.

## Change the hero portrait

The hero shows your real photo (`public/images/profile/desi-armanda-sari.jpg`), tinted and
overlaid with scanlines so it blends into the theme. The photo is public.

1. Replace that file with the new photo, keeping the file name. Portrait orientation works best;
   the frame shows it at 4:5 with the face around 30% from the top.
2. Check the hero with `npm run dev` at desktop and phone widths, then commit the file.

## Images

- Use PNG, JPG/WebP or SVG. Keep thumbnails under 120 KB and other images under 500 KB.
- Always write alt text that says what the image shows, e.g. "BPMN map of the as-is process".
