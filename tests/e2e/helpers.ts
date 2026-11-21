import type { Page } from "@playwright/test";

/**
 * Scrolls through the whole page so every Reveal has fired, then waits for the
 * transitions to finish. Run before axe: half-faded text (opacity < 1) would
 * otherwise be reported as a colour-contrast failure.
 */
export async function revealAll(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => Math.max(200, Math.floor(window.innerHeight / 2)));
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(40);
  }
  await page.waitForFunction(
    () => document.querySelectorAll('[data-reveal="hidden"]').length === 0,
  );
  await page.waitForTimeout(900); // 420ms reveal + up to 400ms stagger delay
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
}
