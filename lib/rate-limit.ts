import "server-only";

import { isContactTestMode } from "./test-mode";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;
const MAX_KEYS = 500;

const buckets = new Map<string, number[]>();
const recBuckets = new Map<string, number[]>();
const recFingerprints = new Map<string, number>();

/**
 * Extracts the client IP from trusted reverse-proxy headers.
 * Prefers `x-vercel-forwarded-for` (set by Vercel Edge, not client-spoofable)
 * over `x-real-ip` and `x-forwarded-for`.
 */
export function extractClientIp(requestHeaders: {
  get(name: string): string | null;
}): string | null {
  const vercelIp = requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelIp) return vercelIp;
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}

/**
 * Best-effort per-instance sliding-window rate limiter for the contact Server Action.
 * NOTE: In serverless deployments (Vercel), state is process-local per warm instance
 * and NOT shared across concurrent instances or cold starts. Cloudflare Turnstile
 * remains the primary distributed anti-abuse control; for strict distributed rate
 * limiting, back this with Upstash Redis or Vercel WAF rate limiting.
 */
export function checkContactRateLimit(
  ip: string | null,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSec: number } {
  if (isContactTestMode()) return { ok: true };
  const key = ip?.trim() || "unknown";
  const cutoff = now - WINDOW_MS;
  const recent = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= MAX_REQUESTS) {
    buckets.set(key, recent);
    const oldest = recent[0] ?? now;
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)) };
  }

  recent.push(now);
  buckets.set(key, recent);

  // Prevent unbounded memory growth on long-lived instances.
  if (buckets.size > MAX_KEYS) {
    for (const [k, times] of buckets) {
      if (times.every((t) => t <= cutoff)) buckets.delete(k);
    }
  }
  return { ok: true };
}

/** Test-only reset helper. */
export function resetContactRateLimit() {
  buckets.clear();
}

/**
 * Best-effort per-instance sliding-window rate limiter for public recommendation submissions.
 * Uses a separate bucket from the contact form (max 3 submissions per 10 minutes per IP).
 */
export function checkRecommendationRateLimit(
  ip: string | null,
  now = Date.now(),
  { bypassTestMode = false } = {},
): { ok: true } | { ok: false; retryAfterSec: number } {
  if (!bypassTestMode && isContactTestMode()) return { ok: true };
  const key = ip?.trim() || "unknown";
  const cutoff = now - WINDOW_MS;
  const recent = (recBuckets.get(key) ?? []).filter((t) => t > cutoff);
  const maxRecRequests = 3;

  if (recent.length >= maxRecRequests) {
    recBuckets.set(key, recent);
    const oldest = recent[0] ?? now;
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)) };
  }

  recent.push(now);
  recBuckets.set(key, recent);

  if (recBuckets.size > MAX_KEYS) {
    for (const [k, times] of recBuckets) {
      if (times.every((t) => t <= cutoff)) recBuckets.delete(k);
    }
  }
  return { ok: true };
}

/**
 * Prevents accidental or repeated duplicate recommendation submissions within 10 minutes
 * on the same server instance.
 */
export function checkDuplicateRecommendation(
  authorName: string,
  text: string,
  now = Date.now(),
  { bypassTestMode = false } = {},
): { ok: true } | { ok: false } {
  if (!bypassTestMode && isContactTestMode()) return { ok: true };
  const normalized = `${authorName.trim().toLowerCase()}::${text.trim().toLowerCase().replace(/\s+/g, " ")}`;
  const cutoff = now - WINDOW_MS;
  const prev = recFingerprints.get(normalized);
  if (prev && prev > cutoff) {
    return { ok: false };
  }
  recFingerprints.set(normalized, now);
  if (recFingerprints.size > MAX_KEYS) {
    for (const [k, t] of recFingerprints) {
      if (t <= cutoff) recFingerprints.delete(k);
    }
  }
  return { ok: true };
}

/** Test-only reset helper for recommendation rate limiter and deduplication cache. */
export function resetRecommendationRateLimit() {
  recBuckets.clear();
  recFingerprints.clear();
}
