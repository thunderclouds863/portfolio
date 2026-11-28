"use client";

import { ExternalLink } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

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

/** "[ live demo ]" link to the running app, in a new tab. Pre-warms on hover/focus. */
function DemoLink({ href, title, className }: { href: string; title: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-demo-link=""
      onPointerEnter={() => triggerDemoWarm(href)}
      onFocus={() => triggerDemoWarm(href)}
      onTouchStart={() => triggerDemoWarm(href)}
      className={cn(
        "text-amber hover:text-yellow inline-flex min-h-11 items-center gap-2 self-start font-mono text-sm underline-offset-4 hover:underline",
        className,
      )}
    >
      [ live demo
      <ExternalLink aria-hidden="true" className="size-4" /> ]
      <span className="sr-only"> of {title} (opens in a new tab)</span>
    </a>
  );
}

export { DemoLink, DemoWarmup };
