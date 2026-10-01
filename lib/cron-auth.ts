import { timingSafeEqual } from "node:crypto";

// Guards the /api/cron/* routes. Vercel Cron calls them with
// "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set on the
// project; anything else (or a missing secret) is rejected so the jobs
// can't be triggered by anyone who finds the URL.
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function unauthorizedCronResponse(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
