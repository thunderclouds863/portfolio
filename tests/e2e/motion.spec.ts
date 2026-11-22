import { expect, test, type Page } from "@playwright/test";

// Phase 4 — PRD section 7. The production build has no published content yet,
// so the timeline and pipeline are exercised on the dev-only /styleguide demo
// (built into the e2e build via ENABLE_STYLEGUIDE=1); parallax, reveals and the
// typing line are tested on the home page.

const layerY = (page: Page, layer: string) =>
  page.locator(`[data-layer="${layer}"]`).evaluate((el) => {
    const t = getComputedStyle(el).transform;
    return t === "none" ? 0 : new DOMMatrixReadOnly(t).m42;
  });

const scrollTo = (page: Page, y: number) =>
  page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);

const scrollToCentre = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => {
    const box = el.getBoundingClientRect();
    const top = window.scrollY + box.top + box.height / 2 - window.innerHeight / 2;
    window.scrollTo({ top, behavior: "instant" });
  });

test.describe("full motion, desktop 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: "no-preference" });

  test("parallax layers move by depth, transform only, within 120px", async ({ page }) => {
    await page.goto("/");
    expect(await layerY(page, "L0")).toBe(0);
    await scrollTo(page, 400);
    await expect.poll(() => layerY(page, "L0")).toBeGreaterThan(0);
    const [l0, l1, l3] = [
      await layerY(page, "L0"),
      await layerY(page, "L1"),
      await layerY(page, "L3"),
    ];
    expect(l0).toBeGreaterThan(l1); // far layer lags more than mid
    expect(l1).toBeGreaterThan(0);
    expect(l3).toBeLessThan(0); // near layer moves ahead
    await scrollTo(page, 3000);
    await expect.poll(() => layerY(page, "L0")).toBeCloseTo(120, 0);
    for (const layer of ["L0", "L1", "L3"]) {
      expect(Math.abs(await layerY(page, layer))).toBeLessThanOrEqual(120);
      // Only transform is written inline.
      const style = await page.locator(`[data-layer="${layer}"]`).getAttribute("style");
      expect(style ?? "").toMatch(/^transform: translate3d\(0px, -?[\d.]+px, 0px\);$/);
    }
  });

  test("sections below the fold reveal once when scrolled into view", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("#contact-title").locator("xpath=..");
    await expect(header).toHaveAttribute("data-reveal", "hidden");
    await expect(header).toHaveCSS("opacity", "0");
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(header).toHaveAttribute("data-reveal", "shown");
    await expect(header).toHaveCSS("opacity", "1");
    // Once: scrolling away does not hide it again.
    await scrollTo(page, 0);
    await expect(header).toHaveAttribute("data-reveal", "shown");
  });

  test("content in the first viewport is never hidden", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#top [data-reveal]")).toHaveCount(0);
    await expect(page.locator("h1")).toHaveCSS("opacity", "1");
  });

  test("typing line types once within 1.5s and then shows the whole line", async ({ page }) => {
    await page.goto("/");
    const cover = page.locator("[data-typing-cover]");
    const timing = await cover.evaluate((el) => {
      const anim = el.getAnimations()[0];
      const t = anim?.effect?.getComputedTiming();
      return { duration: Number(t?.duration), iterations: t?.iterations };
    });
    expect(timing.duration).toBeLessThanOrEqual(1500);
    expect(timing.iterations).toBe(1);
    await expect
      .poll(() => cover.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41))
      .toBeGreaterThan(100);
  });

  test("timeline line draws and pipeline fills with scroll (styleguide demo)", async ({ page }) => {
    await page.goto("/styleguide");
    const line = page.locator("[data-timeline-line]");
    const bar = page.locator("[data-approach-progress]");
    const scale = (loc: typeof line, axis: "a" | "d") =>
      loc.evaluate((el, ax) => {
        const t = getComputedStyle(el).transform;
        return t === "none" ? 1 : new DOMMatrixReadOnly(t)[ax];
      }, axis);

    await scrollTo(page, 0);
    await expect.poll(() => scale(line, "d")).toBeLessThan(0.05);

    await scrollToCentre(page, '[aria-label="Timeline demo"]');
    await expect.poll(() => scale(line, "d")).toBeGreaterThan(0.2);

    await scrollToCentre(page, '[aria-label="Pipeline demo"]');
    await expect.poll(() => scale(bar, "a")).toBeGreaterThan(0.2);
    await expect(page.locator('[aria-label="Pipeline demo"] [data-active]')).toHaveCount(1);
  });

  test("no layout shift while loading and scrolling (CLS < 0.05)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    for (let y = 0; y <= 8000; y += 400) {
      await scrollTo(page, y);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(600);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    test.info().annotations.push({ type: "CLS", description: cls.toFixed(4) });
    expect(cls).toBeLessThan(0.05);
  });

  // PRD section 11 targets <= 150 KB compressed. Measured 176.5 KB at Phase 4: the
  // Next.js/React runtime alone is ~115 KB, and Motion + reveal code adds ~6.5 KB.
  // The target is NOT met yet (open decision); this guard catches further growth.
  // Phase 6: 181.1 KB — the working contact form adds ~4.6 KB (Zod loads only on submit,
  // Turnstile only near the form). Guard raised from 180 to 185 KB accordingly.
  test("first-load JS on / does not grow past the 185 KB regression guard", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const js = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .filter(
          (e) =>
            (e as PerformanceResourceTiming).initiatorType === "script" || e.name.endsWith(".js"),
        )
        .reduce(
          (acc, e) => {
            const r = e as PerformanceResourceTiming;
            return {
              encoded: acc.encoded + r.encodedBodySize,
              decoded: acc.decoded + r.decodedBodySize,
              count: acc.count + 1,
            };
          },
          { encoded: 0, decoded: 0, count: 0 },
        ),
    );
    const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
    test.info().annotations.push({
      type: "first-load JS",
      description: `${js.count} files, ${kb(js.encoded)} transferred (compressed), ${kb(js.decoded)} uncompressed`,
    });
    console.log(
      `first-load JS: ${js.count} files, ${kb(js.encoded)} compressed, ${kb(js.decoded)} uncompressed`,
    );
    expect(js.encoded).toBeLessThanOrEqual(185 * 1024);
  });
});

