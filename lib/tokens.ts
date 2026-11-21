// PRD section 6 colour tokens. Source of truth for docs and tests;
// app/globals.css must declare the same values (checked in tests/unit/tokens.test.ts).
export type ColorToken = {
  name: "bg" | "panel" | "green" | "green-dim" | "muted" | "amber" | "white" | "yellow" | "red";
  prdName: string;
  hex: string;
  use: string;
  /** Used for text (needs >= 4.5:1) or only for UI/borders (needs >= 3:1). */
  kind: "surface" | "text" | "ui";
};

export const colorTokens: readonly ColorToken[] = [
  { name: "bg", prdName: "--bg", hex: "#050505", use: "Page background", kind: "surface" },
  {
    name: "panel",
    prdName: "--panel",
    hex: "#0B140D",
    use: "Cards, terminal frames",
    kind: "surface",
  },
  {
    name: "green",
    prdName: "--green",
    hex: "#2CFF56",
    use: "Headings, key text, primary borders",
    kind: "text",
  },
  {
    name: "green-dim",
    prdName: "--green-dim",
    hex: "#1F9E3A",
    use: "Secondary borders, grid lines, inactive states",
    kind: "ui",
  },
  {
    name: "muted",
    prdName: "--text-muted",
    hex: "#A3B8A8",
    use: "Long-form body text",
    kind: "text",
  },
  {
    name: "amber",
    prdName: "--amber",
    hex: "#FFB200",
    use: "CTAs, active nav, hover links, focus ring",
    kind: "text",
  },
  {
    name: "white",
    prdName: "--white",
    hex: "#FFFFFF",
    use: "Emphasis inside body text, sparingly",
    kind: "text",
  },
  {
    name: "yellow",
    prdName: "--yellow",
    hex: "#FFD700",
    use: "Warning / status badges",
    kind: "text",
  },
  { name: "red", prdName: "--red", hex: "#FF0000", use: "Errors only", kind: "text" },
];
