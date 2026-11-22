#!/usr/bin/env node
/*
 * Link checker for the built site (PRD 12: zero broken internal/external links).
 *
 * Crawls a running production server (`npm run start`) from "/", following every
 * same-origin <a href>. For each page it checks:
 *   - internal links and assets (href/src/srcset) return 2xx;
 *   - "#fragment" targets exist on the target page (nav anchors, TOC links);
 *   - external http(s) links answer (HEAD, then GET), with retries.
 * External hosts that block automated requests (LinkedIn answers 999) are
 * reported as warnings, not failures; everything else non-2xx fails the run.
 *
 * Usage: node scripts/check-links.mjs [baseUrl] [--no-external]
 * No dependencies: Node's fetch plus a small attribute scanner.
 */

const args = process.argv.slice(2);
const BASE = new URL(args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000");
const CHECK_EXTERNAL = !args.includes("--no-external");

/** Never crawled: admin and API routes are not part of the public site. */
const SKIP_PATHS = [/^\/keystatic/, /^\/api\//, /^\/admin/];
/** Hosts known to reject bots: a non-2xx answer there is a warning only. */
const BOT_HOSTILE = [/(^|\.)linkedin\.com$/];

const TIMEOUT_MS = 15_000;
const UA = "Mozilla/5.0 (compatible; portfolio-link-check/1.0)";

const pages = new Map(); // pathname -> { status, ids:Set, html }
const queue = ["/"];
const references = []; // { from, url }
const failures = [];
const warnings = [];

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");

function attrValues(html, attr) {
  const re = new RegExp(`\\s${attr}=("([^"]*)"|'([^']*)')`, "gi");
  const out = [];
  for (const m of html.matchAll(re)) out.push(decode(m[2] ?? m[3] ?? ""));
  return out;
}

function anchorHrefs(html) {
  const out = [];
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) out.push(...attrValues(m[0], "href"));
  return out;
}

function assetUrls(html) {
  const out = [];
  for (const m of html.matchAll(/<(img|script|source|link|iframe)\b[^>]*>/gi)) {
    const tag = m[0];
    // preconnect/dns-prefetch point at origins, not resources; canonical and
    // alternate are metadata on NEXT_PUBLIC_SITE_URL (checked by the SEO e2e tests).
    if (/^<link/i.test(tag) && /rel=["'](preconnect|dns-prefetch|canonical|alternate)/i.test(tag)) {
      continue;
    }
    out.push(...attrValues(tag, "src"), ...attrValues(tag, "href"));
    for (const set of attrValues(tag, "srcset")) {
      out.push(...set.split(",").map((part) => part.trim().split(/\s+/)[0]));
    }
  }
  return out.filter(Boolean);
}

async function request(url, method) {
  return fetch(url, {
    method,
    redirect: "follow",
    headers: { "user-agent": UA, accept: "text/html,*/*" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

async function fetchPage(pathname) {
  const res = await request(new URL(pathname, BASE), "GET");
  const type = res.headers.get("content-type") ?? "";
  const html = type.includes("text/html") ? await res.text() : "";
  const ids = new Set(attrValues(html, "id"));
  return { status: res.status, ids, html };
}

const isSkipped = (pathname) => SKIP_PATHS.some((re) => re.test(pathname));

async function crawl() {
  while (queue.length) {
    const pathname = queue.shift();
    if (pages.has(pathname)) continue;
    const page = await fetchPage(pathname);
    pages.set(pathname, page);
    if (!page.html) continue;
    const links = anchorHrefs(page.html).map((raw) => ({ raw, isLink: true }));
    const assets = assetUrls(page.html).map((raw) => ({ raw, isLink: false }));
    for (const { raw, isLink } of [...links, ...assets]) {
      if (/^(mailto|tel|javascript|data|blob):/i.test(raw)) continue;
      let url;
      try {
        url = new URL(raw, new URL(pathname, BASE));
      } catch {
        failures.push(`${pathname}: malformed URL "${raw}"`);
        continue;
      }
      references.push({ from: pathname, url });
      // Only <a href> targets are crawled as pages. Assets (images, scripts,
      // next/image URLs such as /_next/image?url=...) are checked as assets,
      // with their query string; crawling them as pages dropped the query.
      if (isLink && url.origin === BASE.origin && !isSkipped(url.pathname)) {
        const target = url.pathname;
        if (!pages.has(target) && !queue.includes(target) && !/\.[a-z0-9]+$/i.test(target)) {
          queue.push(target);
        }
      }
    }
  }
}

async function checkInternal() {
  const assets = new Map();
  for (const { from, url } of references) {
    if (url.origin !== BASE.origin || isSkipped(url.pathname)) continue;
    const page = pages.get(url.pathname);
    if (page) {
      if (page.status < 200 || page.status >= 300) {
        failures.push(`${from} -> ${url.pathname}: HTTP ${page.status}`);
      } else if (url.hash && url.hash.length > 1) {
        const id = decodeURIComponent(url.hash.slice(1));
        if (!page.ids.has(id))
          failures.push(`${from} -> ${url.pathname}${url.hash}: no element with that id`);
      }
      continue;
    }
    const key = url.pathname + url.search;
    if (!assets.has(key)) assets.set(key, from);
  }
  await Promise.all(
    [...assets].map(async ([key, from]) => {
      const res = await request(new URL(key, BASE), "GET");
      await res.body?.cancel();
      if (res.status < 200 || res.status >= 300)
        failures.push(`${from} -> ${key}: HTTP ${res.status}`);
    }),
  );
  return assets.size;
}

async function checkExternalUrl(href) {
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      let res = await request(href, "HEAD");
      if (res.status === 405 || res.status === 403 || res.status === 404) {
        res = await request(href, "GET");
        await res.body?.cancel();
      }
      if (res.status >= 200 && res.status < 400) return null;
      lastError = `HTTP ${res.status}`;
      if (res.status < 500 && res.status !== 429) break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  return lastError;
}

async function checkExternal() {
  const external = new Map();
  for (const { from, url } of references) {
    if (url.origin === BASE.origin || !/^https?:$/.test(url.protocol)) continue;
    const href = url.href.split("#")[0];
    if (!external.has(href)) external.set(href, new Set());
    external.get(href).add(from);
  }
  if (!CHECK_EXTERNAL) return external.size;
  await Promise.all(
    [...external].map(async ([href, froms]) => {
      const error = await checkExternalUrl(href);
      if (!error) return;
      const line = `${[...froms].join(", ")} -> ${href}: ${error}`;
      const host = new URL(href).hostname;
      if (BOT_HOSTILE.some((re) => re.test(host)))
        warnings.push(`${line} (host blocks automated checks)`);
      else failures.push(line);
    }),
  );
  return external.size;
}

const started = Date.now();
try {
  await fetch(BASE, { signal: AbortSignal.timeout(TIMEOUT_MS) });
} catch {
  console.error(`link check: no server at ${BASE.href}. Run \`npm run start\` first.`);
  process.exit(2);
}
await crawl();
const assetCount = await checkInternal();
const externalCount = await checkExternal();

console.log(
  `link check: ${pages.size} pages, ${assetCount} assets, ${externalCount} external links` +
    `${CHECK_EXTERNAL ? "" : " (external not checked)"} in ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
for (const pathname of [...pages.keys()].sort())
  console.log(`  page ${pathname} ${pages.get(pathname).status}`);
for (const w of warnings) console.warn(`  WARN ${w}`);
if (failures.length) {
  for (const f of failures) console.error(`  FAIL ${f}`);
  console.error(`link check: ${failures.length} broken link(s)`);
  process.exit(1);
}
console.log("link check: no broken links");
