import { expect, test, type Page } from "@playwright/test";

const DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

async function fakeTurnstile(page: Page, token = DUMMY_TOKEN) {
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `window.turnstile = {
        render(el, o) { el.setAttribute("data-fake-turnstile", ""); window.__ts = o; setTimeout(() => o.callback(${JSON.stringify(token)}), 20); return "w1"; },
        reset() { setTimeout(() => window.__ts && window.__ts.callback(${JSON.stringify(token)}), 20); },
        remove() {},
      };`,
    }),
  );
}

test.describe("Phase 3 — Public recommendation submission & moderation privacy", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("existing published recommendations stay visible and pending submissions never appear publicly", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await fakeTurnstile(page);
    await page.goto("/testimonials");
    const publishedCards = page.locator("[data-testimonial-list] > li");
    const initialCount = await publishedCards.count();
    expect(initialCount).toBeGreaterThanOrEqual(3);

    // Open the Share a Recommendation form.
    await page.getByRole("button", { name: "[ Share a Recommendation ]" }).click();
    const form = page.getByRole("form", { name: "Share a Recommendation form" });
    await expect(form).toBeVisible();
    await form
      .locator("[data-turnstile]")
      .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(form.locator("[data-fake-turnstile]")).toBeAttached({ timeout: 15_000 });

    // Invalid empty submission shows errors and focuses first invalid field (authorName).
    await form.getByRole("button", { name: "[ Submit for review ]" }).click();
    await expect(form.getByLabel(/^Full name/)).toBeFocused();
    await expect(form.getByText(/Please enter your full name/)).toBeVisible();

    // Character counter updates live.
    const sampleText =
      "Working with Desi on process analysis and internal web tools significantly improved our reporting clarity.";
    await form.getByLabel(/^Full name/).fill("Test Reviewer");
    await form.getByLabel(/^Role or title/).fill("Product Analyst");
    await form.getByLabel(/^Company or organization/).fill("Sample Org");
    await form.getByLabel(/^Recommendation/).fill(sampleText);
    await expect(form.getByText(new RegExp(`\\(${sampleText.length} / 1500\\)`))).toBeVisible();

    // Invalid URL is rejected.
    await form.getByLabel(/^LinkedIn profile URL/).fill("javascript:alert(1)");
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "[ Submit for review ]" }).click();
    await expect(form.getByText(/Enter a valid http:\/\/ or https:\/\//)).toBeVisible();

    // Fix URL, wait past MIN_FILL_MS (3s), and submit in test mode.
    await form
      .getByLabel(/^LinkedIn profile URL/)
      .fill("https://www.linkedin.com/in/test-reviewer");
    await page.waitForTimeout(3200);
    await form.getByRole("button", { name: "[ Submit for review ]" }).click();
    await expect(page.getByText("SUBMISSION RECEIVED (PENDING REVIEW)")).toBeVisible();

    // Reload /testimonials: pending submission must NOT appear publicly.
    await page.reload();
    await expect(page.locator("[data-testimonial-list] > li")).toHaveCount(initialCount);
    await expect(page.locator("[data-testimonial-list]")).not.toContainText("Test Reviewer");
    expect(errors).toEqual([]);
  });

  test("honeypot is hidden and unreachable by keyboard; delivery failure shows generic error", async ({
    page,
  }) => {
    await fakeTurnstile(page);
    await page.goto("/testimonials");
    await page.getByRole("button", { name: "[ Share a Recommendation ]" }).click();
    const form = page.getByRole("form", { name: "Share a Recommendation form" });
    await form
      .locator("[data-turnstile]")
      .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(form.locator("[data-fake-turnstile]")).toBeAttached({ timeout: 15_000 });

    const honeypot = form.locator('input[name="website"]');
    await expect(honeypot).toHaveAttribute("tabindex", "-1");

    await form.getByLabel(/^Full name/).fill("FailDelivery User");
    await form.getByLabel(/^Role or title/).fill("Lead Engineer");
    await form
      .getByLabel(/^Recommendation/)
      .fill("Reliable systems analyst who translates messy workflows into maintainable software.");
    await form.getByRole("checkbox").check();
    await page.waitForTimeout(3200);
    await form.getByRole("button", { name: "[ Submit for review ]" }).click();
    await expect(
      form.getByText("Your submission could not be queued right now. Please try again later."),
    ).toBeVisible();
  });

  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    test(`/testimonials (with form open) has 0px horizontal overflow at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/testimonials");
      await page.getByRole("button", { name: "[ Share a Recommendation ]" }).click();
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth, `/testimonials at ${width}px`).toBeLessThanOrEqual(innerWidth);
    });
  }
});
