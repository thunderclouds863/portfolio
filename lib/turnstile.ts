import "server-only";

import { TURNSTILE_DUMMY_TOKEN, isContactTestMode } from "./test-mode";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 10_000;
const MAX_TOKEN_LENGTH = 2048;

export type TurnstileResult =
  { ok: true } | { ok: false; reason: "missing-token" | "rejected" | "unavailable" };

/**
 * FR-CF-03: verifies a Turnstile token server-side (PRD 8.3 step "siteverify").
 * Never throws; network errors and timeouts count as "unavailable".
 * Logs only the outcome and Cloudflare error codes — never the token or IP.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileResult> {
  if (!token || token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: "missing-token" };

  if (isContactTestMode()) {
    return token === TURNSTILE_DUMMY_TOKEN ? { ok: true } : { ok: false, reason: "rejected" };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[contact] turnstile: TURNSTILE_SECRET_KEY is not set");
    return { ok: false, reason: "unavailable" };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: crypto.randomUUID(),
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetchImpl(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[contact] turnstile: siteverify HTTP ${res.status}`);
      return { ok: false, reason: "unavailable" };
    }
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success === true) return { ok: true };
    console.warn(
      `[contact] turnstile: rejected (${(data["error-codes"] ?? []).join(",") || "no code"})`,
    );
    return { ok: false, reason: "rejected" };
  } catch (error) {
    console.error(
      `[contact] turnstile: request failed (${error instanceof Error ? error.name : "unknown"})`,
    );
    return { ok: false, reason: "unavailable" };
  }
}
