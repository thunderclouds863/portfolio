"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export type TurnstileHandle = { reset: () => void };

type TurnstileWidgetProps = {
  siteKey: string;
  onToken: (token: string | null) => void;
  onError?: () => void;
};

/**
 * Cloudflare Turnstile (FR-CF-03), explicit rendering. The script loads only
 * when the form comes near the viewport, so it is not part of the page's
 * first-load JavaScript. The token is passed up via onToken; it expires after
 * 300s, so expiry clears it and the widget refreshes itself.
 */
const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(function TurnstileWidget(
  { siteKey, onToken, onError },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const callbacks = useRef({ onToken, onError });
  callbacks.current = { onToken, onError };

  useImperativeHandle(ref, () => ({
    reset: () => {
      callbacks.current.onToken(null);
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const mount = () => {
      loadScript()
        .then(() => {
          if (cancelled || !window.turnstile || widgetId.current) return;
          widgetId.current = window.turnstile.render(container, {
            sitekey: siteKey,
            theme: "dark",
            "response-field": false,
            "refresh-expired": "auto",
            callback: (token: string) => callbacks.current.onToken(token),
            "expired-callback": () => callbacks.current.onToken(null),
            "error-callback": () => {
              callbacks.current.onToken(null);
              callbacks.current.onError?.();
            },
          });
        })
        .catch(() => callbacks.current.onError?.());
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        mount();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey]);

  return <div ref={containerRef} data-turnstile="" className="min-h-[65px]" />;
});

export { TurnstileWidget };
