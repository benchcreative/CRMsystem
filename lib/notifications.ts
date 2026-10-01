import { prisma } from "@/lib/prisma";
import { needsFollowUp } from "@/lib/labels";
import { sendBatchNotificationEmail } from "@/lib/notification-email";
import { formatCustomerName } from "@/lib/customer";
import type { NotificationType } from "@prisma/client";

const QUOTE_EXPIRING_WINDOW_DAYS = 2;

// Single choke point for creating a Notification row. Every trigger in this
// file (and the quote status-change action) goes through this rather than
// calling prisma.notification.create directly. Email is NOT sent here — it
// goes out batched, whenever a check run next flushes pending notifications
// (see flushPendingNotificationEmails below).
export async function createNotification(data: {
  type: NotificationType;
  message: string;
  customerId?: string | null;
  quoteId?: string | null;
}) {
  return prisma.notification.create({ data });
}

// Runs on page load rather than a background job, so it's easy for two
// requests (e.g. a Next.js prefetch alongside the real navigation) to call
// this concurrently. The dedup checks below are check-then-create, not
// atomic, so without this in-process lock two overlapping calls could both
// see "no existing notification" and both create one. Serializing to a
// single in-flight run per process is enough here since this app runs as
// one Node process against one local SQLite file — there's no multi-worker
// deployment to worry about.
let inFlightSync: Promise<void> | null = null;

export async function syncNotifications(): Promise<void> {
  if (!inFlightSync) {
    inFlightSync = runSync().finally(() => {
      inFlightSync = null;
    });
  }
  await inFlightSync;
}

async function runSync(): Promise<void> {
  await Promise.all([
    syncOverdueLeadNotifications(),
    syncQuoteExpiringNotifications(),
  ]);
  await flushPendingNotificationEmails();
}

// Collects every notification created since the last flush — whether by the
// sync checks above or directly by a quote status change — and sends them
// as a single batched email, rather than one email per notification. Runs
// as part of every check run (see syncNotifications), so a notification
// created outside a sync pass (e.g. accepting a quote) still goes out the
// next time any page loads, folded in with whatever else is pending.
async function flushPendingNotificationEmails(): Promise<void> {
  const pending = await prisma.notification.findMany({
    where: { emailedAt: null },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) return;

  await sendBatchNotificationEmail(pending);

  await prisma.notification.updateMany({
    where: { id: { in: pending.map((n) => n.id) } },
    data: { emailedAt: new Date() },
  });
}

async function syncOverdueLeadNotifications(): Promise<void> {
  const customers = await prisma.customer.findMany({
    include: {
      contactLogs: { orderBy: { contactedAt: "desc" }, take: 1 },
    },
  });

  for (const customer of customers) {
    const lastContactedAt = customer.contactLogs[0]?.contactedAt ?? null;
    if (!needsFollowUp(customer.status, lastContactedAt)) continue;

    const latestNotification = await prisma.notification.findFirst({
      where: { customerId: customer.id, type: "overdue_lead" },
      orderBy: { createdAt: "desc" },
    });

    // Already notified for this specific overdue period: either there's no
    // contact at all yet (nothing has changed since we last notified), or
    // the notification was created after the most recent contact (meaning
    // they went quiet again since, but we've already flagged this spell).
    const alreadyNotified =
      latestNotification &&
      (lastContactedAt === null ||
        latestNotification.createdAt >= lastContactedAt);

    if (alreadyNotified) continue;

    await createNotification({
      type: "overdue_lead",
      message: `${formatCustomerName(customer)} needs a follow-up`,
      customerId: customer.id,
    });
  }
}

async function syncQuoteExpiringNotifications(): Promise<void> {
  const now = new Date();
  const windowEnd = new Date(
    now.getTime() + QUOTE_EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const quotes = await prisma.quote.findMany({
    where: {
      validUntil: { not: null, lte: windowEnd },
      // Only still-pending quotes: once accepted/declined, "expiring"
      // doesn't mean anything anymore.
      status: { in: ["draft", "sent"] },
    },
    include: {
      customer: { select: { firstName: true, lastName: true } },
    },
  });

  for (const quote of quotes) {
    const existing = await prisma.notification.findFirst({
      where: { quoteId: quote.id, type: "quote_expiring" },
    });
    if (existing) continue;

    const customerName = formatCustomerName(quote.customer);
    const hasExpired = quote.validUntil! < now;
    const message = hasExpired
      ? `Quote ${quote.quoteNumber} for ${customerName} has expired`
      : `Quote ${quote.quoteNumber} for ${customerName} expires soon`;

    await createNotification({
      type: "quote_expiring",
      message,
      customerId: quote.customerId,
      quoteId: quote.id,
    });
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  return prisma.notification.count({ where: { read: false } });
}

// Shared fetch for the NotificationBell, used by every internal page's own
// header row now that the sidebar layout no longer renders one bell for
// the whole app.
export async function getNotificationBellData() {
  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { read: false } }),
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        message: true,
        read: true,
        createdAt: true,
        customerId: true,
        quoteId: true,
      },
    }),
  ]);
  return { unreadCount, notifications };
}