test.describe("reduced motion (prefers-reduced-motion: reduce)", () => {
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });

  test("parallax factors are 0 after scrolling", async ({ page }) => {
    await page.goto("/");
    await scrollTo(page, 600);
    await page.waitForTimeout(300);
    for (const layer of ["L0", "L1", "L3"]) {
      expect(await layerY(page, layer)).toBe(0);
    }
  });

  test("reveals are instant: nothing is ever hidden", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);
    await expect(page.locator('[data-reveal="hidden"]')).toHaveCount(0);
    await expect(page.locator("#contact-title")).toHaveCSS("opacity", "1");
  });

  test("typing line is static, blinking stops, scanlines are hidden", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-typing-cover]")).toBeHidden();
    const cursor = page.locator("#top .animate-blink").first();
    await expect(cursor).toHaveCSS("animation-iteration-count", "1");
    await page.waitForTimeout(100);
    await expect(cursor).toHaveCSS("opacity", "1");
    await expect(page.getByTestId("scanlines")).toBeHidden();
  });

  test("timeline is fully drawn and pipeline is not animated (styleguide demo)", async ({
    page,
  }) => {
    await page.goto("/styleguide");
    await scrollToCentre(page, '[aria-label="Pipeline demo"]');
    await page.waitForTimeout(300);
    await expect(page.locator("[data-timeline-line]")).toHaveCSS("transform", "none");
    await expect(page.locator('[aria-label="Pipeline demo"] [data-active]')).toHaveCount(0);
  });
});

test.describe("mobile 375px: reveals only", { tag: "@mobile" }, () => {
  test.use({ viewport: { width: 375, height: 812 }, reducedMotion: "no-preference" });

  test("no parallax, no scroll-linked line; reveals still run", async ({ page }) => {
    await page.goto("/");
    // Reveals arm after hydration, which takes longer in emulated mobile WebKit.
    await expect(page.locator('[data-reveal="hidden"]').first()).toBeAttached({ timeout: 15_000 });
    await scrollTo(page, 600);
    await page.waitForTimeout(300);
    for (const layer of ["L0", "L1", "L3"]) {
      expect(await layerY(page, layer)).toBe(0);
    }
    await page.goto("/styleguide");
    await scrollToCentre(page, '[aria-label="Timeline demo"]');
    await page.waitForTimeout(300);
    await expect(page.locator("[data-timeline-line]")).toHaveCSS("transform", "none");
  });
});
