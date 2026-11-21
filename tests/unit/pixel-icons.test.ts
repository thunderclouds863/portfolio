import { describe, expect, it } from "vitest";

import { pixelIcons, toRects } from "@/components/pixel/pixel-icons";

describe("pixel icons", () => {
  it.each(Object.entries(pixelIcons))("%s is a 16x16 bitmap of # and .", (_name, rows) => {
    expect(rows).toHaveLength(16);
    for (const row of rows) expect(row).toMatch(/^[#.]{16}$/);
  });

  it("merges horizontal runs into rects", () => {
    expect(toRects(["##..#...........", "................"])).toEqual([
      { x: 0, y: 0, width: 2 },
      { x: 4, y: 0, width: 1 },
    ]);
  });
});
