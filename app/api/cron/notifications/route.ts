import { syncNotifications } from "@/lib/notifications";
import { isAuthorizedCronRequest, unauthorizedCronResponse } from "@/lib/cron-auth";

// Notification sweep: flags overdue leads and expiring quotes, then sends
// the batched digest email. This already runs on every page load (see
// app/layout.tsx); the scheduled run makes sure digests still go out on a
// quiet day when nobody opens the app.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) return unauthorizedCronResponse();

  await syncNotifications();
  return Response.json({ ok: true });
}
