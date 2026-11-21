import { makeRouteHandler } from "@keystatic/next/route-handler";

import { isKeystaticEnabled } from "@/lib/keystatic-access";

import config from "../../../../keystatic.config";

const handlers = isKeystaticEnabled() ? makeRouteHandler({ config }) : null;

function notFound() {
  return new Response("Not Found", { status: 404 });
}

export function GET(request: Request) {
  return handlers ? handlers.GET(request) : notFound();
}

export function POST(request: Request) {
  return handlers ? handlers.POST(request) : notFound();
}
