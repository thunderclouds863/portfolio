"use client";

import { useEffect } from "react";

const WARMED_UNTIL = new Map<string, number>();
const CLIENT_COOLDOWN_MS = 4 * 60 * 1000;

function triggerDemoWarm(href: string) {
  if (typeof window === "undefined" || (typeof navigator !== "undefined" && navigator.webdriver)) {
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    return;
  }
  if (!parsed.hostname.endsWith(".vercel.app")) return;

  const now = Date.now();
  if ((WARMED_UNTIL.get(parsed.origin) ?? 0) > now) return;
  WARMED_UNTIL.set(parsed.origin, now + CLIENT_COOLDOWN_MS);

  void fetch("/api/demo-warm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: href }),
    keepalive: true,
  }).catch(() => {});
}

/** Pre-warms a Vercel demo container in the background when a case study page opens. */
function DemoWarmup({ href }: { href: string }) {
  useEffect(() => {
    triggerDemoWarm(href);
  }, [href]);
  return null;
}

export { DemoWarmup, triggerDemoWarm };
