import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/lib/contrast";
import { colorTokens } from "@/lib/tokens";

const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");
const BG = "#050505";
const PANEL = "#0B140D";

describe("colour tokens", () => {
  it("globals.css declares exactly the PRD tokens", () => {
    const declared = [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [
      m[1],
      m[2].toUpperCase(),
    ]);
    const expected = colorTokens.map((t) => [t.name, t.hex.toUpperCase()]);
    expect(declared).toEqual(expected);
  });

  it("clears Tailwind's default palette so no other colours exist", () => {
    expect(css).toMatch(/--color-\*:\s*initial/);
  });

  it("contrast ratio maths matches WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });

  it.each(colorTokens.filter((t) => t.kind === "text").map((t) => [t.name, t.hex]))(
    "text token %s meets 4.5:1 on bg and panel",
    (_name, hex) => {
      expect(contrastRatio(hex, BG)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(hex, PANEL)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(colorTokens.filter((t) => t.kind === "ui").map((t) => [t.name, t.hex]))(
    "UI token %s meets 3:1 on bg and panel",
    (_name, hex) => {
      expect(contrastRatio(hex, BG)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(hex, PANEL)).toBeGreaterThanOrEqual(3);
    },
  );

  it("primary button text (bg on amber) meets 4.5:1", () => {
    expect(contrastRatio(BG, "#FFB200")).toBeGreaterThanOrEqual(4.5);
  });
});
