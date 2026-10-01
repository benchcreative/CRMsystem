import { createElement } from "react";
import { prisma } from "@/lib/prisma";
import { APP_URL, emailBrandFromSettings, sendEmail } from "@/lib/email";
import NotificationDigestEmail from "@/emails/notification-digest";
import type { Notification } from "@prisma/client";

// Sends one email covering every notification passed in, rather than one
// email per notification. Best-effort: a failed or misconfigured send
// should never break the check run that triggered it.
//
// Set NEXT_PUBLIC_APP_URL to the real deployed URL (env var, not a code
// change) so the "Open dashboard" link doesn't point at localhost.
export async function sendBatchNotificationEmail(
  notifications: Notification[]
): Promise<void> {
  if (notifications.length === 0) return;

  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  const to = settings?.notificationEmail?.trim();

  if (!to) return; // No address configured — skip silently, don't error.

  await sendEmail({
    to,
    subject: `${notifications.length} update${notifications.length === 1 ? "" : "s"} in your CRM`,
    context: "notification digest",
    react: createElement(NotificationDigestEmail, {
      brand: emailBrandFromSettings(settings),
      messages: notifications.map((n) => n.message),
      dashboardUrl: APP_URL,
    }),
  });
}
