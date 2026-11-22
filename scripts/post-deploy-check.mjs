#!/usr/bin/env node
/*
 * Post-deploy checklist (PRD 13) against a live URL.
 *
 * Usage: node scripts/post-deploy-check.mjs https://<domain> [--local]
 *   --local  skip the checks that only make sense on the real domain
 *            (TLS certificate, http->https and www redirects, https-only rules).
 *
 * Checks: status codes for every sitemap route and fixed routes, 404 for
 * unknown routes, TLS certificate, http/www redirects, security headers,
 * sitemap.xml and robots.txt, Open Graph / Twitter tags and the OG image.
 * No dependencies. Exit code 1 when any check fails.
 */
import tls from "node:tls";

const args = process.argv.slice(2);
const LOCAL = args.includes("--local");
const raw = args.find((a) => !a.startsWith("--"));
if (!raw) {
  console.error("usage: node scripts/post-deploy-check.mjs https://<domain> [--local]");
  process.exit(2);
}
const BASE = new URL(raw);
const ORIGIN = BASE.origin;

try {
  await fetch(ORIGIN, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
} catch (error) {
  console.error(
    `post-deploy check: cannot reach ${ORIGIN} (${error.cause?.code ?? error.message})`,
  );
  process.exit(2);
}

const results = [];
const pass = (name, detail = "") => results.push({ ok: true, name, detail });
const fail = (name, detail = "") => results.push({ ok: false, name, detail });
const check = (cond, name, detail) => (cond ? pass(name, detail) : fail(name, detail));

const get = (path, init = {}) =>
  fetch(new URL(path, ORIGIN), {
    redirect: "manual",
    headers: { "user-agent": "portfolio-post-deploy-check/1.0" },
    signal: AbortSignal.timeout(20_000),
    ...init,
  });

const metaContent = (html, attr, key) => {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    if (new RegExp(`${attr}=["']${key}["']`, "i").test(tag)) {
      return tag.match(/content=["']([^"']*)["']/i)?.[1] ?? null;
    }
  }
  return null;
};

// ── Sitemap and robots ─────────────────────────────────────────────────────
const sitemapRes = await get("/sitemap.xml");
const sitemap = sitemapRes.status === 200 ? await sitemapRes.text() : "";
check(sitemapRes.status === 200, "sitemap.xml returns 200", `HTTP ${sitemapRes.status}`);
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
check(locs.length > 0, "sitemap lists routes", `${locs.length} URLs`);
check(
  locs.every((l) => l.startsWith(ORIGIN)),
  "sitemap URLs use the production origin",
  locs.filter((l) => !l.startsWith(ORIGIN)).join(", ") || ORIGIN,
);
check(
  !locs.some((l) => /\/(keystatic|admin|api|styleguide)/.test(l)),
  "sitemap has no admin/dev routes",
);

