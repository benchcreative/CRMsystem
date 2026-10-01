import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { statusLabels, statusOrder, needsFollowUp } from "@/lib/labels";
import { formatCustomerName } from "@/lib/customer";
import { formatPenceAsGBP } from "@/lib/currency";
import { formatTimeOnly, formatRelativeDate } from "@/lib/date";
import { NotificationBell } from "@/app/(internal)/components/NotificationBell";
import { CustomerQuickActions } from "@/app/(internal)/components/CustomerQuickActions";

// Depends on "today" (Today's schedule) and live counts — must never be
// served from a stale build-time snapshot, unlike static pages elsewhere
// in this app.
export const dynamic = "force-dynamic";

const RECENT_ACTIVITY_DAYS = 7;
const RECENT_ACTIVITY_LIMIT = 8;

function dayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default async function DashboardPage() {
  const { start: todayStart, end: todayEnd } = dayBounds(new Date());
  const activitySince = daysAgo(RECENT_ACTIVITY_DAYS);

  const [
    unreadCount,
    notifications,
    customersWithContact,
    appointmentsToday,
    installsToday,
    statusCounts,
    pipelineValueAgg,
    recentNotifications,
    recentCustomers,
  ] = await Promise.all([
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
    prisma.customer.findMany({
      include: { contactLogs: { orderBy: { contactedAt: "desc" }, take: 1 } },
    }),
    prisma.customer.findMany({
      where: { appointmentAt: { gte: todayStart, lt: todayEnd } },
      orderBy: { appointmentAt: "asc" },
    }),
    prisma.customer.findMany({
      where: {
        jobStatus: "scheduled",
        installDate: { gte: todayStart, lt: todayEnd },
      },
      orderBy: { installDate: "asc" },
    }),
    prisma.customer.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.customer.aggregate({
      _sum: { value: true },
      where: { status: { notIn: ["won", "lost"] } },
    }),
    prisma.notification.findMany({
      where: {
        type: { in: ["quote_accepted", "quote_declined"] },
        createdAt: { gte: activitySince },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { createdAt: { gte: activitySince } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Needs follow-up: same shared threshold function the customer list uses.
  const overdue = customersWithContact
    .map((customer) => ({
      ...customer,
      lastContactedAt: customer.contactLogs[0]?.contactedAt ?? null,
    }))
    .filter((customer) => needsFollowUp(customer.status, customer.lastContactedAt))
    .sort((a, b) => {
      if (!a.lastContactedAt && !b.lastContactedAt) return 0;
      if (!a.lastContactedAt) return -1;
      if (!b.lastContactedAt) return 1;
      return a.lastContactedAt.getTime() - b.lastContactedAt.getTime();
    });

  // Today's schedule: appointments and installs merged into one time-ordered list.
  const scheduleItems = [
    ...appointmentsToday.map((customer) => ({
      customer,
      time: customer.appointmentAt as Date,
      kind: "appointment" as const,
    })),
    ...installsToday.map((customer) => ({
      customer,
      time: customer.installDate as Date,
      kind: "install" as const,
    })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  const statusCountMap = new Map(
    statusCounts.map((row) => [row.status, row._count._all])
  );
  const pipelineValue = pipelineValueAgg._sum.value ?? 0;
  const activePipelineCount =
    (statusCountMap.get("new") ?? 0) +
    (statusCountMap.get("quote_booked") ?? 0) +
    (statusCountMap.get("quoted") ?? 0);

  // Recent activity: quote accepted/declined events (already-tracked
  // Notification rows) plus new customer creations, merged and trimmed.
  const recentActivity = [
    ...recentNotifications.map((notification) => ({
      message: notification.message,
      at: notification.createdAt,
      href: notification.quoteId
        ? `/quotes/${notification.quoteId}`
        : notification.customerId
          ? `/customers/${notification.customerId}/edit`
          : "/customers",
    })),
    ...recentCustomers.map((customer) => ({
      message: `New customer: ${formatCustomerName(customer)}`,
      at: customer.createdAt,
      href: `/customers/${customer.id}/edit`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT);

  return (
    <main className="px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-dash-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-dash-muted">
            A quick look at what needs attention today.
          </p>
        </div>
        <NotificationBell unreadCount={unreadCount} notifications={notifications} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Needs follow-up */}
        <div className="border border-dash-line bg-dash-surface p-6">
          <span className="block font-heading text-4xl leading-none tabular-nums text-accent">
            {overdue.length}
          </span>
          <p className="mt-1 text-sm text-dash-muted">Needs follow-up</p>

          {overdue.length === 0 ? (
            <p className="mt-5 text-sm text-dash-muted">All caught up.</p>
          ) : (
            <div className="mt-5 divide-y divide-dash-line">
              {overdue.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between py-2 text-sm transition-colors hover:bg-dash-line/30"
                >
                  <span className="flex items-center gap-2 text-dash-ink">
                    <span className="h-1.5 w-1.5 shrink-0 bg-accent" />
                    <CustomerQuickActions
                      customerId={customer.id}
                      name={formatCustomerName(customer)}
                      phone={customer.phone}
                      email={customer.email}
                      triggerClassName="text-dash-ink"
                    />
                  </span>
                  <span className="text-dash-muted">
                    {statusLabels[customer.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's schedule */}
        <div className="border border-dash-line bg-dash-surface p-6">
          <span className="block font-heading text-4xl leading-none tabular-nums text-dash-ink">
            {scheduleItems.length}
          </span>
          <p className="mt-1 text-sm text-dash-muted">Scheduled today</p>

          {scheduleItems.length === 0 ? (
            <p className="mt-5 text-sm text-dash-muted">
              Nothing scheduled today.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-dash-line">
              {scheduleItems.map(({ customer, time, kind }) => (
                <div
                  key={`${kind}-${customer.id}`}
                  className="flex items-center justify-between py-2 text-sm transition-colors hover:bg-dash-line/30"
                >
                  <span className="flex items-center gap-2 text-dash-ink">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 ${
                        kind === "install" ? "bg-status-booked" : "bg-accent"
                      }`}
                    />
                    <CustomerQuickActions
                      customerId={customer.id}
                      name={formatCustomerName(customer)}
                      phone={customer.phone}
                      email={customer.email}
                      triggerClassName="text-dash-ink"
                    />
                  </span>
                  <span className="text-dash-muted">
                    {formatTimeOnly(time)} &middot;{" "}
                    {kind === "install" ? "Install" : "Appointment"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline snapshot */}
        <div className="border border-dash-line bg-dash-surface p-6">
          <p className="text-sm text-dash-muted">Pipeline snapshot</p>
          <div className="mt-2 flex items-end gap-8">
            <div>
              <span className="block font-heading text-4xl leading-none tabular-nums text-dash-ink">
                {activePipelineCount}
              </span>
              <p className="mt-1 text-xs text-dash-muted">Active leads</p>
            </div>
            <div>
              <span className="block font-heading text-4xl leading-none tabular-nums text-dash-ink">
                {formatPenceAsGBP(pipelineValue)}
              </span>
              <p className="mt-1 text-xs text-dash-muted">Pipeline value</p>
            </div>
          </div>
          <div className="mt-5 space-y-2 border-t border-dash-line pt-4">
            {statusOrder.map((status) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-dash-muted">{statusLabels[status]}</span>
                <span className="tabular-nums text-right text-dash-ink">
                  {statusCountMap.get(status) ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="border border-dash-line bg-dash-surface p-6">
          <span className="block font-heading text-4xl leading-none tabular-nums text-dash-ink">
            {recentActivity.length}
          </span>
          <p className="mt-1 text-sm text-dash-muted">
            Recent activity &middot; last {RECENT_ACTIVITY_DAYS} days
          </p>

          {recentActivity.length === 0 ? (
            <p className="mt-5 text-sm text-dash-muted">
              No activity in the last {RECENT_ACTIVITY_DAYS} days.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-dash-line">
              {recentActivity.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block py-2 text-sm transition-colors hover:bg-dash-line/30"
                >
                  <span className="text-dash-ink">{item.message}</span>
                  <span className="ml-2 text-xs text-dash-muted">
                    {formatRelativeDate(item.at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
