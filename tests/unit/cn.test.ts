import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn keeps custom type utilities", () => {
  it.each(["text-label", "text-meta", "text-display-1", "text-display-2", "text-h3"])(
    "%s survives next to a text colour",
    (typeClass) => {
      const merged = cn(typeClass, "text-amber").split(" ");
      expect(merged).toContain(typeClass);
      expect(merged).toContain("text-amber");
    },
  );

  it("still resolves real conflicts", () => {
    expect(cn("text-meta", "text-label")).toBe("text-label");
    expect(cn("text-green", "text-amber")).toBe("text-amber");
    expect(cn("shadow-pixel", "shadow-pixel-hover")).toBe("shadow-pixel-hover");
  });
});
