import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isKeystaticEnabled } from "@/lib/keystatic-access";

import KeystaticApp from "./keystatic";

// FR-CMS-03: noindex, not in the sitemap, not linked from the public site.
export const metadata: Metadata = {
  title: "Content admin",
  robots: { index: false, follow: false },
};

export default function KeystaticLayout() {
  if (!isKeystaticEnabled()) notFound();
  return <KeystaticApp />;
}
