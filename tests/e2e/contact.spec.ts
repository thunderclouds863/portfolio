import { expect, test, type Page } from "@playwright/test";

// Phase 6 — contact form end to end (PRD 8.3 / 8.6, FR-CF-01…06).
// The e2e build runs with CONTACT_TEST_MODE=1: the server accepts Cloudflare's
// dummy token and simulates Resend (addresses @delivery-fail.test fail).
// In the browser, Cloudflare's script is replaced by a fake that issues tokens.

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

async function openForm(page: Page, { freezeTime = false } = {}) {
  await page.clock.install();
  // Date.now() stands still (timers keep running), so "elapsed" stays under 3s
  // however slowly the browser fills the form.
  if (freezeTime) await page.clock.setFixedTime(new Date());
  await page.goto("/#contact");
  const form = page.getByRole("form", { name: "Contact form" });
  await expect(form).toBeVisible();
  // The widget loads when it comes within 400px of the viewport; on short phone
  // viewports /#contact lands above that, so scroll to it like a visitor would.
  // (Instant scroll: the site's smooth scrolling keeps the element "unstable".)
  await form
    .locator("[data-turnstile]")
    .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  // The widget loads lazily after hydration; slow WebKit runs need more than 5s.
  await expect(form.locator("[data-fake-turnstile]")).toBeAttached({ timeout: 15_000 });
  return form;
}

async function fillValid(page: Page, email = "person@example.com") {
  const form = page.getByRole("form", { name: "Contact form" });
  await form.getByLabel(/^Name/).fill("Example Person");
  await form.getByLabel(/^Email/).fill(email);
  await form.getByLabel(/^Inquiry type/).selectOption("job");
  await form.getByLabel(/^Message/).fill("Hello, this is a test message from the e2e suite.");
  await form.getByRole("checkbox").check();
}

const sendButton = (page: Page) => page.getByRole("button", { name: "[ Send message ]" });
const status = (page: Page) => page.getByRole("form", { name: "Contact form" }).getByRole("status");

test.beforeEach(async ({ page }) => {
  await fakeTurnstile(page);
});

test("invalid fields show errors linked to the field and focus the first one", async ({ page }) => {
  const form = await openForm(page);
  await sendButton(page).click();
  const name = form.getByLabel(/^Name/);
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  const describedBy = await name.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`#${describedBy!.split(" ").at(-1)}`)).toHaveText(
    "Name must be 2 to 80 characters.",
  );
  for (const msg of [
    "Enter a valid email address.",
    "Choose an inquiry type.",
    "Message must be 20 to 2000 characters.",
    "Please agree so the message can be answered.",
  ]) {
    await expect(form.getByText(msg)).toBeVisible();
  }
  await expect(status(page)).toHaveText("Please fix the highlighted fields.");

  // Fixing the name moves focus to the next invalid field.
  await name.fill("Example Person");
  await sendButton(page).click();
  await expect(form.getByLabel(/^Email/)).toBeFocused();
});

test("valid message: TRANSMITTING... then MESSAGE RECEIVED, announced and focused", async ({
  page,
}) => {
  await openForm(page);
  await fillValid(page);
  await page.clock.fastForward(4000);
  await sendButton(page).click();
  const received = page.getByText("MESSAGE RECEIVED", { exact: true });
  await expect(received).toBeVisible();
  await expect(received).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Message received." })).toBeAttached();

  // "Send another message" returns an empty form (state diagram: Success → Idle).
  await page.getByRole("button", { name: "[ Send another message ]" }).click();
  await expect(page.getByRole("form", { name: "Contact form" }).getByLabel(/^Name/)).toHaveValue(
    "",
  );
});

test("the button shows TRANSMITTING... and is disabled while sending", async ({ page }) => {
  await openForm(page);
  await fillValid(page);
  await page.clock.fastForward(4000);
  // Hold the Server Action request so the submitting state can be observed.
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/*", async (route) => {
    if (route.request().method() === "POST" && route.request().headers()["next-action"]) {
      await held;
    }
    await route.fallback();
  });
  await sendButton(page).click();
  const busy = page.getByRole("button", { name: "TRANSMITTING..." });
  await expect(busy).toBeVisible();
  await expect(busy).toBeDisabled();
  release();
  await expect(page.getByText("MESSAGE RECEIVED", { exact: true })).toBeVisible();
});

test("submitting faster than 3 seconds asks to send again (no fake success)", async ({ page }) => {
  await openForm(page, { freezeTime: true });
  await fillValid(page);
  await sendButton(page).click();
  await expect(status(page)).toHaveText("That was quick. Please wait a moment, then send again.");
  await expect(page.getByText("MESSAGE RECEIVED", { exact: true })).toHaveCount(0);
});

test("a delivery failure shows an error with retry and keeps the input", async ({ page }) => {
  const form = await openForm(page);
  await fillValid(page, "person@delivery-fail.test");
  await page.clock.fastForward(4000);
  await sendButton(page).click();
  await expect(status(page)).toContainText("Your message could not be sent right now.");
  // Fallback (Phase 6 decision): the published email from Profile links, or
  // "try again later" when no email is published.
  await expect(status(page)).toContainText(
    /You can also write directly to \S+@\S+\.|Please try again later\./,
  );
  await expect(form.getByLabel(/^Message/)).toHaveValue(
    "Hello, this is a test message from the e2e suite.",
  );
  await expect(sendButton(page)).toBeEnabled();
});

test("a failed security check shows an error and can be retried", async ({ page }) => {
  await page.unrouteAll();
  await fakeTurnstile(page, "invalid-token");
  await openForm(page);
  await fillValid(page);
  await page.clock.fastForward(4000);
  await sendButton(page).click();
  await expect(status(page)).toContainText("The security check did not pass. Please try again.");
});

test("the honeypot is invisible to people and filling it fakes success silently", async ({
  page,
}) => {
  const form = await openForm(page);
  const honeypot = form.locator('input[name="website"]');
  await expect(honeypot).toHaveAttribute("tabindex", "-1");
  await expect(honeypot).not.toBeInViewport();
  await fillValid(page, "person@delivery-fail.test"); // would fail if it were really sent
  await honeypot.evaluate((el: HTMLInputElement) => (el.value = "https://spam.example"));
  await page.clock.fastForward(4000);
  await sendButton(page).click();
  await expect(page.getByText("MESSAGE RECEIVED", { exact: true })).toBeVisible();
});

test("the honeypot is not reachable by keyboard", async ({ page }) => {
  const form = await openForm(page);
  await form.getByLabel(/^Message/).focus();
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press("Tab");
    const name = await page.evaluate(() => (document.activeElement as HTMLInputElement)?.name);
    expect(name).not.toBe("website");
  }
});
