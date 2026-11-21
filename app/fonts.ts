import { IBM_Plex_Sans, JetBrains_Mono, Press_Start_2P } from "next/font/google";

// PRD section 6: self-hosted via next/font, Latin subset, display swap.
// Press Start 2P ships one weight (400); never synthesize bold.
export const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-press-start",
});

export const plexSans = IBM_Plex_Sans({
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-sans",
});

export const jetbrainsMono = JetBrains_Mono({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const fontVariables = [pressStart.variable, plexSans.variable, jetbrainsMono.variable].join(
  " ",
);
