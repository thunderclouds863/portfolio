import { expect, test } from "@playwright/test";

// FR-CMS-02/03: with local storage, the admin UI and API exist only in
// development. The e2e suite runs a production build, so both must be 404.
test.describe("Keystatic admin in a production build without GitHub storage", () => {
  test("/keystatic returns 404", async ({ page }) => {
    const response = await page.goto("/keystatic");
    expect(response?.status()).toBe(404);
  });

  test("/api/keystatic returns 404", async ({ request }) => {
    const get = await request.get("/api/keystatic/tree");
    expect(get.status()).toBe(404);
    const post = await request.post("/api/keystatic/update");
    expect(post.status()).toBe(404);
  });

  test("admin routes send noindex", async ({ request }) => {
    const response = await request.get("/keystatic");
    expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  });
});
