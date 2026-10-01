import { runDailyReminderSweep } from "@/lib/reminders";
import { isAuthorizedCronRequest, unauthorizedCronResponse } from "@/lib/cron-auth";

// Daily appointment-reminder sweep (email + SMS ~24h ahead). Scheduled in
// vercel.json; locally the same sweep runs via node-cron in
// instrumentation.ts.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) return unauthorizedCronResponse();

  await runDailyReminderSweep();
  return Response.json({ ok: true });
}