const robotsRes = await get("/robots.txt");
const robots = robotsRes.status === 200 ? await robotsRes.text() : "";
check(robotsRes.status === 200, "robots.txt returns 200", `HTTP ${robotsRes.status}`);
for (const rule of ["/keystatic", "/admin", "/api/", "/styleguide"]) {
  check(robots.includes(`Disallow: ${rule}`), `robots disallows ${rule}`);
}
check(
  robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`),
  "robots points at the sitemap",
  robots.match(/Sitemap: .*/)?.[0] ?? "missing",
);

// ── Routes ─────────────────────────────────────────────────────────────────
const fixed = ["/", "/projects", "/cv", "/privacy", "/testimonials"];
const routes = [...new Set([...fixed, ...locs.map((l) => new URL(l).pathname)])];
const pages = new Map();
for (const path of routes) {
  const res = await get(path);
  const html = res.status === 200 ? await res.text() : "";
  pages.set(path, { res, html });
  check(res.status === 200, `${path} returns 200`, `HTTP ${res.status}`);
}
for (const path of ["/this-page-does-not-exist", "/projects/this-project-does-not-exist"]) {
  const res = await get(path);
  check(res.status === 404, `${path} returns 404`, `HTTP ${res.status}`);
}
const ks = await get("/keystatic");
check(
  (ks.headers.get("x-robots-tag") ?? "").includes("noindex"),
  "/keystatic sends X-Robots-Tag noindex",
  `HTTP ${ks.status}`,
);

// ── Security headers (home) ────────────────────────────────────────────────
const home = pages.get("/").res.headers;
const csp = home.get("content-security-policy") ?? "";
check(csp.includes("default-src 'self'"), "Content-Security-Policy present");
check(csp.includes("frame-ancestors 'none'"), "CSP frame-ancestors 'none'");
if (!LOCAL) check(csp.includes("upgrade-insecure-requests"), "CSP upgrade-insecure-requests");
check(
  (home.get("strict-transport-security") ?? "").includes("max-age="),
  "Strict-Transport-Security",
  home.get("strict-transport-security") ?? "missing",
);
check(home.get("x-content-type-options") === "nosniff", "X-Content-Type-Options nosniff");
check(!!home.get("referrer-policy"), "Referrer-Policy", home.get("referrer-policy") ?? "missing");
check(!!home.get("permissions-policy"), "Permissions-Policy");
check(home.get("x-frame-options") === "DENY", "X-Frame-Options DENY");
check(!home.get("x-powered-by"), "no X-Powered-By header");

// ── Metadata and Open Graph ────────────────────────────────────────────────
const titles = new Set();
for (const [path, { html }] of pages) {
  if (!html) continue;
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
  check(!!title && !titles.has(title), `${path} has a unique <title>`, title);
  titles.add(title);
  const description = metaContent(html, "name", "description");
  check(
    !!description && !/TODO/.test(description),
    `${path} has a meta description`,
    description ?? "missing",
  );
  const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)?.[0];
  const href = canonical?.match(/href=["']([^"']+)["']/i)?.[1] ?? "";
  // The home canonical is the bare origin (no trailing slash); compare normalised.
  const noSlash = (u) => u.replace(/\/$/, "");
  check(
    !!href && noSlash(href) === noSlash(new URL(path, ORIGIN).href),
    `${path} canonical`,
    href || "missing",
  );
  const ogImage = metaContent(html, "property", "og:image");
  check(!!metaContent(html, "property", "og:title"), `${path} og:title`);
  check(
    !!ogImage && ogImage.startsWith(LOCAL ? "http" : "https://"),
    `${path} og:image is absolute`,
    ogImage ?? "missing",
  );
  check(
    metaContent(html, "name", "twitter:card") === "summary_large_image",
    `${path} twitter:card`,
  );
  if (html.includes("[ MISSING:")) fail(`${path} shows no MISSING markers`, "unpublished content");
}
const og = await get("/opengraph-image");
const png = og.status === 200 ? Buffer.from(await og.arrayBuffer()) : Buffer.alloc(0);
check(
  og.status === 200 && (og.headers.get("content-type") ?? "").includes("image/png"),
  "OG image is a PNG",
  `HTTP ${og.status}`,
);
check(
  png.length > 24 && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630,
  "OG image is 1200x630",
);

// ── HTTPS, certificate and redirects (real domain only) ───────────────────
if (!LOCAL) {
  const cert = await new Promise((resolve) => {
    const socket = tls.connect(
      { host: BASE.hostname, port: 443, servername: BASE.hostname, timeout: 15_000 },
      () => {
        resolve({ authorized: socket.authorized, cert: socket.getPeerCertificate() });
        socket.end();
      },
    );
    socket.on("error", (error) => resolve({ authorized: false, error: error.message }));
  });
  const days = cert.cert?.valid_to
    ? Math.floor((new Date(cert.cert.valid_to) - Date.now()) / 86_400_000)
    : -1;
  check(
    cert.authorized && days > 14,
    "TLS certificate valid",
    cert.error ?? `${days} days left (${cert.cert?.valid_to})`,
  );

  const httpRes = await fetch(`http://${BASE.host}/`, {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
  check(
    [301, 308].includes(httpRes.status) &&
      (httpRes.headers.get("location") ?? "").startsWith(`https://${BASE.host}`),
    "http:// redirects permanently to https://",
    `HTTP ${httpRes.status} -> ${httpRes.headers.get("location")}`,
  );

  const other = BASE.hostname.startsWith("www.") ? BASE.hostname.slice(4) : `www.${BASE.hostname}`;
  try {
    const altRes = await fetch(`https://${other}/`, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
    check(
      [301, 307, 308].includes(altRes.status) &&
        (altRes.headers.get("location") ?? "").startsWith(ORIGIN),
      `${other} redirects to ${BASE.hostname}`,
      `HTTP ${altRes.status} -> ${altRes.headers.get("location")}`,
    );
  } catch (error) {
    fail(`${other} redirects to ${BASE.hostname}`, error.message);
  }
}

// ── Report ─────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed for ${ORIGIN}`);
process.exit(failed.length ? 1 : 0);
