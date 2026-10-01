import { prisma } from "@/lib/prisma";

// Named constant, easy to adjust.
export const AI_MONTHLY_LIMIT = 200;

function isDifferentCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() !== b.getFullYear() || a.getMonth() !== b.getMonth();
}

// Resets the counter if the last reset was in a previous calendar month.
// Called before every check/display so the number shown is always current,
// not just at the moment of an AI call.
async function currentMonthSettings() {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  const now = new Date();

  if (!settings) {
    // Settings row always exists in this app; this is just a safe fallback
    // rather than a hard crash if it's somehow missing.
    return { aiCallsThisMonth: 0, aiCallsResetAt: now };
  }

  if (isDifferentCalendarMonth(settings.aiCallsResetAt, now)) {
    return prisma.settings.update({
      where: { id: "singleton" },
      data: { aiCallsThisMonth: 0, aiCallsResetAt: now },
    });
  }

  return settings;
}

export async function checkAiUsageLimit(): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const settings = await currentMonthSettings();
  return {
    allowed: settings.aiCallsThisMonth < AI_MONTHLY_LIMIT,
    used: settings.aiCallsThisMonth,
    limit: AI_MONTHLY_LIMIT,
  };
}

// Called only after a successful AI call (see lib/ai-usage.ts callers) —
// never before, so a failed call doesn't count against the cap.
export async function incrementAiUsage(): Promise<void> {
  await prisma.settings.update({
    where: { id: "singleton" },
    data: { aiCallsThisMonth: { increment: 1 } },
  });
}

// For display on the settings page.
export async function getAiUsage(): Promise<{ used: number; limit: number }> {
  const settings = await currentMonthSettings();
  return { used: settings.aiCallsThisMonth, limit: AI_MONTHLY_LIMIT };
}
