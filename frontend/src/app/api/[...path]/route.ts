// frontend/src/app/api/[...path]/route.ts
// Server-side proxy — reads INTERNAL_API_URL at runtime (never baked into the bundle).
// This replaces the next.config.ts rewrite approach which is unreliable in standalone mode.

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.INTERNAL_API_URL || "http://backend:8000";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const url = new URL(req.url);
  const backendUrl = `${BACKEND_URL}/api/${pathStr}${url.search}`;

  // Forward all headers except ones that should not be proxied
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!["host", "content-length"].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  let response: Response;
  try {
    response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
    });
  } catch (err) {
    console.error(`[proxy] fetch failed → ${backendUrl}:`, err);
    return new NextResponse(
      JSON.stringify({ detail: "Backend unreachable" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // Forward response headers except hop-by-hop ones
  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
