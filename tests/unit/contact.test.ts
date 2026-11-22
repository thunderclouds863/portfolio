import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readContactFields } from "@/lib/contact";
import { validateContactFields } from "@/lib/contact-validation";
import { sendContactEmail, type EmailClient } from "@/lib/email";
import { contactSubject, stripLineBreaks } from "@/lib/sanitize";
import { verifyTurnstile } from "@/lib/turnstile";

// Synthetic test data only.
const validFields = {
  name: "Example Person",
  email: "person@example.com",
  type: "job",
  message: "Hello, this is an example message that is long enough.",
  consent: true,
};

describe("stripLineBreaks (header injection, PRD 10)", () => {
  it.each([
    ["Name\r\nBcc: evil@example.com", "Name Bcc: evil@example.com"],
    ["Name\nX-Injected: 1", "Name X-Injected: 1"],
    ["Name\r", "Name"],
    ["Name Bcc: x", "Name Bcc: x"],
    ["  spaced   out  ", "spaced out"],
  ])("%j → %j", (input, expected) => {
    expect(stripLineBreaks(input)).toBe(expected);
    expect(stripLineBreaks(input)).not.toMatch(/[\r\n]/);
  });

  it("builds the FR-CF-04 subject on one line", () => {
    expect(contactSubject("job", "Example\r\nPerson")).toBe(
      "[Portfolio] Job opportunity — Example Person",
    );
    expect(contactSubject("freelance", "A B")).toBe("[Portfolio] Freelance project — A B");
  });
});

describe("shared contact validation (FR-CF-01/02)", () => {
  it("accepts valid fields", () => {
    expect(validateContactFields(validFields)).toEqual({
      ok: true,
      data: { ...validFields, type: "job" },
    });
  });

  it.each([
    ["name", { name: "A" }],
    ["name", { name: "x".repeat(81) }],
    ["email", { email: "not-an-email" }],
    ["type", { type: "" }],
    ["type", { type: "spam" }],
    ["message", { message: "Too short" }],
    ["message", { message: "x".repeat(2001) }],
    ["consent", { consent: false }],
  ])("rejects an invalid %s", (field, patch) => {
    const result = validateContactFields({ ...validFields, ...patch });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.fieldErrors)).toContain(field);
  });

  it("trims before checking length", () => {
    const result = validateContactFields({ ...validFields, name: "  A  " });
    expect(result.ok).toBe(false);
  });

  it("reads form data, turning the checkbox into a boolean", () => {
    const form = new FormData();
    form.set("name", "Example Person");
    form.set("email", " person@example.com ");
    form.set("type", "other");
    form.set("message", "Hello there, this message is long enough.");
    form.set("consent", "on");
    expect(readContactFields(form)).toEqual({
      name: "Example Person",
      email: "person@example.com",
      type: "other",
      message: "Hello there, this message is long enough.",
      consent: true,
    });
    form.delete("consent");
    expect(readContactFields(form).consent).toBe(false);
  });
});

describe("verifyTurnstile (mocked fetch)", () => {
  beforeEach(() => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    vi.stubEnv("CONTACT_TEST_MODE", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const reply = (body: unknown, status = 200) =>
    vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status }));

  it("posts secret, token and IP form-encoded to siteverify", async () => {
    const fetchMock = reply({ success: true, "error-codes": [] });
    await expect(verifyTurnstile("token-123", "203.0.113.7", fetchMock)).resolves.toEqual({
      ok: true,
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(init?.method).toBe("POST");
    const body = init?.body as URLSearchParams;
    expect(body.get("secret")).toBe("1x0000000000000000000000000000000AA");
    expect(body.get("response")).toBe("token-123");
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });

  it("rejects a token Cloudflare marks invalid", async () => {
    const fetchMock = reply({ success: false, "error-codes": ["invalid-input-response"] });
    await expect(verifyTurnstile("bad", null, fetchMock)).resolves.toEqual({
      ok: false,
      reason: "rejected",
    });
  });

  it("treats a missing or oversized token as missing without calling Cloudflare", async () => {
    const fetchMock = reply({ success: true });
    await expect(verifyTurnstile("", null, fetchMock)).resolves.toMatchObject({
      reason: "missing-token",
    });
    await expect(verifyTurnstile("x".repeat(2049), null, fetchMock)).resolves.toMatchObject({
      reason: "missing-token",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports network failures and HTTP errors as unavailable", async () => {
    const failing = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));
    await expect(verifyTurnstile("t", null, failing)).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
    await expect(verifyTurnstile("t", null, reply({}, 500))).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("is unavailable when the secret is not configured", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    await expect(verifyTurnstile("t", null, reply({ success: true }))).resolves.toMatchObject({
      reason: "unavailable",
    });
  });
});

describe("sendContactEmail (fake Resend client)", () => {
  const message = {
    name: "Example\r\nPerson",
    email: "person@example.com",
    type: "collaboration" as const,
    message: "A private message body that must never be logged.",
  };

  beforeEach(() => {
    vi.stubEnv("CONTACT_FROM_EMAIL", "portfolio@example.com");
    vi.stubEnv("CONTACT_TO_EMAIL", "owner@example.com");
    vi.stubEnv("CONTACT_TEST_MODE", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends plain text with reply-to = sender and a sanitized subject", async () => {
    const send = vi
      .fn<EmailClient["emails"]["send"]>()
      .mockResolvedValue({ data: { id: "1" }, error: null });
    await expect(sendContactEmail(message, { emails: { send } })).resolves.toEqual({ ok: true });
    const payload = send.mock.calls[0]![0];
    expect(payload).toMatchObject({
      from: "portfolio@example.com",
      to: "owner@example.com",
      replyTo: "person@example.com",
      subject: "[Portfolio] Collaboration — Example Person",
    });
    expect(payload.from).not.toContain("person@example.com");
    expect(payload.text).toContain(message.message);
    expect(payload).not.toHaveProperty("html");
  });

  it("returns delivery failure and logs only the error code", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const send = vi.fn<EmailClient["emails"]["send"]>().mockResolvedValue({
      data: null,
      error: { name: "rate_limit_exceeded", statusCode: 429 },
    });
    await expect(sendContactEmail(message, { emails: { send } })).resolves.toEqual({
      ok: false,
      code: "rate_limit_exceeded",
    });
    const logged = errorLog.mock.calls.flat().join(" ");
    expect(logged).toContain("rate_limit_exceeded");
    expect(logged).not.toContain("person@example.com");
    expect(logged).not.toContain(message.message);
  });

  it("never throws on network errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const send = vi
      .fn<EmailClient["emails"]["send"]>()
      .mockRejectedValue(new Error("socket hang up"));
    await expect(sendContactEmail(message, { emails: { send } })).resolves.toEqual({
      ok: false,
      code: "network_error",
    });
  });

  it("refuses test mode on Vercel production", async () => {
    vi.stubEnv("CONTACT_TEST_MODE", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Not configured → real path → fails instead of pretending to deliver.
    await expect(sendContactEmail(message)).resolves.toEqual({ ok: false, code: "not_configured" });
  });
});
