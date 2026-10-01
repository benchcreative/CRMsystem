// Guards against Next.js dev-mode reloads re-registering the schedule on
// every file change, mirroring the globalThis singleton pattern already
// used for the Prisma client in lib/prisma.ts.
const globalForCron = globalThis as unknown as { reminderCronStarted?: boolean };

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Local `next dev` only. Serverless deployments (Vercel) don't keep a
  // process alive for node-cron, so there the sweep runs via the
  // /api/cron/reminders route on the schedule in vercel.json.
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL) return;
  if (globalForCron.reminderCronStarted) return;
  globalForCron.reminderCronStarted = true;

  const cron = await import("node-cron");
  const { runDailyReminderSweep } = await import("@/lib/reminders");

  // Daily 9am appointment-reminder sweep — separate from any other
  // scheduled internal digest job, this one only sends the customer-facing
  // "your appointment is tomorrow" email (see lib/reminders.ts).
  cron.schedule("0 9 * * *", () => {
    runDailyReminderSweep().catch((error) => {
      console.error("Daily reminder sweep failed:", error);
    });
  });

  console.log("[reminders] Daily 9am appointment-reminder sweep scheduled.");
}
