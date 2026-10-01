import { NextResponse, type NextRequest } from "next/server";

// Demo-instance gate: HTTP basic auth in front of the internal CRM, enabled
// only when DEMO_USER and DEMO_PASSWORD are both set (so `npm run dev` with
// no env stays open). Customer-facing routes stay public: the booking page,
// shared quote links, the embed widget and the API it calls.
// /api/cron/* is also skipped here: Vercel Cron sends
// "Authorization: Bearer <CRON_SECRET>", which would collide with basic
// auth, and those routes check CRON_SECRET themselves.
//
// Next.js internals (/_next/*) and public/ files are excluded via the
// matcher below, so public pages still get their JS, CSS and fonts.
const PUBLIC_PATHS = [/^\/book(\/|$)/, /^\/q\//, /^\/api\/public\//, /^\/api\/cron\//];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((pattern) => pattern.test(pathname));
}

// Constant-time comparison so response timing doesn't leak how much of the
// password matched.
function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < Math.max(aBytes.length, bBytes.length); i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

function hasValidCredentials(request: NextRequest, user: string, password: string): boolean {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice("Basic ".length).trim());
  } catch {
    return false;
  }
  const separator = decoded.indexOf(":");
  if (separator === -1) return false;

  const userOk = safeEqual(decoded.slice(0, separator), user);
  const passwordOk = safeEqual(decoded.slice(separator + 1), password);
  return userOk && passwordOk;
}

export function proxy(request: NextRequest) {
  const user = process.env.DEMO_USER;
  const password = process.env.DEMO_PASSWORD;
  if (!user || !password) return NextResponse.next();

  if (isPublicPath(request.nextUrl.pathname)) return NextResponse.next();
  if (hasValidCredentials(request, user, password)) return NextResponse.next();

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CRM demo", charset="UTF-8"' },
  });
}

export const config = {
  matcher: [
    // Everything except Next.js build assets, image optimisation and files
    // served from public/ (embed.js, favicon, svgs, etc.).
    "/((?!_next/static|_next/image|favicon\\.ico|embed\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff2?)$).*)",
  ],
};
