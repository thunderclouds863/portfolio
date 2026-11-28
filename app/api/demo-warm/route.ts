import { NextResponse } from "next/server";

const ALLOWED_DEMO_HOSTS = new Set([
  "overtime-demo.vercel.app",
  "cimory-academy-demo.vercel.app",
  "inventory-demo-woad.vercel.app",
  "ecommerce1-demo.vercel.app",
  "ecommerce2-demo.vercel.app",
  "peminjaman-alat-demo.vercel.app",
  "generate-surat-demo.vercel.app",
  "penyaluran-donasi-demo.vercel.app",
  "perpustakaan-demo.vercel.app",
  "monitoring-termal-demo.vercel.app",
]);

const COOLDOWN_MS = 3 * 60 * 1000;
const recentWarms = new Map<string, number>();

async function warmTarget(rawUrl: string | null) {
  if (!rawUrl) return { ok: false, warmed: false };
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, warmed: false };
  }
  if (parsed.protocol !== "https:" || !ALLOWED_DEMO_HOSTS.has(parsed.hostname)) {
    return { ok: false, warmed: false };
  }

  const origin = parsed.origin;
  const now = Date.now();
  const last = recentWarms.get(origin) ?? 0;
  if (now - last < COOLDOWN_MS) {
    return { ok: true, warmed: false, cached: true };
  }
  recentWarms.set(origin, now);

  try {
    const res = await fetch(parsed.href, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
    });
    return { ok: true, warmed: true, status: res.status };
  } catch {
    return { ok: true, warmed: true };
  }
}

export async function POST(request: Request) {
  let target: string | null = null;
  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body?.url === "string") target = body.url;
  } catch {
    target = new URL(request.url).searchParams.get("url");
  }
  const result = await warmTarget(target);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
