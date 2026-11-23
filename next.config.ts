import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Safari/WebKit applies upgrade-insecure-requests to http://localhost too, which
// rewrites every asset to https://localhost and breaks a local production build
// (and the WebKit e2e run). Send it only when the site itself is served over HTTPS.
const isHttpsSite = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

// PRD section 10. 'unsafe-inline' scripts are accepted because nonces force
// dynamic rendering. 'unsafe-eval' is added in development only (React dev
// tooling needs it; production does not).
function buildCsp({ admin = false } = {}) {
  // PRD 18.6: the Keystatic admin additionally talks to GitHub (API, sign-in,
  // avatars) and loads its own UI font (Inter) from Google Fonts. Admin routes only.
  const extra = admin
    ? {
        connect: " https://api.github.com https://github.com https://raw.githubusercontent.com",
        img: " https://avatars.githubusercontent.com",
        style: " https://fonts.googleapis.com",
        font: " https://fonts.gstatic.com",
      }
    : { connect: "", img: "", style: "", font: "" };
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
    `style-src 'self' 'unsafe-inline'${extra.style}`,
    `img-src 'self' data: blob:${extra.img}`,
    `font-src 'self'${extra.font}`,
    `connect-src 'self' https://challenges.cloudflare.com${extra.connect}`,
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    // PRD 18.6: Keystatic's GitHub App setup form posts to github.com (admin only).
    `form-action 'self'${admin ? " https://github.com" : ""}`,
    "object-src 'none'",
    ...(!isDev && isHttpsSite ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildCsp() },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Dev only: allow HMR and dev resources when the site is opened at 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
  // PRD section 11: modern image formats for next/image.
  images: { formats: ["image/avif", "image/webp"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Later entries override the same header key for matching paths (Next.js headers()).
      ...["/keystatic", "/keystatic/:path*", "/api/keystatic/:path*"].map((source) => ({
        source,
        headers: [
          { key: "Content-Security-Policy", value: buildCsp({ admin: true }) },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      })),
    ];
  },
};

export default nextConfig;
