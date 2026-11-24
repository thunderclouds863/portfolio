import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getHomeData } from "@/lib/home-data";
import { DEFAULT_AVAILABILITY_LABEL } from "@/lib/schema";
import { SITE_NAME, ogLine } from "@/lib/seo";

// PRD section 11: generated OG image in the retro style (name, role, green on
// black). Token colours only. Font: Press Start 2P (OFL, assets/fonts).
export const alt = `${SITE_NAME} — System Analyst portfolio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#050505";
const PANEL = "#0B140D";
const GREEN = "#2CFF56";
const GREEN_DIM = "#1F9E3A";
const MUTED = "#A3B8A8";
const YELLOW = "#FFD700";

export default async function OpengraphImage() {
  const [font, data] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/PressStart2P-Regular.ttf")),
    getHomeData(),
  ]);
  const openToWork = !!data.profile?.availability.openToWork;
  const availabilityLabel = (
    data.profile?.availability.label?.trim() || DEFAULT_AVAILABILITY_LABEL
  ).toUpperCase();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: BG,
        padding: 40,
        fontFamily: "Press Start 2P",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PANEL,
          border: `8px solid ${GREEN}`,
          boxShadow: `12px 12px 0 ${GREEN_DIM}`,
          padding: "48px 56px",
        }}
      >
        <div style={{ display: "flex", color: GREEN_DIM, fontSize: 22 }}>{"> whoami"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", color: GREEN, fontSize: 64, lineHeight: 1.2 }}>
            {SITE_NAME.toUpperCase()}
          </div>
          <div style={{ display: "flex", color: MUTED, fontSize: 24, lineHeight: 1.5 }}>
            {ogLine(data)}
          </div>
        </div>
        {/* The square is drawn, not typed: Press Start 2P has no "■" glyph, and a
            missing glyph makes the renderer fetch a fallback font at runtime. */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 16, color: YELLOW, fontSize: 18 }}
        >
          {openToWork ? (
            <>
              <div
                style={{
                  display: "flex",
                  width: 16,
                  height: 16,
                  marginRight: 16,
                  backgroundColor: YELLOW,
                }}
              />
              <div style={{ display: "flex" }}>{availabilityLabel}</div>
            </>
          ) : (
            " "
          )}
        </div>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Press Start 2P", data: font, style: "normal", weight: 400 }] },
  );
}
