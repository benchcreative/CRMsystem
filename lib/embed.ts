import { prisma } from "@/lib/prisma";

// Browsers always send Origin on the embed widget's cross-origin requests;
// localhost (any port) is allowed so the widget can be tested locally.
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

const HOSTNAME_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

function toHostname(entry: string): string | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(entry)
    ? entry
    : `https://${entry}`;
  try {
    const { hostname } = new URL(withScheme);
    return HOSTNAME_PATTERN.test(hostname) ? hostname : null;
  } catch {
    return null;
  }
}

// Accepts bare hostnames ("client.co.uk") or pasted URLs
// ("https://www.client.co.uk/contact") and normalises both to hostnames.
export function parseEmbedDomains(raw: string): {
  hostnames: string[];
  invalid: string[];
} {
  const hostnames: string[] = [];
  const invalid: string[] = [];
  for (const entry of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    const hostname = toHostname(entry);
    if (!hostname) invalid.push(entry);
    else if (!hostnames.includes(hostname)) hostnames.push(hostname);
  }
  return { hostnames, invalid };
}

// "client.co.uk" and "www.client.co.uk" are treated as the same site.
function withoutWww(hostname: string): string {
  return hostname.replace(/^www\./, "");
}

// Returns the request's Origin if it's allowed to use the public booking
// API, otherwise null. Rejecting server-side (not just omitting CORS
// headers) matters for POST — CORS alone only stops the browser reading the
// response, the booking would still be created.
export async function getAllowedOrigin(request: Request): Promise<string | null> {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return null;
  }
  if (LOCAL_HOSTNAMES.has(hostname)) return origin;

  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
    select: { allowedEmbedDomains: true },
  });
  const { hostnames } = parseEmbedDomains(settings?.allowedEmbedDomains ?? "");
  const allowed = hostnames.some(
    (allowedHost) => withoutWww(allowedHost) === withoutWww(hostname)
  );
  return allowed ? origin : null;
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function forbiddenOriginResponse(): Response {
  return Response.json(
    { error: "This site isn't allowed to use the booking form." },
    { status: 403, headers: { Vary: "Origin" } }
  );
}
