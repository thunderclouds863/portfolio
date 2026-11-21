import type { Metadata } from "next";
import Link from "next/link";

import { SiteChrome } from "@/components/layout/site-chrome";
import { Button } from "@/components/ui/button";

import "./globals.css";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// FR-404-01: terminal-style 404 with links home and to projects. Arcade budget
// (PRD 14): "GAME OVER — CONTINUE?" with "ERROR 404: FILE NOT FOUND" as subline.
// Lives at the app root so it also covers unmatched URLs; it brings its own
// chrome and styles because the root layout is a bare document shell.
export default function NotFound() {
  return (
    <SiteChrome>
      <section
        aria-labelledby="not-found-title"
        className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-4 py-24 md:px-6 md:py-32"
      >
        <p className="text-meta text-red">ERROR 404: FILE NOT FOUND</p>
        <h1 id="not-found-title" className="text-display-1 text-green glow">
          GAME OVER
        </h1>
        <p className="text-label text-white">CONTINUE?</p>
        <nav aria-label="Where to go next" className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/">[ Home ]</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/projects">[ Projects ]</Link>
          </Button>
        </nav>
      </section>
    </SiteChrome>
  );
}
