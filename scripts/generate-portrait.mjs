#!/usr/bin/env node
/*
 * Turns the owner's photo into the pixel-art portrait shown in the hero
 * (PRD 3: "a pixel-art avatar derived from it").
 *
 * Input:  assets/portrait/source/desi.jpg   (git-ignored: the real photo stays local)
 * Output: components/sections/portrait-pixels.ts   (committed: SVG paths only)
 *
 * The portrait is rendered as inline SVG, not as an image file, so the hero H1
 * stays the LCP element and the hero has no raster image (FR-HERO-02).
 *
 * Steps (in headless Chromium, no extra dependencies):
 *  1. downscale to SIZE x SIZE pixels;
 *  2. remove the light studio background by flood fill from the top and side
 *     edges (the white shirt is enclosed by the blazer, so it is kept);
 *  3. reduce to COLORS colours (k-means), the "pixel art" palette;
 *  4. emit one SVG path per colour, merging horizontal runs.
 *
 * Usage: npm run portrait [-- --size 64 --colors 18]
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : fallback;
};
const SIZE = arg("size", 64);
const COLORS = arg("colors", 18);
const source = path.join(root, "assets", "portrait", "source", "desi.jpg");
const out = path.join(root, "components", "sections", "portrait-pixels.ts");

let jpg;
try {
  jpg = await readFile(source);
} catch {
  console.error(
    `portrait: ${path.relative(root, source)} not found (it is git-ignored; add it locally).`,
  );
  process.exit(2);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const result = await page.evaluate(
    async ({ dataUrl, size, colors }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      // Trim 1.5% from each edge: photo exports often carry a thin grey border
      // that the background fill would miss (it showed as a light line).
      const inset = Math.round(img.naturalWidth * 0.015);
      const side = Math.min(img.naturalWidth, img.naturalHeight) - inset * 2;
      ctx.drawImage(img, inset, inset, side, side, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      const px = (x, y) => (y * size + x) * 4;
      const isBackground = (i) => {
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return min > 205 && max - min < 28; // light and nearly grey
      };

      // Flood fill from top, left and right edges.
      const transparent = new Uint8Array(size * size);
      const stack = [];
      for (let i = 0; i < size; i += 1) {
        stack.push([i, 0], [0, i], [size - 1, i]);
      }
      while (stack.length) {
        const [x, y] = stack.pop();
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const k = y * size + x;
        if (transparent[k] || !isBackground(px(x, y))) continue;
        transparent[k] = 1;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }

      // k-means palette on the remaining pixels.
      const points = [];
      for (let k = 0; k < size * size; k += 1) {
        if (!transparent[k]) points.push([data[k * 4], data[k * 4 + 1], data[k * 4 + 2]]);
      }
      const sorted = [...points].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
      let centers = Array.from({ length: colors }, (_, c) =>
        sorted[Math.floor(((c + 0.5) / colors) * (sorted.length - 1))].slice(),
      );
      const nearest = (p) => {
        let best = 0;
        let bestD = Infinity;
        for (let c = 0; c < centers.length; c += 1) {
          const d =
            (p[0] - centers[c][0]) ** 2 + (p[1] - centers[c][1]) ** 2 + (p[2] - centers[c][2]) ** 2;
          if (d < bestD) {
            bestD = d;
            best = c;
          }
        }
        return best;
      };
      for (let iter = 0; iter < 12; iter += 1) {
        const sums = centers.map(() => [0, 0, 0, 0]);
        for (const p of points) {
          const s = sums[nearest(p)];
          s[0] += p[0];
          s[1] += p[1];
          s[2] += p[2];
          s[3] += 1;
        }
        centers = sums.map((s, c) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centers[c]));
      }
      const hex = (c) =>
        "#" +
        c
          .map((v) => Math.round(v).toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();

      // One path per colour; horizontal runs merged.
      const paths = centers.map(() => []);
      for (let y = 0; y < size; y += 1) {
        let x = 0;
        while (x < size) {
          const k = y * size + x;
          if (transparent[k]) {
            x += 1;
            continue;
          }
          const c = nearest([data[k * 4], data[k * 4 + 1], data[k * 4 + 2]]);
          let len = 1;
          while (x + len < size) {
            const k2 = y * size + x + len;
            if (
              transparent[k2] ||
              nearest([data[k2 * 4], data[k2 * 4 + 1], data[k2 * 4 + 2]]) !== c
            )
              break;
            len += 1;
          }
          paths[c].push(`M${x} ${y}h${len}v1h-${len}z`);
          x += len;
        }
      }
      return centers
        .map((c, i) => ({ fill: hex(c), d: paths[i].join("") }))
        .filter((p) => p.d.length > 0);
    },
    { dataUrl: `data:image/jpeg;base64,${jpg.toString("base64")}`, size: SIZE, colors: COLORS },
  );

  const body = [
    "// Generated by scripts/generate-portrait.mjs from the owner's photo",
    "// (assets/portrait/source/desi.jpg, kept out of git). Do not edit by hand:",
    "// replace the photo and run `npm run portrait`.",
    "",
    `export const PORTRAIT_SIZE = ${SIZE};`,
    "",
    "export const PORTRAIT_PATHS: readonly { fill: string; d: string }[] = [",
    ...result.map((p) => `  { fill: "${p.fill}", d: "${p.d}" },`),
    "];",
    "",
  ].join("\n");
  await writeFile(out, body);
  const bytes = Buffer.byteLength(body);
  console.log(
    `portrait: ${SIZE}x${SIZE}, ${result.length} colours, ${(bytes / 1024).toFixed(1)} KB -> ${path.relative(root, out)}`,
  );
} finally {
  await browser.close();
}
