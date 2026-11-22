#!/usr/bin/env node
/*
 * Generates public/cv/desi-armanda-sari-cv.pdf from the site's own /cv page
 * (FR-CV-02): same Published content, print stylesheet, A4.
 *
 * Usage: build and start production first, then
 *   npm run build && npm run start      (in one terminal)
 *   npm run cv:pdf [baseUrl]            (default http://localhost:3000)
 *
 * The PDF is a static file: regenerate it after every content change that
 * appears on /cv, then commit it with that change.
 *
 * Safety: a section that still shows a MISSING marker (unpublished content) is
 * left out of the PDF; the run fails if any MISSING/TODO text or a phone number
 * would still be printed (PRD 10: no phone number on the site).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const base = process.argv[2] ?? "http://localhost:3000";
const out = path.join(root, "public", "cv", "desi-armanda-sari-cv.pdf");

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  const res = await page.goto(`${base}/cv`, { waitUntil: "load" }).catch(() => null);
  if (!res || res.status() !== 200) {
    console.error(`cv:pdf: ${base}/cv is not reachable. Run \`npm run start\` first.`);
    process.exit(2);
  }
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(1500); // let hydration finish before changing styles

  // Hide sections that only hold a MISSING marker (e.g. no published projects yet).
  const hidden = await page.evaluate(() => {
    const names = [];
    for (const section of document.querySelectorAll("main section[aria-labelledby]")) {
      if (section.querySelector("[data-todo-content]")) {
        section.setAttribute("data-cv-pdf-hidden", "");
        names.push(section.querySelector("h2")?.textContent?.trim() ?? "?");
      }
    }
    return names;
  });
  await page.addStyleTag({ content: "[data-cv-pdf-hidden]{display:none !important}" });

  const text = await page.locator("main").innerText();
  const problems = [];
  if (/MISSING|TODO/.test(text)) problems.push("MISSING/TODO text is still visible");
  if (/(\+62|\b08)\d[\d -]{7,}/.test(text)) problems.push("a phone number is visible");
  if (problems.length) {
    console.error(`cv:pdf: not written: ${problems.join("; ")}`);
    process.exit(1);
  }

  await page.pdf({
    path: out,
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
  });
  const sections = await page.locator("main h2").filter({ visible: true }).allInnerTexts();
  console.log(`cv:pdf: wrote ${path.relative(root, out)}`);
  console.log(`  sections: ${sections.join(" | ")}`);
  if (hidden.length) console.log(`  left out (still unpublished): ${hidden.join(", ")}`);
} finally {
  await browser.close();
}
