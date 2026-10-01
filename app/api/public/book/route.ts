import { readBookingInput, submitBooking } from "@/lib/booking";
import { corsHeaders, forbiddenOriginResponse, getAllowedOrigin } from "@/lib/embed";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

// JSON bodies aren't a "simple" CORS request, so the browser sends this
// preflight before every POST from the embed widget.
export async function OPTIONS(request: Request) {
  const origin = await getAllowedOrigin(request);
  if (!origin) return forbiddenOriginResponse();
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = await getAllowedOrigin(request);
  if (!origin) return forbiddenOriginResponse();
  const headers = corsHeaders(origin);

  // Counts every attempt from an allowed origin (not just successful
  // bookings), so bots retrying rejected submissions are throttled too.
  const rate = checkRateLimit(`book:${clientIp(request)}`, RATE_LIMIT);
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many submissions. Please try again in a few minutes." },
      {
        status: 429,
        headers: { ...headers, "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Invalid request." }, { status: 400, headers });
  }

  const fields = body as Record<string, unknown>;
  const result = await submitBooking(readBookingInput((key) => fields[key]));

  switch (result.status) {
    case "booked":
      return Response.json(
        {
          success: {
            name: result.name,
            dateLabel: result.dateLabel,
            time: result.time,
            companyName: result.companyName,
          },
        },
        { status: 201, headers }
      );
    case "invalid":
      return Response.json({ errors: result.errors }, { status: 400, headers });
    case "rejected":
      return Response.json({ error: "Submission rejected." }, { status: 400, headers });
  }
}
