/**
 * Contact-form test mode for automated tests (Playwright) and local work without
 * Resend/Cloudflare accounts: Turnstile accepts the documented dummy token and
 * emails are not sent. Enabled with CONTACT_TEST_MODE=1; refused on Vercel
 * production so a misconfigured deploy can never pretend to deliver mail.
 */
export function isContactTestMode(): boolean {
  return process.env.CONTACT_TEST_MODE === "1" && process.env.VERCEL_ENV !== "production";
}

/** Token produced by Cloudflare's test sitekeys (Turnstile testing docs). */
export const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

/** In test mode, sender addresses on this domain simulate a Resend failure. */
export const TEST_DELIVERY_FAILURE_DOMAIN = "delivery-fail.test";
